// linguagem: JavaScript (ESM), arquivo: server/index.js
// API do funil InstaSpy: catalogo, pedidos, Pix, webhook, auth, painel e analytics.
// Rodar: npm run api   (porta 8787 por padrao)

import express from 'express'
import cors from 'cors'
import QRCode from 'qrcode'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  apagarSessao,
  buscarPedido,
  buscarSessao,
  buscarUsuarioPorEmail,
  buscarUsuarioPorId,
  contarEventos,
  contarEventosEntre,
  criarAlvo,
  criarPedido,
  criarSessao,
  criarUsuario,
  expirarPedidosVencidos,
  listarAlvos,
  marcarPedidoPago,
  receitaPorPlano,
  registrarEvento,
  removerAlvo,
  seedDemo,
  somarReceita,
} from './src/db.js'
import { gerarToken, hashSenha, verificarSenha, expiracaoSessao } from './src/auth.js'
import { acharPlano, limiteDoPlano, PLANOS } from './src/catalog.js'
import { criarCobranca, interpretarWebhook, PROVEDOR } from './src/payments.js'
import { buscarPerfil, encerrarBrowser } from './src/instagram.js'
import { buscarPerfilHttp, perfilFalso, proxyImagemHttp } from './src/instagram-http.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORTA = Number(process.env.PORT ?? 8787)

const app = express()
app.set('trust proxy', 1)
app.use(cors({ origin: true, credentials: false }))
app.use(
  express.json({
    limit: '256kb',
    // guarda o corpo cru para validar assinatura de webhook
    verify: (req, _res, buf) => {
      req.rawBody = buf
    },
  }),
)

seedDemo()

/* ------------------------------- helpers --------------------------------- */

const soDigitos = (v) => String(v ?? '').replace(/\D+/g, '')

function emailValido(v) {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(v ?? '').trim())
}

function cpfValido(v) {
  const cpf = soDigitos(v)
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
  const digito = (base) => {
    let soma = 0
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (base.length + 1 - i)
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }
  return digito(cpf.slice(0, 9)) === Number(cpf[9]) && digito(cpf.slice(0, 10)) === Number(cpf[10])
}

/** Converte a linha do banco no contrato Order da SPA (QR regerado do payload). */
async function serializarPedido(linha) {
  if (!linha) return null
  const qrcode_image = await QRCode.toDataURL(linha.pix_payload, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 352,
  })
  return {
    id: linha.id,
    plano_id: linha.plano_id,
    nome: linha.nome,
    email: linha.email,
    telefone: linha.telefone,
    cpf: linha.cpf,
    status: linha.status,
    valor_centavos: linha.valor_centavos,
    criado_em: linha.criado_em,
    pago_em: linha.pago_em,
    pix: {
      txid: linha.txid,
      copia_e_cola: linha.pix_payload,
      qrcode_image,
      expira_em: linha.expira_em,
      valor_centavos: linha.valor_centavos,
    },
  }
}

/** Middleware de sessao: aceita Bearer token, popula req.usuario. */
function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization ?? ''
  const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : null

  if (!token) return res.status(401).json({ erro: 'Sessão ausente.' })

  const sessao = buscarSessao(token)
  if (!sessao) return res.status(401).json({ erro: 'Sessão expirada. Entre novamente.' })

  const usuario = buscarUsuarioPorId(sessao.usuario_id)
  if (!usuario) return res.status(401).json({ erro: 'Usuário não encontrado.' })

  req.usuario = usuario
  req.token = token
  next()
}

/* ------------------------------ catálogo --------------------------------- */

app.get('/api/planos', (_req, res) => {
  res.json(PLANOS)
})

/* ------------------------------ analytics -------------------------------- */

app.post('/api/eventos/visita', (req, res) => {
  registrarEvento({ tipo: req.body?.tipo === 'checkout' ? 'checkout' : 'visita' })
  res.status(204).end()
})

/* ------------------------------- pedidos --------------------------------- */

