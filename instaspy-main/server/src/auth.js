// linguagem: JavaScript (ESM), arquivo: server/src/auth.js
// Hash de senha com scrypt (node:crypto built-in) e tokens de sessao opacos.

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const N = 16384
const r = 8
const p = 1
const KEYLEN = 64

/** scrypt com salt aleatorio no formato scrypt$N$r$p$salt$hash */
export function hashSenha(senha) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(senha, salt, KEYLEN, { N, r, p }).toString('hex')
  return `scrypt$${N}$${r}$${p}$${salt}$${hash}`
}

/**
 * Verifica a senha contra o hash armazenado.
 * Suporta o marcador `temp:<digitos>` usado na criacao de conta pos-compra —
 * o cliente e forcado a trocar a senha no primeiro acesso.
 */
export function verificarSenha(senha, armazenado) {
  if (!armazenado) return false

  if (armazenado.startsWith('temp:')) {
    return senha === armazenado.slice(5)
  }

  const partes = armazenado.split('$')
  if (partes.length !== 6 || partes[0] !== 'scrypt') return false

  const [, n, rr, pp, salt, hashEsperado] = partes
  const calculado = scryptSync(senha, salt, KEYLEN, {
    N: Number(n),
    r: Number(rr),
    p: Number(pp),
  })

  const a = Buffer.from(calculado.toString('hex'), 'hex')
  const b = Buffer.from(hashEsperado, 'hex')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function gerarToken() {
  return randomBytes(32).toString('base64url')
}

export function expiracaoSessao(dias = 30) {
  return new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString()
}
