export type RuleMetric = 'transactions' | 'amount' | 'declines'
export type RuleScope = 'card' | 'device' | 'ip'
export type RuleTimeWindow = 'minute' | 'hour' | 'day'
export type RuleOperator = '>' | '<' | '=' | '!='
export type RuleAction = 'flag' | 'challenge' | 'decline'

export interface FraudRule {
  id: string
  name: string
  enabled: boolean
  condition: {
    metric: RuleMetric
    scope: RuleScope
    timeWindow: RuleTimeWindow
    operator: RuleOperator
    threshold: number
  }
  action: RuleAction
}

export interface FraudTransaction {
  id: string
  cardId: string
  deviceId: string
  ipCountry: string
  amount: number
  timestamp: number   // epoch ms — relative offset within the day
  type: string
  isFraud: boolean
  fraudPattern?: 'scalper' | 'promo' | 'card-test' | 'ato' | null
  // filled after test runs
  outcome?: 'approved' | 'flagged' | 'challenged' | 'declined'
  matchedRules?: string[]
  classification?: 'TP' | 'FP' | 'TN' | 'FN'
}

export interface FraudMetrics {
  truePositives: number
  falsePositives: number
  trueNegatives: number
  falseNegatives: number
  precision: number
  recall: number
  f1Score: number
  falsePositiveRate: number
  fraudPrevented: number
  frictionCost: number
  netBenefit: number
}

export type FraudPresetId = 'custom' | 'scalping' | 'promo' | 'card-test'

export interface FraudPreset {
  id: FraudPresetId
  label: string
  description: string
  rules: FraudRule[]
}
