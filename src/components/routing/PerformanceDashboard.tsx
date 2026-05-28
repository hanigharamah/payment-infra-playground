import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { Gateway, Transaction } from '../../types/routing'
import { computeGatewayStats } from '../../utils/routingLogic'

interface Props {
  transactions: Transaction[]
  gateways: Gateway[]
}

const CHART_TOOLTIP = {
  contentStyle: {
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '12px',
  },
  cursor: { fill: '#f8fafc' },
}

export default function PerformanceDashboard({ transactions, gateways }: Props) {
  const processed = transactions.filter((t) => t.outcome !== undefined)
  const approved = processed.filter((t) => t.outcome === 'approved')
  const declined = processed.filter((t) => t.outcome === 'declined')
  const totalFees = approved.reduce((s, t) => s + (t.fee ?? 0), 0)

  const gwA = gateways.find((g) => g.id === 'gw-a')
  const gwAFees = gwA
    ? approved.reduce((s, t) => s + gwA.baseFee + (gwA.percentageFee / 100) * t.amount, 0)
    : 0
  const savings = gwAFees - totalFees
  const avgLatencyMs = approved.length > 0
    ? Math.round(approved.reduce((s, t) => s + (t.routingLatencyMs ?? 0), 0) / approved.length)
    : 0

  const stats = computeGatewayStats(processed, gateways)
  const isProcessed = processed.length > 0

  return (
    <div className="space-y-6">

      {/* 6 stat cards in a 2x3 grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Processed" value={isProcessed ? processed.length : '—'} sub="transactions" />
        <StatCard
          label="Approved"
          value={isProcessed ? approved.length : '—'}
          sub={isProcessed ? `${Math.round((approved.length / processed.length) * 100)}%` : ''}
          color="emerald"
        />
        <StatCard
          label="Declined"
          value={isProcessed ? declined.length : '—'}
          sub={isProcessed ? `${Math.round((declined.length / processed.length) * 100)}%` : ''}
          color="red"
        />
        <StatCard
          label="Savings"
          value={isProcessed ? `$${Math.abs(savings).toFixed(2)}` : '—'}
          sub={isProcessed ? (savings >= 0 ? 'vs Checkout.com only' : 'over Checkout.com') : ''}
          color={savings >= 0 ? 'emerald' : 'red'}
        />
        <StatCard
          label="Total Fees"
          value={isProcessed ? `$${totalFees.toFixed(2)}` : '—'}
          sub="processing cost"
        />
        <StatCard
          label="Avg Latency"
          value={isProcessed ? `${avgLatencyMs}ms` : '—'}
          sub="avg routing speed"
        />
      </div>

      {/* Success rate chart — h-[180px] */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Success Rate by Gateway
        </p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={stats} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} />
            <Tooltip {...CHART_TOOLTIP} formatter={(value: number) => [`${value}%`, 'Success rate']} />
            <Bar dataKey="successRate" fill="#334155" radius={[3, 3, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Avg cost chart — h-[160px], intentionally different height */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Avg Cost per Transaction
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={stats} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v.toFixed(2)}`} />
            <Tooltip {...CHART_TOOLTIP} formatter={(value: number) => [`$${value.toFixed(2)}`, 'Avg fee']} />
            <Bar dataKey="avgFee" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Volume distribution bars */}
      {isProcessed && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Volume Distribution
          </p>
          <div className="space-y-2">
            {stats.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-xs">
                <span className="text-slate-600 w-24 truncate">{s.name}</span>
                <div className="flex-1 mx-3 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-slate-700 h-full rounded-full"
                    style={{ width: processed.length > 0 ? `${(s.total / processed.length) * 100}%` : '0%' }}
                  />
                </div>
                <span className="tabular-nums text-slate-500 w-6 text-right">{s.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer footnote */}
      <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-200 pt-4">
        * Fees simulated. Checkout.com, HyperPay MENA, and Moyasar pricing varies by merchant category and volume tier. Success rates randomised against configured baseline.
      </p>
    </div>
  )
}

function StatCard({
  label, value, sub, color,
}: {
  label: string
  value: string | number
  sub?: string
  color?: 'emerald' | 'red'
}) {
  const valueClass =
    color === 'emerald' ? 'text-emerald-700' :
    color === 'red' ? 'text-red-600' : 'text-slate-900'

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-bold tabular-nums ${valueClass}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}
