import type { Gateway, RoutingRule, Transaction } from '../types/routing'
import type { ScenarioConfig } from '../data/routingScenarios'

const DEFAULT_RULE: RoutingRule = {
  id: 'default',
  condition: {},
  action: { primaryGateway: 'gw-a' },
  isDefault: true,
}

function matchesRule(tx: Transaction, rule: RoutingRule): boolean {
  if (rule.isDefault) return true

  const { condition } = rule
  const hasAnyCond = condition.currency || condition.amountOperator || condition.transactionType
  if (!hasAnyCond) return false

  if (condition.currency && tx.currency !== condition.currency) return false
  if (condition.transactionType && tx.transactionType !== condition.transactionType) return false
  if (condition.amountOperator && condition.amount !== undefined) {
    if (condition.amountOperator === '>' && tx.amount <= condition.amount) return false
    if (condition.amountOperator === '<' && tx.amount >= condition.amount) return false
    if (condition.amountOperator === '=' && Math.abs(tx.amount - condition.amount) > 0.01) return false
  }

  return true
}

function calcFee(gw: Gateway, amount: number): number {
  return gw.baseFee + (gw.percentageFee / 100) * amount
}

function supportsTransaction(gw: Gateway, tx: Transaction): boolean {
  return gw.supportedCurrencies.includes(tx.currency) &&
    gw.supportedTransactionTypes.includes(tx.transactionType)
}

export function processTransaction(
  tx: Transaction,
  rules: RoutingRule[],
  gateways: Gateway[]
): Transaction {
  const enabled = gateways.filter((g) => g.enabled)
  const allRules = [...rules, DEFAULT_RULE]

  for (const rule of allRules) {
    if (!matchesRule(tx, rule)) continue

    const primary = enabled.find((g) => g.id === rule.action.primaryGateway)
    if (!primary) continue
    if (!supportsTransaction(primary, tx)) {
      const fallback = rule.action.fallbackGateway
        ? enabled.find((g) => g.id === rule.action.fallbackGateway && supportsTransaction(g, tx))
        : null
      if (!fallback) {
        return {
          ...tx,
          routedTo: primary.id,
          outcome: 'declined',
          matchedRule: rule.id,
          fee: 0,
          fallbackUsed: false,
          declineReason: 'Gateway does not support this currency or transaction type',
        }
      }
      const fbApproved = Math.random() * 100 < fallback.successRate
      return {
        ...tx,
        routedTo: fallback.id,
        outcome: fbApproved ? 'approved' : 'declined',
        matchedRule: rule.id,
        fee: fbApproved ? calcFee(fallback, tx.amount) : 0,
        fallbackUsed: true,
        declineReason: fbApproved ? undefined : 'Fallback gateway declined',
        routingLatencyMs: fbApproved ? fallback.latency : undefined,
      }
    }

    const approved = Math.random() * 100 < primary.successRate
    if (approved) {
      return { ...tx, routedTo: primary.id, outcome: 'approved', matchedRule: rule.id, fee: calcFee(primary, tx.amount), fallbackUsed: false, routingLatencyMs: primary.latency }
    }

    if (rule.action.fallbackGateway) {
      const fallback = enabled.find((g) => g.id === rule.action.fallbackGateway)
      if (fallback) {
        const fbApproved = Math.random() * 100 < fallback.successRate
      return {
          ...tx,
          routedTo: fallback.id,
          outcome: fbApproved ? 'approved' : 'declined',
          matchedRule: rule.id,
          fee: fbApproved ? calcFee(fallback, tx.amount) : 0,
          fallbackUsed: true,
          declineReason: fbApproved ? undefined : 'Fallback gateway declined',
          routingLatencyMs: fbApproved ? fallback.latency : undefined,
        }
      }
    }

    return { ...tx, routedTo: primary.id, outcome: 'declined', matchedRule: rule.id, fee: 0, fallbackUsed: false, declineReason: 'Gateway declined' }
  }

  return { ...tx, outcome: 'declined', matchedRule: 'no-match', fee: 0, declineReason: 'No matching route' }
}

function weightedRandom<T>(items: { value: T; weight: number }[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0)
  let r = Math.random() * total
  for (const item of items) {
    r -= item.weight
    if (r <= 0) return item.value
  }
  return items[items.length - 1].value
}

function randomHex(len: number): string {
  return Array.from({ length: len }, () =>
    Math.floor(Math.random() * 16).toString(16).toUpperCase()
  ).join('')
}

const DEFAULT_CURRENCIES = [
  { value: 'USD', weight: 20 }, { value: 'EUR', weight: 15 },
  { value: 'SAR', weight: 30 }, { value: 'AED', weight: 15 },
  { value: 'PKR', weight: 10 }, { value: 'CNY', weight: 10 },
]

const DEFAULT_TYPES = [
  { value: 'mada_domestic', weight: 15 },
  { value: 'ticket_purchase', weight: 20 }, { value: 'food_delivery', weight: 20 },
  { value: 'ride_payment', weight: 15 },    { value: 'retail', weight: 15 },
  { value: 'p2p_transfer', weight: 15 },
]

export function generateTransactions(count: number, scenario: ScenarioConfig | null): Transaction[] {
  const prefix = scenario?.txnPrefix ?? 'PYMT'
  const currencies = scenario
    ? scenario.transactionProfile.currencies.map((c) => ({ value: c.currency, weight: c.weight }))
    : DEFAULT_CURRENCIES
  const types = scenario
    ? scenario.transactionProfile.types.map((t) => ({ value: t.type, weight: t.weight }))
    : DEFAULT_TYPES
  const [min, max] = scenario?.transactionProfile.amountRange ?? [5, 500]

  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${String(i + 1).padStart(3, '0')}-${randomHex(6)}`,
    amount: Math.round((Math.random() * (max - min) + min) * 100) / 100,
    currency: weightedRandom(currencies),
    transactionType: weightedRandom(types),
  }))
}

export function getRuleLabel(rule: RoutingRule): string {
  if (rule.isDefault) return 'Default (catch-all)'
  const parts: string[] = []
  if (rule.condition.currency) parts.push(`Currency = ${rule.condition.currency}`)
  if (rule.condition.amountOperator && rule.condition.amount !== undefined)
    parts.push(`Amount ${rule.condition.amountOperator} $${rule.condition.amount}`)
  if (rule.condition.transactionType) parts.push(`Type = ${rule.condition.transactionType}`)
  return parts.join(' AND ') || 'All transactions'
}

export function computeGatewayStats(transactions: Transaction[], gateways: Gateway[]) {
  return gateways.map((gw) => {
    const routed = transactions.filter((t) => t.routedTo === gw.id)
    const approved = routed.filter((t) => t.outcome === 'approved')
    const successRate = routed.length > 0 ? (approved.length / routed.length) * 100 : 0
    const totalFees = routed.reduce((s, t) => s + (t.fee ?? 0), 0)
    const avgFee = approved.length > 0 ? totalFees / approved.length : 0
    return {
      id: gw.id,
      name: gw.shortName,
      successRate: Math.round(successRate * 10) / 10,
      avgFee: Math.round(avgFee * 100) / 100,
      total: routed.length,
      approved: approved.length,
    }
  })
}
