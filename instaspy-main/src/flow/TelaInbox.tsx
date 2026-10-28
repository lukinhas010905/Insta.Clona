// linguagem: TypeScript/TSX, arquivo: src/flow/TelaInbox.tsx
// Tela 5. Inbox falso do Instagram. Conversas com avatar borrado, nome mascarado,
// linhas >= indice 5 bloqueadas com cadeado. Qualquer clique abre o paywall VIP.

import { useEffect, useMemo, useState } from 'react'
import { AVATARES, CONVERSAS, NOTAS } from './dados'
import { gerarSeguindo, mascararNome, tempoRestante, type Perfil } from './perfil'
import { useConfig } from '@/lib/config'
import {
  IconAlerta,
  IconCamera,
  IconCamadas,
  IconCadeado,
  IconEditar,
  IconGlobo,
  IconVoltar,
} from './Icons'

interface LinhaConversa {
  name: string
  message: string
  time: string
  unread: boolean
  locked: boolean
  avatar: string | null
}

export default function TelaInbox({
  perfil,
  segundosRestantes,
  onVoltar,
  onDesbloquear,
}: {
  perfil: Perfil
  segundosRestantes: number
  onVoltar: () => void
  onDesbloquear: () => void
}) {
  const [modal, setModal] = useState(false)
  const [notificacao, setNotificacao] = useState<LinhaConversa | null>(null)
  const { config } = useConfig()
  const { marca } = config

  const usuario = perfil.username.toLowerCase()
  const seguindo = useMemo(() => gerarSeguindo(perfil.username), [perfil.username])

  // notificacao falsa entra depois de 3s
  useEffect(() => {
    const t = window.setTimeout(() => {
      const quem = seguindo.length > 4 ? seguindo[4] : seguindo[0]
      setNotificacao({
        name: mascararNome(quem.fullName),
        message: 'vdd kkk, eu lembro daquele dia',
        time: 'Agora',
        unread: true,
        locked: false,
        avatar: quem.profilePicUrl ?? AVATARES[1],
      })
    }, 3000)
    return () => window.clearTimeout(t)
  }, [seguindo])

  const notas = useMemo(() => {
    const lista = [
      { name: 'Sua nota', avatar: perfil.profilePicUrl ?? AVATARES[0], isOwn: true, note: '' },
    ]
    seguindo.slice(0, 3).forEach((pessoa, i) => {
      lista.push({
        name: mascararNome(pessoa.fullName),
        avatar: (pessoa.profilePicUrl ?? AVATARES[(i + 1) % AVATARES.length]) as string,
        isOwn: false,
        note: NOTAS[i % NOTAS.length],
      })
    })
    return lista
  }, [seguindo, perfil.profilePicUrl])

  const conversas = useMemo<LinhaConversa[]>(() => {
    const lista: LinhaConversa[] = []
    let offset = 0

    if (notificacao) {
      lista.push(notificacao)
      offset = 1
    }

    seguindo.forEach((pessoa, i) => {
      const base = CONVERSAS[(i + offset) % CONVERSAS.length]
      lista.push({
        name: mascararNome(pessoa.fullName),
        message: base.message,
        time: base.time,
        unread: base.unread,
        locked: i >= 5,
        avatar: pessoa.profilePicUrl ?? AVATARES[(i + offset) % AVATARES.length],
      })
    })

    return lista
  }, [seguindo, notificacao])

  const bloquear = () => setModal(true)

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col">
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
                para ter acesso às mensagens
              </p>
            </div>
            <div className="px-4 pb-4 pt-4 bg-[#1a1a1a]">
              <button
                onClick={() => {
                  setModal(false)
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

      <div className="flex-1 overflow-y-auto">
        <header className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={onVoltar} className="p-1" aria-label="Voltar">
              <IconVoltar className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-white font-bold text-[20px]">{usuario}</h1>
          </div>
          <div className="flex items-center gap-5">
            <button className="text-white" aria-label="Camadas">
              <IconCamadas className="w-6 h-6" />
            </button>
            <button className="text-white" aria-label="Editar">
              <IconEditar className="w-6 h-6" />
            </button>
          </div>
        </header>

        <div className="px-4 py-2">
          <div className="bg-[#262626] rounded-[22px] px-4 py-2.5 flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white/90" />
            </div>
            <span className="text-[#a8a8a8] text-[15px]">Interaja com a Meta AI ou pesquise</span>
          </div>
        </div>

        <div className="px-4 pt-4 pb-3">
          <div className="flex gap-5 overflow-x-auto scrollbar-hide">
            {notas.map((nota, i) => (
              <button
                key={i}
                onClick={bloquear}
                className="flex flex-col items-center flex-shrink-0"
                style={{ width: '90px' }}
              >
                <div className="flex flex-col items-center">
                  <div className="h-[48px] flex items-end justify-center mb-[-10px] z-10">
                    <div
                      className="bg-[#2f3234] text-white text-[13px] font-normal leading-[1.3] text-center rounded-[16px]"
                      style={{
                        width: '88px',
                        minWidth: '88px',
                        maxWidth: '88px',
                        minHeight: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px 10px',
                        boxSizing: 'border-box',
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {nota.isOwn ? 'Deixe uma nota...' : nota.note}
                    </div>
                  </div>
                  <div className="w-[82px] h-[82px] rounded-full p-[3px] bg-[#1a1a1a]">
                    <div className="w-full h-full rounded-full overflow-hidden bg-black">
                      <img
                        src={nota.avatar}
                        alt={nota.name}
                        className={`w-full h-full object-cover rounded-full ${
                          nota.isOwn ? '' : 'blur-md'
                        }`}
                      />
                    </div>
                  </div>
                </div>
                <span className="text-[14px] text-white font-medium truncate text-center w-full mt-2">
                  {nota.isOwn ? 'Sua nota' : nota.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-2 flex items-center justify-between">
          <h2 className="text-white font-bold text-[16px]">Mensagens</h2>
          <button className="text-[#0095f6] font-semibold text-[14px]" onClick={bloquear}>
            Pedidos (4)
          </button>
        </div>

        <div className="pb-32">
          {conversas.map((linha, i) => (
            <button
              key={i}
              onClick={bloquear}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#121212] transition-colors active:bg-[#1a1a1a]"
            >
              <div className="relative flex-shrink-0">
                {linha.locked ? (
                  <div className="w-14 h-14 rounded-full bg-[#262626] flex items-center justify-center border border-[#363636]">
                    <IconCadeado className="w-5 h-5 text-[#8e8e8e]" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-transparent">
                    <img
                      src={linha.avatar ?? AVATARES[0]}
                      alt={linha.name}
                      className="w-full h-full object-cover blur-md"
                    />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 text-left">
                <p
                  className={`text-[15px] truncate ${
                    linha.unread ? 'text-white font-bold' : 'text-white font-normal'
                  }`}
                >
                  {linha.name}
                </p>
                <p
                  className={`text-[13px] truncate ${
                    linha.unread ? 'text-white font-semibold' : 'text-[#a8a8a8]'
                  }`}
                >
                  {linha.message}{' '}
                  <span className="text-[#a8a8a8] font-normal">• {linha.time}</span>
                </p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {linha.unread && <div className="w-2 h-2 bg-[#0095f6] rounded-full" />}
                <IconCamera className="w-6 h-6 text-[#8e8e8e]" strokeWidth={1.5} />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#5b4dbf] via-[#7c3aed] to-[#a855f7] px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-yellow-400 text-[14px]">⚡</span>
              <span className="text-white font-semibold text-[14px]">
                Prévia disponível por {tempoRestante(segundosRestantes)}
              </span>
              <IconGlobo className="w-3 h-3 text-white/60" />
            </div>
            <p className="text-white/90 text-[12px] leading-snug">
              Você ganhou 10 minutos para testar gratuitamente nossa ferramenta, mas para liberar
              todas as funcionalidades e ter acesso permanente é necessário ser um membro VIP.
            </p>
          </div>
          <button
            onClick={onDesbloquear}
            className="bg-[#4c1d95]/60 hover:bg-[#4c1d95]/80 text-white text-[13px] font-semibold px-4 py-2 rounded-lg whitespace-nowrap flex-shrink-0 transition-colors"
          >
            Tornar-se VIP
          </button>
        </div>
      </div>
    </div>
  )
}
