// linguagem: JavaScript (ESM), arquivo: server/src/instagram-http.js
// Extrator do perfil publico SEM navegador.
//
// Descoberta: com cabecalhos de navegador o instagram.com/{user}/ devolve a
// pagina completa, com um JSON embutido que tem follower_count,
// following_count, biography, full_name e profile_pic_url.
//
// PROBLEMA REAL: o Instagram bloqueia IPs de datacenter (Vercel, AWS, Railway).
// De um IP residencial a pagina vem completa; de um datacenter vem uma pagina
// de bloqueio sem os dados. Por isso existem tres caminhos, tentados em ordem:
//
//   1. PROXY_URL     - proxy residencial (o que resolve de verdade)
//   2. SCRAPERAPI_KEY - servico de scraping pago
//   3. direto        - so funciona de IP que o Instagram tolera
//
// E dentro do direto ainda tenta a pagina normal e o /embed/.

export const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const CABECALHOS = {
  'user-agent': UA,
  'accept-language': 'pt-BR,pt;q=0.9,en;q=0.8',
  accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
  'sec-fetch-user': '?1',
  'upgrade-insecure-requests': '1',
}

/* ------------------------------- extracao -------------------------------- */

function acharPor(no, teste, profundidade = 0) {
  if (!no || typeof no !== 'object' || profundidade > 16) return null
  if (teste(no)) return no
  for (const valor of Object.values(no)) {
    if (valor && typeof valor === 'object') {
      const achado = acharPor(valor, teste, profundidade + 1)
      if (achado) return achado
    }
  }
  return null
}

/**
 * Acha o no do perfil no JSON embutido. Aceita os dois formatos que o
 * Instagram usa: o novo (follower_count) e o do embed (edge_followed_by).
 */
export function extrairNoPerfil(html) {
  for (const bloco of html.matchAll(/<script type="application\/json"[^>]*>([\s\S]*?)<\/script>/g)) {
    const corpo = bloco[1]
    if (!corpo.includes('profile_pic_url') && !corpo.includes('follower_count')) continue
    let json
    try {
      json = JSON.parse(corpo)
    } catch {
      continue
    }

    // formato novo
    const novo = acharPor(json, (n) => typeof n.follower_count === 'number')
    if (novo) return { no: novo, formato: 'novo' }

    // formato do embed
    const embed = acharPor(
      json,
      (n) =>
        n.edge_followed_by &&
        typeof n.edge_followed_by === 'object' &&
        typeof n.edge_followed_by.count === 'number',
    )
    if (embed) return { no: embed, formato: 'embed' }
  }
  return { no: null, formato: null }
}

