// linguagem: TypeScript/TSX, arquivo: src/pages/Success.tsx
// Pagina de retorno do gateway. Configure no painel do gateway:
//   https://seudominio.com/obrigado
// O pagamento ja passou; aqui so orientamos onde o cliente pega o material.

import { Link } from 'react-router-dom'
import { useConfig } from '@/lib/config'

function Passo({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3.5 border-b border-white/5 pb-3 last:border-0 last:pb-0">
      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[#8b5cf6]/15 text-[11px] font-bold text-[#a78bfa]">
        {n}
      </span>
      <div>
        <p className="text-[13.5px] font-semibold text-white">{titulo}</p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-[#8b8b9e]">{children}</p>
      </div>
    </div>
  )
}

export default function Success() {
  const { config } = useConfig()

  return (
    <div className="relative min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px] bg-[#0c1011]/95 backdrop-blur-xl rounded-[32px] p-8 border border-[#1f1f2e]/50 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e]">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m5 13 4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>

        <h1 className="mt-6 text-[28px] font-bold tracking-tight text-white">Pagamento aprovado</h1>

        <p className="mx-auto mt-3 max-w-sm text-[14.5px] leading-relaxed text-[#8b8b9e]">
          Seu material já foi liberado. Confira o e-mail usado na compra e a área de membros do
          site de pagamento.
        </p>

        <div className="mt-7 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left">
          <Passo n={1} titulo="Abra o e-mail da compra">
            O assunto traz o link de acesso ao material. Confira também a caixa de spam e a aba
            Promoções.
          </Passo>
          <Passo n={2} titulo="Ou entre na área de membros">
            Todo gateway (PerfectPay, OwemPay, Hotmart, Kirvano) tem uma área de membros. O login
            é o mesmo e-mail usado no pagamento.
          </Passo>
          <Passo n={3} titulo="Baixe o PDF">
            O arquivo fica disponível para download imediato e continua acessível depois.
          </Passo>
        </div>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href={`https://wa.me/${config.whatsapp}`}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center justify-center gap-2 rounded-full h-[52px] px-6 text-[15px] font-bold text-white btn-premium"
          >
            Não recebi — falar no WhatsApp
          </a>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full h-[52px] px-6 text-[15px] font-semibold text-white border border-[#3a3a5e] bg-[#1f1f2e] hover:bg-[#2a2a3e] transition-colors"
          >
            Voltar ao início
          </Link>
        </div>

        <p className="mt-5 text-[12px] text-[#6b7280]">
          Guarde o e-mail da compra: é a sua via de acesso ao material.
        </p>
      </div>
    </div>
  )
}
