// linguagem: TypeScript/TSX, arquivo: src/flow/MatrixRain.tsx
// Porte fiel do canvas do original, com a paleta estendida para acompanhar
// a logo neon: base roxa com magenta aparecendo de vez em quando.

import { useEffect, useRef } from 'react'

const CARACTERES = 'AEIOSTKLK.AEITSKLA'.split('')
const TAMANHO = 16
const CORES = ['#8b5cf6', '#a78bfa', '#818cf8', '#7c3aed', '#d946ef', '#6366f1']

export default function MatrixRain() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const redimensionar = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    redimensionar()
    window.addEventListener('resize', redimensionar)

    const colunas = Math.floor(canvas.width / TAMANHO)
    const y = Array(colunas).fill(1)

    const timer = window.setInterval(() => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (let i = 0; i < y.length; i++) {
        const char = CARACTERES[Math.floor(Math.random() * CARACTERES.length)]
        const x = i * TAMANHO
        const py = y[i] * TAMANHO

        ctx.fillStyle = CORES[Math.floor(Math.random() * CORES.length)]
        ctx.globalAlpha = 0.3 + Math.random() * 0.3
        ctx.font = `${TAMANHO}px monospace`
        ctx.fillText(char, x, py)
        ctx.globalAlpha = 1

        if (py > canvas.height && Math.random() > 0.975) y[i] = 0
        y[i]++
      }
    }, 50)

    return () => {
      window.clearInterval(timer)
      window.removeEventListener('resize', redimensionar)
    }
  }, [])

  return <canvas ref={ref} className="fixed inset-0 z-0" style={{ background: '#000000' }} />
}
