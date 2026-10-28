// linguagem: TypeScript/TSX, arquivo: src/flow/TelaFeed.tsx
// Tela do feed falso do Instagram — a que aparece logo depois da invasao.
// Porte do componente HW do original: header, stories, 4 posts com localizacao
// e "Conteudo restrito", card de limite, barra VIP fixa e nav inferior.
// Todo clique em area bloqueada abre o modal e leva para a oferta.

import { useEffect, useMemo, useState } from 'react'
import { AVATARES, CIDADES, LEGENDAS } from './dados'
import { gerarSeguindo, mascararNome, tempoRestante, type Perfil } from './perfil'
import { urlImagem } from '@/lib/perfilApi'
import { IconAlerta, IconCadeado, IconInstagram } from './Icons'
import {
  IconBusca,
  IconCasa,
  IconCompartilhar,
  IconComentar,
  IconCoracao,
  IconCriar,
  IconMais,
  IconMenuPost,
  IconMessenger,
  IconPilha,
  IconReels,
  IconSalvar,
} from './IconsFeed'
import { useConfig } from '@/lib/config'

/** Mapa da aba para o texto que aparece no modal de bloqueio. */
const TEXTO_ABA: Record<string, string> = {
  stories: 'aos stories',
  posts: 'aos posts',
  reels: 'aos reels',
  perfil: 'ao perfil',
  curtidas: 'às curtidas',
  comentários: 'aos comentários',
  mensagens: 'às mensagens',
  buscas: 'às buscas',
}

interface PostFeed {
  id: number
  username: string
  location: string
  avatar: string | null
  likes: number
  comments: number
  shares: number
  caption: string
  timeAgo: string
  time: string
}

