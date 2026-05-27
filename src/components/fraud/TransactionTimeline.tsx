import { useState } from 'react'
import { ChevronDown, ChevronUp, RefreshCw, Play } from 'lucide-react'
import type { FraudTransaction } from '../../types/fraud'
import { formatTime } from '../../utils/fraudLogic'

interface Props {
  transactions: FraudTransaction[]
  tested: boolean
  onGenerate: () => void
  onRunTest: () => void
  isTesting?: boolean
}

const CLASS_COLORS: Record<string, string> = {
  TN: 'bg-emerald-500',
  TP: 'bg-amber-400',
  FP: 'bg-orange-500',
  FN: 'bg-red-600',
}
const CLASS_LABELS: Record<string, string> = {
  TN: 'TN',
  TP: 'TP',
  FP: 'FP',
  FN: 'FN',
}
const OUTCOME_BADGE: Record<string, string> = {
  approved: 'bg-slate-100 text-slate-700',
  flagged: 'bg-amber-50 text-amber-700',
  challenged: 'bg-orange-50 text-orange-700',
  declined: 'bg-red-50 text-red-700',
}

const PATTERN_LABELS: Record<string, string> = {
  scalper: 'Ticket scalper',
  promo: 'Promo abuse',
  'card-test': 'Card testing',
  ato: 'Account takeover',
}

export default function TransactionTimeline({ transactions, tested, onGenerate, onRunTest, isTesting = false }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'all' | 'TP' | 'FP' | 'FN' | 'TN'>('all')

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const visible = tested && filter !== 'all'
    ? transactions.filter(t => t.classification === filter)
    : transactions

  const counts = tested ? {
    TP: transactions.filter(t => t.classification === 'TP').length,
    FP: transactions.filter(t => t.classification === 'FP').length,
    TN: transactions.filter(t => t.classification === 'TN').length,
    FN: transactions.filter(t => t.classification === 'FN').length,
  } : null

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900">Test Transactions</h2>
          {transactions.length > 0 && (
            <span className="text-xs text-slate-400 tabular-nums">{transactions.length} generated</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onGenerate}
            aria-label="Generate fraud testing dataset"
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={13} />
            {transactions.length === 0 ? 'Generate Dataset' : 'Regenerate'}
          </button>
          <button
            onClick={onRunTest}
            disabled={transactions.length === 0 || isTesting}
            aria-busy={isTesting}
            aria-label="Run fraud rules against generated dataset"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white text-sm font-medium rounded hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isTesting ? (
              <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
            ) : (
              <Play size={13} />
            )}
            {isTesting ? 'Testing' : 'Run Test'}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {transactions.length === 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Click <span className="font-semibold text-slate-700">Generate Dataset</span> to create 100 sample transactions (80 legitimate, 20 fraudulent). Then click <span className="font-semibold text-slate-700">Run Test</span> to evaluate them against your rules.
          </p>
        </div>
      )}

      {/* Generated but not tested */}
      {transactions.length > 0 && !tested && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center text-sm text-amber-700">
          Dataset ready. Click <span className="font-semibold">Run Test</span> to evaluate your rules.
        </div>
      )}

      {/* Filter tabs (after test) */}
      {tested && counts && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {(['all', 'TP', 'FP', 'FN', 'TN'] as const).map(f => {
            const label = f === 'all' ? `All (${transactions.length})` :
              f === 'TP' ? `TP: caught fraud (${counts.TP})` :
              f === 'FP' ? `FP: false alarm (${counts.FP})` :
              f === 'FN' ? `FN: missed fraud (${counts.FN})` :
              `TN: correct pass (${counts.TN})`
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs font-medium rounded border transition-colors ${
                  filter === f
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}

      {/* Transaction list */}
      {transactions.length > 0 && (
        <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
          {visible.map(txn => {
            const isExp = expanded.has(txn.id)
            const outcome = txn.outcome ?? 'approved'
            const cls = txn.classification

            return (
              <div
                key={txn.id}
                className={`bg-white border rounded-lg overflow-hidden transition-colors ${
                  tested && cls === 'FN' ? 'border-red-200' :
                  tested && cls === 'FP' ? 'border-orange-200' :
                  'border-slate-200 hover:border-slate-300'
                }`}
              >
                <button
                  className="w-full text-left p-3"
                  onClick={() => toggleExpand(txn.id)}
                >
                  <div className="flex items-center gap-3">
                    {/* Classification dot */}
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      tested && cls ? CLASS_COLORS[cls] : 'bg-slate-300'
                    }`} />

                    {/* Core info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span className="font-mono text-xs text-slate-500">{txn.id}</span>
                        {tested && (
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${OUTCOME_BADGE[outcome]}`}>
                            {outcome.charAt(0).toUpperCase() + outcome.slice(1)}
                          </span>
                        )}
                        {tested && cls && (
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${CLASS_COLORS[cls]} text-white`}>
                            {CLASS_LABELS[cls]}
                          </span>
                        )}
                        {txn.isFraud && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-medium">
                            fraud
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                        <span><span className="text-slate-400">card </span><span className="font-mono text-slate-700">{txn.cardId}</span></span>
                        <span><span className="text-slate-400">amt </span><span className="font-mono text-slate-700 tabular-nums">SAR {txn.amount}</span></span>
                        <span><span className="text-slate-400">device </span><span className="font-mono text-slate-700">{txn.deviceId}</span></span>
                        {tested && txn.matchedRules && txn.matchedRules.length > 0 && (
                          <span><span className="text-slate-400">rule </span><span className="text-slate-700">{txn.matchedRules[0]}</span></span>
                        )}
                      </div>
                    </div>

                    {isExp ? <ChevronUp size={13} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={13} className="text-slate-400 flex-shrink-0" />}
                  </div>
                </button>

                {/* Expanded details */}
                {isExp && (
                  <div className="px-3 pb-3 pt-2 border-t border-slate-100">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs text-slate-600">
                      <div><span className="text-slate-400">IP country: </span>{txn.ipCountry}</div>
                      <div><span className="text-slate-400">Time: </span><span className="font-mono">{formatTime(txn.timestamp)}</span></div>
                      <div><span className="text-slate-400">Type: </span>{txn.type}</div>
                      <div><span className="text-slate-400">Ground truth: </span><span className={txn.isFraud ? 'text-red-600 font-semibold' : 'text-emerald-600 font-semibold'}>{txn.isFraud ? 'Fraud' : 'Legitimate'}</span></div>
                      {txn.fraudPattern && (
                        <div className="col-span-2"><span className="text-slate-400">Pattern: </span>{PATTERN_LABELS[txn.fraudPattern] ?? txn.fraudPattern}</div>
                      )}
                      {tested && txn.matchedRules && (
                        <div className="col-span-2 sm:col-span-4">
                          <span className="text-slate-400">Rules triggered: </span>
                          {txn.matchedRules.length > 0 ? txn.matchedRules.join(', ') : 'None'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
