import type { FraudTransaction, FraudRule, FraudMetrics } from '../types/fraud'

// ── Helpers ───────────────────────────────────────────────────────────────
function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
function randomHex(len: number) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join('')
}

const COUNTRIES = ['SA', 'AE', 'SA', 'SA', 'AE', 'GB', 'US', 'PK', 'IN', 'SA']
const TYPES = ['ticket', 'food', 'retail', 'ticket', 'retail']

// ── Transaction dataset generator ────────────────────────────────────────
export function generateDataset(): FraudTransaction[] {
  const txns: FraudTransaction[] = []
  let counter = 1

  function id() {
    const v = `TXN-${String(counter).padStart(3, '0')}-${randomHex(4)}`
    counter++
    return v
  }

  // ── 80 legitimate transactions ───────────────────────────────────────
  // 40 cards, 2 txns each = exactly 80
  for (let c = 1; c <= 40; c++) {
    const cardId = `CARD-${String(c).padStart(3, '0')}`
    const deviceId = `DEV-${String(c).padStart(3, '0')}`
    for (let t = 0; t < 2; t++) {
      txns.push({
        id: id(),
        cardId,
        deviceId,
        ipCountry: pick(COUNTRIES),
        amount: randomInt(20, 150),
        timestamp: randomInt(0, 86_400_000),
        type: pick(TYPES),
        isFraud: false,
        fraudPattern: null,
      })
    }
  }

  // ── 20 fraudulent transactions ───────────────────────────────────────

  // Pattern 1: Ticket scalpers (8) — CARD-F01 buys 8 tickets in 90s
  // Clearly exceeds "Max 5 per card per hour > 5" (fires at txn 7) AND
  // "High-speed >3 per minute" (fires at txns 5-8)
  const scalperBase = 14_400_000 // 4:00 AM
  for (let i = 0; i < 8; i++) {
    txns.push({
      id: id(),
      cardId: 'CARD-F01',
      deviceId: 'DEV-F01',
      ipCountry: 'SA',
      amount: randomInt(120, 180),
      timestamp: scalperBase + i * 12_000, // 12s apart — 8 txns in 84s
      type: 'ticket',
      isFraud: true,
      fraudPattern: 'scalper',
    })
  }

  // Pattern 2: Promo abuse (5) — 5 different cards, same device, "first purchase"
  for (let i = 0; i < 5; i++) {
    txns.push({
      id: id(),
      cardId: `CARD-F0${i + 2}`,
      deviceId: 'DEV-F02',
      ipCountry: 'SA',
      amount: randomInt(50, 90),
      timestamp: randomInt(28_800_000, 43_200_000),
      type: 'food',
      isFraud: true,
      fraudPattern: 'promo',
    })
  }

  // Pattern 3: Card testing (4) — rapid small transactions then big hit
  // 4 micro-txns (SAR 1-3) in 90s then one large. Triggers "amount < 5" AND ">4 per minute"
  const cardTestBase = 54_000_000 // 15:00
  for (let i = 0; i < 4; i++) {
    txns.push({
      id: id(),
      cardId: 'CARD-F07',
      deviceId: 'DEV-F07',
      ipCountry: 'US',
      amount: i < 3 ? randomInt(1, 3) : randomInt(300, 450), // 3 micro, 1 big
      timestamp: cardTestBase + i * 20_000, // 20s apart, all within 1 min
      type: i < 3 ? 'retail' : 'ticket',
      isFraud: true,
      fraudPattern: 'card-test',
    })
  }

  // Pattern 4: Account takeover (3) — new country, high value
  const atoBase = 68_400_000 // 19:00
  for (let i = 0; i < 3; i++) {
    txns.push({
      id: id(),
      cardId: `CARD-F${i + 8}`,
      deviceId: `DEV-F${i + 8}`,
      ipCountry: pick(['CN', 'RU', 'NG']),
      amount: randomInt(420, 480), // above 400 threshold to trigger "High-value rapid device activity"
      timestamp: atoBase + i * 45_000,
      type: 'retail',
      isFraud: true,
      fraudPattern: 'ato',
    })
  }

  // Shuffle
  return txns.sort(() => Math.random() - 0.5)
}

// ── Rule evaluation ───────────────────────────────────────────────────────
function compare(val: number, operator: string, threshold: number): boolean {
  switch (operator) {
    case '>': return val > threshold
    case '<': return val < threshold
    case '=': return val === threshold
    case '!=': return val !== threshold
    default: return false
  }
}

