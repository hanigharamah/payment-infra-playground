import { useState } from 'react'
import { Trash2, Plus } from 'lucide-react'
import type { Gateway, RoutingRule } from '../../types/routing'
import { ALL_CURRENCIES, ALL_TRANSACTION_TYPES } from '../../data/routingScenarios'
import { getRuleLabel } from '../../utils/routingLogic'

type CondType = 'currency' | 'amount' | 'type'

interface Props {
  rules: RoutingRule[]
  gateways: Gateway[]
  onAdd: (rule: RoutingRule) => void
  onDelete: (id: string) => void
}

export default function RuleBuilder({ rules, gateways, onAdd, onDelete }: Props) {
  const [condType, setCondType] = useState<CondType>('currency')
  const [currVal, setCurrVal] = useState('SAR')
  const [amtOp, setAmtOp] = useState<'>' | '<' | '='>('>')
  const [amtVal, setAmtVal] = useState('100')
  const [typeVal, setTypeVal] = useState('ticket_purchase')
  const [primaryGw, setPrimaryGw] = useState('gw-a')
  const [fallbackGw, setFallbackGw] = useState('')

  function handleAdd() {
    const condition: RoutingRule['condition'] = {}
    if (condType === 'currency') condition.currency = currVal
    else if (condType === 'amount') {
      condition.amountOperator = amtOp
      condition.amount = parseFloat(amtVal) || 0
    } else {
      condition.transactionType = typeVal
    }

    onAdd({
      id: `rule-${Date.now()}`,
      condition,
      action: {
        primaryGateway: primaryGw,
        fallbackGateway: fallbackGw || undefined,
      },
    })
  }

  const gwOptions = gateways.map((g) => ({ value: g.id, label: g.shortName }))

  return (
    <div className="space-y-4">
      {/* Add rule form */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Add Rule
        </p>

        {/* IF condition */}
        <div className="space-y-2">
          <label className="text-xs text-slate-500">IF condition</label>
          <select
            value={condType}
            onChange={(e) => setCondType(e.target.value as CondType)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="currency">Currency =</option>
            <option value="amount">Amount</option>
            <option value="type">Transaction Type =</option>
          </select>

          {condType === 'currency' && (
            <select
              value={currVal}
              onChange={(e) => setCurrVal(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              {ALL_CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          {condType === 'amount' && (
            <div className="flex gap-2">
              <select
                value={amtOp}
                onChange={(e) => setAmtOp(e.target.value as '>' | '<' | '=')}
                className="w-20 px-2 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value=">">{'>'}</option>
                <option value="<">{'<'}</option>
                <option value="=">=</option>
              </select>
              <input
                type="number"
                value={amtVal}
                onChange={(e) => setAmtVal(e.target.value)}
                placeholder="100"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          )}

          {condType === 'type' && (
            <select
              value={typeVal}
              onChange={(e) => setTypeVal(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              {ALL_TRANSACTION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}
        </div>

        {/* THEN action */}
        <div className="space-y-2">
          <label className="text-xs text-slate-500">THEN route to</label>
          <select
            value={primaryGw}
            onChange={(e) => setPrimaryGw(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            {gwOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Fallback */}
        <div className="space-y-2">
          <label className="text-xs text-slate-500">Fallback if declined (optional)</label>
          <select
            value={fallbackGw}
            onChange={(e) => setFallbackGw(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">None</option>
            {gwOptions
              .filter((o) => o.value !== primaryGw)
              .map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
          </select>
        </div>

        <button
          onClick={handleAdd}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <Plus size={13} />
          Add Rule
        </button>
      </div>

      {/* Rules list */}
      <div className="space-y-2">
        {rules.map((rule, idx) => (
          <div
            key={rule.id}
            className="bg-white border border-slate-200 rounded-lg p-3 flex items-start justify-between gap-2"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold tabular-nums text-slate-400 w-4">{idx + 1}</span>
                <span className="text-xs font-medium text-slate-700 leading-snug">
                  {getRuleLabel(rule)}
                </span>
              </div>
              <div className="pl-6">
                <span className="text-xs text-slate-500">
                  → {gateways.find((g) => g.id === rule.action.primaryGateway)?.shortName ?? rule.action.primaryGateway}
                  {rule.action.fallbackGateway && (
                    <span className="text-slate-400">
                      {' '}(fallback: {gateways.find((g) => g.id === rule.action.fallbackGateway)?.shortName})
                    </span>
                  )}
                </span>
                {rule.note && (
                  <p className="text-xs text-slate-400 mt-1">{rule.note}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => onDelete(rule.id)}
              className="shrink-0 p-1 text-slate-300 hover:text-red-500 transition-colors rounded"
              aria-label="Delete rule"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}

        {/* Default rule (always last, non-deletable) */}
        <div className="bg-slate-50 border border-slate-200 border-dashed rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold tabular-nums text-slate-300 w-4">
              {rules.length + 1}
            </span>
            <span className="text-xs font-medium text-slate-400">All other transactions</span>
          </div>
          <div className="pl-6">
            <span className="text-xs text-slate-400">→ Gateway A (default)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
