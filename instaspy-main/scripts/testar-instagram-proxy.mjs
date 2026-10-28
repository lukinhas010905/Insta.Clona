// linguagem: JavaScript (ESM), arquivo: scripts/testar-instagram-proxy.mjs
// Testa o Instagram atraves do proxy ISP SEM credencial (auth por IP).

import { ProxyAgent } from 'undici'

const PROXY = process.env.PROXY ?? 'http://200.234.133.86:12323'
const usuario = process.argv[2] ?? 'mtheus.elias'

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

const dispatcher = new ProxyAgent(PROXY)
const buscar = (url, o = {}) => fetch(url, { ...o, dispatcher })

console.log('proxy :', PROXY)
console.log('alvo  : @' + usuario)
console.log('')

/* 1. IP de saida */
try {
  const r = await buscar('https://api.ipify.org/?format=json', { signal: AbortSignal.timeout(25000) })
  console.log('1) IP de saida   ->', (await r.text()).slice(0, 60))
} catch (e) {
  console.log('1) IP de saida   -> ERRO:', e.name)
}

/* 2. Instagram */
let html = ''
try {
  const t0 = Date.now()
  const r = await buscar(`https://www.instagram.com/${usuario}/`, {
    headers: CABECALHOS,
    signal: AbortSignal.timeout(45000),
  })
  html = await r.text()
  console.log('2) Instagram     ->', r.status, '|', html.length, 'bytes |', Date.now() - t0 + 'ms')
} catch (e) {
  console.log('2) Instagram     -> ERRO:', e.name, e.message)
  if (e.cause) console.log('   causa:', e.cause.code ?? e.cause.message)
  process.exit(1)
}

/* 3. Os dados vieram? */
const temJson = html.includes('follower_count')
const tituloConfere = html.includes(`(@${usuario})`)
const m = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]*)"/i)
const bio = html.match(/"biography":"((?:[^"\\]|\\.)*)"/)
const nome = html.match(/"full_name":"((?:[^"\\]|\\.)*)"/)

console.log('')
console.log('3) JSON embutido     ->', temJson ? 'SIM' : 'nao')
console.log('   titulo com @usuario ->', tituloConfere ? 'SIM' : 'nao')
if (m) console.log('   og:description      ->', m[1].slice(0, 130))
if (nome) console.log('   full_name           ->', JSON.parse('"' + nome[1] + '"'))
if (bio) console.log('   biography           ->', JSON.stringify(JSON.parse('"' + bio[1] + '"')))

console.log('')
if (temJson || tituloConfere) {
  console.log('RESULTADO: o proxy passa no Instagram. Pode configurar no Vercel.')
} else {
  console.log('RESULTADO: proxy funciona, mas o Instagram bloqueou esse IP.')
}
