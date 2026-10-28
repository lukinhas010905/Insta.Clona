/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_WHATSAPP?: string

  /** Marca. Normalmente vem de public/config.json, que não exige rebuild. */
  readonly VITE_MARCA_NOME?: string
  readonly VITE_MARCA_SUFIXO?: string
  readonly VITE_MARCA_COMPLETO?: string
  readonly VITE_MARCA_LOGO?: string

  /** externo = botoes abrem o link do gateway · interno = checkout Pix da propria SPA */
  readonly VITE_CHECKOUT_MODE?: 'externo' | 'interno'
  readonly VITE_CHECKOUT_URL?: string
  readonly VITE_CHECKOUT_URL_BASICO?: string
  readonly VITE_CHECKOUT_URL_COMPLETO?: string
  readonly VITE_CHECKOUT_URL_VITALICIO?: string

  /** '1' mostra Entrar / Meu painel na navegacao */
  readonly VITE_MOSTRAR_PAINEL?: string

  readonly VITE_CHECKOUT_PROVIDER?: 'perfectpay' | 'owempay' | 'local'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
