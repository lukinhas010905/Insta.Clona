// linguagem: TypeScript/TSX, arquivo: src/flow/TelaUsuario.tsx
// Tela 2. Digitar o @ e buscar o perfil REAL na API.
// Contador comeca em 81902 (+10..59 a cada 3s).
// Se a API falhar, cai no gerador deterministico local — o funil nunca trava.
// Acabamento: card com fio neon, aura ambiente e foco do campo em magenta.

import { useEffect, useState } from 'react'
import { IconLoader, IconSeta, Selos } from './Icons'
import LogoMarca from './LogoMarca'
import { diaDaSemana, gerarPerfil, type Perfil } from './perfil'
import { buscarPerfil } from '@/lib/perfilApi'

/** Tempo minimo de "Localizando perfil..." para a animacao nao piscar. */
const MINIMO_CARREGANDO_MS = 1100

export default function TelaUsuario({ onPerfil }: { onPerfil: (perfil: Perfil) => void }) {
  const [valor, setValor] = useState('')
  const [contador, setContador] = useState(81902)
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    const t = window.setInterval(() => {
      setContador((v) => v + Math.floor(Math.random() * 50) + 10)
    }, 3000)
    return () => window.clearInterval(t)
  }, [])

  const enviar = async () => {
    const limpo = valor.replace(/^@/, '').trim()
    if (limpo.length < 1 || carregando) return

    setCarregando(true)
    const inicio = Date.now()

    const real = await buscarPerfil(limpo)

    // segura a tela de carregamento pelo tempo minimo
    const decorrido = Date.now() - inicio
    if (decorrido < MINIMO_CARREGANDO_MS) {
      await new Promise((r) => window.setTimeout(r, MINIMO_CARREGANDO_MS - decorrido))
    }

    onPerfil(real ?? gerarPerfil(limpo))
  }

  if (carregando) {
    return (
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        <div className="relative w-full max-w-[400px]">
          <div className="aura-neon" aria-hidden />
          <div className="relative card-neon p-8 text-center">
            <div className="relative mx-auto mb-4 w-14 h-14">
              <div
                aria-hidden
                className="absolute inset-0 rounded-full blur-xl animate-aura"
                style={{
                  background:
                    'radial-gradient(circle, rgba(139,92,246,.7), rgba(217,70,239,.35) 60%, transparent 78%)',
                }}
              />
              <IconLoader className="relative w-14 h-14 text-[#c4b5fd] animate-spin" />
            </div>
            <p className="text-white font-semibold text-lg mb-2">Localizando perfil...</p>
            <p className="text-[#6b7280] text-sm">
              Buscando dados de @{valor.replace(/^@/, '').trim()}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
      <div className="relative w-full max-w-[400px]">
        <div className="aura-neon" aria-hidden />

        <div className="relative card-neon p-8">
          <div className="flex flex-col items-center mb-8">
            <LogoMarca />
          </div>

          <div className="text-center mb-6">
            <h2 className="text-[26px] font-bold text-white mb-4 leading-tight">
              O que seu <span className="text-[#a78bfa]">Cônjuge</span> faz
              <br />
              quando está no Instagram?
            </h2>
            <p className="text-[#8b8b9e] text-[15px] leading-relaxed">
              Digite o nome de usuário da pessoa a ser espionada, sem o arroba "@"
            </p>
          </div>

          <div className="relative mb-6">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#c4b5fd] text-[16px] font-medium">
              @
            </div>
            <input
              value={valor}
              onChange={(e) => setValor(e.target.value.toLowerCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void enviar()
              }}
              placeholder="ex: nomedoconjuge_10"
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              disabled={carregando}
              className="w-full h-[56px] pl-10 pr-14 bg-white/[.03] border border-[#3a3a5e] rounded-full text-white placeholder:text-[#4b5563] focus:border-[#d946ef] focus:outline-none focus:ring-2 focus:ring-[#d946ef]/25 focus:shadow-[0_0_28px_-6px_rgba(217,70,239,.55)] text-[16px] lowercase transition-all duration-200 disabled:opacity-70"
            />

            {valor.length > 0 && (
              <button
                onClick={() => void enviar()}
                disabled={carregando}
                aria-label="Buscar perfil"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-gradient-to-r from-[#8b5cf6] via-[#d946ef] to-[#f97316] hover:brightness-110 flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-fuchsia-500/30 disabled:opacity-70"
              >
                {carregando ? (
                  <IconLoader className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <IconSeta className="w-5 h-5 text-white" />
                )}
              </button>
            )}
          </div>

          <Selos />
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-[14px]">
          <span className="texto-neon font-semibold">+{contador.toLocaleString('pt-BR')}</span>
          <span className="text-[#6b7280]"> perfis analisados hoje ({diaDaSemana()})</span>
        </p>
      </div>
    </div>
  )
}
