// linguagem: TypeScript/TSX, arquivo: src/flow/TelaConfirmar.tsx
// Tela 3. Confirma o alvo. O avatar nao tem foto: cai no circulo com a inicial
// em gradiente roxo->rosa. Contador comeca em 82114.

import { useEffect, useState } from 'react'
import { IconAlerta, IconSeta } from './Icons'
import { diaDaSemana, formatarNumero, type Perfil } from './perfil'
import { urlImagem } from '@/lib/perfilApi'

export default function TelaConfirmar({
  perfil,
  onCorrigir,
  onConfirmar,
}: {
  perfil: Perfil
  onCorrigir: () => void
  onConfirmar: () => void
}) {
  const [contador, setContador] = useState(82114)
  const [fotoFalhou, setFotoFalhou] = useState(false)

  useEffect(() => {
    const t = window.setInterval(() => {
      setContador((v) => v + Math.floor(Math.random() * 50) + 10)
    }, 3000)
    return () => window.clearInterval(t)
  }, [])

  // a foto vem do CDN do Instagram, servida pelo nosso proxy
  const foto = urlImagem(perfil.profilePicUrl)
  const mostrarFoto = Boolean(foto) && !fotoFalhou

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
      <div className="relative w-full max-w-[400px] card-neon p-6">
        <h2 className="text-[22px] font-bold text-center mb-4 texto-neon">
          Confirme o Instagram
        </h2>

        <p className="text-white text-center text-[15px] mb-6">
          Você deseja espionar o perfil{' '}
          <span className="text-[#a78bfa] font-semibold">@{perfil.username}</span>?
        </p>

        <div className="flex items-center gap-4 mb-4">
          <div className="w-[90px] h-[90px] rounded-full flex-shrink-0 overflow-hidden bg-[#1a1a1a] relative">
            {mostrarFoto ? (
              <img
                src={foto as string}
                alt={perfil.username}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={() => setFotoFalhou(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
                <span className="text-3xl text-white font-bold">
                  {perfil.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-5">
            <div className="text-center">
              <p className="text-white font-bold text-[18px]">{formatarNumero(perfil.posts)}</p>
              <p className="text-[#6b7280] text-[12px]">posts</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-[18px]">{formatarNumero(perfil.followers)}</p>
              <p className="text-[#6b7280] text-[12px]">seguidores</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-[18px]">{formatarNumero(perfil.following)}</p>
              <p className="text-[#6b7280] text-[12px]">seguindo</p>
            </div>
          </div>
        </div>

        {/* whitespace-pre-line: sem isso o HTML colapsa o \n da bio em espaco
            e as linhas do Instagram viram um paragrafo so */}
        <p className="text-white text-[14px] mb-5 leading-snug whitespace-pre-line break-words">
          {perfil.bio || 'Friends & Lifestyle'}
        </p>

        <div className="bg-[#2d1616] rounded-[16px] p-4 mb-5 flex items-start gap-3 border border-[#dc2626]/30">
          <IconAlerta className="w-5 h-5 text-[#ef4444] flex-shrink-0 mt-0.5" />
          <p className="text-[#fca5a5] text-[13px]">
            <span className="text-[#ef4444] font-semibold">Aviso:</span> Limite de apenas 1
            pesquisa por dispositivo, certifique-se que digitou o usuário corretamente.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCorrigir}
            className="flex-1 h-[50px] bg-[#1f1f2e] border border-[#3a3a5e] text-white hover:bg-[#2a2a3e] rounded-full text-[14px] font-medium transition-all active:scale-95"
          >
            Corrigir @
          </button>
          <button
            onClick={onConfirmar}
            className="flex-1 h-[50px] bg-gradient-to-r from-[#8b5cf6] via-[#d946ef] to-[#f97316] hover:brightness-110 rounded-full text-white font-bold text-[14px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-fuchsia-500/30"
          >
            Confirmar <IconSeta className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-[14px]">
          <span className="text-[#a78bfa] font-semibold">+{contador.toLocaleString('pt-BR')}</span>
          <span className="text-[#6b7280]"> perfis analisados hoje ({diaDaSemana()})</span>
        </p>
      </div>
    </div>
  )
}
