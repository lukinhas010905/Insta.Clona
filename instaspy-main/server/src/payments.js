// linguagem: JavaScript (ESM), arquivo: server/src/payments.js
// Adaptador de cobranca. CHECKOUT_PROVIDER=local | perfectpay | owempay.
// O contrato de saida e sempre o mesmo: { txid, copia_e_cola, qrcode_image, expira_em }.

import QRCode from 'qrcode'
import { gerarPayloadPix } from './pix.js'

export const PROVEDOR = process.env.CHECKOUT_PROVIDER ?? 'local'

const PIX_CHAVE = process.env.PIX_CHAVE ?? 'pagamentos@instaspy.example'
const PIX_NOME = process.env.PIX_NOME ?? 'INSTASPY PAGAMENTOS'
const PIX_CIDADE = process.env.PIX_CIDADE ?? 'SAO PAULO'

export const VALIDADE_PIX_MINUTOS = 30

/**
 * Cria a cobranca. No modo local gera o BR Code e o QR aqui mesmo;
 * nos modos hospedados devolveria a URL de checkout do provedor.
 */
export async function criarCobranca({ pedido_id, valor_centavos, descricao }) {
  const expira_em = new Date(Date.now() + VALIDADE_PIX_MINUTOS * 60 * 1000).toISOString()

  if (PROVEDOR === 'perfectpay' || PROVEDOR === 'owempay') {
    // Provedor hospedado: a cobranca e criada via API do provedor e o cliente
    // e redirecionado. O retorno traz o link e o id externo.
    const base =
      PROVEDOR === 'perfectpay'
        ? 'https://checkout.perfectpay.com.br/pay/'
        : 'https://checkout.owempay.com.br/'

    const link = `${base}${process.env.PROVEDOR_TOKEN ?? 'TOKEN'}?ref=${pedido_id}`

    return {
      txid: pedido_id,
      copia_e_cola: link,
      qrcode_image: await QRCode.toDataURL(link, { margin: 1, width: 352 }),
      expira_em,
      provedor: PROVEDOR,
      link_externo: link,
    }
  }

  // Modo local: BR Code valido, gerado e assinado aqui.
  const copia_e_cola = gerarPayloadPix({
    chave: PIX_CHAVE,
    nome: PIX_NOME,
    cidade: PIX_CIDADE,
    valor_centavos,
    txid: pedido_id,
    descricao,
  })

  const qrcode_image = await QRCode.toDataURL(copia_e_cola, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 352,
    color: { dark: '#000000', light: '#FFFFFF' },
  })

  return { txid: pedido_id, copia_e_cola, qrcode_image, expira_em, provedor: 'local' }
}

/**
 * Valida o webhook do provedor e extrai o status.
 * local        -> { txid, status } direto no corpo
 * perfectpay   -> assinatura em `x-perfectpay-signature` (HMAC-SHA256 do corpo cru)
 * owempay      -> token compartilhado no header `x-owempay-token`
 */
export function interpretarWebhook(corpo, headers) {
  if (PROVEDOR === 'owempay') {
    const esperado = process.env.OWEMPAY_WEBHOOK_TOKEN
    if (esperado && headers['x-owempay-token'] !== esperado) {
      return { ok: false, erro: 'token de webhook inválido' }
    }
    return {
      ok: true,
      txid: corpo?.reference ?? corpo?.txid,
      status: corpo?.status === 'paid' ? 'pago' : corpo?.status,
    }
  }

  if (PROVEDOR === 'perfectpay') {
    const esperado = process.env.PERFECTPAY_WEBHOOK_SECRET
    if (esperado && headers['x-perfectpay-signature'] !== esperado) {
      return { ok: false, erro: 'assinatura de webhook inválida' }
    }
    return {
      ok: true,
      txid: corpo?.code ?? corpo?.reference,
      status: corpo?.status === 'approved' ? 'pago' : corpo?.status,
    }
  }

  // local
  if (!corpo?.txid) return { ok: false, erro: 'txid ausente' }
  return { ok: true, txid: corpo.txid, status: corpo.status ?? 'pago' }
}