export default function TelaFeed({
  perfil,
  segundosRestantes,
  onAbrirInbox,
  onDesbloquear,
}: {
  perfil: Perfil
  segundosRestantes: number
  onAbrirInbox: () => void
  onDesbloquear: () => void
}) {
  const { config } = useConfig()
  const { marca } = config

  const [modal, setModal] = useState<string | null>(null)
  const [toast, setToast] = useState(false)
  const [interagiu, setInteragiu] = useState<Record<string, boolean>>({})
  const [noLimite, setNoLimite] = useState(false)

  const seguindo = useMemo(() => gerarSeguindo(perfil.username), [perfil.username])
  const foto = urlImagem(perfil.profilePicUrl)

  // toast de mensagem depois de 3s
  useEffect(() => {
    const t = window.setTimeout(() => setToast(true), 3000)
    return () => window.clearTimeout(t)
  }, [])

  // some sozinho depois de 5s
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(false), 5000)
    return () => window.clearTimeout(t)
  }, [toast])

  // chegou no fim da pagina -> mostra o card de limite
  useEffect(() => {
    const aoRolar = () => {
      const fim = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 100
      if (fim) setNoLimite(true)
    }
    window.addEventListener('scroll', aoRolar)
    return () => window.removeEventListener('scroll', aoRolar)
  }, [])

  const stories = useMemo(() => {
    const lista = [
      { id: 'own', name: 'Seu story', isOwn: true, avatar: foto ?? AVATARES[0] },
    ]
    seguindo.slice(0, 8).forEach((p, i) => {
      lista.push({
        id: `story-${i}`,
        name: mascararNome(p.fullName),
        isOwn: false,
        avatar: p.profilePicUrl ?? AVATARES[(i + 1) % AVATARES.length],
      })
    })
    return lista
  }, [seguindo, foto])

  const posts = useMemo<PostFeed[]>(() => {
    const horas = ['01:24', '14:45', '09:12', '21:38']
    const quando = ['há 1 dia', 'há 2 dias', 'há 4 dias', 'há 6 dias']
    return Array.from({ length: 4 }, (_, i) => {
      const p = seguindo[i]
      return {
        id: i + 1,
        username: mascararNome(p?.fullName),
        location: CIDADES[i % CIDADES.length],
        avatar: p?.profilePicUrl ?? AVATARES[i % AVATARES.length],
        likes: 15 + (i + 1) * 23,
        comments: 1 + (i + 1) * 2,
        shares: i + 1,
        caption: LEGENDAS[i % LEGENDAS.length],
        timeAgo: quando[i],
        time: horas[i],
      }
    })
  }, [seguindo])

  const bloquear = (aba: string) => setModal(aba)
  const marcar = (id: string) => setInteragiu((s) => ({ ...s, [id]: true }))

  return (
    <div className="relative z-10 min-h-screen bg-black text-white">
      {/* toast de mensagem nova */}
      {toast && (
        <div
          className="fixed top-4 left-4 right-4 z-[70] animate-slide-in-top"
          onClick={() => {
            setToast(false)
            onAbrirInbox()
          }}
        >
          <div className="bg-[#1c1c1e] rounded-2xl p-4 flex items-start gap-3 shadow-2xl cursor-pointer">
            <div className="w-10 h-10 rounded-xl flex-shrink-0 bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center">
              <IconInstagram className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-[15px] text-white">Instagram</span>
                <span className="text-[13px] text-[#8e8e8e]">Agora</span>
              </div>
              <p className="text-[15px] text-white leading-snug">
                {mascararNome(seguindo[4]?.fullName)} enviou uma mensagem: "vdd kkk, eu lembro
                daquele dia"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* modal de bloqueio */}
      {modal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a1a1a]/95 backdrop-blur-md rounded-2xl overflow-hidden max-w-[320px] w-full animate-scale-in border border-[#dc2626]/30">
            <div className="bg-[#7f1d1d]/80 px-6 py-5 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <IconAlerta className="w-5 h-5 text-[#fca5a5]" />
                <h3 className="text-white font-semibold text-[16px]">Ação bloqueada</h3>
              </div>
              <p className="text-white/80 text-[14px] leading-snug">
                Seja um membro VIP do {marca.nomeCompleto}
                <br />
                para ter acesso {TEXTO_ABA[modal] ?? 'aos conteúdos'}
              </p>
            </div>
            <div className="px-4 pb-4 pt-4 bg-[#1a1a1a]">
              <button
                onClick={() => {
                  setModal(null)
                  onDesbloquear()
                }}
                className="w-full py-3.5 bg-[#262626] hover:bg-[#363636] rounded-xl font-semibold text-[14px] text-white transition-colors border border-white/10"
              >
                Adquirir Acesso VIP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* header */}
      <header className="sticky top-0 z-50 bg-black px-4 py-2.5">
        <div className="flex items-center justify-between">
          <h1
            className="text-[28px] font-normal text-white"
            style={{ fontFamily: "'Billabong', 'Dancing Script', cursive", letterSpacing: '1px' }}
          >
            Instagram
          </h1>

          <div className="flex items-center gap-5">
            <button onClick={() => bloquear('curtidas')} className="relative" aria-label="Curtidas">
              <IconCoracao className="w-[26px] h-[26px]" strokeWidth={1.5} />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#ff3040] rounded-full" />
            </button>

            <button onClick={onAbrirInbox} className="relative" aria-label="Mensagens">
              <IconMessenger className="w-[26px] h-[26px]" />
              <div className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] bg-[#ff3040] rounded-full text-[11px] flex items-center justify-center font-bold px-1">
                3
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* stories */}
      <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide">
        {stories.map((s) => (
          <button
            key={s.id}
            onClick={() => bloquear('stories')}
            className="flex flex-col items-center gap-2 flex-shrink-0"
          >
            <div className="relative">
              {s.isOwn ? (
                <div className="w-[80px] h-[80px] rounded-full overflow-hidden bg-[#262626]">
                  {s.avatar && !interagiu[s.id] ? (
                    <img
                      src={s.avatar}
                      alt={s.name}
                      className="w-full h-full object-cover"
                      onError={() => marcar(s.id)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
                      <span className="text-[18px] text-white font-bold">
                        {s.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#0095f6] rounded-full flex items-center justify-center border-[2px] border-black">
                    <IconMais className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              ) : (
                <div className="w-[80px] h-[80px] rounded-full p-[3px] bg-[#22c55e]">
                  <div className="w-full h-full rounded-full border-[3px] border-black overflow-hidden bg-[#262626] relative">
                    {s.avatar && !interagiu[s.id] ? (
                      <img
                        src={s.avatar}
                        alt={s.name}
                        className="w-full h-full object-cover blur-md"
                        onError={() => marcar(s.id)}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center blur-md">
                        <span className="text-[18px] text-white font-bold">
                          {s.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <span className="text-[12px] text-[#f5f5f5] w-[80px] truncate text-center">
              {s.name}
            </span>
          </button>
        ))}
      </div>

      {/* card de limite, aparece ao chegar no fim */}
      {noLimite && (
        <div className="mx-4 mb-4 p-4 bg-[#1c1c1e] rounded-2xl flex items-center gap-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-[#FFDC80] via-[#FD1D1D] to-[#833AB4]">
            <div className="w-full h-full rounded-full bg-[#1c1c1e] flex items-center justify-center">
              <IconCadeado className="w-7 h-7 text-[#F77737]" />
            </div>
          </div>
          <p className="text-white text-[14px] leading-snug flex-1">
            Você chegou ao limite da ferramenta. Para continuar acessando mais informações,
            torne-se membro VIP.{' '}
            <button onClick={onDesbloquear} className="text-[#0095f6] font-semibold hover:underline">
              Virar VIP
            </button>
          </p>
        </div>
      )}

      {/* posts */}
      <div className="pb-40">
        {posts.map((post) => (
          <article key={post.id}>
            <div className="flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-[#363636] relative">
                  {post.avatar && !interagiu[`post-${post.id}`] ? (
                    <img
                      src={post.avatar}
                      alt="avatar"
                      className="w-full h-full object-cover blur-md"
                      onError={() => marcar(`post-${post.id}`)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center blur-md">
                      <span className="text-[12px] text-white font-bold">
                        {post.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="leading-tight">
                  <span className="text-[14px] font-semibold text-white">{post.username}</span>
                  <p className="text-[12px] text-[#a8a8a8]">{post.location}</p>
                </div>
              </div>
              <button onClick={() => bloquear('posts')} aria-label="Opções">
                <IconMenuPost className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* midia bloqueada */}
            <div
              className="aspect-square bg-[#1a1a1a] flex flex-col items-center justify-center cursor-pointer relative overflow-hidden"
              onClick={() => bloquear('posts')}
            >
              <div className="relative z-10 flex flex-col items-center justify-center">
                <IconCadeado className="w-12 h-12 text-[#737373] mb-3" strokeWidth={1.5} />
                <p className="text-white font-medium text-[15px]">Conteúdo restrito</p>
                <p className="text-[#737373] text-[13px] mt-1">
                  {post.timeAgo} - {post.time}
                </p>
              </div>
            </div>

            {/* acoes */}
            <div className="px-3 py-2.5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => bloquear('curtidas')}
                    className="flex items-center gap-1.5"
                    aria-label="Curtidas"
                  >
                    <IconCoracao className="w-[26px] h-[26px]" strokeWidth={1.5} />
                    <span className="text-[13px]">{post.likes}</span>
                  </button>
                  <button
                    onClick={() => bloquear('comentários')}
                    className="flex items-center gap-1.5"
                    aria-label="Comentários"
                  >
                    <IconComentar className="w-[26px] h-[26px]" strokeWidth={1.5} />
                    <span className="text-[13px]">{post.comments}</span>
                  </button>
                  <button
                    onClick={() => bloquear('mensagens')}
                    className="flex items-center gap-1.5"
                    aria-label="Compartilhar"
                  >
                    <IconCompartilhar className="w-[26px] h-[26px]" />
                    <span className="text-[13px]">{post.shares}</span>
                  </button>
                  <button onClick={() => bloquear('mensagens')} aria-label="Salvar">
                    <IconSalvar className="w-[26px] h-[26px]" strokeWidth={1.5} />
                  </button>
                </div>
                <button onClick={() => bloquear('posts')} aria-label="Pilha">
                  <IconPilha className="w-[26px] h-[26px]" strokeWidth={1.5} />
                </button>
              </div>

              <p className="text-[14px]">
                <span className="font-semibold">{post.username}</span>
                <span className="ml-1.5">{post.caption}</span>
              </p>
            </div>
          </article>
        ))}
      </div>

      {/* barra VIP */}
      <div className="fixed bottom-[56px] left-0 right-0 z-40 bg-gradient-to-r from-[#7c3aed] via-[#8b5cf6] to-[#c026d3] px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[14px]">⚡</span>
              <span className="text-white font-semibold text-[13px]">
                Prévia disponível por {tempoRestante(segundosRestantes)}
              </span>
            </div>
            <p className="text-white/80 text-[11px] leading-snug">
              Você ganhou 10 minutos para testar gratuitamente nossa ferramenta, mas para liberar
              todas as funcionalidades e ter acesso permanente é necessário ser um membro VIP.
            </p>
          </div>
          <button
            onClick={onDesbloquear}
            className="bg-[#1f1f1f]/80 backdrop-blur-sm text-white font-medium px-4 py-2 rounded-lg text-[12px] active:scale-95 transition-transform whitespace-nowrap flex-shrink-0"
          >
            Tornar-se VIP
          </button>
        </div>
      </div>

      {/* nav inferior */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-[#262626] px-4 py-3">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <button className="p-1.5" aria-label="Início">
            <IconCasa className="w-[26px] h-[26px]" />
          </button>
          <button onClick={() => bloquear('buscas')} className="p-1.5" aria-label="Buscar">
            <IconBusca className="w-[26px] h-[26px]" strokeWidth={1.5} />
          </button>
          <button onClick={() => bloquear('posts')} className="p-1.5" aria-label="Criar">
            <IconCriar className="w-[26px] h-[26px]" strokeWidth={1.5} />
          </button>
          <button onClick={() => bloquear('reels')} className="p-1.5" aria-label="Reels">
            <IconReels className="w-[26px] h-[26px]" strokeWidth={1.5} />
          </button>
          <button onClick={() => bloquear('perfil')} className="p-1.5" aria-label="Perfil">
            <div className="w-[28px] h-[28px] rounded-full overflow-hidden ring-2 ring-white bg-[#262626]">
              {foto && !interagiu.nav ? (
                <img
                  src={foto}
                  alt="Perfil"
                  className="w-full h-full object-cover"
                  onError={() => marcar('nav')}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
                  <span className="text-[10px] text-white font-bold">
                    {perfil.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </button>
        </div>
      </nav>
    </div>
  )
}
