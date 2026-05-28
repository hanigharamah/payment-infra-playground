import type {
  WalletTransaction, WalletUser, BankAccount, Variance, PendingApproval, ReconciliationRun, BlockedTx, TxType, TxStatus,
} from '../types/walletOps'

// ── Cost rates per tx type ─────────────────────────────────────────────────
const COST_RATES: Record<TxType, number> = {
  p2p: 0.0002,
  topup_bank: 0.003,
  topup_card: 0.021,
  cashout: 0.003,
  payout_standard: 0.0015,
  payout_instant: 0.0085,
  merchant_settlement: 0.002,
  refund: 0.001,
}

// ── Type labels ────────────────────────────────────────────────────────────
export const TX_TYPE_LABELS: Record<TxType, string> = {
  p2p: 'P2P Transfer',
  topup_card: 'Card Top-Up',
  topup_bank: 'Bank Top-Up',
  cashout: 'Cash Out',
  payout_standard: 'Standard Payout',
  payout_instant: 'Instant Payout',
  merchant_settlement: 'Merchant Settlement',
  refund: 'Refund',
}

// SAMA Payment Supervision Rules: balance limits vs. monthly throughput limits are distinct. These are balance/hold limits.
export const TIER_LIMITS: Record<1 | 2 | 3, number> = { 1: 5000, 2: 20000, 3: 200000 }
export const TIER_MONTHLY_LIMITS: Record<1 | 2 | 3, number> = { 1: 20000, 2: 60000, 3: 500000 }

// ── Build ledger entries for a transaction ─────────────────────────────────
function buildLedger(type: TxType, from: string, to: string, amount: number, cost: number): WalletTransaction['ledgerEntries'] {
  switch (type) {
    case 'p2p':
      return [
        { account: `user:${from}`, debit: amount, credit: 0 },
        { account: `user:${to}`, debit: 0, credit: amount },
      ]
    case 'topup_card':
      return [
        { account: 'bank:snb_float', debit: amount, credit: 0 },
        { account: `user:${to}`, debit: 0, credit: amount },
        { account: 'expense:gateway', debit: cost, credit: 0 },
        { account: 'bank:snb_float', debit: 0, credit: cost },
      ]
    case 'topup_bank':
      return [
        { account: 'bank:snb_float', debit: amount, credit: 0 },
        { account: `user:${to}`, debit: 0, credit: amount },
      ]
    case 'cashout':
      return [
        { account: `user:${from}`, debit: amount, credit: 0 },
        { account: 'bank:snb_float', debit: 0, credit: amount },
      ]
    case 'payout_standard':
      return [
        { account: `user:${from}`, debit: amount, credit: 0 },
        { account: 'bank:rajhi_driver', debit: 0, credit: amount },
      ]
    case 'payout_instant':
      return [
        { account: `user:${from}`, debit: amount, credit: 0 },
        { account: 'bank:rajhi_driver', debit: 0, credit: amount },
      ]
    case 'merchant_settlement':
      return [
        { account: `user:${from}`, debit: amount, credit: 0 },
        { account: 'bank:anb_merchant', debit: 0, credit: amount },
      ]
    case 'refund':
      return [
        { account: 'liability:refunds', debit: amount, credit: 0 },
        { account: `user:${to}`, debit: 0, credit: amount },
      ]
    default:
      return []
  }
}

// ── ID generator ───────────────────────────────────────────────────────────
let _txCounter = 3000
export function nextTxId(): string {
  _txCounter++
  const hex = Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0')
  return `TXN-${_txCounter}-${hex}`
}

let _varCounter = 10
export function nextVarId(): string {
  _varCounter++
  return `VAR-${String(_varCounter).padStart(3, '0')}`
}