/** Decodifica as entidades que o Instagram escapa nas meta tags. */
export function decodificarEntidades(s) {
  return String(s)
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

export function extrairMeta(html) {
  const pega = (prop) => {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']*)["']`,
      'i',
    )
    const m = html.match(re)
    return m ? decodificarEntidades(m[1]) : ''
  }
  return {
    titulo: pega('og:title'),
    descricao: pega('og:description'),
    imagem: pega('og:image'),
    descricaoGeral: pega('description'),
  }
}

/** "681 seguidores, seguindo 960, 2 posts" -> { followers, following, posts } */
export function extrairMetaDescricao(desc) {
  if (!desc) return {}
  const num = (s) => Number(String(s).replace(/\./g, '').replace(/,/g, ''))

  const seguidores = desc.match(/([\d.,]+)\s*(?:seguidores|followers)/i)
  const seguindo =
    desc.match(/(?:seguindo|following)\s*([\d.,]+)/i) ??
    desc.match(/([\d.,]+)\s*(?:seguindo|following)/i)
  const posts = desc.match(/([\d.,]+)\s*(?:posts|publica)/i)

  return {
    followers: seguidores ? num(seguidores[1]) : undefined,
    following: seguindo ? num(seguindo[1]) : undefined,
    posts: posts ? num(posts[1]) : undefined,
  }
}

export function extrairNomeDoTitulo(titulo) {
  if (!titulo) return ''
  return titulo.split('(@')[0].replace(/[•|]\s*$/, '').trim()
}

/** Monta o perfil normalizado a partir do HTML (serve os dois endpoints). */
function montarPerfil(username, html) {
  const { no, formato } = extrairNoPerfil(html)
  const meta = extrairMeta(html)
  const daMeta = extrairMetaDescricao(meta.descricao)

  // A pagina de bloqueio do Instagram TAMBEM traz og: tags, mas genericas:
  // og:title = "Instagram", sem "(@usuario)", e nenhum numero. Sem esta
  // checagem o codigo aceitava a pagina de bloqueio como perfil valido e
  // devolvia nome "Instagram", zero seguidores e uma imagem qualquer.
  const tituloConfere = Boolean(meta.titulo && meta.titulo.includes(`(@${username})`))
  if (!no && !tituloConfere) return null

  const bioJson = no?.biography ?? ''
  const bioMeta = (meta.descricaoGeral.match(/Instagram:\s*"([\s\S]*)"\s*$/i)?.[1] ?? '').trim()

  const perfil = {
    username,
    fullName: no?.full_name?.trim() || extrairNomeDoTitulo(meta.titulo),
    bio: bioJson || bioMeta,
    profilePicUrl: no?.profile_pic_url_hd || no?.profile_pic_url || meta.imagem || null,
    followers: no?.follower_count ?? no?.edge_followed_by?.count ?? daMeta.followers ?? 0,
    following: no?.following_count ?? no?.edge_follow?.count ?? daMeta.following ?? 0,
    posts:
      no?.edge_owner_to_timeline_media?.count ?? no?.all_media_count ?? daMeta.posts ?? 0,
    isPrivate: Boolean(no?.is_private),
    isVerified: Boolean(no?.is_verified),
    fonte: formato ? `json-${formato}` : 'meta-tags',
  }

  // nome "Instagram" ou tudo zerado = pagina de bloqueio disfarcada
  const nomeValido = perfil.fullName && perfil.fullName.toLowerCase() !== 'instagram'
  const temNumero = perfil.followers > 0 || perfil.following > 0 || perfil.posts > 0
  if (!nomeValido || (!temNumero && !no)) return null

  return perfil
}

/* ------------------------------- transporte ------------------------------ */

/**
 * Proxy. O Instagram bloqueia IP de datacenter (Vercel, AWS), entao em
 * producao e preciso sair por um IP residencial.
 *
 * Tres formas, em ordem de preferencia:
 *   1. SCRAPERAPI_KEY  -> servico de scraping, aceita ?url= (sem codigo extra)
 *   2. HTTPS_PROXY     -> proxy comum (http://user:pass@host:porta), via undici
 *   3. direto          -> so funciona de IP que o Instagram tolera
 */
let _dispatcher // undefined = ainda nao resolvido, null = sem proxy

async function dispatcherDeProxy() {
  if (_dispatcher !== undefined) return _dispatcher

  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY
  if (!proxy) {
    _dispatcher = null
    return null
  }

  try {
    const { ProxyAgent } = await import('undici')
    _dispatcher = new ProxyAgent(proxy)
  } catch {
    // undici ausente: segue sem proxy em vez de quebrar
    _dispatcher = null
  }
  return _dispatcher
}

/** fetch que respeita o proxy configurado. */
async function buscar(url, opcoes = {}) {
  const dispatcher = await dispatcherDeProxy()
  return dispatcher ? fetch(url, { ...opcoes, dispatcher }) : fetch(url, opcoes)
}

/** Monta a URL final conforme o transporte escolhido. */
function montarUrl(urlOriginal) {
  const scraper = process.env.SCRAPERAPI_KEY
  if (scraper) {
    const base = process.env.SCRAPER_ENDPOINT ?? 'https://api.scraperapi.com'
    return {
      url: `${base}?api_key=${encodeURIComponent(scraper)}&url=${encodeURIComponent(urlOriginal)}`,
      via: 'scraperapi',
    }
  }
  if (process.env.PROXY_URL) {
    // proxy do tipo prefixo: https://proxy.exemplo.com/fetch?url=
    return { url: `${process.env.PROXY_URL.replace(/\/$/, '')}/${urlOriginal}`, via: 'proxy-url' }
  }
  if (process.env.HTTPS_PROXY || process.env.HTTP_PROXY) {
    return { url: urlOriginal, via: 'https-proxy' }
  }
  return { url: urlOriginal, via: 'direto' }
}

async function baixar(urlOriginal, timeoutMs) {
  const { url, via } = montarUrl(urlOriginal)
  const controlador = new AbortController()
  const timer = setTimeout(() => controlador.abort(), timeoutMs)

  try {
    const r = await buscar(url, { headers: CABECALHOS, redirect: 'follow', signal: controlador.signal })
    const html = await r.text()
    return { status: r.status, html, via, tamanho: html.length }
  } catch (erro) {
    return { status: 0, html: '', via, erro: erro.name === 'AbortError' ? 'timeout' : erro.message }
  } finally {
    clearTimeout(timer)
  }
}

/* ---------------------------------- API ---------------------------------- */

/**
 * Busca o perfil publico. Devolve o perfil ou { erro, debug }.
 * `debug: true` inclui o que cada tentativa devolveu — util para descobrir
 * se o bloqueio e de IP.
 */
export async function buscarPerfilHttp(usuarioBruto, { timeoutMs = 9000, debug = false } = {}) {
  const username = String(usuarioBruto).replace(/^@/, '').trim().toLowerCase()
  if (!/^[a-z0-9._]{1,30}$/.test(username)) return { erro: 'usuario invalido' }

  const tentativas = []
  const endpoints = [
    `https://www.instagram.com/${username}/`,
    `https://www.instagram.com/${username}/embed/`,
  ]

  for (const url of endpoints) {
    const r = await baixar(url, timeoutMs)

    const registro = {
      endpoint: url.includes('/embed/') ? 'embed' : 'pagina',
      via: r.via,
      status: r.status,
      tamanho: r.tamanho ?? 0,
    }

    if (r.erro) {
      registro.erro = r.erro
      tentativas.push(registro)
      continue
    }

    if (r.status === 404) {
      registro.erro = 'nao encontrado'
      tentativas.push(registro)
      continue
    }

    const perfil = montarPerfil(username, r.html)
    registro.fonte = perfil?.fonte ?? null

    if (perfil?.followers || perfil?.profilePicUrl) {
      if (debug) perfil.debug = { tentativas: [...tentativas, registro] }
      return perfil
    }

    registro.erro = perfil ? 'sem numeros' : 'sem dados publicos'
    tentativas.push(registro)
  }

  return {
    erro: 'instagram bloqueou ou nao devolveu dados',
    ...(debug ? { debug: { tentativas } } : {}),
  }
}