app.post('/api/pedidos', async (req, res, next) => {
  try {
    const { plano_id, nome, email, telefone, cpf } = req.body ?? {}

    const plano = acharPlano(plano_id)
    if (!plano) return res.status(400).json({ erro: 'Plano inválido.' })
    if (!nome || String(nome).trim().split(/\s+/).length < 2) {
      return res.status(400).json({ erro: 'Informe seu nome completo.' })
    }
    if (!emailValido(email)) return res.status(400).json({ erro: 'E-mail inválido.' })
    const fone = soDigitos(telefone)
    if (fone.length !== 10 && fone.length !== 11) {
      return res.status(400).json({ erro: 'Informe DDD + número.' })
    }
    if (!cpfValido(cpf)) return res.status(400).json({ erro: 'CPF inválido.' })

    // id do pedido e também o txid do BR Code (alfanumérico, 32 chars)
    const id = globalThis.crypto.randomUUID().replace(/-/g, '')

    const cobranca = await criarCobranca({
      pedido_id: id,
      valor_centavos: plano.preco_centavos,
      descricao: `InstaSpy ${plano.nome}`,
    })

    const linha = criarPedido({
      id,
      plano_id: plano.id,
      nome: String(nome).trim(),
      email: String(email).trim(),
      telefone: String(telefone),
      cpf: String(cpf),
      valor_centavos: plano.preco_centavos,
      txid: id,
      pix_payload: cobranca.copia_e_cola,
      expira_em: cobranca.expira_em,
    })

    registrarEvento({ tipo: 'checkout', pedido_id: id, plano_id: plano.id })

    res.status(201).json(await serializarPedido(linha))
  } catch (erro) {
    next(erro)
  }
})

app.get('/api/pedidos/:id', async (req, res, next) => {
  try {
    expirarPedidosVencidos()
    const linha = buscarPedido(req.params.id)
    if (!linha) return res.status(404).json({ erro: 'Pedido não encontrado.' })
    res.json(await serializarPedido(linha))
  } catch (erro) {
    next(erro)
  }
})

// Apenas para desenvolvimento: confirma o Pix sem passar pelo banco.
app.post('/api/pedidos/:id/simular-pagamento', async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SANDBOX !== '1') {
      return res.status(403).json({ erro: 'Rota de sandbox desativada em produção.' })
    }
    const linha = marcarPedidoPago(req.params.id)
    if (!linha) return res.status(404).json({ erro: 'Pedido não encontrado.' })
    res.json(await serializarPedido(linha))
  } catch (erro) {
    next(erro)
  }
})

/* ------------------------------- webhook --------------------------------- */

app.post('/api/webhooks/pix', async (req, res, next) => {
  try {
    const r = interpretarWebhook(req.body, req.headers)
    if (!r.ok) return res.status(401).json({ erro: r.erro })

    const linha = buscarPedido(r.txid)
    if (!linha) return res.status(404).json({ erro: 'Pedido não encontrado.' })

    if (r.status === 'pago') marcarPedidoPago(linha.id)

    res.json({ recebido: true, pedido_id: linha.id, status: r.status })
  } catch (erro) {
    next(erro)
  }
})

/* --------------------------------- auth ---------------------------------- */

app.post('/api/auth/registrar', (req, res, next) => {
  try {
    const { nome, email, senha } = req.body ?? {}

    if (!nome || String(nome).trim().split(/\s+/).length < 2) {
      return res.status(400).json({ erro: 'Informe seu nome completo.' })
    }
    if (!emailValido(email)) return res.status(400).json({ erro: 'E-mail inválido.' })
    if (!senha || String(senha).length < 6) {
      return res.status(400).json({ erro: 'A senha precisa ter ao menos 6 caracteres.' })
    }
    if (buscarUsuarioPorEmail(email)) {
      return res.status(409).json({ erro: 'Já existe uma conta com este e-mail.' })
    }

    const usuario = criarUsuario({
      nome: String(nome).trim(),
      email: String(email).trim(),
      senha_hash: hashSenha(String(senha)),
    })

    const token = gerarToken()
    criarSessao(usuario.id, token, expiracaoSessao())

    res.status(201).json({ token, usuario: publico(usuario) })
  } catch (erro) {
    next(erro)
  }
})

