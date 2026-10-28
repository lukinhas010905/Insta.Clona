// linguagem: TypeScript/TSX, arquivo: src/lib/config.tsx
// Configuracao em tempo de execucao: public/config.json e lido no boot.
// Trocar marca, logo ou link do checkout nao exige rebuild.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type ModoCheckout = 'externo' | 'interno'
export type PlanoId = 'basico' | 'completo' | 'vitalicio'

export interface Marca {
  /** parte branca do lockup: "INSTASPY" */
  nome: string
  /** parte roxa: ".PRO" */
  sufixo: string
  /** como aparece no texto corrido: "InstaSpy.Pro" */
  nomeCompleto: string
  /** caminho da logo. Vazio ou 404 -> cai no icone embutido. */
  logo: string
}

export interface Oferta {
  /** preco riscado: "De: R$ 279,90" */
  ancora: string
  /** preco cobrado: "R$ 29,90". Os 2 ultimos digitos saem menores. */
  preco: string
  seguranca: string
  garantia: string
  /** cada item aceita {nome}, trocado pelo nome do perfil */
  beneficios: string[]
  cta: string
  rodape: string
}

export interface RuntimeConfig {
  marca: Marca
  oferta: Oferta
  modo_checkout: ModoCheckout
  mostrar_painel: boolean
  whatsapp: string
  checkout: {
    padrao: string
    basico: string
    completo: string
    vitalicio: string
  }
}

/** Padroes embutidos no bundle em tempo de compilacao. */
const PADROES: RuntimeConfig = {
  marca: {
    nome: import.meta.env.VITE_MARCA_NOME || 'INSTASPY',
    sufixo: import.meta.env.VITE_MARCA_SUFIXO || '.PRO',
    nomeCompleto: import.meta.env.VITE_MARCA_COMPLETO || 'InstaSpy.Pro',
    logo: import.meta.env.VITE_MARCA_LOGO || '',
  },
  oferta: {
    ancora: 'De: R$ 279,90',
    preco: 'R$ 29,90',
    seguranca: 'Pagamento seguro',
    garantia: '30 dias de garantia',
    beneficios: [
      'Todas as mensagens do direct de {nome}',
      'Todas as fotos sem censura (incluindo apagadas)',
      'Localização em tempo real e locais que esteve',
      'Alerta sempre que {nome} interagir com alguém',
      '2 bônus surpresa avaliados em R$ 120,00',
    ],
    cta: 'Acessar tudo agora mesmo',
    rodape: 'Acesso liberado em até 2 minutos',
  },
  modo_checkout: (import.meta.env.VITE_CHECKOUT_MODE as ModoCheckout) || 'externo',
  mostrar_painel: import.meta.env.VITE_MOSTRAR_PAINEL === '1',
  whatsapp: import.meta.env.VITE_WHATSAPP || '5511999999999',
  checkout: {
    padrao: import.meta.env.VITE_CHECKOUT_URL || '',
    basico: import.meta.env.VITE_CHECKOUT_URL_BASICO || '',
    completo: import.meta.env.VITE_CHECKOUT_URL_COMPLETO || '',
    vitalicio: import.meta.env.VITE_CHECKOUT_URL_VITALICIO || '',
  },
}

function urlValida(valor: unknown): valor is string {
  return typeof valor === 'string' && /^https?:\/\//i.test(valor.trim())
}

function texto(valor: unknown, padrao: string): string {
  return typeof valor === 'string' && valor.trim() ? valor.trim() : padrao
}

/** Mescla o config.json por cima dos padroes, campo a campo. */
function mesclar(base: RuntimeConfig, bruto: unknown): RuntimeConfig {
  if (!bruto || typeof bruto !== 'object') return base
  const c = bruto as Record<string, unknown>
  const checkoutBruto = (c.checkout ?? {}) as Record<string, unknown>
  const marcaBruta = (c.marca ?? {}) as Record<string, unknown>
  const ofertaBruta = (c.oferta ?? {}) as Record<string, unknown>

  const beneficios = Array.isArray(ofertaBruta.beneficios)
    ? ofertaBruta.beneficios.filter((b): b is string => typeof b === 'string' && b.trim() !== '')
    : []

  return {
    marca: {
      nome: texto(marcaBruta.nome, base.marca.nome),
      sufixo: texto(marcaBruta.sufixo, base.marca.sufixo),
      nomeCompleto: texto(marcaBruta.nomeCompleto, base.marca.nomeCompleto),
      // string vazia e valida aqui: significa "usa o icone embutido"
      logo: typeof marcaBruta.logo === 'string' ? marcaBruta.logo.trim() : base.marca.logo,
    },
    oferta: {
      ancora: texto(ofertaBruta.ancora, base.oferta.ancora),
      preco: texto(ofertaBruta.preco, base.oferta.preco),
      seguranca: texto(ofertaBruta.seguranca, base.oferta.seguranca),
      garantia: texto(ofertaBruta.garantia, base.oferta.garantia),
      beneficios: beneficios.length ? beneficios : base.oferta.beneficios,
      cta: texto(ofertaBruta.cta, base.oferta.cta),
      rodape: texto(ofertaBruta.rodape, base.oferta.rodape),
    },
    modo_checkout:
      c.modo_checkout === 'interno'
        ? 'interno'
        : c.modo_checkout === 'externo'
          ? 'externo'
          : base.modo_checkout,
    mostrar_painel: typeof c.mostrar_painel === 'boolean' ? c.mostrar_painel : base.mostrar_painel,
    whatsapp: texto(c.whatsapp, base.whatsapp),
    checkout: {
      padrao: urlValida(checkoutBruto.padrao) ? checkoutBruto.padrao.trim() : base.checkout.padrao,
      basico: urlValida(checkoutBruto.basico) ? checkoutBruto.basico.trim() : base.checkout.basico,
      completo: urlValida(checkoutBruto.completo) ? checkoutBruto.completo.trim() : base.checkout.completo,
      vitalicio: urlValida(checkoutBruto.vitalicio) ? checkoutBruto.vitalicio.trim() : base.checkout.vitalicio,
    },
  }
}

/**
 * Resolve o link de checkout de um plano.
 * Ordem: link do plano -> link padrao -> null (usa /obrigado).
 */
export function urlCheckout(config: RuntimeConfig, plano: string): string | null {
  const especifico = config.checkout[plano as PlanoId]
  if (urlValida(especifico)) return especifico.trim()
  if (urlValida(config.checkout.padrao)) return config.checkout.padrao.trim()
  return null
}

interface ConfigState {
  config: RuntimeConfig
  carregando: boolean
}

const ConfigContext = createContext<ConfigState>({ config: PADROES, carregando: true })

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<RuntimeConfig>(PADROES)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let vivo = true

    // no-store: trocar o config no servidor vale no proximo carregamento, sem cache
    fetch('/config.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((bruto) => {
        if (vivo && bruto) setConfig(mesclar(PADROES, bruto))
      })
      .catch(() => undefined)
      .finally(() => {
        if (vivo) setCarregando(false)
      })

    return () => {
      vivo = false
    }
  }, [])

  const value = useMemo(() => ({ config, carregando }), [config, carregando])
  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
}

export function useConfig(): ConfigState {
  return useContext(ConfigContext)
}
