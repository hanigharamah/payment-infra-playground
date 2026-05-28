import type { SettlementResult } from '../../types/settlement'
import { formatAmount } from '../../utils/settlementLogic'

interface Props {
  result: SettlementResult
  currency: string
}

export default function SummaryCards({ result, currency }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <MetricCard
        label="Gross GMV"
        value={formatAmount(result.grossGMV, currency)}
        sub="daily volume"
      />
      <MetricCard
        label="Total fees"
        value={formatAmount(result.totalFees, currency)}
        sub={`${result.effectiveRate.toFixed(2)}% effective rate`}
        note="Includes platform commission, VAT, and all processing fees"
        color="red"
      />
      <MetricCard
        label="Net payout"
        value={formatAmount(result.netPayout, currency)}
        sub={result.settlementDate}
        color="emerald"
      />
    </div>
  )
}

function MetricCard({
  label, value, sub, note, color,
}: {
  label: string
  value: string
  sub: string
  note?: string
  color?: 'emerald' | 'red'
}) {
  const valueClass =
    color === 'emerald' ? 'text-emerald-700' :
    color === 'red' ? 'text-red-600' :
    'text-slate-900'

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">{label}</p>
      <p className={`text-xl font-bold tabular-nums leading-tight ${valueClass}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-1 leading-snug">{sub}</p>
      {note && <p className="text-xs text-slate-400 mt-0.5 leading-snug">{note}</p>}
    </div>
  )
}
