import type {
  SettlementInputs, SettlementResult, FeeLineItem, MerchantCategory,
} from '../types/settlement'

const VAT_RATE = 0.15

// ── Interchange rates ──────────────────────────────────────────────────────
function interchangeFee(inputs: SettlementInputs): number {
  const gross = inputs.dailyVolume * inputs.avgTicketSize
  const visaVol = gross * (inputs.paymentMix.visa / 100)
  const walletVol = gross * (inputs.paymentMix.wallet / 100)
  // COD has no interchange

  // mada: SAR 2 cap per transaction
  const madaFee = inputs.paymentMix.mada > 0
    ? inputs.dailyVolume * (inputs.paymentMix.mada / 100) * Math.min(inputs.avgTicketSize * 0.0075, 2)
    : 0

  // Standard domestic Visa interchange, Saudi Arabia (MCC-dependent)
  const visaFee = visaVol * 0.016
  const walletFee = walletVol * 0.015

  return madaFee + visaFee + walletFee
}

// ── Scheme fees (card-on-file, not wallet or COD) ──────────────────────────
function schemeFee(inputs: SettlementInputs): number {
  const gross = inputs.dailyVolume * inputs.avgTicketSize
  const cardPct = (inputs.paymentMix.mada + inputs.paymentMix.visa) / 100
  return gross * cardPct * 0.0009
}

// ── Acquirer margin by merchant category ──────────────────────────────────
const ACQUIRER_RATE: Record<MerchantCategory, number> = {
  fnb: 0.008,
  retail: 0.006,
  services: 0.0075,
  ticketing: 0.010,
  digital: 0.005,
}

function acquirerFee(inputs: SettlementInputs): number {
  const gross = inputs.dailyVolume * inputs.avgTicketSize
  const rate = ACQUIRER_RATE[inputs.merchantCategory]
  // COD has no acquirer fee
  const codPct = inputs.paymentMix.cod / 100
  return gross * (1 - codPct) * rate
}

// Gateway fee: SAR 0.35 per transaction + 0.25% of volume
// Reflects typical percentage-based pricing for Saudi payment gateways
function gatewayFee(inputs: SettlementInputs): number {
  const gross = inputs.dailyVolume * inputs.avgTicketSize
  return inputs.dailyVolume * 0.35 + gross * 0.0025
}

// ── Instant payout premium ────────────────────────────────────────────────
function instantPremium(inputs: SettlementInputs): number {
  if (inputs.settlementTiming !== 'T+0') return 0
  const gross = inputs.dailyVolume * inputs.avgTicketSize
  return gross * 0.005
}

// ── Platform commission ───────────────────────────────────────────────────
function platformFee(inputs: SettlementInputs): number {
  const gross = inputs.dailyVolume * inputs.avgTicketSize
  return gross * (inputs.platformCommission / 100)
}

// ── Float cost (opportunity cost of delayed settlement) ───────────────────
// Assumes 5% annual cost of capital; T+0 = 0 days, T+1 = 1 day, T+2 = 2 days
function floatCost(inputs: SettlementInputs, grossGMV: number): number {
  const days = inputs.settlementTiming === 'T+0' ? 0 : inputs.settlementTiming === 'T+1' ? 1 : 2
  return grossGMV * 0.05 * (days / 365)
}

// ── Settlement date description ───────────────────────────────────────────
function settlementDateLabel(timing: string): string {
  if (timing === 'T+0') return 'Same day (T+0)'
  if (timing === 'T+1') return 'Next business day (T+1)'
  return '2 business days (T+2)'
}

// ── Main calculation ──────────────────────────────────────────────────────
export function calculateSettlement(inputs: SettlementInputs): SettlementResult {
  const grossGMV = inputs.dailyVolume * inputs.avgTicketSize

  const interchange = interchangeFee(inputs)
  const scheme = schemeFee(inputs)
  const acquirer = acquirerFee(inputs)
  const gateway = gatewayFee(inputs)
  const instant = instantPremium(inputs)
  const platform = platformFee(inputs)
  const taxableFees = scheme + acquirer + gateway + instant + platform
  const vat = taxableFees * VAT_RATE

  const totalFees = interchange + scheme + acquirer + gateway + instant + platform + vat
  const netPayout = grossGMV - totalFees
  const effectiveRate = grossGMV > 0 ? (totalFees / grossGMV) * 100 : 0
  const float = floatCost(inputs, grossGMV)

  const lineItems: FeeLineItem[] = [
    { label: 'Interchange', amount: interchange, pct: grossGMV > 0 ? (interchange / grossGMV) * 100 : 0, color: 'bg-slate-700' },
    { label: 'Scheme fees', amount: scheme, pct: grossGMV > 0 ? (scheme / grossGMV) * 100 : 0, color: 'bg-slate-500' },
    { label: 'Acquirer margin', amount: acquirer, pct: grossGMV > 0 ? (acquirer / grossGMV) * 100 : 0, color: 'bg-slate-400' },
    { label: 'Gateway', amount: gateway, pct: grossGMV > 0 ? (gateway / grossGMV) * 100 : 0, color: 'bg-slate-300' },
    ...(instant > 0 ? [{ label: 'Instant payout premium', amount: instant, pct: grossGMV > 0 ? (instant / grossGMV) * 100 : 0, color: 'bg-amber-400' }] : []),
    { label: 'Platform commission', amount: platform, pct: grossGMV > 0 ? (platform / grossGMV) * 100 : 0, color: 'bg-emerald-400' },
    { label: 'VAT on taxable fees', amount: vat, pct: grossGMV > 0 ? (vat / grossGMV) * 100 : 0, color: 'bg-slate-600' },
  ].filter(item => item.amount > 0)

  return {
    grossGMV,
    totalFees,
    netPayout,
    effectiveRate,
    lineItems,
    settlementDate: settlementDateLabel(inputs.settlementTiming),
    settlementDays: inputs.settlementTiming === 'T+0' ? 0 : inputs.settlementTiming === 'T+1' ? 1 : 2,
    floatCost: float,
  }
}

// ── Currency symbol ───────────────────────────────────────────────────────
export function currencySymbol(currency: string): string {
  const map: Record<string, string> = { SAR: 'SAR ', AED: 'AED ', USD: '$', EUR: '€' }
  return map[currency] ?? currency + ' '
}

export function formatAmount(amount: number, currency: string): string {
  return `${currencySymbol(currency)}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
