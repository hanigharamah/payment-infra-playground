import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { SettlementResult } from '../../types/settlement'
import { formatAmount } from '../../utils/settlementLogic'

interface Props {
  result: SettlementResult
  currency: string
}

// Maps our Tailwind bg class to a hex for Recharts
const COLOR_MAP: Record<string, string> = {
  'bg-slate-700': '#334155',
  'bg-slate-600': '#475569',
  'bg-slate-500': '#64748b',
  'bg-slate-400': '#94a3b8',
  'bg-slate-300': '#cbd5e1',
  'bg-blue-400': '#60a5fa',
  'bg-amber-400': '#fbbf24',
  'bg-emerald-400': '#34d399',
}

export default function FeeBreakdown({ result, currency }: Props) {
  const { lineItems, grossGMV } = result

  const chartData = lineItems.map(item => ({
    name: item.label,
    amount: Number(item.amount.toFixed(2)),
    color: COLOR_MAP[item.color] ?? '#334155',
  }))

  return (
    <div className="space-y-5">

      {/* Proportional bar (stacked CSS) */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Fee waterfall</p>
        <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-100">
          {/* Net payout bar */}
          {grossGMV > 0 && (
            <div
              className="h-full bg-emerald-200"
              style={{ width: `${(result.netPayout / grossGMV) * 100}%` }}
            />
          )}
          {lineItems.map(item => (
            <div
              key={item.label}
              className={`h-full ${item.color}`}
              style={{ width: `${item.pct}%` }}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          <LegendDot color="bg-emerald-200" label="Net payout" />
          {lineItems.map(item => (
            <LegendDot key={item.label} color={item.color} label={item.label} />
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border-t border-slate-200 pt-4">
        <div className="divide-y divide-slate-100">
          {lineItems.map(item => (
            <div key={item.label} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${item.color}`} />
                <span className="text-sm text-slate-700">{item.label}</span>
              </div>
              <div className="flex items-center gap-6 text-right">
                <span className="text-xs tabular-nums text-slate-400 w-14">{item.pct.toFixed(2)}%</span>
                <span className="text-sm tabular-nums font-medium text-slate-900 w-28">
                  {formatAmount(item.amount, currency)}
                </span>
              </div>
            </div>
          ))}
          {/* Total row */}
          <div className="flex items-center justify-between py-2.5 font-semibold">
            <span className="text-sm text-slate-900">Total fees</span>
            <div className="flex items-center gap-6 text-right">
              <span className="text-xs tabular-nums text-slate-600 w-14">{result.effectiveRate.toFixed(2)}%</span>
              <span className="text-sm tabular-nums text-slate-900 w-28">{formatAmount(result.totalFees, currency)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between py-2.5 font-bold">
            <span className="text-sm text-emerald-700">Net payout</span>
            <span className="text-sm tabular-nums text-emerald-700 pr-0 w-28 text-right">
              {formatAmount(result.netPayout, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Horizontal bar chart */}
      <div className="border-t border-slate-200 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Fee breakdown by component</p>
        <ResponsiveContainer width="100%" height={lineItems.length * 36 + 20}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 8, left: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${formatAmount(v, currency)}`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={110}
            />
            <Tooltip
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px' }}
              cursor={{ fill: '#f8fafc' }}
              formatter={(value: number) => [formatAmount(value, currency), 'Amount']}
            />
            <Bar dataKey="amount" radius={[0, 3, 3, 0]} maxBarSize={20}>
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  )
}
