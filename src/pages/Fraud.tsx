import { useState } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../components/common/Nav'
import RuleBuilder from '../components/fraud/RuleBuilder'
import TransactionTimeline from '../components/fraud/TransactionTimeline'
import MetricsDashboard from '../components/fraud/MetricsDashboard'
import { generateDataset, evaluateRules, computeMetrics } from '../utils/fraudLogic'
import { DEFAULT_RULES, FRAUD_PRESETS } from '../data/fraudPresets'
import type { FraudRule, FraudTransaction, FraudPresetId } from '../types/fraud'
import type { FraudMetrics } from '../types/fraud'

export default function Fraud() {
  const [rules, setRules] = useState<FraudRule[]>(DEFAULT_RULES)
  const [activePreset, setActivePreset] = useState<FraudPresetId>('scalping')
  const [transactions, setTransactions] = useState<FraudTransaction[]>([])
  const [tested, setTested] = useState(false)
  const [metrics, setMetrics] = useState<FraudMetrics | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  function handlePreset(id: FraudPresetId) {
    setActivePreset(id)
    if (id !== 'custom') {
      const preset = FRAUD_PRESETS.find(p => p.id === id)
      if (preset) setRules(preset.rules)
    }
    // Clear results when switching presets
    setTested(false)
    setMetrics(null)
    setTransactions(prev => prev.map(t => ({
      ...t, outcome: undefined, matchedRules: undefined, classification: undefined,
    })))
  }

  function handleRulesChange(next: FraudRule[]) {
    setRules(next)
    setActivePreset('custom')
    // Invalidate previous test results
    setTested(false)
    setMetrics(null)
  }

  function handleGenerate() {
    setTransactions(generateDataset())
    setTested(false)
    setMetrics(null)
  }

  function handleRunTest() {
    if (transactions.length === 0) return
    setIsTesting(true)
    window.setTimeout(() => {
      const evaluated = evaluateRules(transactions, rules)
      const m = computeMetrics(evaluated)
      setTransactions(evaluated)
      setMetrics(m)
      setTested(true)
      setIsTesting(false)
    }, 250)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link to="/" className="hover:text-slate-900 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-900">Fraud Detection Playground</span>
        </div>

        {/* Page header */}
        <div className="mb-8 pb-6 border-b border-slate-200">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Fraud Detection Playground
          </h1>
          <p className="text-base text-slate-600 max-w-2xl">
            Write velocity rules — flag anyone buying 5+ tickets in an hour, block cards used across 5 devices in a day — then test them against 100 generated transactions and watch precision and recall update in real time.
          </p>
        </div>

        {/* ── Rule Builder ── */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
          <h2 className="text-base font-bold text-slate-900 mb-5">Build Fraud Rules</h2>
          <RuleBuilder
            rules={rules}
            activePreset={activePreset}
            onChange={handleRulesChange}
            onPreset={handlePreset}
          />
        </div>

        {/* ── Transaction Timeline ── */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
          <TransactionTimeline
            transactions={transactions}
            tested={tested}
            onGenerate={handleGenerate}
            onRunTest={handleRunTest}
            isTesting={isTesting}
          />
        </div>

        {/* ── Metrics Dashboard ── */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-slate-900 mb-4">Performance Metrics</h2>
          <MetricsDashboard metrics={metrics} />
        </div>

        {/* Footnote */}
        <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-200 pt-4">
          * During the 2022 Qatar World Cup, secondary market ticket fraud peaked at 12,000 bot-driven purchases per hour. The detection window was 90 seconds. Transaction dataset is synthetically generated — fraud patterns are deterministic, timestamps are randomised within each run. Precision-recall trade-offs are real: a rule too aggressive kills legitimate group bookings.
        </p>
      </div>
    </div>
  )
}
