export type WalletTabId = 'activity' | 'balances' | 'reconciliation' | 'approvals' | 'kyc' | 'cost'

export type TxType =
  | 'p2p'
  | 'topup_card'
  | 'topup_bank'
  | 'cashout'
  | 'payout_standard'
  | 'payout_instant'
  | 'merchant_settlement'
  | 'refund'

export type TxStatus = 'completed' | 'pending' | 'failed' | 'awaiting_approval' | 'blocked_kyc'
export type UserType = 'customer' | 'driver' | 'merchant'

export interface LedgerEntry {
  account: string
  debit: number
  credit: number
}

export interface WalletTransaction {
  id: string
  timestamp: Date
  type: TxType
  fromUserId: string
  toUserId: string
  amount: number
  currency: 'SAR'
  status: TxStatus
  operationalCost: number
  ledgerEntries: LedgerEntry[]
  failureReason?: string
  approvalReason?: string
}

export interface WalletUser {
  id: string
  name: string
  shortName: string
  type: UserType
  kycTier: 1 | 2 | 3
  balance: number
  monthlyVolume: number
  monthlyLimit: number
  joinedMonthsAgo: number
  avatarInitials: string
}

export interface BankAccount {
  id: string
  label: string
  bank: string
  accountLast4: string
  balance: number
  todayInflows: number
  todayOutflows: number
  lastReconciled: Date
}

export interface Variance {
  id: string
  detectedAt: Date
  type: 'missing_ledger' | 'missing_bank' | 'amount_mismatch' | 'duplicate'
  expectedAmount: number
  actualAmount: number
  variance: number
  status: 'open' | 'investigating' | 'resolved'
}

export interface PendingApproval {
  id: string
  txId: string
  submittedAt: Date
  txType: TxType
  fromUser: string
  toUser: string
  amount: number
  reason: string
  riskScore: 'low' | 'medium' | 'high'
}

export interface ReconciliationRun {
  id: string
  startTime: Date
  endTime: Date
  entriesProcessed: number
  matched: number
  variances: number
  status: 'completed' | 'in_progress' | 'failed'
}

export interface BlockedTx {
  id: string
  time: Date
  userName: string
  attemptedAmount: number
  reason: string
  status: 'rejected' | 'notified' | 'upgrade_pending'
}

export interface Toast {
  id: string
  message: string
  type: 'info' | 'warning' | 'error'
}

export interface ApprovalDecisions {
  approved: number
  rejected: number
}
