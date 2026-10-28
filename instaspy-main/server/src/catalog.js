// linguagem: JavaScript (ESM), arquivo: server/src/catalog.js
// Fonte de verdade dos planos. Espelhado em src/lib/plans.ts (fallback do primeiro paint).
//
// checkout_url: link do gateway para o plano. Vazio cai no link padrao do
// public/config.json. Definir aqui evita depender de rebuild da SPA.

const doAmbiente = (sufixo) => process.env[`CHECKOUT_URL_${sufixo}`] || ''

export const PLANOS = [
  {
    id: 'basico',
    nome: 'Básico',
    subtitulo: 'Para começar',
    preco_centavos: 4790,
    preco_ancora_centavos: 19700,
    periodo: 'pagamento único',
    destaque: false,
    selo: null,
    limite_perfis: 1,
    checkout_url: doAmbiente('BASICO'),
    recursos: [
      '1 perfil monitorado',
      'Acesso ao Instagram',
      'Histórico de 7 dias',
      'Material em PDF',
      'Suporte por e-mail',
    ],
  },
  {
    id: 'completo',
    nome: 'Completo',
    subtitulo: 'O mais escolhido',
    preco_centavos: 8790,
    preco_ancora_centavos: 39700,
    periodo: 'pagamento único',
    destaque: true,
    selo: 'MAIS VENDIDO',
    limite_perfis: 3,
    checkout_url: doAmbiente('COMPLETO'),
    recursos: [
      '3 perfis monitorados',
      'Instagram + WhatsApp',
      'Histórico ilimitado',
      'Mensagens em tempo real',
      'Captura de mídia e stories',
      'Alertas por e-mail',
      'Suporte prioritário 24h',
    ],
  },
  {
    id: 'vitalicio',
    nome: 'Vitalício',
    subtitulo: 'Acesso permanente',
    preco_centavos: 14700,
    preco_ancora_centavos: 89700,
    periodo: 'uma vez, para sempre',
    destaque: false,
    selo: 'MELHOR VALOR',
    limite_perfis: 10,
    checkout_url: doAmbiente('VITALICIO'),
    recursos: [
      '10 perfis monitorados',
      'Instagram + WhatsApp + Facebook',
      'Atualizações vitalícias',
      'Modo fantasma (100% indetectável)',
      'Exportação de relatórios em PDF',
      'Gerente de conta dedicado',
    ],
  },
]

export function acharPlano(id) {
  return PLANOS.find((p) => p.id === id) ?? null
}

export function limiteDoPlano(id) {
  return acharPlano(id)?.limite_perfis ?? 1
}
