// linguagem: JavaScript (ESM), arquivo: server/src/instagram.js
// Busca o perfil publico do Instagram com um Chromium real.
//
// Por que navegador e nao fetch: com cliente HTTP comum o Instagram devolve a
// casca SSR desligada (is_crawler_ssr_html_only_mode) e a API web_profile_info
// responde 429. Com um Chromium de verdade a pagina vem completa e traz um
// <script type="application/json"> com follower_count, following_count,
// biography, full_name e profile_pic_url.

import { URL } from 'node:url'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const CACHE_MS = 10 * 60 * 1000
// Perfil real dispara domcontentloaded em ~1s. @ inexistente faz o Instagram
// segurar a pagina ate o timeout, entao estes valores definem o pior caso
// (~12s + ~6s) antes de cair no perfil gerado.
const TIMEOUT_PAGINA = 12_000
const TIMEOUT_DADOS = 6_000

/** cache simples em memoria: @ -> { quando, perfil } */
const cache = new Map()

let browserPromise = null

/**
 * Chromium reaproveitado entre requisicoes. Abrir um browser por busca
 * custa ~1,5s e muito RAM; um so atende todas.
 */
async function obterBrowser() {
  if (!browserPromise) {
    browserPromise = (async () => {
      const { chromium } = await import('playwright')
      return chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
        ],
      })
    })().catch((erro) => {
      browserPromise = null
      throw erro
    })
  }
  return browserPromise
}

export async function encerrarBrowser() {
  if (!browserPromise) return
  try {
    const b = await browserPromise
    await b.close()
  } catch {
    /* ja fechado */
  }
  browserPromise = null
}

/** Varre um objeto JSON atras do no que tem follower_count + biography. */
function acharNoJson(no, profundidade = 0) {
  if (!no || typeof no !== 'object' || profundidade > 14) return null
  if (
    typeof no.follower_count === 'number' &&
    (typeof no.biography === 'string' || typeof no.full_name === 'string')
  ) {
    return no
  }
  for (const valor of Object.values(no)) {
    if (valor && typeof valor === 'object') {
      const achado = acharNoJson(valor, profundidade + 1)
      if (achado) return achado
    }
  }
  return null
}

/** Extrai o no do perfil dos <script type="application/json"> da pagina. */
function extrairJsonEmbutido(html) {
  for (const bloco of html.matchAll(/<script type="application\/json"[^>]*>([\s\S]*?)<\/script>/g)) {
    const corpo = bloco[1]
    if (!corpo.includes('follower_count')) continue
    try {
      const no = acharNoJson(JSON.parse(corpo))
      if (no) return no
    } catch {
      /* bloco nao era JSON valido, tenta o proximo */
    }
  }
  return null
}

/** "681 seguidores, seguindo 960, 2 posts" -> { followers, following, posts } */
function extrairMetaDescricao(desc) {
  if (!desc) return {}
  const num = (s) => Number(String(s).replace(/\./g, '').replace(/,/g, ''))

  const seguidores = desc.match(/([\d.,]+)\s*(?:seguidores|followers)/i)
  const seguindo = desc.match(/(?:seguindo|following)\s*([\d.,]+)/i) ?? desc.match(/([\d.,]+)\s*(?:seguindo|following)/i)
  const posts = desc.match(/([\d.,]+)\s*(?:posts|publica)/i)

  return {
    followers: seguidores ? num(seguidores[1]) : undefined,
    following: seguindo ? num(seguindo[1]) : undefined,
    posts: posts ? num(posts[1]) : undefined,
  }
}

/** "Nome (@user) • Fotos e vídeos do Instagram" -> "Nome" */
function extrairNomeDoTitulo(titulo) {
  if (!titulo) return ''
  return titulo.split('(@')[0].replace(/[•|]\s*$/, '').trim()
}

/**
 * Busca o perfil publico. Devolve null se nao conseguir (perfil inexistente,
 * conta privada sem dados, bloqueio ou Chromium indisponivel).
 */
