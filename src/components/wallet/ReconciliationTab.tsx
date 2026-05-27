import { CheckCircle, Clock, XCircle } from 'lucide-react'
import type { ReconciliationRun, Variance } from '../../types/walletOps'
import { formatSAR, formatTime, varianceTypeLabel } from '../../utils/walletOpsLogic'

interface Props {
  reconRuns: ReconciliationRun[]
  variances: Variance[]
  onResolveVariance: (id: string) => void
}

export default function ReconciliationTab({ reconRuns, variances, onResolveVariance }: Props) {
  const latestRun = reconRuns[0]
  const totalMatched = reconRuns.reduce((s, r) => s + r.matched, 0)
  const totalEntries = reconRuns.reduce((s, r) => s + r.entriesProcessed, 0)
  const totalVarCount = reconRuns.reduce((s, r) => s + r.variances, 0)
  const overallMatchRate = totalEntries > 0
    ? ((totalMatched / totalEntries) * 100).toFixed(2)
    : '100.00'

  return (
    <div className="space-y-6">

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Last Run Match Rate"
          value={latestRun ? `${((latestRun.matched / latestRun.entriesProcessed) * 100).toFixed(2)}%` : '—'}
          sub="latest reconciliation"
          color="emerald"
        />
        <StatCard
          label="Overall Match Rate"
          value={`${overallMatchRate}%`}
          sub={`${reconRuns.length} runs`}
        />
        <StatCard
          label="Open Variances"
          value={String(variances.filter(v => v.status !== 'resolved').length)}
          sub="require investigation"
          color={variances.some(v => v.status === 'open') ? 'red' : 'slate'}
        />
        <StatCard
          label="Total Variances Found"
          value={String(totalVarCount)}
          sub={`across ${reconRuns.length} runs`}
          color={totalVarCount > 0 ? 'amber' : 'slate'}
        />
      </div>

      {/* Run history */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Run History</p>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Run ID</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 hidden sm:table-cell">Start</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 hidden md:table-cell">Entries</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Matched</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Variances</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 hidden sm:table-cell">Match %</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reconRuns.map((run, idx) => {
                const matchPct = ((run.matched / run.entriesProcessed) * 100).toFixed(2)
                return (
                  <tr key={run.id} className={`hover:bg-slate-50 ${idx === 0 ? 'bg-emerald-50/30' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{run.id.slice(0, 16)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 hidden sm:table-cell">
                      {formatTime(run.startTime)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-slate-600 hidden md:table-cell">
                      {run.entriesProcessed.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-sm text-emerald-700 font-medium">
                      {run.matched.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-mono tabular-nums text-sm font-semibold ${run.variances > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                        {run.variances}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-xs hidden sm:table-cell">
                      <span className={parseFloat(matchPct) >= 99.9 ? 'text-emerald-700' : 'text-amber-700'}>
                        {matchPct}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <RunStatusBadge status={run.status} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Exception queue */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Exception Queue</p>
        {variances.length === 0 ? (
          <div className="border border-slate-200 rounded-lg p-6 text-center">
            <CheckCircle size={20} className="text-emerald-500 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No exceptions. All entries reconciled.</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">ID</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Type</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Variance Amount</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 hidden sm:table-cell">Detected</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Status</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {variances.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{v.id}</td>
                    <td className="px-4 py-3 text-xs text-slate-700">{varianceTypeLabel(v.type)}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-red-600 text-sm">
                      {formatSAR(v.variance)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono hidden sm:table-cell">
                      {formatTime(v.detectedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        v.status === 'resolved' ? 'text-emerald-700 bg-emerald-50' :
                        v.status === 'investigating' ? 'text-amber-700 bg-amber-50' :
                        'text-red-600 bg-red-50'
                      }`}>
                        {v.status === 'resolved' ? 'Resolved' : v.status === 'investigating' ? 'Investigating' : 'Open'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {v.status !== 'resolved' && (
                        <button
                          onClick={() => onResolveVariance(v.id)}
                          className="text-xs text-slate-500 hover:text-slate-900 underline underline-offset-2 transition-colors"
                        >
                          Mark resolved
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function RunStatusBadge({ status }: { status: ReconciliationRun['status'] }) {
  if (status === 'completed') return (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
      <CheckCircle size={12} /> Done
    </span>
  )
  if (status === 'in_progress') return (
    <span className="inline-flex items-center gap-1 text-xs text-amber-700 font-medium">
      <Clock size={12} /> Running
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
      <XCircle size={12} /> Failed
    </span>
  )
}

function StatCard({ label, value, sub, color }: {
  label: string; value: string; sub: string
  color?: 'emerald' | 'red' | 'amber' | 'slate'
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

