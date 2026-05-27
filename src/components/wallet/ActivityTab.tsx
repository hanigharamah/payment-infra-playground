import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { WalletTransaction, WalletUser } from '../../types/walletOps'
import {
  TX_TYPE_LABELS, formatSAR, formatTime, formatRelative, statusColor, statusLabel,
} from '../../utils/walletOpsLogic'

interface Props {
  transactions: WalletTransaction[]
  users: WalletUser[]
  isSimulating: boolean
}

type Filter = 'all' | 'completed' | 'failed' | 'awaiting_approval' | 'blocked_kyc'
type TypeFilter = 'all' | WalletTransaction['type']

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'completed', label: 'Completed' },
  { id: 'awaiting_approval', label: 'Pending Approval' },
  { id: 'failed', label: 'Failed' },
  { id: 'blocked_kyc', label: 'KYC Blocked' },
]

export default function ActivityTab({ transactions, users, isSimulating }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const userMap = Object.fromEntries(users.map(u => [u.id, u]))

  const completed = transactions.filter(t => t.status === 'completed')
  const failed = transactions.filter(t => t.status === 'failed')
  const totalVolume = completed.reduce((sum, tx) => sum + tx.amount, 0)
  const successRate = completed.length + failed.length > 0
    ? ((completed.length / (completed.length + failed.length)) * 100).toFixed(1)
    : '100.0'
  const avgLatency = 284 + Math.min(80, transactions.filter(t => t.status === 'awaiting_approval').length * 6)

  const filtered = transactions.filter(tx => {
    if (filter !== 'all' && tx.status !== filter) return false
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false
    const q = query.trim().toLowerCase()
    if (!q) return true
    return tx.id.toLowerCase().includes(q)
      || userName(tx.fromUserId).toLowerCase().includes(q)
      || userName(tx.toUserId).toLowerCase().includes(q)
  })

  // Show newest 50
  const visible = filtered.slice(0, 50)

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function userName(id: string) {
    return userMap[id]?.shortName ?? id
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        <MetricCard label="Transactions Today" value={transactions.length.toLocaleString()} sub="+18% vs yesterday" />
        <MetricCard label="Transaction Volume" value={formatSAR(totalVolume)} sub="Daily total" />
        <MetricCard label="Success Rate" value={`${successRate}%`} sub={`${completed.length} succeeded · ${failed.length} failed`} />
        <MetricCard label="Avg Latency" value={`${avgLatency}ms`} sub={`p95: ${avgLatency + 128}ms`} />
      </div>

      {/* Filter row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search reference or user"
          aria-label="Search wallet activity"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
          aria-label="Filter wallet activity by transaction type"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <option value="all">All Types</option>
          {(Object.entries(TX_TYPE_LABELS) as [WalletTransaction['type'], string][]).map(([type, label]) => (
            <option key={type} value={type}>{label}</option>
          ))}
        </select>
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as Filter)}
          aria-label="Filter wallet activity by status"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          {FILTERS.map(f => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Real-Time Transaction Feed
        </p>
        {isSimulating && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        )}
      </div>

      {/* Transaction list */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        {visible.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">No transactions match this filter</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visible.map((tx, idx) => {
              const isExp = expanded.has(tx.id)
              const isNew = idx < 3 && isSimulating
              return (
                <div
                  key={tx.id}
                  className={`transition-colors ${isNew ? 'bg-emerald-50' : 'bg-white hover:bg-slate-50'}`}
                >
                  {/* Row */}
                  <button
                    onClick={() => toggle(tx.id)}
                    className="w-full text-left px-4 py-3 flex items-center gap-3"
                  >
                    {/* Expand icon */}
                    <span className="text-slate-400 shrink-0">
                      {isExp ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>

                    {/* Tx ID */}
                    <span className="font-mono text-xs text-slate-500 w-36 shrink-0 truncate">
                      {tx.id}
                    </span>

                    {/* Time */}
                    <span className="font-mono text-xs text-slate-400 w-20 shrink-0">
                      {formatTime(tx.timestamp)}
                    </span>

                    {/* Type */}
                    <span className="text-xs text-slate-700 font-medium w-36 shrink-0 truncate">
                      {TX_TYPE_LABELS[tx.type]}
                    </span>

                    {/* From → To */}
                    <span className="text-xs text-slate-500 flex-1 truncate hidden sm:block">
                      {userName(tx.fromUserId)} → {userName(tx.toUserId)}
                    </span>

                    {/* Amount */}
                    <span className="font-mono text-sm font-semibold tabular-nums text-slate-900 w-28 text-right shrink-0">
                      {formatSAR(tx.amount)}
                    </span>

                    {/* Status */}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded w-36 text-center shrink-0 ${statusColor(tx.status)}`}>
                      {statusLabel(tx.status)}
                    </span>
                  </button>

                  {/* Expanded detail */}
                  {isExp && (
                    <div className="px-4 pb-4 bg-slate-50 border-t border-slate-100">
                      <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">

                        {/* Meta */}
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Transaction Detail</p>
                          <dl className="space-y-1">
                            <Row label="ID" value={tx.id} mono />
                            <Row label="Timestamp" value={`${tx.timestamp.toLocaleDateString('en-US')} ${formatTime(tx.timestamp)} (${formatRelative(tx.timestamp)})`} />
                            <Row label="Type" value={TX_TYPE_LABELS[tx.type]} />
                            <Row label="From" value={userName(tx.fromUserId)} />
                            <Row label="To" value={userName(tx.toUserId)} />
                            <Row label="Amount" value={formatSAR(tx.amount)} mono />
                            <Row label="Op. Cost" value={tx.operationalCost > 0 ? formatSAR(tx.operationalCost) : '—'} mono />
                            {tx.failureReason && <Row label="Failure" value={tx.failureReason} error />}
                            {tx.approvalReason && <Row label="Hold reason" value={tx.approvalReason} warn />}
                          </dl>
                        </div>

                        {/* Ledger */}
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Ledger Entries</p>
                          {tx.ledgerEntries.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No ledger entries — transaction did not settle</p>
                          ) : (
                            <table className="w-full text-xs font-mono">
                              <thead>
                                <tr className="text-slate-400">
                                  <th className="text-left font-semibold pb-1">Account</th>
                                  <th className="text-right font-semibold pb-1">Dr</th>
                                  <th className="text-right font-semibold pb-1">Cr</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {tx.ledgerEntries.map((entry, i) => (
                                  <tr key={i} className="text-slate-700">
                                    <td className="py-0.5 pr-2">{entry.account}</td>
                                    <td className="text-right py-0.5 tabular-nums">
                                      {entry.debit > 0 ? entry.debit.toFixed(2) : '—'}
                                    </td>
                                    <td className="text-right py-0.5 tabular-nums">
                                      {entry.credit > 0 ? entry.credit.toFixed(2) : '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {filtered.length > 50 && (
        <p className="text-xs text-slate-400 mt-3 text-right">
          Showing 50 of {filtered.length} transactions
        </p>
      )}
    </div>
  )
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">{label}</p>
      <p className="font-mono tabular-nums text-xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  )
}

function Row({ label, value, mono, error, warn }: {
  label: string; value: string; mono?: boolean; error?: boolean; warn?: boolean
}) {
  return (
    <div className="flex gap-2 items-baseline">
      <dt className="text-xs text-slate-400 w-24 shrink-0">{label}</dt>
      <dd className={`text-xs break-all ${mono ? 'font-mono' : ''} ${error ? 'text-red-600' : warn ? 'text-amber-700' : 'text-slate-700'}`}>
        {value}
      </dd>
    </div>
  )
}