// ── Generate a single new transaction ─────────────────────────────────────
export function generateTransaction(
  users: WalletUser[],
  existingApprovals: PendingApproval[],
): {
  tx: WalletTransaction
  updatedUsers: WalletUser[]
  newApproval: PendingApproval | null
  newBlocked: BlockedTx | null
} {
  const customers = users.filter(u => u.type === 'customer')
  const drivers = users.filter(u => u.type === 'driver')
  const merchants = users.filter(u => u.type === 'merchant')

  // Pick a random scenario
  const roll = Math.random()
  let type: TxType
  let fromId: string
  let toId: string
  let amount: number

  if (roll < 0.22) {
    // P2P between customers
    type = 'p2p'
    const [a, b] = shuffleTwo(customers)
    fromId = a.id; toId = b.id
    amount = rand(50, 800)
  } else if (roll < 0.35) {
    // Card top-up
    type = 'topup_card'
    fromId = 'external'
    toId = pick(customers).id
    amount = rand(100, 1500)
  } else if (roll < 0.48) {
    // Bank top-up
    type = 'topup_bank'
    fromId = 'external'
    toId = pick([...customers, ...drivers]).id
    amount = rand(200, 3000)
  } else if (roll < 0.57) {
    // Cash out
    type = 'cashout'
    const u = pick([...customers, ...drivers])
    fromId = u.id; toId = 'bank'
    amount = rand(200, 2000)
  } else if (roll < 0.68) {
    // Standard payout driver
    type = 'payout_standard'
    fromId = pick(merchants).id
    toId = pick(drivers).id
    amount = rand(150, 900)
  } else if (roll < 0.78) {
    // Instant payout driver
    type = 'payout_instant'
    fromId = pick(merchants).id
    toId = pick(drivers).id
    amount = rand(150, 1200)
  } else if (roll < 0.91) {
    // Merchant settlement
    type = 'merchant_settlement'
    fromId = pick(merchants).id
    toId = 'bank'
    amount = rand(1000, 15000)
  } else {
    // Refund
    type = 'refund'
    fromId = 'system'
    toId = pick(customers).id
    amount = rand(20, 300)
  }

  const cost = parseFloat((amount * COST_RATES[type]).toFixed(2))
  const now = new Date()

  // Check KYC limit for top-ups and P2P to users
  const recipientId = ['topup_card', 'topup_bank', 'p2p', 'refund'].includes(type) ? toId : null
  const recipient = recipientId ? users.find(u => u.id === recipientId) : null

  if (recipient && recipient.kycTier === 1) {
    const wouldBeVolume = recipient.monthlyVolume + amount
    if (wouldBeVolume > TIER_LIMITS[1]) {
      const blockedEntry: BlockedTx = {
        id: `BLK-${String(Date.now()).slice(-5)}`,
        time: now,
        userName: recipient.name,
        attemptedAmount: amount,
        reason: `Tier 1 monthly limit (SAR ${TIER_LIMITS[1].toLocaleString()}) would be exceeded`,
        status: 'notified',
      }
      const failedTx: WalletTransaction = {
        id: nextTxId(),
        timestamp: now,
        type,
        fromUserId: fromId,
        toUserId: toId,
        amount,
        currency: 'SAR',
        status: 'blocked_kyc',
        operationalCost: 0,
        ledgerEntries: [],
      }
      return { tx: failedTx, updatedUsers: users, newApproval: null, newBlocked: blockedEntry }
    }
  }

  // Check approval rules
  const needsApproval =
    (type === 'p2p' && amount > 5000) ||
    ((type === 'payout_standard' || type === 'payout_instant') && amount > 10000) ||
    (type === 'merchant_settlement' && amount > 12000)

  const pendingApprovalCount = existingApprovals.length
  if (needsApproval && pendingApprovalCount < 10) {
    const waitingTx: WalletTransaction = {
      id: nextTxId(),
      timestamp: now,
      type,
      fromUserId: fromId,
      toUserId: toId,
      amount,
      currency: 'SAR',
      status: 'awaiting_approval',
      operationalCost: cost,
      ledgerEntries: [],
      approvalReason: amount > 10000 ? 'High-value transaction' : 'Amount exceeds auto-approve threshold',
    }
    const approval: PendingApproval = {
      id: `APR-${String(Date.now()).slice(-5)}`,
      txId: waitingTx.id,
      submittedAt: now,
      txType: type,
      fromUser: fromId,
      toUser: toId,
      amount,
      reason: waitingTx.approvalReason ?? 'Threshold exceeded',
      riskScore: amount > 10000 ? 'high' : amount > 5000 ? 'medium' : 'low',
    }
    return { tx: waitingTx, updatedUsers: users, newApproval: approval, newBlocked: null }
  }

  // Small random failure chance (5%)
  const status: TxStatus = Math.random() < 0.05 ? 'failed' : 'completed'
  const ledger = status === 'completed' ? buildLedger(type, fromId, toId, amount, cost) : []

  const tx: WalletTransaction = {
    id: nextTxId(),
    timestamp: now,
    type,
    fromUserId: fromId,
    toUserId: toId,
    amount,
    currency: 'SAR',
    status,
    operationalCost: status === 'completed' ? cost : 0,
    ledgerEntries: ledger,
    failureReason: status === 'failed' ? 'Downstream service error — retry eligible' : undefined,
  }

  // Update user balances and monthly volumes
  const updatedUsers = users.map(u => {
    if (status !== 'completed') return u
    let balance = u.balance
    let monthlyVolume = u.monthlyVolume
    if (u.id === fromId && ['p2p', 'cashout', 'payout_standard', 'payout_instant', 'merchant_settlement'].includes(type)) {
      balance = Math.max(0, balance - amount)
      monthlyVolume += amount
    }
    if (u.id === toId && ['p2p', 'topup_card', 'topup_bank', 'payout_standard', 'payout_instant', 'refund'].includes(type)) {
      balance += amount
      monthlyVolume += amount
    }
    return { ...u, balance: parseFloat(balance.toFixed(2)), monthlyVolume: parseFloat(monthlyVolume.toFixed(2)) }
  })

  return { tx, updatedUsers, newApproval: null, newBlocked: null }
}

