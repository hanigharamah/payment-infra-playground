import type {
  WalletUser, BankAccount, WalletTransaction, ReconciliationRun, BlockedTx, PendingApproval,
} from '../types/walletOps'

// ── Users ─────────────────────────────────────────────────────────────────
export const INITIAL_USERS: WalletUser[] = [
  { id: 'hani_g',    name: 'Hani Gharamah',        shortName: 'Hani G',     type: 'customer', kycTier: 2, balance: 1250.00,  monthlyVolume: 3420.00,  monthlyLimit: 20000, joinedMonthsAgo: 8,  avatarInitials: 'HG' },
  { id: 'sara_o',    name: 'Sara Al-Otaibi',        shortName: 'Sara A',     type: 'customer', kycTier: 1, balance: 320.00,   monthlyVolume: 4850.00,  monthlyLimit: 5000,  joinedMonthsAgo: 0,  avatarInitials: 'SO' },
  { id: 'ahmed_k',   name: 'Ahmed Khan',            shortName: 'Ahmed K',    type: 'customer', kycTier: 2, balance: 4580.00,  monthlyVolume: 8200.00,  monthlyLimit: 20000, joinedMonthsAgo: 14, avatarInitials: 'AK' },
  { id: 'muhammad_i',name: 'Muhammad Iqbal',        shortName: 'Muhammad I', type: 'driver',   kycTier: 2, balance: 0.00,     monthlyVolume: 12400.00, monthlyLimit: 20000, joinedMonthsAgo: 11, avatarInitials: 'MI' },
  { id: 'hassan_a',  name: 'Hassan Ali',            shortName: 'Hassan A',   type: 'driver',   kycTier: 2, balance: 2340.00,  monthlyVolume: 6800.00,  monthlyLimit: 20000, joinedMonthsAgo: 7,  avatarInitials: 'HA' },
  { id: 'yousef_m',  name: 'Yousef Mohammed',       shortName: 'Yousef M',   type: 'driver',   kycTier: 2, balance: 8900.00,  monthlyVolume: 9100.00,  monthlyLimit: 20000, joinedMonthsAgo: 22, avatarInitials: 'YM' },
  { id: 'foodics_47',name: 'Foodics Cloud Kitchen #47', shortName: 'Foodics 47', type: 'merchant', kycTier: 2, balance: 12450.00, monthlyVolume: 87000.00, monthlyLimit: 200000, joinedMonthsAgo: 18, avatarInitials: 'FK' },
  { id: 'albaik_o',  name: 'Al Baik Olaya Branch',  shortName: 'Al Baik',    type: 'merchant', kycTier: 2, balance: 24890.00, monthlyVolume: 134000.00, monthlyLimit: 200000, joinedMonthsAgo: 31, avatarInitials: 'AB' },
]

// ── Bank accounts ─────────────────────────────────────────────────────────
// Total: 12,450,322.10 + 3,205,441.80 + 2,579,127.60 = SAR 18,234,891.50
export const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'snb_float',
    label: 'Customer Float Account',
    bank: 'SNB',
    accountLast4: '7842',
    balance: 12_450_322.10,
    todayInflows: 234_500,
    todayOutflows: 198_200,
    lastReconciled: new Date(Date.now() - 2 * 60 * 1000),
  },
  {
    id: 'rajhi_driver',
    label: 'Driver Settlement Reserve',
    bank: 'Al Rajhi',
    accountLast4: '3291',
    balance: 3_205_441.80,
    todayInflows: 84_200,
    todayOutflows: 91_400,
    lastReconciled: new Date(Date.now() - 2 * 60 * 1000),
  },
  {
    id: 'anb_merchant',
    label: 'Merchant Float Reserve',
    bank: 'ANB',
    accountLast4: '5516',
    balance: 2_579_127.60,
    todayInflows: 142_800,
    todayOutflows: 128_600,
    lastReconciled: new Date(Date.now() - 2 * 60 * 1000),
  },
]

// ── Seed transactions (last ~2 hours) ─────────────────────────────────────
function minsAgo(n: number) { return new Date(Date.now() - n * 60 * 1000) }
function h(id: string, ts: Date, type: WalletTransaction['type'], from: string, to: string, amount: number, status: WalletTransaction['status'], cost: number, ledger: WalletTransaction['ledgerEntries'], failureReason?: string): WalletTransaction {
  return { id, timestamp: ts, type, fromUserId: from, toUserId: to, amount, currency: 'SAR', status, operationalCost: cost, ledgerEntries: ledger, failureReason }
}

