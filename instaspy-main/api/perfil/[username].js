// linguagem: JavaScript (ESM), arquivo: api/perfil/[username].js
// Funcao serverless do Vercel.
//
// O Instagram bloqueia IPs de datacenter. Sem PROXY_URL ou SCRAPERAPI_KEY
// configurados, a busca falha e cai no perfil gerado.
//
// Use ?debug=1 para ver o que cada tentativa devolveu:
//   /api/perfil/mtheus.elias?debug=1

import { buscarPerfilHttp, perfilFalso } from '../../server/src/instagram-http.js'

export default async function handler(req, res) {
  const username = String(req.query.username ?? '')
    .replace(/^@/, '')
    .trim()
    .toLowerCase()

  if (!/^[a-z0-9._]{1,30}$/.test(username)) {
    return res.status(400).json({ erro: 'Usuário inválido.' })
  }

  const debug = req.query.debug === '1'

  try {
    const perfil = await buscarPerfilHttp(username, { debug })

    if (perfil?.erro) {
      return res.json({ ...perfilFalso(username), aviso: perfil.erro, ...(debug ? { debug: perfil.debug } : {}) })
    }

    // cache de borda: 10 min bom, serve ate 15 min velho enquanto revalida
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=300')
    res.json(perfil)
  } catch (erro) {
    res.json({ ...perfilFalso(username), aviso: `falha: ${erro.message}` })
  }
}
