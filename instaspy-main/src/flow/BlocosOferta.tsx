// linguagem: TypeScript/TSX, arquivo: src/flow/BlocosOferta.tsx
// Blocos da pagina de oferta, portados do original:
//   Depoimentos (carrossel com dots) · Aviso (faixa vermelha)
//   PerguntasFrequentes (acordeao) · Garantia (bloco verde) · BarraUrgencia (rodape fixo)

import { useEffect, useState } from 'react'
import { DEPOIMENTOS, PERGUNTAS_FAQ } from './dados'
import { tempoRestante, type Perfil } from './perfil'
import { useConfig } from '@/lib/config'
import { IconAlerta, IconCadeado } from './Icons'

/* ------------------------------ depoimentos ------------------------------ */

export function Depoimentos() {
  const { config } = useConfig()
  const [ativo, setAtivo] = useState(0)
  const d = DEPOIMENTOS[ativo]

  return (
    <div className="mx-4 mb-6">
      <h3 className="text-lg font-bold text-center mb-5 leading-tight text-white">
        Veja o que falam as pessoas
        <br />
        que usam o <span className="texto-neon">{config.marca.nomeCompleto}</span>
      </h3>

      <div className="card-neon p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-[#1f1f2e]">
            <img src={d.foto} alt={d.nome} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-white font-semibold text-[13px]">{d.nome}</p>
            <p className="text-[#737373] text-[11px]">{d.tempo}</p>
          </div>
        </div>

        <p className="text-[#a8a8a8] text-[13px] leading-relaxed">{d.texto}</p>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {DEPOIMENTOS.map((_, i) => (
          <button
            key={i}
            onClick={() => setAtivo(i)}
            aria-label={`Depoimento ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              i === ativo ? 'bg-[#a78bfa] w-6' : 'bg-[#333] w-2'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

/* --------------------------------- aviso --------------------------------- */

export function Aviso() {
  return (
    <div className="mx-4 mb-6">
      <div className="bg-[#3f1212]/50 border border-[#ef4444]/30 rounded-2xl p-4 flex items-start gap-3">
        <IconAlerta className="w-5 h-5 text-[#ef4444] flex-shrink-0 mt-0.5" />
        <p className="text-[#a8a8a8] text-[13px] leading-relaxed">
          As informações acessadas são{' '}
          <span className="font-bold text-white">extremamente sensíveis</span>. Use com
          responsabilidade.
        </p>
      </div>
    </div>
  )
}

/* ---------------------------------- FAQ ---------------------------------- */

function Chevron({ aberto }: { aberto: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`w-5 h-5 text-[#a78bfa] flex-shrink-0 transition-transform duration-200 ${
        aberto ? 'rotate-180' : ''
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PerguntasFrequentes() {
  const [aberta, setAberta] = useState<number | null>(null)

  return (
    <div className="mx-4 mb-6">
      <div className="card-neon p-5">
        <h3 className="text-lg font-bold text-center mb-5 text-white">Perguntas Frequentes</h3>

        <div className="space-y-2">
          {PERGUNTAS_FAQ.map((item, i) => (
            <div key={i} className="bg-[#1f1f2e] rounded-xl overflow-hidden">
              <button
                onClick={() => setAberta(aberta === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left"
                aria-expanded={aberta === i}
              >
                <p className="text-white font-medium text-[13px] pr-4">{item.q}</p>
                <Chevron aberto={aberta === i} />
              </button>

              {aberta === i && (
                <div className="px-4 pb-4">
                  <p className="text-[#737373] text-[12px] leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* -------------------------------- garantia ------------------------------- */

export function Garantia() {
  const { config } = useConfig()

  return (
    <div className="mx-4 mb-6">
      <div className="bg-gradient-to-br from-[#052e16]/50 to-[#14532d]/30 border border-[#22c55e]/30 rounded-2xl p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <IconCadeado className="w-6 h-6 text-[#22c55e]" />
          <p className="text-[#22c55e] font-bold text-base">{config.oferta.garantia}</p>
        </div>
        <p className="text-[#a8a8a8] text-[13px] leading-relaxed">
          Teste sem risco! Se não gostar ou por algum motivo não se adaptar, devolvemos 100% do
          seu dinheiro.
        </p>
      </div>
    </div>
  )
}

/* ----------------------------- barra de urgencia -------------------------- */

const MINUTOS_URGENCIA = 10

export function BarraUrgencia({
  perfil,
  onComprar,
}: {
  perfil: Perfil
  onComprar: () => void
}) {
  const [segundos, setSegundos] = useState(MINUTOS_URGENCIA * 60)

  useEffect(() => {
    const t = window.setInterval(() => setSegundos((s) => Math.max(0, s - 1)), 1000)
    return () => window.clearInterval(t)
  }, [])

  const nome = perfil.fullName || perfil.username

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0c1011]/95 backdrop-blur-sm border-t border-[#1f1f2e] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[#ef4444] font-semibold text-[13px]">
            Finalize sua compra em {tempoRestante(segundos)}
          </p>
          <p className="text-[#737373] text-[11px] truncate">
            Ao zerar o cronômetro, nunca mais será possível acessar o instagram de {nome}.
          </p>
        </div>

        <button
          onClick={onComprar}
          className="bg-gradient-to-r from-[#8b5cf6] via-[#d946ef] to-[#f97316] hover:brightness-110 text-white font-semibold px-4 py-4 rounded-xl whitespace-nowrap text-[12px] leading-tight transition-all active:scale-95"
        >
          Desbloquear
          <br />
          Acesso Agora
        </button>
      </div>
    </div>
  )
}
