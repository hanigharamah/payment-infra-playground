export interface Gateway {
  id: string
  name: string
  shortName: string
  successRate: number
  baseFee: number
  percentageFee: number
  latency: number
  supportedCurrencies: string[]
  supportedTransactionTypes: string[]
  enabled: boolean
}

export interface RuleCondition {
  currency?: string
  amountOperator?: '>' | '<' | '='
  amount?: number
  transactionType?: string
}

export interface RoutingRule {
  id: string
  condition: RuleCondition
  action: {
    primaryGateway: string
    fallbackGateway?: string
  }
  note?: string
  isDefault?: boolean
}

export interface Transaction {
  id: string
  amount: number
  currency: string
  transactionType: string
  routedTo?: string
  fallbackUsed?: boolean
  outcome?: 'approved' | 'declined'
  matchedRule?: string
  fee?: number
  declineReason?: string
  routingLatencyMs?: number
}

export type ScenarioId = 'custom' | 'mega_event' | 'super_app' | 'merchant_payouts'