// ── Compute metrics from transaction list ──────────────────────────────────
export interface WalletMetrics {
  totalVolume: number
  txCount: number
  successRate: number
  pendingCount: number
  failedCount: number
  totalCost: number
  costRate: number
  avgTxSize: number
  instantPayoutShare: number
}

export function computeMetrics(transactions: WalletTransaction[]): WalletMetrics {
  const completed = transactions.filter(t => t.status === 'completed')
  const failed = transactions.filter(t => t.status === 'failed')
  const pending = transactions.filter(t => t.status === 'awaiting_approval' || t.status === 'pending')
  const totalVolume = completed.reduce((s, t) => s + t.amount, 0)
  const totalCost = transactions.reduce((s, t) => s + t.operationalCost, 0)
  const instantPayouts = completed.filter(t => t.type === 'payout_instant')
  const allPayouts = completed.filter(t => t.type === 'payout_standard' || t.type === 'payout_instant')

  return {
    totalVolume: parseFloat(totalVolume.toFixed(2)),
    txCount: transactions.length,
    successRate: transactions.length > 0 ? parseFloat(((completed.length / (completed.length + failed.length)) * 100).toFixed(1)) : 100,
    pendingCount: pending.length,
    failedCount: failed.length,
    totalCost: parseFloat(totalCost.toFixed(2)),
    costRate: totalVolume > 0 ? parseFloat(((totalCost / totalVolume) * 100).toFixed(3)) : 0,
    avgTxSize: completed.length > 0 ? parseFloat((totalVolume / completed.length).toFixed(2)) : 0,
    instantPayoutShare: allPayouts.length > 0 ? parseFloat(((instantPayouts.length / allPayouts.length) * 100).toFixed(1)) : 0,
  }
}

// ── Compute cost breakdown by type ────────────────────────────────────────
export interface CostByType { type: string; cost: number; count: number; pct: number }

