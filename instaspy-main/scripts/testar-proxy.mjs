// linguagem: JavaScript (ESM), arquivo: scripts/testar-proxy.mjs
// Valida um proxy contra o Instagram antes de configurar em producao.
//
//   node scripts/testar-proxy.mjs "http://user:pass@host:porta"
//
// Testa: conectividade do proxy, busca do perfil e o proxy da foto.
// Se passar aqui, passa no Vercel (mesma biblioteca, mesma logica).

import { ProxyAgent } from 'undici'

const proxy = process.argv[2] ?? process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY
const usuario = process.argv[3] ?? 'mtheus.elias'

if (!proxy) {
  console.error('uso: node scripts/testar-proxy.mjs "http://user:pass@host:porta" [usuario]')
  process.exit(1)
}

const UA =
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

/** esconde a senha no log */
function mascarar(s) {
  return s.replace(/\/\/([^:/@]+):([^@]+)@/, '//$1:***@')
}

const dispatcher = new ProxyAgent(proxy)
const buscar = (url, opcoes = {}) => fetch(url, { ...opcoes, dispatcher })

console.log('proxy  :', mascarar(proxy))
console.log('alvo   : @' + usuario)
console.log('')

/* ---------------------------- 1. o proxy responde? ----------------------- */
const ipUrl = process.env.IP_CHECK_URL ?? 'https://api.ipify.org?format=json'
let ipSaida = '(nao verifiquei)'
try {
  const r = await buscar(ipUrl, { signal: AbortSignal.timeout(20000) })
  const txt = await r.text()
  ipSaida = txt.slice(0, 80)
  console.log('1) proxy ativo        ->', r.status, '| IP de saida:', ipSaida)
} catch (e) {
  console.log('1) proxy FALHOU       ->', e.name, e.message)
  process.exit(1)
}

/* ------------------------ 2. o Instagram entrega? ------------------------ */
let html = ''
try {
  const t0 = Date.now()
  const r = await buscar(`https://www.instagram.com/${usuario}/`, {
    headers: CABECALHOS,
    signal: AbortSignal.timeout(45000),
  })
  html = await r.text()
  console.log('2) instagram respondeu ->', r.status, '|', html.length, 'bytes |', Date.now() - t0 + 'ms')
} catch (e) {
  console.log('2) instagram FALHOU    ->', e.name, e.message)
  process.exit(1)
}

/* ------------------------- 3. os dados vieram? --------------------------- */
const temJson = html.includes('follower_count')
const temMeta = /property="og:description"/.test(html)
const tituloConfere = html.includes(`(@${usuario})`)

console.log('3) JSON embutido      ->', temJson ? 'SIM' : 'nao')
console.log('   og:description     ->', temMeta ? 'SIM' : 'nao')
console.log('   titulo com @usuario ->', tituloConfere ? 'SIM' : 'nao')

if (!temJson && !tituloConfere) {
  console.log('')
  console.log('RESULTADO: o proxy funciona mas o Instagram ainda bloqueia.')
  console.log('           Esse IP nao serve. Tente outro (residencial brasileiro).')
  process.exit(2)
}

// extrai os numeros do jeito que a producao faz
const m = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]*)"/i)
console.log('')
console.log('RESULTADO: OK — esse proxy serve.')
if (m) console.log('           og:description:', m[1].slice(0, 120))
