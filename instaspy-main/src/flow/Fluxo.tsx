// linguagem: TypeScript/TSX, arquivo: src/flow/Fluxo.tsx
// Maquina de estados das 5 telas. O canvas do Matrix fica sempre montado na raiz
// (z-0); as telas 4 e 5 tem fundo preto opaco e o cobrem, como no original.

import { useEffect, useState } from 'react'
import MatrixRain from './MatrixRain'
import TelaHook from './TelaHook'
import TelaUsuario from './TelaUsuario'
import TelaConfirmar from './TelaConfirmar'
import TelaHack from './TelaHack'
import TelaInbox from './TelaInbox'
import TelaFeed from './TelaFeed'
import TelaOferta from './TelaOferta'
import { type Perfil } from './perfil'
import { MINUTOS_PREVIA } from './dados'
import { useConfig, urlCheckout } from '@/lib/config'

// hack -> feed (a tela principal) -> inbox (pelo icone de mensagens) -> oferta
type Etapa = 'hook' | 'usuario' | 'confirmar' | 'hack' | 'feed' | 'inbox' | 'oferta'

export default function Fluxo() {
  const { config } = useConfig()
  const [etapa, setEtapa] = useState<Etapa>('hook')
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [segundos, setSegundos] = useState(MINUTOS_PREVIA * 60)

  // contagem regressiva da previa VIP, roda no feed e no inbox
  useEffect(() => {
    if (etapa !== 'feed' && etapa !== 'inbox') return
    const t = window.setInterval(() => setSegundos((s) => Math.max(0, s - 1)), 1000)
    return () => window.clearInterval(t)
  }, [etapa])

  const receberPerfil = (p: Perfil) => {
    setPerfil(p)
    setEtapa('confirmar')
  }

  // botao VIP -> tela de oferta (o upsell com o preco)
  const abrirOferta = () => setEtapa('oferta')

  // CTA da oferta -> link do gateway definido em public/config.json
  const irParaCheckout = () => {
    const url = urlCheckout(config, 'padrao')
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
    else window.location.href = '/obrigado'
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <MatrixRain />

      {etapa === 'hook' && <TelaHook onIniciar={() => setEtapa('usuario')} />}

      {etapa === 'usuario' && <TelaUsuario onPerfil={receberPerfil} />}

      {etapa === 'confirmar' && perfil && (
        <TelaConfirmar
          perfil={perfil}
          onCorrigir={() => setEtapa('usuario')}
          onConfirmar={() => setEtapa('hack')}
        />
      )}

      {etapa === 'hack' && perfil && (
        <TelaHack username={perfil.username} onConcluir={() => setEtapa('feed')} />
      )}

      {etapa === 'feed' && perfil && (
        <TelaFeed
          perfil={perfil}
          segundosRestantes={segundos}
          onAbrirInbox={() => setEtapa('inbox')}
          onDesbloquear={abrirOferta}
        />
      )}

      {etapa === 'inbox' && perfil && (
        <TelaInbox
          perfil={perfil}
          segundosRestantes={segundos}
          onVoltar={() => setEtapa('feed')}
          onDesbloquear={abrirOferta}
        />
      )}

      {etapa === 'oferta' && perfil && (
        <TelaOferta perfil={perfil} onComprar={irParaCheckout} />
      )}
    </div>
  )
}
