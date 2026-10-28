// linguagem: JavaScript (ESM), arquivo: server/src/db.js
// Persistencia com node:sqlite (built-in, Node >= 22.5). Zero dependencia nativa.
// Migrar para Postgres: trocar as 4 funcoes de repositorio, o schema e ANSI.

import { DatabaseSync } from 'node:sqlite'
import { randomUUID, randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ARQUIVO = process.env.DB_PATH ?? path.join(__dirname, '..', 'data.sqlite')

export const db = new DatabaseSync(ARQUIVO)
db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id          TEXT PRIMARY KEY,
    nome        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    senha_hash  TEXT NOT NULL,
    plano_id    TEXT NOT NULL DEFAULT 'basico',
    expira_em   TEXT,
    criado_em   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pedidos (
    id               TEXT PRIMARY KEY,
    plano_id         TEXT NOT NULL,
    nome             TEXT NOT NULL,
    email            TEXT NOT NULL,
    telefone         TEXT NOT NULL,
    cpf              TEXT NOT NULL,
    status           TEXT NOT NULL DEFAULT 'pendente',
    valor_centavos   INTEGER NOT NULL,
    txid             TEXT NOT NULL UNIQUE,
    pix_payload      TEXT NOT NULL,
    expira_em        TEXT NOT NULL,
    criado_em        TEXT NOT NULL,
    pago_em          TEXT
  );

  CREATE TABLE IF NOT EXISTS sessoes (
    token      TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    criado_em  TEXT NOT NULL,
    expira_em  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS alvos (
    id            TEXT PRIMARY KEY,
    usuario_id    TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    plataforma    TEXT NOT NULL,
    identificador TEXT NOT NULL,
    rotulo        TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'ativo',
    criado_em     TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS eventos (
    id              TEXT PRIMARY KEY,
    tipo            TEXT NOT NULL,
    pedido_id       TEXT,
    plano_id        TEXT,
    valor_centavos  INTEGER DEFAULT 0,
    criado_em       TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_alvos_usuario   ON alvos(usuario_id);
  CREATE INDEX IF NOT EXISTS idx_eventos_tipo    ON eventos(tipo, criado_em);
  CREATE INDEX IF NOT EXISTS idx_pedidos_email   ON pedidos(email);
  CREATE INDEX IF NOT EXISTS idx_sessoes_usuario ON sessoes(usuario_id);
`)

const agora = () => new Date().toISOString()

/* ------------------------------- usuarios -------------------------------- */

export function criarUsuario({ nome, email, senha_hash, plano_id = 'basico', expira_em = null }) {
  const id = randomUUID()
  db.prepare(
    `INSERT INTO usuarios (id, nome, email, senha_hash, plano_id, expira_em, criado_em)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, nome, email.toLowerCase(), senha_hash, plano_id, expira_em, agora())
  return buscarUsuarioPorId(id)
}

export function buscarUsuarioPorEmail(email) {
  return db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email.toLowerCase())
}

export function buscarUsuarioPorId(id) {
  return db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id)
}

/* -------------------------------- pedidos -------------------------------- */

export function criarPedido(p) {
  const id = randomUUID()
  db.prepare(
    `INSERT INTO pedidos
       (id, plano_id, nome, email, telefone, cpf, status, valor_centavos, txid, pix_payload, expira_em, criado_em)
     VALUES (?, ?, ?, ?, ?, ?, 'pendente', ?, ?, ?, ?, ?)`,
  ).run(
    id, p.plano_id, p.nome, p.email.toLowerCase(), p.telefone, p.cpf,
    p.valor_centavos, p.txid, p.pix_payload, p.expira_em, agora(),
  )
  return buscarPedido(id)
}

export function buscarPedido(id) {
  return db.prepare('SELECT * FROM pedidos WHERE id = ?').get(id)
}

export function marcarPedidoPago(id) {
  const pedido = buscarPedido(id)
  if (!pedido || pedido.status === 'pago') return pedido

  const pago_em = agora()
  db.prepare('UPDATE pedidos SET status = ?, pago_em = ? WHERE id = ?').run('pago', pago_em, id)
  registrarEvento({
    tipo: 'venda',
    pedido_id: id,
    plano_id: pedido.plano_id,
    valor_centavos: pedido.valor_centavos,
  })

  // libera acesso: cria ou atualiza a conta do comprador
  const existente = buscarUsuarioPorEmail(pedido.email)
  const expira = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()

  if (existente) {
    db.prepare('UPDATE usuarios SET plano_id = ?, expira_em = ? WHERE id = ?').run(
      pedido.plano_id,
      pedido.plano_id === 'vitalicio' ? null : expira,
      existente.id,
    )
  } else {
    criarUsuario({
      nome: pedido.nome,
      email: pedido.email,
      senha_hash: hashSenhaTemporaria(pedido.cpf),
      plano_id: pedido.plano_id,
      expira_em: pedido.plano_id === 'vitalicio' ? null : expira,
    })
  }

  return buscarPedido(id)
}

export function expirarPedidosVencidos() {
  const r = db
    .prepare(
      `UPDATE pedidos SET status = 'expirado'
       WHERE status = 'pendente' AND expira_em < ?`,
    )
    .run(agora())
  return r.changes
}

