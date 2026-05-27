export type MerchantCategory = 'fnb' | 'retail' | 'services' | 'ticketing' | 'digital'
export type SettlementTiming = 'T+0' | 'T+1' | 'T+2'
export type Currency = 'SAR' | 'AED' | 'USD' | 'EUR'

export interface PaymentMethodMix {
  mada: number      // percent 0–100
  visa: number
  wallet: number
  cod: number
}

export interface SettlementInputs {
  dailyVolume: number           // number of transactions
  avgTicketSize: number         // amount per txn
  currency: Currency
  merchantCategory: MerchantCategory
  paymentMix: PaymentMethodMix  // must sum to 100
  settlementTiming: SettlementTiming
  platformCommission: number    // percent, e.g. 5
}

export interface FeeLineItem {
  label: string
  amount: number
  pct: number        // of gross GMV
  color: string      // tailwind bg class for the bar segment
}

export interface SettlementResult {
  grossGMV: number
  totalFees: number
  netPayout: number
  effectiveRate: number   // totalFees / grossGMV as percent
  lineItems: FeeLineItem[]
  settlementDate: string  // human-readable, e.g. "Same day (T+0)"
  settlementDays: number  // 0, 1, or 2
  floatCost: number       // opportunity cost of T+1/T+2 vs T+0
}

export type PresetId = 'custom' | 'megaevent-fnb' | 'superapp-kitchen' | 'driver-payout'

export interface SettlementPreset {
  id: PresetId
  label: string
  description: string
  inputs: SettlementInputs
}