export const INITIAL_TRANSACTIONS: WalletTransaction[] = [
  h('TXN-2001-A1B2C3', minsAgo(2),  'p2p',               'hani_g',    'sara_o',    150.00,  'completed', 0.03, [{ account: 'user:hani_g', debit: 150, credit: 0 }, { account: 'user:sara_o', debit: 0, credit: 150 }]),
  h('TXN-2002-D4E5F6', minsAgo(4),  'topup_card',         'external',  'ahmed_k',   500.00,  'completed', 10.50, [{ account: 'bank:snb_float', debit: 500, credit: 0 }, { account: 'user:ahmed_k', debit: 0, credit: 500 }, { account: 'expense:gateway', debit: 10.50, credit: 0 }, { account: 'bank:snb_float', debit: 0, credit: 10.50 }]),
  h('TXN-2003-G7H8I9', minsAgo(6),  'payout_instant',     'foodics_47','muhammad_i',320.00,  'completed', 2.72, [{ account: 'user:foodics_47', debit: 320, credit: 0 }, { account: 'bank:rajhi_driver', debit: 0, credit: 320 }]),
  h('TXN-2004-J1K2L3', minsAgo(9),  'merchant_settlement','albaik_o',  'bank',       8400.00, 'completed', 16.80, [{ account: 'user:albaik_o', debit: 8400, credit: 0 }, { account: 'bank:anb_merchant', debit: 0, credit: 8400 }]),
  h('TXN-2005-M4N5O6', minsAgo(11), 'p2p',               'ahmed_k',   'hani_g',    200.00,  'completed', 0.04, [{ account: 'user:ahmed_k', debit: 200, credit: 0 }, { account: 'user:hani_g', debit: 0, credit: 200 }]),
  h('TXN-2006-P7Q8R9', minsAgo(15), 'topup_bank',         'external',  'yousef_m',  1000.00, 'completed', 3.00, [{ account: 'bank:snb_float', debit: 1000, credit: 0 }, { account: 'user:yousef_m', debit: 0, credit: 1000 }]),
  h('TXN-2007-S1T2U3', minsAgo(18), 'cashout',            'hassan_a',  'bank',       600.00,  'completed', 1.80, [{ account: 'user:hassan_a', debit: 600, credit: 0 }, { account: 'bank:rajhi_driver', debit: 0, credit: 600 }]),
  h('TXN-2008-V4W5X6', minsAgo(21), 'payout_standard',    'foodics_47','hassan_a',  480.00,  'completed', 0.72, [{ account: 'user:foodics_47', debit: 480, credit: 0 }, { account: 'bank:rajhi_driver', debit: 0, credit: 480 }]),
  h('TXN-2009-Y7Z8A9', minsAgo(24), 'p2p',               'sara_o',    'ahmed_k',    80.00,   'completed', 0.02, [{ account: 'user:sara_o', debit: 80, credit: 0 }, { account: 'user:ahmed_k', debit: 0, credit: 80 }]),
  h('TXN-2010-B1C2D3', minsAgo(27), 'topup_card',         'external',  'hani_g',    300.00,  'failed',    0,    [], 'Gateway timeout — card network unreachable'),
  h('TXN-2011-E4F5G6', minsAgo(31), 'refund',             'system',    'sara_o',     45.00,  'completed', 0.05, [{ account: 'liability:refunds', debit: 45, credit: 0 }, { account: 'user:sara_o', debit: 0, credit: 45 }]),
  h('TXN-2012-H7I8J9', minsAgo(35), 'merchant_settlement','foodics_47','bank',       4050.00, 'completed', 8.10, [{ account: 'user:foodics_47', debit: 4050, credit: 0 }, { account: 'bank:anb_merchant', debit: 0, credit: 4050 }]),
  h('TXN-2013-K1L2M3', minsAgo(38), 'payout_instant',     'albaik_o',  'yousef_m',  780.00,  'awaiting_approval', 6.63, [], 'Amount > SAR 500 threshold'),
  h('TXN-2014-N4O5P6', minsAgo(42), 'p2p',               'yousef_m',  'hani_g',    350.00,  'completed', 0.07, [{ account: 'user:yousef_m', debit: 350, credit: 0 }, { account: 'user:hani_g', debit: 0, credit: 350 }]),
  h('TXN-2015-Q7R8S9', minsAgo(45), 'topup_bank',         'external',  'ahmed_k',   2500.00, 'completed', 7.50, [{ account: 'bank:snb_float', debit: 2500, credit: 0 }, { account: 'user:ahmed_k', debit: 0, credit: 2500 }]),
  h('TXN-2016-T1U2V3', minsAgo(49), 'cashout',            'ahmed_k',   'bank',       1200.00, 'completed', 3.60, [{ account: 'user:ahmed_k', debit: 1200, credit: 0 }, { account: 'bank:snb_float', debit: 0, credit: 1200 }]),
  h('TXN-2017-W4X5Y6', minsAgo(52), 'p2p',               'hani_g',    'yousef_m',   90.00,  'completed', 0.02, [{ account: 'user:hani_g', debit: 90, credit: 0 }, { account: 'user:yousef_m', debit: 0, credit: 90 }]),
  h('TXN-2018-Z7A8B9', minsAgo(57), 'topup_card',         'external',  'sara_o',    150.00,  'blocked_kyc', 0, [], undefined),
  h('TXN-2019-C1D2E3', minsAgo(61), 'payout_standard',    'albaik_o',  'muhammad_i',560.00,  'completed', 0.84, [{ account: 'user:albaik_o', debit: 560, credit: 0 }, { account: 'bank:rajhi_driver', debit: 0, credit: 560 }]),
  h('TXN-2020-F4G5H6', minsAgo(65), 'p2p',               'ahmed_k',   'sara_o',    120.00,  'completed', 0.02, [{ account: 'user:ahmed_k', debit: 120, credit: 0 }, { account: 'user:sara_o', debit: 0, credit: 120 }]),
  h('TXN-2021-I7J8K9', minsAgo(70), 'merchant_settlement','foodics_47','bank',       3800.00, 'completed', 7.60, [{ account: 'user:foodics_47', debit: 3800, credit: 0 }, { account: 'bank:anb_merchant', debit: 0, credit: 3800 }]),
  h('TXN-2022-L1M2N3', minsAgo(74), 'topup_bank',         'external',  'hassan_a',  800.00,  'completed', 2.40, [{ account: 'bank:snb_float', debit: 800, credit: 0 }, { account: 'user:hassan_a', debit: 0, credit: 800 }]),
  h('TXN-2023-O4P5Q6', minsAgo(78), 'p2p',               'yousef_m',  'ahmed_k',   220.00,  'completed', 0.04, [{ account: 'user:yousef_m', debit: 220, credit: 0 }, { account: 'user:ahmed_k', debit: 0, credit: 220 }]),
  h('TXN-2024-R7S8T9', minsAgo(83), 'refund',             'system',    'hani_g',     30.00,  'completed', 0.03, [{ account: 'liability:refunds', debit: 30, credit: 0 }, { account: 'user:hani_g', debit: 0, credit: 30 }]),
  h('TXN-2025-U1V2W3', minsAgo(87), 'cashout',            'yousef_m',  'bank',       2000.00, 'completed', 6.00, [{ account: 'user:yousef_m', debit: 2000, credit: 0 }, { account: 'bank:snb_float', debit: 0, credit: 2000 }]),
  h('TXN-2026-X4Y5Z6', minsAgo(91), 'topup_card',         'external',  'ahmed_k',   800.00,  'completed', 16.80, [{ account: 'bank:snb_float', debit: 800, credit: 0 }, { account: 'user:ahmed_k', debit: 0, credit: 800 }]),
  h('TXN-2027-A7B8C9', minsAgo(95), 'p2p',               'sara_o',    'yousef_m',   60.00,  'completed', 0.01, [{ account: 'user:sara_o', debit: 60, credit: 0 }, { account: 'user:yousef_m', debit: 0, credit: 60 }]),
  h('TXN-2028-D1E2F3', minsAgo(99), 'payout_instant',     'albaik_o',  'hassan_a',  420.00,  'completed', 3.57, [{ account: 'user:albaik_o', debit: 420, credit: 0 }, { account: 'bank:rajhi_driver', debit: 0, credit: 420 }]),
  h('TXN-2029-G4H5I6', minsAgo(103),'merchant_settlement','albaik_o',  'bank',       5200.00, 'completed', 10.40, [{ account: 'user:albaik_o', debit: 5200, credit: 0 }, { account: 'bank:anb_merchant', debit: 0, credit: 5200 }]),
  h('TXN-2030-J7K8L9', minsAgo(108),'topup_bank',         'external',  'hani_g',    400.00,  'completed', 1.20, [{ account: 'bank:snb_float', debit: 400, credit: 0 }, { account: 'user:hani_g', debit: 0, credit: 400 }]),
]

