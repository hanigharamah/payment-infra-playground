import type { FraudMetrics } from '../../types/fraud'

interface Props {
  metrics: FraudMetrics | null
}

function pct(n: number) { return `${Math.round(n * 100)}%` }
function f1Fmt(n: number) { return n.toFixed(2) }
function money(n: number) { return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` }

export default function MetricsDashboard({ metrics }: Props) {
  if (!metrics) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
        <p className="text-sm text-slate-500">Run a test to see performance metrics.</p>
      </div>
    )
  }

  const { truePositives: TP, falsePositives: FP, trueNegatives: TN, falseNegatives: FN } = metrics

  return (
    <div className="space-y-6">

      {/* Confusion Matrix */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <p className="text-sm font-bold text-slate-900 mb-4">Confusion Matrix</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 px-3 text-xs text-slate-500 font-medium" />
              <th className="text-center py-2 px-3 text-xs text-slate-600 font-semibold">Actually Fraud</th>
              <th className="text-center py-2 px-3 text-xs text-slate-600 font-semibold">Actually Legitimate</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="py-3 px-3 text-xs font-semibold text-slate-600">Flagged / Declined</td>
              <td className="text-center py-3 px-3">
                <div className="bg-amber-50 border border-amber-200 rounded p-2">
                  <p className="font-bold tabular-nums text-amber-700">TP: {TP}</p>
                  <p className="text-xs text-amber-600">True Positive</p>
                </div>
              </td>
              <td className="text-center py-3 px-3">
                <div className="bg-orange-50 border border-orange-200 rounded p-2">
                  <p className="font-bold tabular-nums text-orange-700">FP: {FP}</p>
                  <p className="text-xs text-orange-600">False Positive</p>
                </div>
              </td>
            </tr>
            <tr>
              <td className="py-3 px-3 text-xs font-semibold text-slate-600">Approved</td>
              <td className="text-center py-3 px-3">
                <div className="bg-red-50 border border-red-200 rounded p-2">
                  <p className="font-bold tabular-nums text-red-700">FN: {FN}</p>
                  <p className="text-xs text-red-600">False Negative</p>
                </div>
              </td>
              <td className="text-center py-3 px-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded p-2">
                  <p className="font-bold tabular-nums text-emerald-700">TN: {TN}</p>
                  <p className="text-xs text-emerald-600">True Negative</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Precision"
          value={pct(metrics.precision)}
          sub={`TP / (TP+FP) = ${TP} / ${TP + FP}`}
          good={metrics.precision >= 0.85}
        />
        <MetricCard
          label="Recall"
          value={pct(metrics.recall)}
          sub={`TP / (TP+FN) = ${TP} / ${TP + FN}`}
          good={metrics.recall >= 0.85}
        />
        <MetricCard
          label="F1 Score"
          value={f1Fmt(metrics.f1Score)}
          sub="Harmonic mean of precision & recall"
          good={metrics.f1Score >= 0.85}
        />
        <MetricCard
          label="False Positive Rate"
          value={pct(metrics.falsePositiveRate)}
          sub={`FP / (FP+TN) = ${FP} / ${FP + TN}`}
          good={metrics.falsePositiveRate <= 0.05}
          invertColor
        />
      </div>

      {/* Business Impact */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <p className="text-sm font-bold text-slate-900 mb-4">Business Impact</p>
        <div className="space-y-0">
          <div className="flex items-start justify-between py-3 border-b border-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-900">Fraud prevented</p>
              <p className="text-xs text-slate-500 mt-0.5">{TP} fraudulent transactions caught</p>
            </div>
            <p className="text-xl font-bold tabular-nums text-emerald-600">{money(metrics.fraudPrevented)}</p>
          </div>
          <div className="flex items-start justify-between py-3 border-b border-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-900">Customer friction cost</p>
              <p className="text-xs text-slate-500 mt-0.5">{FP} legitimate transactions blocked × SAR 65 avg × 20% abandonment</p>
            </div>
            <p className="text-xl font-bold tabular-nums text-red-500">{FP > 0 ? `-${money(metrics.frictionCost)}` : '$0'}</p>
          </div>
          <div className="flex items-center justify-between pt-3 border-t-2 border-slate-200 mt-1">
            <p className="text-sm font-bold text-slate-900">Net benefit</p>
            <p className={`text-xl font-bold tabular-nums ${metrics.netBenefit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {metrics.netBenefit >= 0 ? money(metrics.netBenefit) : `-${money(Math.abs(metrics.netBenefit))}`}
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-4 leading-relaxed border-t border-slate-100 pt-3">
          * Fraudulent transaction value: actual per-transaction amounts from dataset. Legitimate order value SAR 65. Abandonment from friction: 20%.
        </p>
      </div>
    </div>
  )
}

function MetricCard({
  label, value, sub, good, invertColor,
}: {
  label: string
  value: string
  sub: string
  good: boolean
  invertColor?: boolean
}) {
  const positive = invertColor ? !good : good
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">{label}</p>
      <p className={`text-2xl font-bold tabular-nums font-mono ${positive ? 'text-slate-900' : 'text-red-600'}`}>
        {value}
      </p>
      <p className="text-xs text-slate-500 mt-1.5 leading-snug">{sub}</p>
    </div>
  )
}
