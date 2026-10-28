// linguagem: TypeScript, arquivo: src/flow/perfil.ts
// Gerador de perfil falso. Porte fiel das funcoes CO / cg / TO do bundle original.
// O "perfil" e deterministico: o mesmo @ sempre devolve os mesmos numeros.

export interface Perfil {
  username: string
  fullName: string
  bio: string
  profilePicUrl: string | null
  followers: number
  following: number
  posts: number
  isPrivate: boolean
  isVerified: boolean
}

const BIOS = [
  '✨ Vivendo a vida intensamente 🌟',
  '📸 Amante de viagens e café ☕',
  '🎯 Focado nos objetivos 💪',
  '🌈 Espalhando amor e positividade 💕',
  '🔥 Criando memórias inesquecíveis 🎉',
]

const DIAS = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
]

/** Semente = soma dos char codes do @. Sem Math.random: recarregar dá o mesmo perfil. */
export function gerarPerfil(entrada: string): Perfil {
  const username = entrada.replace(/^@/, '').trim()
  const semente = username.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)

  const faixa = (min: number, max: number): number => {
    const s = Math.sin(semente + min) * 1e4
    return Math.floor((s - Math.floor(s)) * (max - min) + min)
  }

  return {
    username,
    fullName: username.charAt(0).toUpperCase() + username.slice(1),
    bio: BIOS[semente % BIOS.length],
    profilePicUrl: null,
    followers: faixa(800, 15000),
    following: faixa(200, 2000),
    posts: faixa(20, 300),
    isPrivate: false,
    isVerified: false,
  }
}

/** Contadores em pt-BR: 8.400 -> "8.400" · 12.500 -> "12,5 mil" · 1.200.000 -> "1,2M" */
export function formatarNumero(n: number): string {
  if (n < 1e4) return n.toLocaleString('pt-BR')

  if (n < 1e6) {
    const mil = n / 1e3
    return mil >= 100
      ? `${Math.floor(mil)} mil`
      : `${mil % 1 === 0 ? mil.toString() : mil.toFixed(1).replace('.', ',')} mil`
  }

  if (n < 1e9) {
    const m = n / 1e6
    return `${m % 1 === 0 ? m.toString() : m.toFixed(1).replace('.', ',')}M`
  }

  const b = n / 1e9
  return `${b % 1 === 0 ? b.toString() : b.toFixed(1).replace('.', ',')}B`
}

/** Mascara o nome na lista de conversas: "Mariana" -> "Mar*****" */
export function mascararNome(nome?: string): string {
  if (!nome || nome.length <= 3) return `${nome || 'usr'}*****`
  return `${nome.substring(0, 3)}*****`
}

export function diaDaSemana(): string {
  return DIAS[new Date().getDay()]
}

/** mm:ss do contador da previa VIP. */
export function tempoRestante(segundos: number): string {
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const NOMES_SEGUINDO = [
  'Fernanda Lima',
  'Rodrigo Alves',
  'Beatriz Nogueira',
  'Thiago Moreira',
  'Carolina Prado',
  'Vinicius Rocha',
  'Larissa Antunes',
  'Gustavo Peixoto',
]

export interface PessoaSeguindo {
  username: string
  fullName: string
  profilePicUrl: string | null
}

/**
 * Lista de "seguindo" derivada do @ — mesma semente, mesmo resultado.
 * Alimenta as duas telas que mostram terceiros (inbox e feed).
 */
export function gerarSeguindo(username: string, quantos = 8): PessoaSeguindo[] {
  const semente = username.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return Array.from({ length: quantos }, (_, i) => {
    const nome = NOMES_SEGUINDO[(semente + i) % NOMES_SEGUINDO.length]
    return {
      username: nome.split(' ')[0].toLowerCase(),
      fullName: nome,
      profilePicUrl: null,
    }
  })
}
