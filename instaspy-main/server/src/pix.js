// linguagem: JavaScript (ESM), arquivo: server/src/pix.js
// Gerador de BR Code (Pix) no padrao EMV QRCPS-MPM do Banco Central.
// TLV + CRC16-CCITT-FALSE, conforme manual de padroes do BACEN.

const GUI_PIX = 'br.gov.bcb.pix'

/** Monta um campo TLV: ID (2) + tamanho (2) + valor. */
function tlv(id, valor) {
  const s = String(valor)
  const tam = String(s.length).padStart(2, '0')
  if (s.length > 99) throw new Error(`campo ${id} excede 99 caracteres`)
  return `${id}${tam}${s}`
}

/** CRC16/CCITT-FALSE: poly 0x1021, init 0xFFFF, sem reflexao, xorout 0. */
export function crc16(payload) {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/** Remove acentos e caracteres que o padrao nao aceita em nome/cidade. */
function ascii(valor) {
  return String(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 .-]/g, '')
    .trim()
}

/** txid do BR Code: alfanumerico, ate 25 chars. */
function txidValido(valor) {
  const limpo = String(valor).replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  return limpo.slice(0, 25) || '***'
}

/**
 * Gera o payload "copia e cola" do Pix.
 * @param {{chave:string, nome:string, cidade:string, valor_centavos:number, txid:string, descricao?:string}} p
 */
export function gerarPayloadPix({
  chave,
  nome,
  cidade,
  valor_centavos,
  txid,
  descricao = 'InstaSpy',
}) {
  const valor = (valor_centavos / 100).toFixed(2)

  const merchant =
    tlv('00', GUI_PIX) + tlv('01', chave) + (descricao ? tlv('02', ascii(descricao).slice(0, 40)) : '')

  const adicional = tlv('05', txidValido(txid))

  const semCrc =
    tlv('00', '01') +
    tlv('26', merchant) +
    tlv('52', '0000') +
    tlv('53', '986') +
    tlv('54', valor) +
    tlv('58', 'BR') +
    tlv('59', ascii(nome).slice(0, 25) || 'RECEBEDOR') +
    tlv('60', ascii(cidade).slice(0, 15) || 'SAO PAULO') +
    tlv('62', adicional) +
    '6304'

  return semCrc + crc16(semCrc)
}