/* --------------------------------- imagem -------------------------------- */

/**
 * Proxy da foto de perfil. O CDN do Instagram recusa hotlink sem Referer.
 * Tem teto de tempo e respeita PROXY_URL quando configurado.
 */
export async function proxyImagemHttp(urlBruta, { timeoutMs = 8000 } = {}) {
  let alvo
  try {
    alvo = new URL(urlBruta)
  } catch {
    return { erro: 'url invalida' }
  }

  const permitido =
    /(^|\.)cdninstagram\.com$/.test(alvo.hostname) || /(^|\.)fbcdn\.net$/.test(alvo.hostname)
  if (!permitido) return { erro: 'host nao permitido' }

  const cabecalhos = {
    'user-agent': UA,
    referer: 'https://www.instagram.com/',
    accept: 'image/*,*/*',
  }

  // O CDN das fotos nao bloqueia datacenter como a pagina principal bloqueia.
  // Por isso a ordem e invertida aqui: tenta DIRETO primeiro, e so usa o proxy
  // se o direto falhar. Passar a foto pelo proxy sem necessidade e mais lento
  // e ja se mostrou fragil no runtime do Vercel.
  const tentativas = [
    { via: 'direto', fazer: (url, signal) => fetch(url, { headers: cabecalhos, signal }) },
    { via: 'proxy', fazer: (url, signal) => buscar(url, { headers: cabecalhos, signal }) },
  ]

  let ultimoErro = 'falha desconhecida'

  for (const tentativa of tentativas) {
    const controlador = new AbortController()
    const timer = setTimeout(() => controlador.abort(), timeoutMs)

    try {
      const { url } = montarUrl(alvo.toString())
      const r = await tentativa.fazer(url, controlador.signal)

      if (!r.ok) {
        ultimoErro = `cdn respondeu ${r.status} (${tentativa.via})`
        continue
      }

      return {
        contentType: r.headers.get('content-type') ?? 'image/jpeg',
        buffer: Buffer.from(await r.arrayBuffer()),
      }
    } catch (erro) {
      ultimoErro = `${erro.name} (${tentativa.via})`
    } finally {
      clearTimeout(timer)
    }
  }

  return { erro: ultimoErro }
}

/* -------------------------------- fallback ------------------------------- */

const BIOS_FALSAS = [
  '✨ Vivendo a vida intensamente 🌟',
  '📸 Amante de viagens e café ☕',
  '🎯 Focado nos objetivos 💪',
  '🌈 Espalhando amor e positividade 💕',
  '🔥 Criando memórias inesquecíveis 🎉',
]

/** Perfil determinístico usado quando o Instagram recusa. */
export function perfilFalso(entrada) {
  const username = String(entrada).replace(/^@/, '').trim().toLowerCase()
  const semente = username.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const faixa = (min, max) => {
    const s = Math.sin(semente + min) * 1e4
    return Math.floor((s - Math.floor(s)) * (max - min) + min)
  }
  return {
    username,
    fullName: username.charAt(0).toUpperCase() + username.slice(1),
    bio: BIOS_FALSAS[semente % BIOS_FALSAS.length],
    profilePicUrl: null,
    followers: faixa(800, 15000),
    following: faixa(200, 2000),
    posts: faixa(20, 300),
    isPrivate: false,
    isVerified: false,
    fonte: 'gerado',
  }
}
