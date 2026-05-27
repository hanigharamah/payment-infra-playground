import { ArrowRight, RefreshCw, Play } from 'lucide-react'
import type { Gateway, RoutingRule, Transaction } from '../../types/routing'
import { getRuleLabel } from '../../utils/routingLogic'

interface Props {
  transactions: Transaction[]
  gateways: Gateway[]
  rules: RoutingRule[]
  onGenerate: () => void
  onProcess: () => void
  isProcessing?: boolean
}

const TYPE_LABELS: Record<string, string> = {
  ticket_purchase: 'Ticket',
  food_delivery: 'Food',
  ride_payment: 'Ride',
  retail: 'Retail',
  p2p_transfer: 'P2P',
  instant_payout: 'Instant',
  standard_payout: 'Standard',
}

export default function TransactionPanel({
  transactions,
  gateways,
  rules,
  onGenerate,
  onProcess,
  isProcessing = false,
}: Props) {
  const processed = transactions.some((t) => t.outcome !== undefined)
  const approved = transactions.filter((t) => t.outcome === 'approved').length
  const declined = transactions.filter((t) => t.outcome === 'declined').length

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          onClick={onGenerate}
          aria-label="Generate 50 synthetic transactions"
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-900 text-sm font-semibold rounded-lg transition-colors"
        >
          <RefreshCw size={14} />
          Generate 50 Transactions
        </button>
        <button
          onClick={onProcess}
          disabled={transactions.length === 0 || isProcessing}
          aria-busy={isProcessing}
          aria-label="Process generated transactions through routing rules"
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
          ) : (
            <Play size={14} />
          )}
          {isProcessing ? 'Processing' : 'Process Transactions'}
        </button>
      </div>

      {/* Status bar */}
      {transactions.length > 0 && (
        <div className="flex items-center gap-4 py-2 border-b border-slate-200 text-xs text-slate-500">
          <span>
            <span className="font-semibold tabular-nums text-slate-900">{transactions.length}</span> transactions
          </span>
          {processed && (
            <>
              <span className="text-slate-200">|</span>
              <span>
                <span className="font-semibold tabular-nums text-emerald-700">{approved}</span> approved
              </span>
              <span>
                <span className="font-semibold tabular-nums text-red-600">{declined}</span> declined
              </span>
            </>
          )}
        </div>
      )}

      {/* Transaction list */}
      {transactions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 flex flex-col items-center justify-center text-center">
          <p className="text-sm text-slate-400">
            Generate transactions to see the routing flow
          </p>
        </div>
      ) : (
        <div className="space-y-1.5 overflow-y-auto max-h-[640px] pr-1">
          {transactions.map((tx) => {
            const gateway = gateways.find((g) => g.id === tx.routedTo)
            const matchedRule = [...rules, { id: 'default', condition: {}, action: { primaryGateway: 'gw-a' }, isDefault: true as const }]
              .find((r) => r.id === tx.matchedRule)

            return (
              <div
                key={tx.id}
                className={`bg-white border rounded-lg px-4 py-3 transition-colors ${
                  tx.outcome === 'approved'
                    ? 'border-l-4 border-l-emerald-400 border-t-slate-100 border-r-slate-100 border-b-slate-100'
                    : tx.outcome === 'declined'
                    ? 'border-l-4 border-l-red-400 border-t-slate-100 border-r-slate-100 border-b-slate-100'
                    : 'border-slate-100'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  {/* Left: ID + type */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs text-slate-400 shrink-0">{tx.id}</span>
                    <span className="inline-flex px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium shrink-0">
                      {TYPE_LABELS[tx.transactionType] ?? tx.transactionType}
                    </span>
                  </div>

                  {/* Center: amount + currency */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-sm font-semibold tabular-nums text-slate-900">
                      ${tx.amount.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400">{tx.currency}</span>
                  </div>

                  {/* Right: routing outcome */}
                  <div className="flex items-center gap-2 shrink-0">
                    {tx.routedTo && (
                      <>
                        <ArrowRight size={12} className="text-slate-300" />
                        <span className="text-xs font-medium text-slate-600">
                          {gateway?.shortName ?? tx.routedTo}
                          {tx.fallbackUsed && (
                            <span className="text-slate-400"> (fb)</span>
                          )}
                        </span>
                      </>
                    )}
                    {tx.outcome && (
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                          tx.outcome === 'approved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {tx.outcome}
                      </span>
                    )}
                  </div>
                </div>

                {/* Matched rule — shown if processed */}
                {matchedRule && (
                  <div className="mt-1.5 ml-0">
                    <span className="text-xs text-slate-400">
                      Rule: {getRuleLabel(matchedRule)}
                      {tx.fee !== undefined && tx.fee > 0 && (
                        <span className="ml-2 tabular-nums">· Fee ${tx.fee.toFixed(2)}</span>
                      )}
                    </span>
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