function buildContextCounts(
  txns: FraudTransaction[],
  scope: 'card' | 'device' | 'ip',
  timeWindow: 'minute' | 'hour' | 'day',
): Map<string, Map<string, number>> {
  // Returns Map<scopeKey, Map<txnId, count of txns in same scope+window>>
  const windowMs: Record<string, number> = {
    minute: 60_000,
    hour: 3_600_000,
    day: 86_400_000,
  }
  const wMs = windowMs[timeWindow]

  const scopeKey = (t: FraudTransaction) =>
    scope === 'card' ? t.cardId : scope === 'device' ? t.deviceId : t.ipCountry

  // For each txn, count how many txns share the same scope key within wMs before/including this one
  const result = new Map<string, Map<string, number>>()

  for (const txn of txns) {
    const key = scopeKey(txn)
    const count = txns.filter(
      other => scopeKey(other) === key && other.timestamp <= txn.timestamp && txn.timestamp - other.timestamp < wMs
    ).length
    if (!result.has(key)) result.set(key, new Map())
    result.get(key)!.set(txn.id, count)
  }

  return result
}

export function evaluateRules(
  transactions: FraudTransaction[],
  rules: FraudRule[],
): FraudTransaction[] {
  const enabledRules = rules.filter(r => r.enabled)

  // Precompute counts for each rule
  type CountMap = Map<string, Map<string, number>>
  const countCache = new Map<string, CountMap>()

  function getCounts(scope: string, timeWindow: string): CountMap {
    const key = `${scope}:${timeWindow}`
    if (!countCache.has(key)) {
      countCache.set(key, buildContextCounts(transactions, scope as 'card' | 'device' | 'ip', timeWindow as 'minute' | 'hour' | 'day'))
    }
    return countCache.get(key)!
  }

  return transactions.map(txn => {
    const matchedRules: string[] = []
    let outcome: FraudTransaction['outcome'] = 'approved'

    for (const rule of enabledRules) {
      const { metric, scope, timeWindow, operator, threshold } = rule.condition

      let value = 0
      if (metric === 'transactions') {
        const counts = getCounts(scope, timeWindow)
        const scopeKey = scope === 'card' ? txn.cardId : scope === 'device' ? txn.deviceId : txn.ipCountry
        value = counts.get(scopeKey)?.get(txn.id) ?? 1
      } else if (metric === 'amount') {
        value = txn.amount
      } else if (metric === 'declines') {
        // Simulate: card testers get high decline count — approximate by using low-amount card pattern
        value = txn.fraudPattern === 'card-test' && txn.amount < 5 ? 7 : 0
      }

      if (compare(value, operator, threshold)) {
        matchedRules.push(rule.name)
        if (rule.action === 'decline') outcome = 'declined'
        else if (rule.action === 'challenge') outcome = 'challenged'
        else if (rule.action === 'flag' && outcome === 'approved') outcome = 'flagged'
        break // first match wins
      }
    }

    const blocked = outcome === 'flagged' || outcome === 'challenged' || outcome === 'declined'
    const classification: FraudTransaction['classification'] =
      blocked && txn.isFraud ? 'TP' :
      blocked && !txn.isFraud ? 'FP' :
      !blocked && !txn.isFraud ? 'TN' : 'FN'

    return { ...txn, outcome, matchedRules, classification }
  })
}

// ── Metrics calculation ───────────────────────────────────────────────────
export function computeMetrics(transactions: FraudTransaction[]): FraudMetrics {
  const evaluated = transactions.filter(t => t.classification !== undefined)

  const TP = evaluated.filter(t => t.classification === 'TP').length
  const FP = evaluated.filter(t => t.classification === 'FP').length
  const TN = evaluated.filter(t => t.classification === 'TN').length
  const FN = evaluated.filter(t => t.classification === 'FN').length

  const precision = TP + FP > 0 ? TP / (TP + FP) : 0
  const recall = TP + FN > 0 ? TP / (TP + FN) : 0
  const f1Score = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0
  const falsePositiveRate = FP + TN > 0 ? FP / (FP + TN) : 0

  const fraudPrevented = evaluated
    .filter(t => t.classification === 'TP')
    .reduce((s, t) => s + t.amount, 0)

  const AVG_LEGIT_ORDER = 65
  const ABANDONMENT_RATE = 0.2
  const frictionCost = FP * AVG_LEGIT_ORDER * ABANDONMENT_RATE

  return {
    truePositives: TP,
    falsePositives: FP,
    trueNegatives: TN,
    falseNegatives: FN,
    precision,
    recall,
    f1Score,
    falsePositiveRate,
    fraudPrevented,
    frictionCost,
    netBenefit: fraudPrevented - frictionCost,
  }
}

// ── Format helpers ────────────────────────────────────────────────────────
export function formatTime(ms: number): string {
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1_000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
