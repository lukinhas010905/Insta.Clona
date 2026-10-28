// linguagem: TypeScript, arquivo: src/flow/dados.ts
// Conteudo das telas finais: avatares, conversas e notas do inbox falso.
// Valores copiados do bundle original.

export const AVATARES = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150&h=150&fit=crop&crop=face',
]

export interface Conversa {
  message: string
  time: string
  unread: boolean
}

export const CONVERSAS: Conversa[] = [
  { message: 'Saudade de te ver...', time: 'Agora', unread: true },
  { message: 'vmo fazer algo?', time: '33 min', unread: true },
  { message: 'Blz depois a gente se fala', time: '2 h', unread: false },
  { message: 'Reagiu com 👍 à sua mensagem', time: '6 h', unread: false },
  { message: '3 novas mensagens', time: '22 h', unread: true },
  { message: 'vamo se ver la, oq acha?', time: '1 d', unread: false },
  { message: 'Enviou um reel de amandix9...', time: '2 d', unread: false },
  { message: 'Enviou uma mensagem de voz', time: '2 d', unread: false },
  { message: 'Foi bom ontem né kkk', time: '2 d', unread: false },
  { message: 'Curtiu sua mensagem', time: '2 d', unread: false },
  { message: 'reagiu sua foto:🔥🔥', time: '3 d', unread: false },
  { message: 'eu vi isso hj', time: '3 d', unread: false },
  { message: 'Tá ocupado?', time: '3 d', unread: false },
  { message: 'tem uma camisa sua', time: '4 d', unread: false },
  { message: 'Curtiu sua mensagem', time: '4 d', unread: false },
]

export const NOTAS = [
  'Gentee\nque dia lindo ta hoje',
  'Ninguem\npra sair a tarde?',
  'Saudade\ndele :(',
  'Tô\non 💭',
]

/** Alfabeto usado no gerador de senhas da tela de invasao. */
export const ALFABETO_SENHA = 'abcdefghijklmnopqrstuvwxyz0123456789'

/** Minutos da previa gratis antes do paywall. */
export const MINUTOS_PREVIA = 10

/** Cidades que aparecem como localizacao nos posts do feed. */
export const CIDADES = [
  'Santa Maria',
  'Porto Alegre',
  'Uruguaiana',
  'Caxias do Sul',
  'Pelotas',
  'Canoas',
  'Novo Hamburgo',
  'Passo Fundo',
]

/** Legendas curtas dos posts. */
export const LEGENDAS = ['😍', '🔥', '❤️', '✨', '💕', '🥰', '💫']

/* ---------------------- depoimentos e FAQ da oferta ---------------------- */

export interface Depoimento {
  nome: string
  tempo: string
  texto: string
  foto: string
}

export const DEPOIMENTOS: Depoimento[] = [
  {
    nome: 'marco*****',
    tempo: '3h',
    texto:
      'Achei q era golpe mas testei msm assim. Paguei, em 3 min recebi o acesso. Tava tudo lá: directs, fotos q ele apagava, até a localização funcionou. Valeu cada centavo.',
    foto: '/depoimentos/feedback-marcos.jpg',
  },
  {
    nome: 'julia*****',
    tempo: '5h',
    texto:
      'Descobri que meu namorado conversava com a ex dele. As mensagens apareceram todas. Me livrei de um problema.',
    foto: '/depoimentos/feedback-julia.jpg',
  },
  {
    nome: 'ricar*****',
    tempo: '1d',
    texto:
      'No início tive receio, mas funcionou perfeitamente. Vi stories que tinham me bloqueado e até mensagens apagadas. Super recomendo!',
    foto: '/depoimentos/feedback-ricardo.jpg',
  },
]

export interface PerguntaFAQ {
  q: string
  a: string
}

export const PERGUNTAS_FAQ: PerguntaFAQ[] = [
  {
    q: 'A ferramenta realmente funciona?',
    a: 'Sim, nossa ferramenta utiliza tecnologia avançada para acessar informações públicas e privadas de qualquer perfil.',
  },
  {
    q: 'A pessoa vai saber que eu stalkeei o perfil dela?',
    a: 'Não! Todo o processo é 100% anônimo. A pessoa nunca saberá que você acessou as informações dela.',
  },
  {
    q: 'Funciona em perfis privados?',
    a: 'Sim! Independente se o perfil é público ou privado, você terá acesso completo.',
  },
  {
    q: 'Preciso instalar alguma coisa?',
    a: 'Não. Todo o acesso é feito pelo navegador, sem necessidade de instalar nenhum aplicativo.',
  },
  {
    q: 'Como funciona a garantia?',
    a: 'Oferecemos 30 dias de garantia. Se não ficar satisfeito, devolvemos 100% do seu dinheiro.',
  },
  {
    q: 'Quanto tempo tenho acesso?',
    a: 'Seu acesso é vitalício. Uma vez adquirido, você pode usar quando quiser.',
  },
]