export async function buscarPerfil(usuarioBruto, { usarCache = true } = {}) {
  const username = String(usuarioBruto).replace(/^@/, '').trim().toLowerCase()
  if (!/^[a-z0-9._]{1,30}$/.test(username)) return { erro: 'usuario invalido' }

  if (usarCache) {
    const emCache = cache.get(username)
    if (emCache && Date.now() - emCache.quando < CACHE_MS) {
      return { ...emCache.perfil, cache: true }
    }
  }

  const browser = await obterBrowser()
  const ctx = await browser.newContext({
    userAgent: UA,
    viewport: { width: 1280, height: 900 },
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  })

  const page = await ctx.newPage()
  // imagens e fontes nao importam para extrair dados: bloqueia e fica mais rapido
  await page.route('**/*', (rota) => {
    const tipo = rota.request().resourceType()
    if (tipo === 'image' || tipo === 'font' || tipo === 'media') rota.abort()
    else rota.continue()
  })

  try {
    const resposta = await page
      .goto(`https://www.instagram.com/${username}/`, {
        waitUntil: 'domcontentloaded',
        timeout: TIMEOUT_PAGINA,
      })
      // @ inexistente faz o Instagram segurar a pagina: segue em frente e
      // deixa a espera pelos dados decidir
      .catch(() => null)

    if (resposta && resposta.status() === 404) return { erro: 'perfil nao encontrado' }

    // espera o JSON embutido aparecer no HTML
    const achouDados = await page
      .waitForFunction(
        () => (document.documentElement?.innerHTML ?? '').includes('follower_count'),
        { timeout: TIMEOUT_DADOS },
      )
      .then(() => true)
      .catch(() => false)

    if (!achouDados) {
      // ultimo recurso: as meta tags og: costumam vir mesmo sem o JSON
      const desc = await page
        .evaluate(() => document.querySelector('meta[property="og:description"]')?.content ?? '')
        .catch(() => '')
      if (!desc) return { erro: 'sem dados publicos' }
    }

    const html = await page.content()
    const meta = await page.evaluate(() => {
      const pega = (p) => document.querySelector(`meta[property="${p}"]`)?.content ?? ''
      return {
        titulo: pega('og:title'),
        descricao: pega('og:description'),
        imagem: pega('og:image'),
      }
    })

    // O JSON embutido corta a bio depois de 2 linhas. O <header> tem ela inteira,
    // entao a bio sai do DOM e o JSON fica para os numeros e a foto.
    const doDom = await page.evaluate(() => {
      const header = document.querySelector('header')
      if (!header) return { bio: '', fullName: '' }

      // NAO filtra vazias aqui: o Instagram usa linha em branco dentro da bio
      // para separar blocos. So as das pontas sao lixo do DOM.
      const linhas = header.innerText.split('\n').map((l) => l.trim())
      while (linhas.length && !linhas[0]) linhas.shift()
      while (linhas.length && !linhas[linhas.length - 1]) linhas.pop()

      const iContagem = linhas.findIndex((l) => /(seguindo|following)/i.test(l))
      if (iContagem === -1) return { bio: '', fullName: '' }

      const resto = linhas.slice(iContagem + 1)
      if (resto.length <= 1) return { bio: '', fullName: (resto[0] ?? '').trim() }

      const nome = resto[0].trim()
      let bioLinhas = resto.slice(1)

      // o <header> mistura bio e itens de interface: corta no primeiro deles
      const RUIDO =
        /^(Mostrar mais|Ver |Editar perfil|Seguir|Seguindo|Mensagem|Meta Verified|Profissional|Carregar|Licensing|INJr|Verificado|Threads|Meta\b|Sobre|Blog|Ajuda|API|Privacidade|Termos|Localizações|Popular|Contato|Sobre o|Mais opções)/i

      // corta no primeiro item de interface que aparece depois da bio
      const parada = bioLinhas.findIndex((l) => l && RUIDO.test(l))
      if (parada > -1) bioLinhas = bioLinhas.slice(0, parada)

      // tira branco das pontas, mantem as do meio
      while (bioLinhas.length && !bioLinhas[0]) bioLinhas.shift()
      while (bioLinhas.length && !bioLinhas[bioLinhas.length - 1]) bioLinhas.pop()

      return { bio: bioLinhas.join('\n'), fullName: nome }
    })

    const no = extrairJsonEmbutido(html)
    const daMeta = extrairMetaDescricao(meta.descricao)

    if (!no && !meta.descricao) return { erro: 'sem dados publicos' }

    // fica com a bio mais completa das duas fontes
    const bioJson = no?.biography ?? ''
    const bio = doDom.bio.length > bioJson.length ? doDom.bio : bioJson

    const perfil = {
      username,
      fullName: no?.full_name?.trim() || doDom.fullName || extrairNomeDoTitulo(meta.titulo),
      bio,
      profilePicUrl:
        no?.profile_pic_url_hd || no?.profile_pic_url || meta.imagem || null,
      followers: no?.follower_count ?? daMeta.followers ?? 0,
      following: no?.following_count ?? daMeta.following ?? 0,
      posts: no?.edge_owner_to_timeline_media?.count ?? no?.all_media_count ?? daMeta.posts ?? 0,
      isPrivate: Boolean(no?.is_private),
      isVerified: Boolean(no?.is_verified),
      fonte: no ? 'json-embutido' : 'meta-tags',
    }

    cache.set(username, { quando: Date.now(), perfil })
    return perfil
  } finally {
    await ctx.close().catch(() => undefined)
  }
}

/**
 * Proxy da foto de perfil. O CDN do Instagram recusa hotlink sem Referer,
 * entao a imagem e buscada no servidor e devolvida em stream.
 */
export async function proxyImagem(urlBruta) {
  let alvo
  try {
    alvo = new URL(urlBruta)
  } catch {
    return { erro: 'url invalida' }
  }

  const permitido =
    /(^|\.)cdninstagram\.com$/.test(alvo.hostname) || /(^|\.)fbcdn\.net$/.test(alvo.hostname)
  if (!permitido) return { erro: 'host nao permitido' }

  const r = await fetch(alvo, {
    headers: { 'user-agent': UA, referer: 'https://www.instagram.com/', accept: 'image/*,*/*' },
  })

  if (!r.ok) return { erro: `cdn respondeu ${r.status}` }

  return {
    contentType: r.headers.get('content-type') ?? 'image/jpeg',
    buffer: Buffer.from(await r.arrayBuffer()),
  }
}

export function limparCache() {
  cache.clear()
}
