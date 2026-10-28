// linguagem: TypeScript/TSX, arquivo: src/flow/TelaHook.tsx
// Tela 1. Maquina de estados identica ao original:
//   title (digita a 50ms) -> pausa 400ms -> subtitle (digita a 35ms) -> cursor off -> CTA sobe
// Cursor pisca a cada 530ms. Icone do botao some por 150ms a cada 2500ms.
// O que mudou aqui foi so acabamento: card com fio neon, aura ambiente e
// o numero do contador no gradiente da logo.

import { useEffect, useState } from 'react'
import { IconOlho, Selos } from './Icons'
import LogoMarca from './LogoMarca'
import { diaDaSemana } from './perfil'

const TITULO = `O que seu Cônjuge faz\nquando está no Instagram?`
const SUBTITULO = 'Descubra a verdade sobre qualquer pessoa, acessando o instagram dela!'

type Etapa = 'title' | 'subtitle' | 'done'

export default function TelaHook({ onIniciar }: { onIniciar: () => void }) {
  const [contador, setContador] = useState(81676)
  const [iconeVisivel, setIconeVisivel] = useState(true)
  const [titulo, setTitulo] = useState('')
  const [subtitulo, setSubtitulo] = useState('')
  const [cursorAtivo, setCursorAtivo] = useState(true)
  const [cursorPisca, setCursorPisca] = useState(true)
  const [etapa, setEtapa] = useState<Etapa>('title')
  const [mostrarCta, setMostrarCta] = useState(false)

  // contador de perfis: +10..59 a cada 2,5s
  useEffect(() => {
    const t = window.setInterval(() => {
      setContador((v) => v + Math.floor(Math.random() * 50) + 10)
    }, 2500)
    return () => window.clearInterval(t)
  }, [])

  // piscada do icone do botao
  useEffect(() => {
    const t = window.setInterval(() => {
      setIconeVisivel(false)
      window.setTimeout(() => setIconeVisivel(true), 150)
    }, 2500)
    return () => window.clearInterval(t)
  }, [])

  // digitacao do titulo
  useEffect(() => {
    let i = 0
    const inicio = window.setTimeout(() => {
      const t = window.setInterval(() => {
        if (i < TITULO.length) {
          setTitulo(TITULO.substring(0, i + 1))
          i++
        } else {
          window.clearInterval(t)
          window.setTimeout(() => setEtapa('subtitle'), 400)
        }
      }, 50)
    }, 500)
    return () => window.clearTimeout(inicio)
  }, [])

  // digitacao do subtitulo -> depois libera o CTA
  useEffect(() => {
    if (etapa !== 'subtitle') return
    let i = 0
    const t = window.setInterval(() => {
      if (i < SUBTITULO.length) {
        setSubtitulo(SUBTITULO.substring(0, i + 1))
        i++
      } else {
        window.clearInterval(t)
        setEtapa('done')
        window.setTimeout(() => {
          setCursorAtivo(false)
          window.setTimeout(() => setMostrarCta(true), 200)
        }, 300)
      }
    }, 35)
    return () => window.clearInterval(t)
  }, [etapa])

  // piscar do cursor
  useEffect(() => {
    if (!cursorAtivo) return
    const t = window.setInterval(() => setCursorPisca((v) => !v), 530)
    return () => window.clearInterval(t)
  }, [cursorAtivo])

  const cursor = <span className={cursorPisca ? 'opacity-100' : 'opacity-0'}>|</span>

  // divide o texto digitado e pinta "Cônjuge" de roxo
  const tituloRender = titulo.split(/(Cônjuge)/).map((parte, i) =>
    parte === 'Cônjuge' ? (
      <span key={i} className="text-[#a78bfa]">
        {parte}
      </span>
    ) : (
      parte.split('\n').map((linha, j, arr) => (
        <span key={`${i}-${j}`}>
          {linha}
          {j < arr.length - 1 && <br />}
        </span>
      ))
    ),
  )

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
      <div className="relative w-full max-w-[400px]">
        <div className="aura-neon" aria-hidden />

        <div className="relative card-neon p-8">
          <div className="flex flex-col items-center mb-8">
            <LogoMarca />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-[26px] font-bold text-white mb-4 leading-tight min-h-[80px]">
              {tituloRender}
              {etapa === 'title' && cursorAtivo && (
                <span className="transition-opacity duration-100">{cursor}</span>
              )}
            </h2>
            <p className="text-[#8b8b9e] text-[15px] leading-relaxed min-h-[48px]">
              {subtitulo}
              {etapa === 'subtitle' && cursorAtivo && (
                <span className="transition-opacity duration-100">{cursor}</span>
              )}
            </p>
          </div>

          <div
            className={`transition-all duration-500 ease-out ${
              mostrarCta
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4 pointer-events-none'
            }`}
          >
            <button
              onClick={onIniciar}
              className="w-full h-[56px] text-[16px] font-bold btn-premium rounded-full flex items-center justify-center gap-2.5 text-white mb-6"
            >
              <IconOlho
                className={`h-5 w-5 transition-all duration-150 ${
                  iconeVisivel ? 'opacity-100' : 'opacity-0'
                }`}
              />
              Espionar Agora
            </button>
            <Selos />
          </div>
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