export function computeCostByType(transactions: WalletTransaction[]): CostByType[] {
  const map: Record<string, { cost: number; count: number }> = {}
  for (const tx of transactions) {
    if (tx.operationalCost <= 0) continue
    const label = TX_TYPE_LABELS[tx.type]
    if (!map[label]) map[label] = { cost: 0, count: 0 }
    map[label].cost += tx.operationalCost
    map[label].count++
  }
  const total = Object.values(map).reduce((s, v) => s + v.cost, 0)
  return Object.entries(map)
    .map(([type, { cost, count }]) => ({
      type,
      cost: parseFloat(cost.toFixed(2)),
      count,
      pct: total > 0 ? parseFloat(((cost / total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.cost - a.cost)
}

// ── Generate a fake reconciliation run ────────────────────────────────────
export function generateReconRun(hasVariance: boolean): ReconciliationRun {
  const start = new Date()
  const entries = Math.floor(Math.random() * 800) + 400
  const variances = hasVariance ? Math.floor(Math.random() * 4) + 1 : 0
  return {
    id: `RECON-${Date.now()}`,
    startTime: start,
    endTime: new Date(start.getTime() + 4200),
    entriesProcessed: entries,
    matched: entries - variances,
    variances,
    status: 'completed',
  }
}

// ── Inject a test variance ─────────────────────────────────────────────────
export function createTestVariance(bankAccounts: BankAccount[]): { variance: Variance; updatedAccounts: BankAccount[] } {
  const account = pick(bankAccounts)
  const expected = account.balance
  const delta = parseFloat((rand(800, 4500)).toFixed(2))
  const actual = expected - delta
  const types: Variance['type'][] = ['missing_ledger', 'missing_bank', 'amount_mismatch', 'duplicate']
  const variance: Variance = {
    id: nextVarId(),
    detectedAt: new Date(),
    type: pick(types),
    expectedAmount: expected,
    actualAmount: actual,
    variance: delta,
    status: 'open',
  }
  const updatedAccounts = bankAccounts.map(a =>
    a.id === account.id ? { ...a, balance: parseFloat((a.balance - delta * 0.001).toFixed(2)) } : a
  )
  return { variance, updatedAccounts }
}

// ── Formatting helpers ─────────────────────────────────────────────────────
export function formatSAR(amount: number): string {
  return `SAR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatSARCompact(amount: number): string {
  if (amount >= 1_000_000) return `SAR ${(amount / 1_000_000).toFixed(2)}M`
  if (amount >= 1_000) return `SAR ${(amount / 1_000).toFixed(1)}K`
  return `SAR ${amount.toFixed(2)}`
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

export function formatRelative(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ── Status color helpers ───────────────────────────────────────────────────
export function statusColor(status: WalletTransaction['status']): string {
  switch (status) {
    case 'completed': return 'text-emerald-700 bg-emerald-50'
    case 'failed': return 'text-red-600 bg-red-50'
    case 'awaiting_approval': return 'text-amber-700 bg-amber-50'
    case 'blocked_kyc': return 'text-orange-700 bg-orange-50'
    case 'pending': return 'text-slate-600 bg-slate-100'
  }
}

export function statusLabel(status: WalletTransaction['status']): string {
  switch (status) {
    case 'completed': return 'Completed'
    case 'failed': return 'Failed'
    case 'awaiting_approval': return 'Awaiting Approval'
    case 'blocked_kyc': return 'Blocked — KYC'
    case 'pending': return 'Pending'
  }
}

export function riskColor(score: 'low' | 'medium' | 'high'): string {
  switch (score) {
    case 'low': return 'text-emerald-700 bg-emerald-50'
    case 'medium': return 'text-amber-700 bg-amber-50'
    case 'high': return 'text-red-600 bg-red-50'
  }
}

export function varianceTypeLabel(type: Variance['type']): string {
  switch (type) {
    case 'missing_ledger': return 'Missing Ledger Entry'
    case 'missing_bank': return 'Missing Bank Entry'
    case 'amount_mismatch': return 'Amount Mismatch'
    case 'duplicate': return 'Duplicate Entry'
  }
}

// ── Utility ────────────────────────────────────────────────────────────────
function rand(min: number, max: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2))
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function shuffleTwo<T>(arr: T[]): [T, T] {
  const copy = [...arr]
  const i = Math.floor(Math.random() * copy.length)
  const a = copy.splice(i, 1)[0]
  const b = pick(copy)
  return [a, b]
}
