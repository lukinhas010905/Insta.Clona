// linguagem: TypeScript/TSX, arquivo: src/flow/TelaOferta.tsx
// Tela de oferta — o upsell que vem depois do inbox.
// Estrutura copiada do original: banner laranja->rosa, card do perfil,
// card de preco com ancoragem, lista de beneficios e CTA para o gateway.
// Todos os textos e o preco vem de config.oferta: trocar nao exige rebuild.

import { useConfig } from '@/lib/config'
import { urlImagem } from '@/lib/perfilApi'
import { formatarNumero, type Perfil } from './perfil'
import { IconCadeado, IconCheck } from './Icons'
import LogoMarca from './LogoMarca'
import { Aviso, BarraUrgencia, Depoimentos, Garantia, PerguntasFrequentes } from './BlocosOferta'

export default function TelaOferta({
  perfil,
  onComprar,
}: {
  perfil: Perfil
  onComprar: () => void
}) {
  const { config } = useConfig()
  const { oferta, marca } = config

  const foto = urlImagem(perfil.profilePicUrl)

  // os 2 ultimos caracteres do preco saem menores, como no original
  const corte = Math.max(0, oferta.preco.length - 2)
  const precoPrincipal = oferta.preco.slice(0, corte)
  const precoCentavos = oferta.preco.slice(corte)

  const nome = perfil.fullName || perfil.username
  const trocarNome = (t: string) => t.replace(/\{nome\}/g, nome)

  return (
    <div className="relative z-10 min-h-screen bg-black text-white pb-32">
      {/* banner de conclusao */}
      <div className="mx-4 pt-8 mb-5">
        <div className="bg-gradient-to-r from-[#f97316] to-[#ec4899] rounded-2xl p-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
          <p className="text-white font-bold text-base relative z-10">
            Espionagem 100% finalizada! 🥳
          </p>
          <p className="text-white/90 text-[13px] relative z-10 mt-1">
            Adquira seu acesso VIP e tenha acesso imediatamente a:
          </p>
        </div>
      </div>

      {/* card do alvo */}
      <div className="mx-4 mb-5">
        <div className="card-neon p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#bc1888] p-[2.5px] shrink-0">
              <div className="w-full h-full rounded-full bg-[#1a1a1a] flex items-center justify-center overflow-hidden">
                {foto ? (
                  <img
                    src={foto}
                    alt={perfil.username}
                    referrerPolicy="no-referrer"
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement
                      img.style.display = 'none'
                      img.parentElement!.innerHTML = '<span class="text-2xl">👤</span>'
                    }}
                  />
                ) : (
                  <span className="text-2xl">👤</span>
                )}
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-[17px] truncate">{nome}</p>
              <p className="text-[#737373] text-[13px] truncate">@{perfil.username}</p>
            </div>
          </div>

          <div className="flex gap-8 mt-4">
            <div className="text-center">
              <p className="text-white font-bold text-[15px]">{formatarNumero(perfil.posts)}</p>
              <p className="text-[#737373] text-[11px]">posts</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-[15px]">
                {formatarNumero(perfil.followers)}
              </p>
              <p className="text-[#737373] text-[11px]">seguidores</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-[15px]">{formatarNumero(perfil.following)}</p>
              <p className="text-[#737373] text-[11px]">seguindo</p>
            </div>
          </div>

          {perfil.bio && (
            <p className="text-[#737373] text-[12px] mt-3 whitespace-pre-line">{perfil.bio}</p>
          )}
        </div>
      </div>

      {/* card de preco */}
      <div className="mx-4 mb-6">
        <div className="card-neon p-6 text-center">
          <div className="flex flex-col items-center mb-4">
            <LogoMarca />
          </div>

          <p className="text-[15px] mb-4 text-[#a8a8a8]">
            Com o <span className="texto-neon font-bold">{marca.nomeCompleto}</span> você vai
            ter acesso completo ao instagram de {nome} por apenas:
          </p>

          <div className="bg-[#1f1f2e] rounded-2xl p-4 mb-5">
            <p className="text-[#737373] line-through text-[13px]">{oferta.ancora}</p>
            <p className="text-4xl font-bold text-white">
              {precoPrincipal}
              <span className="text-xl">{precoCentavos}</span>
            </p>
            <div className="flex items-center justify-center gap-4 mt-3 text-[11px]">
              <div className="flex items-center gap-1 text-[#a78bfa]">
                <IconCadeado className="w-3 h-3" />
                <span>{oferta.seguranca}</span>
              </div>
              <div className="flex items-center gap-1 text-[#a78bfa]">
                <IconCheck className="w-3 h-3" />
                <span>{oferta.garantia}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 text-left mb-5">
            {oferta.beneficios.map((b, i) => (
              <div key={i} className="flex items-start gap-3 bg-[#1f1f2e] rounded-xl p-3">
                <IconCheck className="w-5 h-5 text-[#a78bfa] flex-shrink-0 mt-0.5" />
                <p className="text-[#a8a8a8] text-[13px]">{trocarNome(b)}</p>
              </div>
            ))}
          </div>

          <button
            onClick={onComprar}
            className="w-full h-14 text-base font-bold text-white bg-gradient-to-r from-[#8b5cf6] via-[#a855f7] to-[#ec4899] hover:from-[#7c3aed] hover:via-[#9333ea] hover:to-[#db2777] rounded-2xl shadow-lg shadow-purple-500/25 mb-2 border-0 transition-all active:scale-[.98]"
          >
            {oferta.cta}
          </button>
          <p className="text-[#737373] text-[11px]">{oferta.rodape}</p>
        </div>
      </div>

      {/* depoimentos, aviso, FAQ e garantia */}
      <Depoimentos />
      <Aviso />
      <PerguntasFrequentes />
      <Garantia />

      {/* rodape fixo com urgencia */}
      <BarraUrgencia perfil={perfil} onComprar={onComprar} />
    </div>
  )
}
