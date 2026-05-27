export type WalletMode = 'event' | 'super-app'
export type WalletModel = 'hybrid' | 'stored-value' | 'tokenized-card'

export interface WalletInputs {
  mode: WalletMode
  walletModel: WalletModel
  dailyTransactions: number
  avgTransactionValue: number
  walletAdoption: number
  storedBalanceShare: number
  tokenizedCardShare: number
  fallbackCoverage: number
  offlinePosShare: number
  instantPayoutShare: number
  refundRate: number
  riskHoldRate: number
}

export interface WalletRailItem {
  label: string
  share: number
  volume: number
  feeRate: number
  latencyMs: number
}

export interface WalletResult {
  walletTransactions: number
  grossGMV: number
  walletGMV: number
  successRate: number
  p95LatencyMs: number
  netFeeCost: number
  savingsVsOpenCard: number
  queueMinutesSaved: number
  supportTicketsPer10k: number
  reconciliationBreaks: number
  heldTransactions: number
  heldAmount: number
  railItems: WalletRailItem[]
  sampleId: string
  sampleTime: string
}

export type WalletPresetId = 'expo-cashless' | 'fifa-prepaid' | 'delivery-wallet' | 'ride-payouts'

export interface WalletPreset {
  id: WalletPresetId
  label: string
  description: string
  inputs: WalletInputs
}
