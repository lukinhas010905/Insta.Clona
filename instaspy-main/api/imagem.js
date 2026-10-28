// linguagem: JavaScript (ESM), arquivo: api/imagem.js
// Funcao serverless do Vercel que faz proxy das fotos do CDN do Instagram.
// O CDN recusa hotlink sem Referer, entao a imagem passa pelo servidor.

import { proxyImagemHttp } from '../server/src/instagram-http.js'

export default async function handler(req, res) {
  const url = req.query.url
  if (!url) return res.status(400).json({ erro: 'Parâmetro url ausente.' })

  try {
    const r = await proxyImagemHttp(String(url))
    if (r?.erro) return res.status(502).json({ erro: r.erro })

    res.setHeader('Content-Type', r.contentType)
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400')
    res.send(r.buffer)
  } catch (erro) {
    res.status(502).json({ erro: `falha ao buscar imagem: ${erro.message}` })
  }
}