// senha inicial = 6 primeiros digitos do CPF; o cliente troca no primeiro acesso
function hashSenhaTemporaria(cpf) {
  return `temp:${String(cpf).replace(/\D/g, '').slice(0, 6)}`
}

/* -------------------------------- sessoes -------------------------------- */

export function criarSessao(usuario_id, token, expira_em) {
  db.prepare(
    'INSERT INTO sessoes (token, usuario_id, criado_em, expira_em) VALUES (?, ?, ?, ?)',
  ).run(token, usuario_id, agora(), expira_em)
}

export function buscarSessao(token) {
  return db
    .prepare('SELECT * FROM sessoes WHERE token = ? AND expira_em > ?')
    .get(token, agora())
}

export function apagarSessao(token) {
  db.prepare('DELETE FROM sessoes WHERE token = ?').run(token)
}

/* --------------------------------- alvos --------------------------------- */

export function listarAlvos(usuario_id) {
  return db
    .prepare('SELECT * FROM alvos WHERE usuario_id = ? ORDER BY criado_em DESC')
    .all(usuario_id)
}

export function criarAlvo({ usuario_id, plataforma, identificador, rotulo }) {
  const id = randomUUID()
  db.prepare(
    `INSERT INTO alvos (id, usuario_id, plataforma, identificador, rotulo, status, criado_em)
     VALUES (?, ?, ?, ?, ?, 'ativo', ?)`,
  ).run(id, usuario_id, plataforma, identificador, rotulo, agora())
  return db.prepare('SELECT * FROM alvos WHERE id = ?').get(id)
}

export function removerAlvo(id, usuario_id) {
  const r = db.prepare('DELETE FROM alvos WHERE id = ? AND usuario_id = ?').run(id, usuario_id)
  return r.changes > 0
}

/* -------------------------------- eventos -------------------------------- */

export function registrarEvento({ tipo, pedido_id = null, plano_id = null, valor_centavos = 0 }) {
  db.prepare(
    `INSERT INTO eventos (id, tipo, pedido_id, plano_id, valor_centavos, criado_em)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(randomUUID(), tipo, pedido_id, plano_id, valor_centavos, agora())
}

export function contarEventos(tipo, desdeIso) {
  const r = db
    .prepare('SELECT COUNT(*) AS n FROM eventos WHERE tipo = ? AND criado_em >= ?')
    .get(tipo, desdeIso)
  return r?.n ?? 0
}

/** Contagem em janela fechada — usada pela serie diaria do dashboard. */
export function contarEventosEntre(tipo, deIso, ateIso) {
  const r = db
    .prepare('SELECT COUNT(*) AS n FROM eventos WHERE tipo = ? AND criado_em BETWEEN ? AND ?')
    .get(tipo, deIso, ateIso)
  return r?.n ?? 0
}

export function somarReceita(desdeIso) {
  const r = db
    .prepare(
      `SELECT COALESCE(SUM(valor_centavos), 0) AS total
       FROM eventos WHERE tipo = 'venda' AND criado_em >= ?`,
    )
    .get(desdeIso)
  return r?.total ?? 0
}

export function receitaPorPlano(desdeIso) {
  return db
    .prepare(
      `SELECT plano_id,
              COUNT(*) AS vendas,
              COALESCE(SUM(valor_centavos), 0) AS receita_centavos
       FROM eventos
       WHERE tipo = 'venda' AND criado_em >= ?
       GROUP BY plano_id`,
    )
    .all(desdeIso)
}

/* --------------------------------- seed ---------------------------------- */

// Popula eventos de demonstracao para o dashboard nao nascer zerado.
export function seedDemo() {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM eventos').get()
  if (n > 0) return

  const planos = [
    { id: 'basico', valor: 4790 },
    { id: 'completo', valor: 8790 },
    { id: 'vitalicio', valor: 14700 },
  ]

  const inserir = db.prepare(
    `INSERT INTO eventos (id, tipo, pedido_id, plano_id, valor_centavos, criado_em)
     VALUES (?, ?, NULL, ?, ?, ?)`,
  )

  for (let dia = 6; dia >= 0; dia--) {
    const base = new Date()
    base.setDate(base.getDate() - dia)
    base.setHours(12, 0, 0, 0)

    const visitas = 180 + Math.floor(Math.random() * 140) + (6 - dia) * 22
    for (let i = 0; i < visitas; i++) {
      inserir.run(randomUUID(), 'visita', null, 0, base.toISOString())
    }

    const checkouts = Math.floor(visitas * (0.06 + Math.random() * 0.03))
    for (let i = 0; i < checkouts; i++) {
      inserir.run(randomUUID(), 'checkout', null, 0, base.toISOString())
    }

    const vendas = Math.max(1, Math.floor(checkouts * (0.32 + Math.random() * 0.18)))
    for (let i = 0; i < vendas; i++) {
      const p = planos[Math.floor(Math.random() * planos.length)]
      inserir.run(randomUUID(), 'venda', p.id, p.valor, base.toISOString())
    }
  }
}
