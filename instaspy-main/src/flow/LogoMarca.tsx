// linguagem: TypeScript/TSX, arquivo: src/flow/LogoMarca.tsx
// Bloco de marca do topo do card.
//
// A logo entra no lugar da caixinha de gradiente: o arquivo ja vem com fundo
// transparente e o glow neon embutido. Por cima entra uma aura propria, que
// respira, para o brilho ganhar profundidade no card escuro.

import { useState } from 'react'
import { useConfig } from '@/lib/config'
import { IconInstagram } from './Icons'

export default function LogoMarca() {
  const { config } = useConfig()
  const { marca } = config
  const [falhou, setFalhou] = useState(false)

  const usarImagem = Boolean(marca.logo) && !falhou

  return (
    <>
      <div className="relative flex items-center justify-center mb-3.5">
        {/* aura que pulsa atras da logo */}
        <div
          aria-hidden
          className="absolute w-[104px] h-[104px] rounded-full blur-2xl animate-aura"
          style={{
            background:
              'radial-gradient(circle, rgba(139,92,246,.6) 0%, rgba(217,70,239,.32) 45%, rgba(249,115,22,.18) 68%, transparent 78%)',
          }}
        />

        {usarImagem ? (
          <img
            src={marca.logo}
            alt={marca.nomeCompleto}
            width={80}
            height={80}
            draggable={false}
            className="relative w-[80px] h-[80px] object-contain select-none animate-flutuar"
            onError={() => setFalhou(true)}
          />
        ) : (
          <div className="relative w-[64px] h-[64px] rounded-[18px] bg-gradient-to-br from-[#8b5cf6] via-[#d946ef] to-[#f97316] flex items-center justify-center">
            <IconInstagram className="w-9 h-9 text-white" />
          </div>
        )}
      </div>

      <h1 className="text-[18px] font-bold tracking-tight">
        <span className="text-white">{marca.nome}</span>
        <span className="texto-neon">{marca.sufixo}</span>
      </h1>
    </>
  )
}
