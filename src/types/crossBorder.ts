export type CurrencyCode = 'SAR' | 'USD' | 'EUR' | 'AED' | 'CNY' | 'GBP' | 'PKR' | 'INR' | 'BDT'
export type CorridorPurpose = 'tourist' | 'remittance' | 'merchant_settlement' | 'b2b'
export type PaymentMethodType = 'correspondent_banking' | 'stablecoin' | 'local_network'

export interface PaymentCorridor {
  sendCurrency: CurrencyCode
  receiveCurrency: CurrencyCode
  amount: number
  purpose: CorridorPurpose
}

export interface PaymentMethod {
  name: string
  type: PaymentMethodType
  description: string
  available: boolean
  unavailableReason?: string
  fees: {
    sendingFee: number
    intermediaryFees: number[]
    receivingFee: number
    fxSpread: number
    total: number
    totalPct: number
  }
  timeline: string
  timelineMinutes: number
  regulatorySteps: { label: string; description: string }[]
  flowSteps: string[]
  finalAmount: number
  bestFor: string
  transparency: string
  availability: string
  risk: string
  limits: string
}

export interface CrossBorderComparison {
  corridor: PaymentCorridor
  methods: PaymentMethod[]
  bestValue: PaymentMethodType
}

export interface CrossBorderPreset {
  id: string
  label: string
  useCase: string
  corridor: PaymentCorridor
}
