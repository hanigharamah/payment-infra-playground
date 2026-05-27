import type { SettlementResult } from '../../types/settlement'
import { formatAmount } from '../../utils/settlementLogic'

interface Props {
  result: SettlementResult
  currency: string
}

export default function SettlementTimeline({ result, currency }: Props) {
  const days = result.settlementDays

  const steps = [
    { day: 'D+0', label: 'Transaction', desc: 'Customer payment captured', active: true },
    { day: 'D+1', label: 'Batch close', desc: 'Acquirer file submitted', active: true },
    { day: days === 0 ? 'D+0' : days === 1 ? 'D+1' : 'D+2', label: 'Settlement', desc: result.settlementDate, active: true, highlight: true },
  ]

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">Settlement timeline</p>

      <div className="relative">
        {/* Connector line */}
        <div className="absolute left-3.5 top-3 bottom-3 w-px bg-slate-200" />

        <div className="space-y-5">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-4 relative">
              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10 ${
                step.highlight
                  ? 'bg-slate-900 border-slate-900'
                  : 'bg-white border-slate-300'
              }`}>
                <span className={`text-xs font-bold ${step.highlight ? 'text-white' : 'text-slate-400'}`}>
                  {idx + 1}
                </span>
              </div>
              <div className="pt-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 tabular-nums">{step.day}</span>
                  <span className={`text-sm font-semibold ${step.highlight ? 'text-slate-900' : 'text-slate-700'}`}>
                    {step.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Float cost box */}
      {days > 0 && (
        <div className="mt-5 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-xs font-semibold text-amber-800 mb-1">Float cost (T+{days})</p>
          <p className="text-sm tabular-nums font-semibold text-amber-800">
            {formatAmount(result.floatCost, currency)}/day
          </p>
          <p className="text-xs text-amber-600 mt-0.5 leading-snug">
            Opportunity cost at 5% annual cost of capital. T+0 eliminates this entirely.
          </p>
        </div>
      )}

      {days === 0 && (
        <div className="mt-5 p-3 bg-emerald-50 border border-emerald-200 rounded-md">
          <p className="text-xs font-semibold text-emerald-800 mb-0.5">Instant settlement active</p>
          <p className="text-xs text-emerald-700 leading-snug">
            Zero float cost. Instant payout premium of 0.5% applies to gross GMV.
          </p>
        </div>
      )}
    </div>
  )
}
