import { useState } from 'react'
import { Trash2, ChevronUp, ChevronDown, Plus } from 'lucide-react'
import type { FraudRule, RuleAction, RuleMetric, RuleOperator, RuleScope, RuleTimeWindow } from '../../types/fraud'
import { FRAUD_PRESETS } from '../../data/fraudPresets'
import type { FraudPresetId } from '../../types/fraud'

interface Props {
  rules: FraudRule[]
  activePreset: FraudPresetId
  onChange: (rules: FraudRule[]) => void
  onPreset: (id: FraudPresetId) => void
}

const ACTION_STYLES: Record<RuleAction, string> = {
  flag: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100',
  challenge: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100',
  decline: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
}
const ACTION_LABELS: Record<RuleAction, string> = {
  flag: 'Flag for Review',
  challenge: 'Challenge (3DS)',
  decline: 'Auto-Decline',
}
const METRIC_LABELS: Record<RuleMetric, string> = {
  transactions: 'Transactions',
  amount: 'Amount ($)',
  declines: 'Declines',
}
const SCOPE_LABELS: Record<RuleScope, string> = {
  card: 'per card',
  device: 'per device',
  ip: 'per IP',
}
const WINDOW_LABELS: Record<RuleTimeWindow, string> = {
  minute: 'per minute',
  hour: 'per hour',
  day: 'per day',
}

let nextId = 100