app.post('/api/auth/login', (req, res, next) => {
  try {
    const { email, senha } = req.body ?? {}
    if (!email || !senha) return res.status(400).json({ erro: 'Informe e-mail e senha.' })

    const usuario = buscarUsuarioPorEmail(email)
    if (!usuario || !verificarSenha(String(senha), usuario.senha_hash)) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' })
    }

    const token = gerarToken()
    criarSessao(usuario.id, token, expiracaoSessao())

    res.json({ token, usuario: publico(usuario) })
  } catch (erro) {
    next(erro)
  }
})

app.post('/api/auth/sair', autenticar, (req, res) => {
  apagarSessao(req.token)
  res.status(204).end()
})

/* -------------------------------- painel --------------------------------- */

app.get('/api/painel', autenticar, (req, res) => {
  res.json(montarPainel(req.usuario))
})

app.post('/api/painel/alvos', autenticar, (req, res, next) => {
  try {
    const { plataforma, identificador, rotulo } = req.body ?? {}

    if (!['instagram', 'whatsapp'].includes(plataforma)) {
      return res.status(400).json({ erro: 'Plataforma inválida.' })
    }
    const valor = String(identificador ?? '').trim().replace(/^@/, '')
    if (valor.length < 3) {
      return res.status(400).json({ erro: 'Informe um identificador válido.' })
    }

    const alvos = listarAlvos(req.usuario.id)
    const limite = limiteDoPlano(req.usuario.plano_id)
    if (alvos.length >= limite) {
      return res.status(409).json({
        erro: `Limite de ${limite} perfis do plano ${req.usuario.plano_id} atingido.`,
      })
    }

    criarAlvo({
      usuario_id: req.usuario.id,
      plataforma,
      identificador: valor,
      rotulo: String(rotulo ?? '').trim() || `@${valor}`,
    })

    res.status(201).json(montarPainel(req.usuario))
  } catch (erro) {
    next(erro)
  }
})

app.delete('/api/painel/alvos/:id', autenticar, (req, res) => {
  const removido = removerAlvo(req.params.id, req.usuario.id)
  if (!removido) return res.status(404).json({ erro: 'Alvo não encontrado.' })
  res.json(montarPainel(req.usuario))
})

/* ------------------------------ analytics -------------------------------- */

app.get('/api/analytics', autenticar, (_req, res) => {
  const agora = Date.now()
  const iso = (ms) => new Date(ms).toISOString()
  const inicioHoje = new Date()
  inicioHoje.setHours(0, 0, 0, 0)

  const visitas_hoje = contarEventos('visita', iso(inicioHoje.getTime()))
  const visitas_7d = contarEventos('visita', iso(agora - 7 * 864e5))
  const checkout_iniciados = contarEventos('checkout', iso(agora - 7 * 864e5))
  const vendas_confirmadas = contarEventos('venda', iso(agora - 7 * 864e5))
  const receita_centavos = somarReceita(iso(agora - 7 * 864e5))

  const serie_7d = []
  for (let d = 6; d >= 0; d--) {
    const dia = new Date()
    dia.setDate(dia.getDate() - d)
    dia.setHours(0, 0, 0, 0)
    const fim = new Date(dia)
    fim.setHours(23, 59, 59, 999)

    const de = iso(dia.getTime())
    const ate = iso(fim.getTime())
    const visitas = contarEventosEntre('visita', de, ate)
    const vendas = contarEventosEntre('venda', de, ate)

    serie_7d.push({
      dia: dia.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      visitas,
      vendas,
    })
  }

  res.json({
    visitas_hoje,
    visitas_7d,
    checkout_iniciados,
    vendas_confirmadas,
    receita_centavos,
    conversao: checkout_iniciados ? vendas_confirmadas / checkout_iniciados : 0,
    por_plano: receitaPorPlano(iso(agora - 7 * 864e5)),
    serie_7d,
  })
})

/* ------------------------------- utilitários ----------------------------- */

function publico(usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    plano_id: usuario.plano_id,
    expira_em: usuario.expira_em,
  }
}

function montarPainel(usuario) {
  const alvos = listarAlvos(usuario.id)
  return {
    usuario: publico(usuario),
    alvos,
    total_alvos: alvos.length,
    limite_perfis: limiteDoPlano(usuario.plano_id),
  }
}

