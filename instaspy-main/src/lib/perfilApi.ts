// linguagem: TypeScript, arquivo: src/lib/perfilApi.ts
// Cliente da API do funil. Duas rotas importam:
//   GET /api/perfil/:username  -> dados publicos reais do Instagram
//   GET /api/imagem?url=       -> proxy da foto (o CDN do Instagram recusa hotlink)

export const API_BASE: string = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? '/api'

export interface PerfilAPI {
  username: string
  fullName: string
  bio: string
  profilePicUrl: string | null
  followers: number
  following: number
  posts: number
  isPrivate: boolean
  isVerified: boolean
  /** 'json-embutido' | 'meta-tags' (real) · 'gerado' (fallback) */
  fonte?: string
  aviso?: string
}

/** Busca o perfil real. Devolve null se a API estiver fora do ar. */
export async function buscarPerfil(usuario: string): Promise<PerfilAPI | null> {
  try {
    const r = await fetch(`${API_BASE}/perfil/${encodeURIComponent(usuario)}`)
    if (!r.ok) return null
    const dados = (await r.json()) as PerfilAPI
    return dados?.username ? dados : null
  } catch {
    return null
  }
}

/** Converte a URL do CDN do Instagram na URL do nosso proxy. */
export function urlImagem(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('/') || url.startsWith('data:')) return url
  return `${API_BASE}/imagem?url=${encodeURIComponent(url)}`
}