// ── Initial pending approvals ─────────────────────────────────────────────
export const INITIAL_APPROVALS: PendingApproval[] = [
  {
    id: 'APR-001', txId: 'TXN-2013-K1L2M3',
    submittedAt: minsAgo(38),
    txType: 'payout_instant', fromUser: 'Al Baik Olaya Branch', toUser: 'Yousef Mohammed',
    amount: 780.00, reason: 'Instant payout > SAR 500 threshold', riskScore: 'low',
  },
  {
    id: 'APR-002', txId: 'TXN-2031-NEW01',
    submittedAt: minsAgo(15),
    txType: 'p2p', fromUser: 'Ahmed Khan', toUser: 'Hani Gharamah',
    amount: 6200.00, reason: 'P2P transfer > SAR 5,000 threshold', riskScore: 'medium',
  },
  {
    id: 'APR-003', txId: 'TXN-2032-NEW02',
    submittedAt: minsAgo(7),
    txType: 'merchant_settlement', fromUser: 'Foodics Cloud Kitchen #47', toUser: 'Bank',
    amount: 12450.00, reason: 'Merchant first large settlement', riskScore: 'low',
  },
]

// ── Reconciliation runs (past 5 days) ─────────────────────────────────────
export const INITIAL_RECON_RUNS: ReconciliationRun[] = [
  { id: 'REC-0524', startTime: new Date('2026-05-24T02:00:00'), endTime: new Date('2026-05-24T02:04:18'), entriesProcessed: 1182, matched: 1182, variances: 0, status: 'completed' },
  { id: 'REC-0523', startTime: new Date('2026-05-23T02:00:00'), endTime: new Date('2026-05-23T02:03:52'), entriesProcessed: 1074, matched: 1074, variances: 0, status: 'completed' },
  { id: 'REC-0522', startTime: new Date('2026-05-22T02:00:00'), endTime: new Date('2026-05-22T02:05:01'), entriesProcessed: 1240, matched: 1239, variances: 1, status: 'completed' },
  { id: 'REC-0521', startTime: new Date('2026-05-21T02:00:00'), endTime: new Date('2026-05-21T02:03:29'), entriesProcessed: 983,  matched: 983,  variances: 0, status: 'completed' },
  { id: 'REC-0520', startTime: new Date('2026-05-20T02:00:00'), endTime: new Date('2026-05-20T02:04:44'), entriesProcessed: 1108, matched: 1108, variances: 0, status: 'completed' },
]

