import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Info } from 'lucide-react'
import Nav from '../components/common/Nav'
import GatewayConfig from '../components/routing/GatewayConfig'
import RuleBuilder from '../components/routing/RuleBuilder'
import TransactionPanel from '../components/routing/TransactionPanel'
import PerformanceDashboard from '../components/routing/PerformanceDashboard'
import type { Gateway, RoutingRule, Transaction, ScenarioId } from '../types/routing'
import { DEFAULT_GATEWAYS, SCENARIOS } from '../data/routingScenarios'
import { processTransaction, generateTransactions } from '../utils/routingLogic'

const SCENARIO_OPTIONS = [
  { value: 'custom', label: 'Custom — configure from scratch' },
  { value: 'fifa', label: 'FIFA 2034 Ticketing' },
  { value: 'careem', label: 'Careem Pay Multi-Vertical' },
  { value: 'ubereats', label: 'Uber Eats Merchant Payouts' },
]

export default function Routing() {
  const [gateways, setGateways] = useState<Gateway[]>(DEFAULT_GATEWAYS)
  const [rules, setRules] = useState<RoutingRule[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [scenarioId, setScenarioId] = useState<ScenarioId>('custom')
  const [isProcessing, setIsProcessing] = useState(false)

  const activeScenario = scenarioId !== 'custom' ? SCENARIOS[scenarioId] : null

  function handleToggle(id: string) {
    setGateways((prev) => prev.map((g) => (g.id === id ? { ...g, enabled: !g.enabled } : g)))
  }

  function handleSuccessRate(id: string, rate: number) {
    setGateways((prev) => prev.map((g) => (g.id === id ? { ...g, successRate: rate } : g)))
  }

  function handleAddRule(rule: RoutingRule) {
    setRules((prev) => [...prev, rule])
    setTransactions([])
  }

  function handleDeleteRule(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id))
    setTransactions([])
  }

  function handleScenario(id: ScenarioId) {
    setScenarioId(id)
    setRules(id === 'custom' ? [] : SCENARIOS[id].rules)
    setTransactions([])
  }

  function handleGenerate() {
    setTransactions(generateTransactions(50, activeScenario))
  }

  function handleProcess() {
    if (transactions.length === 0) return
    setIsProcessing(true)
    window.setTimeout(() => {
      setTransactions((prev) => prev.map((tx) => processTransaction(tx, rules, gateways)))
      setIsProcessing(false)
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
          <span className="text-slate-900">Payment Routing Simulator</span>
        </div>

        {/* Page header */}
        <div className="mb-8 pb-6 border-b border-slate-200 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 lg:gap-8">
          <div className="max-w-xl">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Payment Routing Simulator
            </h1>
            <p className="text-base text-slate-600">
              Route transactions across Checkout.com, HyperPay MENA, and Moyasar using priority rules. Build the logic, generate 50 transactions, see where the money goes and what it costs.
            </p>
          </div>

          {/* Scenario selector */}
          <div className="w-full lg:w-auto lg:shrink-0 lg:min-w-[260px]">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Load Example Scenario
            </label>
            <select
              value={scenarioId}
              onChange={(e) => handleScenario(e.target.value as ScenarioId)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              {SCENARIO_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {activeScenario && (
              <div className="flex items-start gap-1.5 mt-2">
                <Info size={12} className="text-slate-500 mt-0.5 shrink-0" />
                <p className="text-xs text-slate-500 leading-snug">{activeScenario.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* 3-column layout — 3 / 4 / 3 on a 10-col grid */}
        <div className="grid grid-cols-1 xl:grid-cols-10 gap-6 items-start">

          {/* LEFT PANEL */}
          <div className="xl:col-span-3 space-y-6">
            <section>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
                Gateway Configuration
              </p>
              <GatewayConfig
                gateways={gateways}
                onToggle={handleToggle}
                onSuccessRateChange={handleSuccessRate}
              />
            </section>
            <div className="border-t border-slate-200" />
            <section>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
                Routing Rules
              </p>
              <RuleBuilder
                rules={rules}
                gateways={gateways}
                onAdd={handleAddRule}
                onDelete={handleDeleteRule}
              />
            </section>
          </div>

          {/* CENTER PANEL */}
          <div className="xl:col-span-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
              Transaction Flow
            </p>
            <TransactionPanel
              transactions={transactions}
              gateways={gateways}
              rules={rules}
              onGenerate={handleGenerate}
              onProcess={handleProcess}
              isProcessing={isProcessing}
            />
          </div>

          {/* RIGHT PANEL */}
          <div className="xl:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
              Performance Dashboard
            </p>
            <PerformanceDashboard
              transactions={transactions}
              gateways={gateways}
            />
          </div>

        </div>
      </div>
    </div>
  )
}