/* ------------------------------ Instagram -------------------------------- */

/** Teto de tempo da busca com Chromium. Estourou, cai na busca sem browser. */
const PRAZO_BUSCA_MS = 12_000

function comPrazo(promessa, ms) {
  return Promise.race([
    promessa,
    new Promise((_, rejeitar) =>
      setTimeout(() => rejeitar(new Error(`tempo esgotado (${ms}ms)`)), ms),
    ),
  ])
}

// Busca o perfil em degraus, do mais rapido ao mais rico.
//
//   PERFIL_MODO=rapido    (padrao) HTTP puro, ~600ms, bio truncada em 2 linhas
//   PERFIL_MODO=completo  Chromium primeiro, ~1-6s, bio completa
//
// O padrao e o mesmo caminho que roda no Vercel: assim o preview e a producao
// mostram exatamente a mesma coisa. Em qualquer modo, se falhar, cai no perfil
// gerado para o funil nunca travar.
const MODO_PERFIL = process.env.PERFIL_MODO ?? 'rapido'

app.get('/api/perfil/:username', async (req, res) => {
  const username = String(req.params.username).replace(/^@/, '').trim().toLowerCase()

  if (!/^[a-z0-9._]{1,30}$/.test(username)) {
    return res.status(400).json({ erro: 'Usuário inválido.' })
  }

  // modo completo: Chromium primeiro, para trazer a bio inteira
  if (MODO_PERFIL === 'completo') {
    try {
      const perfil = await comPrazo(buscarPerfil(username), PRAZO_BUSCA_MS)
      if (!perfil?.erro) return res.json(perfil)
    } catch (erro) {
      console.warn('[api] chromium indisponivel:', erro.message)
    }
  }

  // caminho leve: le o JSON embutido da pagina, sem navegador
  try {
    const viaHttp = await buscarPerfilHttp(username)
    if (!viaHttp?.erro) return res.json(viaHttp)
    return res.json({ ...perfilFalso(username), aviso: viaHttp.erro })
  } catch (erro) {
    console.warn('[api] busca http falhou:', erro.message)
  }

  res.json({ ...perfilFalso(username), aviso: 'instagram indisponivel' })
})

// Proxy da foto: o CDN do Instagram recusa hotlink sem Referer.
app.get('/api/imagem', async (req, res) => {
  const url = req.query.url
  if (!url) return res.status(400).json({ erro: 'Parâmetro url ausente.' })

  try {
    const r = await proxyImagemHttp(String(url))
    if (r?.erro) return res.status(502).json({ erro: r.erro })

    res.set('Content-Type', r.contentType)
    res.set('Cache-Control', 'public, max-age=3600')
    res.send(r.buffer)
  } catch (erro) {
    res.status(502).json({ erro: `falha ao buscar imagem: ${erro.message}` })
  }
})

/* --------------------------- static + fallback --------------------------- */

// O 404 de API precisa vir ANTES do catch-all. Se vier depois, um GET para
// /api/inexistente cai no app.get('*') e devolve o index.html em vez de JSON.
app.use('/api', (_req, res) => res.status(404).json({ erro: 'Rota de API não encontrada.' }))

// Serve o build da SPA (dist/) sempre, nao so em producao: assim
// `node server/index.js` sozinho ja sobe o site inteiro no preview.
const dist = path.join(__dirname, '..', 'dist')
app.use(express.static(dist))
app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')))

// handler de erro: nunca vaza stack para o cliente
app.use((erro, _req, res, _next) => {
  console.error('[api] erro:', erro)
  res.status(500).json({ erro: 'Erro interno do servidor.' })
})

const servidor = app.listen(PORTA, () => {
  console.log(`[api] InstaSpy ouvindo em http://127.0.0.1:${PORTA}`)
  console.log(`[api] provedor de checkout: ${PROVEDOR}`)
})

// Fecha o Chromium junto com o processo, senao ele fica orfao.
for (const sinal of ['SIGINT', 'SIGTERM']) {
  process.on(sinal, () => {
    encerrarBrowser().finally(() => servidor.close(() => process.exit(0)))
  })
}