// ── Blocked transactions ──────────────────────────────────────────────────
export const INITIAL_BLOCKED: BlockedTx[] = [
  { id: 'BLK-001', time: minsAgo(57), userName: 'Sara Al-Otaibi', attemptedAmount: 150.00, reason: 'Monthly limit reached (Tier 1: SAR 5,000)', status: 'upgrade_pending' },
]

// ── 30-day trend data for cost analytics ─────────────────────────────────
export interface CostTrendPoint {
  day: string
  costRate: number
  p2p: number
  card: number
  bank: number
  payout: number
}

export const COST_TREND_DATA: CostTrendPoint[] = Array.from({ length: 30 }, (_, i) => {
  const day = 30 - i
  // Gradual shift: fewer card top-ups, more wallet-to-wallet over time
  const p2pPct = Math.min(42, 30 + i * 0.4)
  const cardPct = Math.max(22, 38 - i * 0.53)
  const bankPct = Math.round(20 + i * 0.1)
  const payoutPct = Math.round(12 + Math.random() * 2)
  // Weighted average cost rate:
  // p2p=0.02%, card=2.10%, bank=0.30%, payout mix~0.50%
  const costRate = parseFloat(
    ((p2pPct * 0.0002 + cardPct * 0.021 + bankPct * 0.003 + payoutPct * 0.005) / 100).toFixed(4)
  )
  const date = new Date('2026-05-27')
  date.setDate(date.getDate() - day + 1)
  return {
    day: date.toISOString().slice(0, 10),
    costRate,
    p2p: Math.round(p2pPct),
    card: Math.round(cardPct),
    bank: Math.round(bankPct),
    payout: payoutPct,
  }
})