export default function RuleBuilder({ rules, activePreset, onChange, onPreset }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function update(id: string, patch: Partial<FraudRule>) {
    onChange(rules.map(r => r.id === id ? { ...r, ...patch } : r))
  }

  function updateCondition(id: string, patch: Partial<FraudRule['condition']>) {
    onChange(rules.map(r => r.id === id ? { ...r, condition: { ...r.condition, ...patch } } : r))
  }

  function deleteRule(id: string) {
    onChange(rules.filter(r => r.id !== id))
  }

  function moveRule(idx: number, dir: -1 | 1) {
    const next = [...rules]
    const target = idx + dir
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]]
    onChange(next)
  }

  function addRule() {
    const newRule: FraudRule = {
      id: `r${++nextId}`,
      name: 'New rule',
      enabled: true,
      condition: { metric: 'transactions', scope: 'card', timeWindow: 'hour', operator: '>', threshold: 10 },
      action: 'flag',
    }
    onChange([...rules, newRule])
    setExpanded(prev => new Set(prev).add(newRule.id))
  }

  return (
    <div>
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FRAUD_PRESETS.map(p => (
          <button
            key={p.id}
            onClick={() => onPreset(p.id)}
            className={`px-4 py-2 text-sm font-medium rounded border transition-colors ${
              activePreset === p.id
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => onPreset('custom')}
          className={`px-4 py-2 text-sm font-medium rounded border transition-colors ${
            activePreset === 'custom'
              ? 'bg-slate-900 border-slate-900 text-white'
              : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
          }`}
        >
          Custom
        </button>
      </div>

      {/* Preset description */}
      {activePreset !== 'custom' && (
        <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 leading-relaxed">
          {FRAUD_PRESETS.find(p => p.id === activePreset)?.description}
        </div>
      )}

      {/* Rule cards */}
      <div className="space-y-3">
        {rules.map((rule, idx) => (
          <div
            key={rule.id}
            className={`bg-white border rounded-lg transition-colors ${
              rule.enabled ? 'border-slate-200' : 'border-slate-100 opacity-60'
            }`}
          >
            {/* Rule header */}
            <div className="flex items-center gap-3 p-4">
              <input
                type="checkbox"
                checked={rule.enabled}
                onChange={e => update(rule.id, { enabled: e.target.checked })}
                className="w-4 h-4 accent-slate-900 flex-shrink-0"
              />
              <button
                className="flex-1 text-left"
                onClick={() => toggleExpand(rule.id)}
              >
                <span className="text-xs font-bold tabular-nums text-slate-400 mr-2">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="text-sm font-semibold text-slate-900">{rule.name}</span>
                <span className={`ml-3 text-xs px-2 py-0.5 rounded border font-medium ${ACTION_STYLES[rule.action]}`}>
                  {ACTION_LABELS[rule.action]}
                </span>
              </button>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => moveRule(idx, -1)}
                  disabled={idx === 0}
                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={() => moveRule(idx, 1)}
                  disabled={idx === rules.length - 1}
                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                >
                  <ChevronDown size={14} />
                </button>
                <button
                  onClick={() => toggleExpand(rule.id)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  {expanded.has(rule.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <button
                  onClick={() => deleteRule(rule.id)}
                  className="p-1 text-slate-400 hover:text-red-600 ml-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Expanded editor */}
            {expanded.has(rule.id) && (
              <div className="px-4 pb-4 border-t border-slate-100">
                {/* Rule name */}
                <div className="mt-3 mb-4">
                  <input
                    type="text"
                    value={rule.name}
                    onChange={e => update(rule.id, { name: e.target.value })}
                    className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-slate-400"
                    placeholder="Rule name"
                  />
                </div>

                {/* Condition */}
                <div className="bg-slate-50 rounded p-3 mb-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">IF</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={rule.condition.metric}
                      onChange={e => updateCondition(rule.id, { metric: e.target.value as RuleMetric })}
                      className="px-2 py-1.5 border border-slate-200 rounded text-sm bg-white"
                    >
                      {(Object.keys(METRIC_LABELS) as RuleMetric[]).map(k => (
                        <option key={k} value={k}>{METRIC_LABELS[k]}</option>
                      ))}
                    </select>

                    <select
                      value={rule.condition.scope}
                      onChange={e => updateCondition(rule.id, { scope: e.target.value as RuleScope })}
                      className="px-2 py-1.5 border border-slate-200 rounded text-sm bg-white"
                    >
                      {(Object.keys(SCOPE_LABELS) as RuleScope[]).map(k => (
                        <option key={k} value={k}>{SCOPE_LABELS[k]}</option>
                      ))}
                    </select>

                    <select
                      value={rule.condition.timeWindow}
                      onChange={e => updateCondition(rule.id, { timeWindow: e.target.value as RuleTimeWindow })}
                      className="px-2 py-1.5 border border-slate-200 rounded text-sm bg-white"
                    >
                      {(Object.keys(WINDOW_LABELS) as RuleTimeWindow[]).map(k => (
                        <option key={k} value={k}>{WINDOW_LABELS[k]}</option>
                      ))}
                    </select>

                    <select
                      value={rule.condition.operator}
                      onChange={e => updateCondition(rule.id, { operator: e.target.value as RuleOperator })}
                      className="px-2 py-1.5 border border-slate-200 rounded text-sm bg-white w-16"
                    >
                      {(['>', '<', '=', '!='] as RuleOperator[]).map(op => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>

                    <input
                      type="number"
                      value={rule.condition.threshold}
                      onChange={e => updateCondition(rule.id, { threshold: Number(e.target.value) })}
                      className="px-2 py-1.5 border border-slate-200 rounded text-sm w-20 bg-white"
                      min={0}
                    />
                  </div>
                </div>

                {/* Action */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">THEN</p>
                  <div className="flex gap-2 flex-wrap">
                    {(['flag', 'challenge', 'decline'] as RuleAction[]).map(a => (
                      <button
                        key={a}
                        onClick={() => update(rule.id, { action: a })}
                        className={`px-3 py-1.5 text-sm font-medium rounded border transition-colors ${
                          rule.action === a
                            ? ACTION_STYLES[a] + ' ring-1 ring-offset-1 ring-current'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {ACTION_LABELS[a]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Default rule */}
        <div className="bg-white border border-dashed border-slate-200 rounded-lg p-4 opacity-50">
          <p className="text-sm text-slate-600">
            Default: all other transactions <span className="font-semibold">Approved</span>
          </p>
        </div>
      </div>

      {/* Add rule */}
      <button
        onClick={addRule}
        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded hover:bg-slate-800 transition-colors"
      >
        <Plus size={14} />
        Add Rule
      </button>
    </div>
  )
}
