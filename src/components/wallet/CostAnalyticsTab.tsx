import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, CartesianGrid,
} from 'recharts'
import type { WalletTransaction } from '../../types/walletOps'
import type { CostTrendPoint } from '../../data/walletOpsData'
import {
  TX_TYPE_LABELS, formatSAR, formatSARCompact, computeCostByType,
} from '../../utils/walletOpsLogic'
import type { TxType } from '../../types/walletOps'

const COST_RATES: Record<TxType, number> = {
  p2p: 0.02,
  topup_bank: 0.30,
  topup_card: 2.10,
  cashout: 0.30,
  payout_standard: 0.15,
  payout_instant: 0.85,
  merchant_settlement: 0.20,
  refund: 0.10,
}

const BAR_COLORS = ['#0f172a', '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0']

interface Props {
  transactions: WalletTransaction[]
  costTrend: CostTrendPoint[]
}

export default function CostAnalyticsTab({ transactions, costTrend }: Props) {
  const completed = transactions.filter(t => t.status === 'completed')
  const totalVolume = completed.reduce((s, t) => s + t.amount, 0)
  const totalCost = transactions.reduce((s, t) => s + t.operationalCost, 0)
  const costRate = totalVolume > 0 ? (totalCost / totalVolume) * 100 : 0

  const costByType = computeCostByType(transactions)

  // Card top-up as a pct of volume (the expensive one)
  const cardTopupCount = completed.filter(t => t.type === 'topup_card').length
  const bankTopupCount = completed.filter(t => t.type === 'topup_bank').length
  const totalTopups = cardTopupCount + bankTopupCount
  const cardTopupShare = totalTopups > 0 ? (cardTopupCount / totalTopups) * 100 : 0

  // Instant vs standard payout share
  const instantCount = completed.filter(t => t.type === 'payout_instant').length
  const standardCount = completed.filter(t => t.type === 'payout_standard').length
  const totalPayouts = instantCount + standardCount
  const instantShare = totalPayouts > 0 ? (instantCount / totalPayouts) * 100 : 0

  // Annual projection (simple)
  const dailyRate = totalCost / Math.max(1, transactions.length / 100) // rough daily estimate
  const annualProjection = dailyRate * 365

  return (
    <div className="space-y-6">

      {/* Summary metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard label="Session Op. Cost" value={formatSAR(totalCost)} sub="this session" />
        <MetricCard label="Effective Cost Rate" value={`${costRate.toFixed(3)}%`} sub="cost / volume" color="amber" />
        <MetricCard label="Card Top-Up Share" value={`${cardTopupShare.toFixed(0)}%`} sub={`${(100 - cardTopupShare).toFixed(0)}% bank (cheaper)`} color={cardTopupShare > 50 ? 'red' : 'emerald'} />
        <MetricCard label="Instant Payout Share" value={`${instantShare.toFixed(0)}%`} sub="of all payouts" />
      </div>

      {/* Two-col layout: bar chart + optimization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Cost by type */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">Cost by Transaction Type</p>
          {costByType.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No cost data yet — run the simulation</p>
          ) : (
            <>
              <div className="h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costByType} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="type"
                      tick={{ fontSize: 9, fill: '#64748b' }}
                      tickFormatter={v => v.split(' ').slice(-1)[0]}
                    />
                    <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={v => `SAR ${v}`} />
                    <Tooltip
                      formatter={(v: number) => [formatSAR(v), 'Cost']}
                      labelStyle={{ fontSize: 11, color: '#1e293b' }}
                      contentStyle={{ fontSize: 11, border: '1px solid #e2e8f0', borderRadius: 6 }}
                    />
                    <Bar dataKey="cost" radius={[2, 2, 0, 0]}>
                      {costByType.map((_, idx) => (
                        <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Table */}
              <div className="space-y-1.5">
                {costByType.map(row => (
                  <div key={row.type} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-slate-600 truncate">{row.type}</span>
                        <span className="font-mono text-xs text-slate-900 tabular-nums ml-2 shrink-0">
                          {formatSAR(row.cost)}
                        </span>
                      </div>
                      <div className="w-full h-1 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-slate-700"
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="font-mono text-xs text-slate-400 tabular-nums w-10 text-right shrink-0">
                      {row.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Optimization cards */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Optimization Opportunities</p>

          <OptCard
            title="Shift card top-ups to bank transfers"
            saving={computeSavingShift(cardTopupCount, completed)}
            current={`${cardTopupShare.toFixed(0)}% of top-ups via card (2.1% rate)`}
            target="Target: ≤30% card, ≥70% bank transfer (0.3% rate)"
            color="red"
          />

          <OptCard
            title="Reduce instant payout premium"
            saving={computeInstantSaving(instantCount, completed)}
            current={`${instantShare.toFixed(0)}% instant payout share (0.85% rate)`}
            target="Batch non-urgent payouts at 0.15% for SAR savings"
            color="amber"
          />

          <OptCard
            title="P2P is near-zero cost"
            saving={null}
            current={`P2P at ${(COST_RATES.p2p * 100).toFixed(2)}% rate — cheapest channel`}
            target="Encourage wallet-to-wallet over card for domestic transfers"
            color="emerald"
          />
        </div>
      </div>

      {/* 30-day trend */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">30-Day Cost Rate Trend</p>
          <p className="text-xs text-slate-400">% of volume</p>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={costTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f172a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                tickFormatter={(v: number) => `${v.toFixed(2)}%`}
              />
              <Tooltip
                formatter={(v: number) => [`${v.toFixed(3)}%`, 'Cost Rate']}
                labelStyle={{ fontSize: 11, color: '#1e293b' }}
                contentStyle={{ fontSize: 11, border: '1px solid #e2e8f0', borderRadius: 6 }}
              />
              <Area
                type="monotone"
                dataKey="costRate"
                stroke="#0f172a"
                strokeWidth={1.5}
                fill="url(#costGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Trend shows gradual cost reduction as wallet-to-wallet (P2P) volume grows relative to card top-ups.
          Each 10% shift from card to bank top-up saves ~{formatSARCompact(annualProjection * 0.1)}/year at current run rate.
        </p>
      </div>

      {/* Rate reference */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Operational Cost Rates</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.entries(COST_RATES) as [TxType, number][]).map(([type, rate]) => (
            <div key={type} className="text-xs">
              <p className="text-slate-500">{TX_TYPE_LABELS[type]}</p>
              <p className="font-mono font-semibold text-slate-900 mt-0.5 tabular-nums">{rate.toFixed(2)}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function computeSavingShift(cardTopupCount: number, completed: WalletTransaction[]): number | null {
  const cardTopups = completed.filter(t => t.type === 'topup_card')
  if (cardTopups.length === 0) return null
  const avgSize = cardTopups.reduce((s, t) => s + t.amount, 0) / cardTopups.length
  // Saving if 40% shift from card (2.1%) to bank (0.3%)
  const shiftCount = Math.floor(cardTopupCount * 0.4)
  return parseFloat((shiftCount * avgSize * (0.021 - 0.003)).toFixed(2))
}

function computeInstantSaving(instantCount: number, completed: WalletTransaction[]): number | null {
  const instantPayouts = completed.filter(t => t.type === 'payout_instant')
  if (instantPayouts.length === 0) return null
  const avgSize = instantPayouts.reduce((s, t) => s + t.amount, 0) / Math.max(1, instantPayouts.length)
  const shiftCount = Math.floor(instantCount * 0.3)
  return parseFloat((shiftCount * avgSize * (0.0085 - 0.0015)).toFixed(2))
}

function OptCard({ title, saving, current, target, color }: {
  title: string
  saving: number | null
  current: string
  target: string
  color: 'red' | 'amber' | 'emerald'
}) {
  const borderClass =
    color === 'red' ? 'border-red-200 bg-red-50/40' :
    color === 'amber' ? 'border-amber-200 bg-amber-50/40' :
    'border-emerald-200 bg-emerald-50/40'

  const savingClass =
    color === 'red' ? 'text-red-700' :
    color === 'amber' ? 'text-amber-700' :
    'text-emerald-700'

  return (
    <div className={`border rounded-lg p-4 ${borderClass}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-slate-800">{title}</p>
        {saving !== null && saving > 0 && (
          <span className={`text-xs font-mono font-semibold tabular-nums shrink-0 ${savingClass}`}>
            Save {formatSAR(saving)}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-600 mb-1">{current}</p>
      <p className="text-xs text-slate-400">{target}</p>
    </div>
  )
}

function MetricCard({ label, value, sub, color }: {
  label: string; value: string; sub: string
  color?: 'emerald' | 'red' | 'amber'
}) {
  const valueClass =
    color === 'emerald' ? 'text-emerald-700' :
    color === 'red' ? 'text-red-600' :
    color === 'amber' ? 'text-amber-700' :
    'text-slate-900'

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">{label}</p>
      <p className={`text-xl font-bold tabular-nums leading-tight ${valueClass}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  )
}
