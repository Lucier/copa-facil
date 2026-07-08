import { createHmac } from 'crypto'
import { describe, it, expect, beforeEach } from 'vitest'
import { MercadoPagoConfig } from 'mercadopago'
import { MercadoPagoPaymentGatewayAdapter } from '../infrastructure/adapters/mercadopago-payment-gateway.adapter'

const SECRET = 'test-webhook-secret'
const DATA_ID = '123456789'
const REQUEST_ID = 'req-abc-123'

function buildSignature(ts: number, dataId = DATA_ID, requestId = REQUEST_ID): string {
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`
  const hmac = createHmac('sha256', SECRET).update(manifest).digest('hex')
  return `ts=${ts},v1=${hmac}`
}

describe('MercadoPagoPaymentGatewayAdapter — verifyWebhookSignature', () => {
  let adapter: MercadoPagoPaymentGatewayAdapter

  beforeEach(() => {
    const mpConfig = new MercadoPagoConfig({ accessToken: 'TEST-token' })
    adapter = new MercadoPagoPaymentGatewayAdapter(mpConfig, SECRET)
  })

  it('accepts a valid signature within the 5-minute window', () => {
    const ts = Math.floor(Date.now() / 1000)
    const sig = buildSignature(ts)
    expect(adapter.verifyWebhookSignature(Buffer.from('{}'), sig, REQUEST_ID, DATA_ID)).toBe(true)
  })

  it('rejects a signature with wrong HMAC', () => {
    const ts = Math.floor(Date.now() / 1000)
    const sig = `ts=${ts},v1=deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef`
    expect(adapter.verifyWebhookSignature(Buffer.from('{}'), sig, REQUEST_ID, DATA_ID)).toBe(false)
  })

  it('rejects a replayed signature older than 5 minutes', () => {
    const ts = Math.floor(Date.now() / 1000) - 301
    const sig = buildSignature(ts)
    expect(adapter.verifyWebhookSignature(Buffer.from('{}'), sig, REQUEST_ID, DATA_ID)).toBe(false)
  })

  it('rejects a future timestamp', () => {
    const ts = Math.floor(Date.now() / 1000) + 60
    const sig = buildSignature(ts)
    expect(adapter.verifyWebhookSignature(Buffer.from('{}'), sig, REQUEST_ID, DATA_ID)).toBe(false)
  })

  it('rejects when x-signature header is missing', () => {
    expect(adapter.verifyWebhookSignature(Buffer.from('{}'), '', REQUEST_ID, DATA_ID)).toBe(false)
  })

  it('rejects when the secret is not configured', () => {
    const mpConfig = new MercadoPagoConfig({ accessToken: 'TEST-token' })
    const adapterNoSecret = new MercadoPagoPaymentGatewayAdapter(mpConfig)
    const ts = Math.floor(Date.now() / 1000)
    const sig = buildSignature(ts)
    expect(adapterNoSecret.verifyWebhookSignature(Buffer.from('{}'), sig, REQUEST_ID, DATA_ID)).toBe(false)
  })

  it('rejects when the x-signature uses "&" as separator (old/wrong format)', () => {
    const ts = Math.floor(Date.now() / 1000)
    const manifest = `id:${DATA_ID};request-id:${REQUEST_ID};ts:${ts};`
    const hmac = createHmac('sha256', SECRET).update(manifest).digest('hex')
    const badSig = `ts=${ts}&v1=${hmac}`
    expect(adapter.verifyWebhookSignature(Buffer.from('{}'), badSig, REQUEST_ID, DATA_ID)).toBe(false)
  })

  it('rejects when dataId in signature does not match', () => {
    const ts = Math.floor(Date.now() / 1000)
    const sig = buildSignature(ts, 'different-id')
    expect(adapter.verifyWebhookSignature(Buffer.from('{}'), sig, REQUEST_ID, DATA_ID)).toBe(false)
  })

  it('rejects a malformed x-signature header', () => {
    expect(adapter.verifyWebhookSignature(Buffer.from('{}'), 'not-valid-header', REQUEST_ID, DATA_ID)).toBe(false)
  })
})
