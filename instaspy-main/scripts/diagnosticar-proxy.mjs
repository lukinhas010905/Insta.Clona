// linguagem: JavaScript (ESM), arquivo: scripts/diagnosticar-proxy.mjs
// Mostra a causa real da falha do proxy, que o fetch esconde atras de
// "TypeError: fetch failed". Testa TCP, HTTP puro e HTTPS.

import net from 'node:net'
import { ProxyAgent, request } from 'undici'

const host = process.argv[2] ?? '200.234.133.86'
const porta = Number(process.argv[3] ?? 12323)
const usuario = process.argv[4] ?? '14ae1db3cc39b'
const senha = process.argv[5] ?? '81c9f51269'

console.log('host :', host)
console.log('porta:', porta)
console.log('user :', usuario)
console.log('senha:', senha ? senha.slice(0, 2) + '***' + senha.slice(-2) : '(vazia)')
console.log('')

/* --------------------------- 1. TCP alcançável? -------------------------- */
await new Promise((resolve) => {
  const t0 = Date.now()
  const socket = net.connect({ host, port: porta }, () => {
    console.log('1) TCP           -> ABERTO (' + (Date.now() - t0) + 'ms)')
    socket.destroy()
    resolve()
  })
  socket.setTimeout(12000)
  socket.on('timeout', () => {
    console.log('1) TCP           -> TIMEOUT')
    socket.destroy()
    resolve()
  })
  socket.on('error', (e) => {
    console.log('1) TCP           -> ERRO:', e.code ?? e.message)
    resolve()
  })
})

/* ------------------- 2. HTTP puro, pra ver a resposta -------------------- */
const agent = new ProxyAgent(`http://${usuario}:${senha}@${host}:${porta}`)

try {
  const t0 = Date.now()
  const r = await request('http://api.ipify.org/?format=json', {
    dispatcher: agent,
    headers: { 'user-agent': 'Mozilla/5.0' },
    headersTimeout: 20000,
    bodyTimeout: 20000,
  })
  const txt = await r.body.text()
  console.log('2) HTTP via proxy ->', r.statusCode, '|', txt.slice(0, 80), '|', Date.now() - t0 + 'ms')
} catch (e) {
  console.log('2) HTTP via proxy -> ERRO:', e.code ?? e.message)
  if (e.cause) console.log('   causa:', e.cause.code ?? e.cause.message)
}

/* ---------------------- 3. HTTPS, que é o que importa -------------------- */
try {
  const t0 = Date.now()
  const r = await request('https://api.ipify.org/?format=json', {
    dispatcher: agent,
    headers: { 'user-agent': 'Mozilla/5.0' },
    headersTimeout: 25000,
    bodyTimeout: 25000,
  })
  const txt = await r.body.text()
  console.log('3) HTTPS via proxy ->', r.statusCode, '|', txt.slice(0, 80), '|', Date.now() - t0 + 'ms')
} catch (e) {
  console.log('3) HTTPS via proxy -> ERRO:', e.code ?? e.message)
  if (e.cause) console.log('   causa:', e.cause.code ?? e.cause.message)
}
