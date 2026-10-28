// linguagem: TypeScript/TSX, arquivo: src/flow/TelaHack.tsx
// Tela 4. Reconstrucao da tela de login do Instagram com a "quebra de criptografia".
// 4 senhas aleatorias de 8-12 chars, digitadas a 80ms/char. As 3 primeiras sao
// rejeitadas (400ms de pausa entre elas); a 4a e aceita -> toast verde -> avanca.

import { useEffect, useRef, useState } from 'react'
import { IconCheck, IconFacebook, IconLoader } from './Icons'
import { ALFABETO_SENHA } from './dados'

type Status = 'attempting' | 'success'

interface Tentativa {
  password: string
  status: 'rejected' | 'accepted'
}

function gerarSenhas(): string[] {
  const comprimentos = [
    8 + Math.floor(Math.random() * 4),
    9 + Math.floor(Math.random() * 3),
    10 + Math.floor(Math.random() * 3),
    11 + Math.floor(Math.random() * 2),
  ]
  return comprimentos.map((n) =>
    Array.from({ length: n }, () => ALFABETO_SENHA[Math.floor(Math.random() * ALFABETO_SENHA.length)]).join(''),
  )
}

export default function TelaHack({
  username,
  onConcluir,
}: {
  username: string
  onConcluir: () => void
}) {
  const [indice, setIndice] = useState(0)
  const [tentativas, setTentativas] = useState<Tentativa[]>([])
  const [senhaAtual, setSenhaAtual] = useState('')
  const [status, setStatus] = useState<Status>('attempting')
  const [mensagem, setMensagem] = useState('Testando combinações...')
  const [mostrarToast, setMostrarToast] = useState(false)

  const senhas = useRef<string[]>(gerarSenhas())

  useEffect(() => {
    if (status !== 'attempting' || indice >= 4) return

    const alvo = senhas.current[indice]
    let pos = 0

    const timer = window.setInterval(() => {
      if (pos <= alvo.length) {
        setSenhaAtual(alvo.substring(0, pos))
        pos++
      } else {
        window.clearInterval(timer)
        window.setTimeout(() => {
          if (indice < 3) {
            setTentativas((t) => [...t, { password: alvo, status: 'rejected' }])
            setSenhaAtual('')
            setIndice((i) => i + 1)
          } else {
            setTentativas((t) => [...t, { password: alvo, status: 'accepted' }])
            setStatus('success')
            setMensagem('Acesso liberado!')
            setMostrarToast(true)
            window.setTimeout(() => onConcluir(), 2500)
          }
        }, 400)
      }
    }, 80)

    return () => window.clearInterval(timer)
  }, [indice, status, onConcluir])

  // ultima tentativa rejeitada -> mostra o erro do Instagram
  const ultimaRejeitada =
    tentativas.length > 0 && tentativas[tentativas.length - 1].status === 'rejected'

  // revela so o ultimo caractere digitado, o resto vira bolinha
  const senhaMascarada = (): string => {
    if (senhaAtual.length === 0) return '••••••••••'
    return '•'.repeat(senhaAtual.length - 1) + (senhaAtual[senhaAtual.length - 1] || '')
  }

  const sucesso = status === 'success'

  return (
    <div className="relative z-10 min-h-screen bg-black text-white flex flex-col">
      {mostrarToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 animate-scale-in">
          <div className="bg-[#22c55e] text-white px-8 py-4 rounded-2xl flex items-center gap-3 shadow-lg shadow-green-500/30">
            <IconCheck className="w-6 h-6" />
            <div className="text-center">
              <p className="font-bold text-[16px]">Conta</p>
              <p className="font-bold text-[16px]">acessada</p>
              <p className="font-bold text-[16px]">com sucesso!</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-10 py-8">
        <h1
          className="text-[46px] font-normal mb-10 text-white"
          style={{ fontFamily: "'Billabong', cursive", letterSpacing: '1px' }}
        >
          Instagram
        </h1>

        <div className="w-full max-w-[350px] space-y-3">
          <div className="bg-[#121212] border border-[#363636] rounded-[4px] px-3 py-3 h-[44px] flex items-center">
            <span className="text-white text-[14px]">{username}</span>
          </div>

          <div className="bg-[#121212] border border-[#363636] rounded-[4px] px-3 py-3 h-[44px] flex items-center">
            <span className="text-white text-[14px] tracking-[3px] font-normal">
              {senhaMascarada()}
            </span>
          </div>

          {ultimaRejeitada && status === 'attempting' && (
            <p className="text-[#ed4956] text-[13px] text-center">
              A senha que você inseriu está incorreta.
            </p>
          )}

          <div
            className={`rounded-xl p-4 flex items-center gap-3 border ${
              sucesso ? 'bg-[#0a2a1a] border-[#22c55e]/30' : 'bg-[#1a1a2e] border-[#2d2d44]'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                sucesso ? 'bg-[#22c55e]' : 'bg-gradient-to-br from-purple-500 to-pink-500'
              }`}
            >
              {sucesso ? (
                <IconCheck className="w-5 h-5 text-white" />
              ) : (
                <IconLoader className="w-5 h-5 text-white animate-spin" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-[14px]">
                {sucesso ? 'Criptografia quebrada com sucesso!' : 'Quebrando criptografia da conta'}
              </p>
              <p className="text-[#8e8e8e] text-[12px]">
                {sucesso ? 'Acesso liberado à conta!' : mensagem}
              </p>
            </div>
          </div>

          <button
            disabled
            className="w-full py-3 rounded-lg text-[14px] font-semibold mt-2 bg-[#0095f6] text-white"
          >
            Entrar
          </button>

          <button className="w-full text-center text-[12px] text-[#0095f6] py-3">
            Esqueceu a senha?
          </button>

          <div className="flex items-center gap-4 py-1">
            <div className="flex-1 h-px bg-[#363636]" />
            <span className="text-[#8e8e8e] text-[13px] font-semibold">OU</span>
            <div className="flex-1 h-px bg-[#363636]" />
          </div>

          <button className="w-full flex items-center justify-center gap-2 py-3">
            <IconFacebook className="w-5 h-5" />
            <span className="text-[#0095f6] font-semibold text-[14px]">
              Entrar com o Facebook
            </span>
          </button>
        </div>
      </div>

      <div className="border-t border-[#363636] py-5 mt-auto">
        <p className="text-center text-[14px] text-[#f5f5f5]">
          Não tem uma conta?{' '}
          <span className="text-[#0095f6] font-semibold">Cadastre-se.</span>
        </p>
      </div>
    </div>
  )
}
