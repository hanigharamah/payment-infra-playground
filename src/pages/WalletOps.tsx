import { useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Play, Square } from 'lucide-react'
import Nav from '../components/common/Nav'
import ActivityTab from '../components/wallet/ActivityTab'
import BalancesTab from '../components/wallet/BalancesTab'
import ReconciliationTab from '../components/wallet/ReconciliationTab'
import ApprovalsTab from '../components/wallet/ApprovalsTab'
import KycTab from '../components/wallet/KycTab'
import CostAnalyticsTab from '../components/wallet/CostAnalyticsTab'
import {
  INITIAL_USERS, INITIAL_BANK_ACCOUNTS, INITIAL_TRANSACTIONS,
  INITIAL_APPROVALS, INITIAL_RECON_RUNS, INITIAL_BLOCKED, COST_TREND_DATA,
} from '../data/walletOpsData'
import type { WalletTransaction, WalletUser, BankAccount, Variance, PendingApproval, ReconciliationRun, BlockedTx, WalletTabId, ApprovalDecisions } from '../types/walletOps'
import {
  generateTransaction, generateReconRun, createTestVariance,
  computeMetrics, formatSARCompact,
} from '../utils/walletOpsLogic'

const TABS: { id: WalletTabId; label: string }[] = [
  { id: 'activity', label: 'Activity' },
  { id: 'balances', label: 'Balances' },
  { id: 'reconciliation', label: 'Reconciliation' },
  { id: 'approvals', label: 'Approvals' },
  { id: 'kyc', label: 'KYC & Limits' },
  { id: 'cost', label: 'Cost Analytics' },
]

export default function WalletOps() {
  const [activeTab, setActiveTab] = useState<WalletTabId>('activity')
  const [isSimulating, setIsSimulating] = useState(false)
  const [txGenerated, setTxGenerated] = useState(0)

  const [transactions, setTransactions] = useState<WalletTransaction[]>(INITIAL_TRANSACTIONS)
  const [users, setUsers] = useState<WalletUser[]>(INITIAL_USERS)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(INITIAL_BANK_ACCOUNTS)
  const [variances, setVariances] = useState<Variance[]>([])
  const [approvals, setApprovals] = useState<PendingApproval[]>(INITIAL_APPROVALS)
  const [reconRuns, setReconRuns] = useState<ReconciliationRun[]>(INITIAL_RECON_RUNS)
  const [blockedTxs, setBlockedTxs] = useState<BlockedTx[]>(INITIAL_BLOCKED)
  const [decisions, setDecisions] = useState<ApprovalDecisions>({ approved: 0, rejected: 0 })
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'info' | 'warning' | 'error' }[]>([])

  // Refs for stale-closure-safe simulation
  const simRef = useRef(false)
  const txCountRef = useRef(0)
  const usersRef = useRef(users)
  const approvalsRef = useRef(approvals)

  usersRef.current = users
  approvalsRef.current = approvals

  const addToast = useCallback((message: string, type: 'info' | 'warning' | 'error' = 'info') => {
    const id = String(Date.now())
    setToasts(prev => [...prev.slice(-3), { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const runNextTick = useCallback(() => {
    if (!simRef.current) return
    if (txCountRef.current >= 100) {
      simRef.current = false
      setIsSimulating(false)
      addToast('Simulation complete — 100 transactions generated', 'info')
      // Run a recon after simulation
      const run = generateReconRun(Math.random() < 0.3)
      setReconRuns(prev => [run, ...prev])
      if (run.variances > 0) addToast(`Reconciliation found ${run.variances} variance(s)`, 'warning')
      return
    }

    const delay = 500 + Math.random() * 1000
    const { tx, updatedUsers, newApproval, newBlocked } = generateTransaction(
      usersRef.current,
      approvalsRef.current,
    )

    if (newApproval) {
      setApprovals(prev => [newApproval, ...prev])
      approvalsRef.current = [newApproval, ...approvalsRef.current]
      addToast(`Approval required: ${tx.type} SAR ${tx.amount.toFixed(2)}`, 'warning')
    }
    if (newBlocked) {
      setBlockedTxs(prev => [newBlocked, ...prev])
      addToast(`KYC block: ${newBlocked.userName} hit monthly limit`, 'error')
    }
    if (tx.status === 'failed') {
      addToast(`Transaction failed: ${tx.id.slice(0, 12)}`, 'error')
    }

    usersRef.current = updatedUsers
    setUsers(updatedUsers)
    setTransactions(prevTxs => [tx, ...prevTxs])
    txCountRef.current++
    setTxGenerated(txCountRef.current)

    setTimeout(runNextTick, delay)
  }, [addToast])

  function handleSimulate() {
    if (isSimulating) {
      simRef.current = false
      setIsSimulating(false)
      return
    }
    simRef.current = true
    txCountRef.current = 0
    setTxGenerated(0)
    setTransactions(INITIAL_TRANSACTIONS)
    setUsers(INITIAL_USERS)
    setBankAccounts(INITIAL_BANK_ACCOUNTS)
    setVariances([])
    setApprovals(INITIAL_APPROVALS)
    approvalsRef.current = INITIAL_APPROVALS
    usersRef.current = INITIAL_USERS
    setReconRuns(INITIAL_RECON_RUNS)
    setBlockedTxs(INITIAL_BLOCKED)
    setDecisions({ approved: 0, rejected: 0 })
    setIsSimulating(true)
    setTimeout(runNextTick, 200)
  }

  function handleInjectVariance() {
    const { variance, updatedAccounts } = createTestVariance(bankAccounts)
    setVariances(prev => [variance, ...prev])
    setBankAccounts(updatedAccounts)
    addToast(`Variance injected: ${variance.id} — SAR ${variance.variance.toFixed(2)}`, 'warning')
    setActiveTab('balances')
  }

  function handleResolveVariance(id: string) {
    setVariances(prev => prev.map(v => v.id === id ? { ...v, status: 'resolved' } : v))
    addToast(`Variance ${id} marked as resolved`, 'info')
  }

  function handleApprove(id: string) {
    const apr = approvals.find(a => a.id === id)
    setApprovals(prev => prev.filter(a => a.id !== id))
    setDecisions(prev => ({ ...prev, approved: prev.approved + 1 }))
    setTransactions(prev => prev.map(t =>
      t.id === apr?.txId ? { ...t, status: 'completed' } : t
    ))
    addToast(`Approved: ${id}`, 'info')
  }

  function handleReject(id: string) {
    const apr = approvals.find(a => a.id === id)
    setApprovals(prev => prev.filter(a => a.id !== id))
    setDecisions(prev => ({ ...prev, rejected: prev.rejected + 1 }))
    setTransactions(prev => prev.map(t =>
      t.id === apr?.txId ? { ...t, status: 'failed', failureReason: 'Rejected by operations' } : t
    ))
    addToast(`Rejected: ${id}`, 'error')
  }

  const metrics = computeMetrics(transactions)
  const pendingApprovalCount = approvals.length
  const currentSimTime = `${(transactions[0]?.timestamp ?? new Date()).toISOString().slice(11, 19)} UTC`

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link to="/" className="hover:text-slate-900 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-900">Wallet Operations Dashboard</span>
        </div>

        {/* Operations top bar */}
        <div className="sticky top-[105px] lg:top-[57px] z-40 mb-6 bg-white border border-slate-200 rounded-lg">
          <div className="min-h-14 px-4 py-3 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-bold text-slate-900">Wallet Operations</h1>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  All systems operational
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Ledger integrity, float reconciliation, approvals, KYC limits, and cost of acceptance.
              </p>
            </div>

            <div className="hidden xl:flex items-center justify-center gap-0">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                  {tab.id === 'approvals' && pendingApprovalCount > 0 && (
                    <span className="ml-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">
                      {pendingApprovalCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-mono tabular-nums text-slate-500">
                {currentSimTime}
              </span>
              {isSimulating && (
                <span className="text-xs font-mono tabular-nums text-slate-500">
                  {txGenerated}/100
                </span>
              )}
            <button
              onClick={handleSimulate}
              className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
                isSimulating
                  ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  : 'bg-slate-900 text-white hover:bg-slate-700'
              }`}
            >
              {isSimulating ? (
                <>
                  <Square size={13} />
                  Stop
                </>
              ) : (
                <>
                  <Play size={13} />
                  Simulate Day
                </>
              )}
            </button>
            </div>
          </div>
        </div>

        {/* Live metrics strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
          <MetricStrip label="Transactions" value={String(metrics.txCount)} />
          <MetricStrip label="Volume" value={formatSARCompact(metrics.totalVolume)} />
          <MetricStrip label="Success Rate" value={`${metrics.successRate}%`} color={metrics.successRate < 95 ? 'red' : 'emerald'} />
          <MetricStrip
            label="Pending Approval"
            value={String(pendingApprovalCount)}
            color={pendingApprovalCount > 0 ? 'amber' : undefined}
          />
          <MetricStrip label="Op. Cost" value={formatSARCompact(metrics.totalCost)} />
        </div>

        <div className="xl:hidden mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Dashboard View
          </label>
          <select
            value={activeTab}
            onChange={(event) => setActiveTab(event.target.value as WalletTabId)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            {TABS.map(tab => (
              <option key={tab.id} value={tab.id}>{tab.label}</option>
            ))}
          </select>
        </div>

        {/* Tab content */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          {activeTab === 'activity' && (
            <ActivityTab
              transactions={transactions}
              users={users}
              isSimulating={isSimulating}
            />
          )}
          {activeTab === 'balances' && (
            <BalancesTab
              users={users}
              bankAccounts={bankAccounts}
              variances={variances}
              onInjectVariance={handleInjectVariance}
              onResolveVariance={handleResolveVariance}
            />
          )}
          {activeTab === 'reconciliation' && (
            <ReconciliationTab
              reconRuns={reconRuns}
              variances={variances}
              onResolveVariance={handleResolveVariance}
            />
          )}
          {activeTab === 'approvals' && (
            <ApprovalsTab
              approvals={approvals}
              decisions={decisions}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}
          {activeTab === 'kyc' && (
            <KycTab
              users={users}
              blockedTxs={blockedTxs}
            />
          )}
          {activeTab === 'cost' && (
            <CostAnalyticsTab
              transactions={transactions}
              costTrend={COST_TREND_DATA}
            />
          )}
        </div>

        {/* Footnote */}
        <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-200 pt-4 mt-6">
          * SAMA KYC tiers: Tier 1 SAR 5,000/month (basic ID), Tier 2 SAR 20,000/month (full KYC), Tier 3 SAR 200,000/month (business).
          Operational cost rates: P2P 0.02%, bank top-up 0.30%, card top-up 2.10%, instant payout 0.85%, standard payout 0.15%.
          All figures are simulated planning models only.
        </p>
      </div>

      {/* Toast notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                toast.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                'bg-white border-slate-200 text-slate-800'
              }`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MetricStrip({ label, value, color }: {
  label: string; value: string; color?: 'emerald' | 'red' | 'amber'
}) {
  const valClass =
    color === 'emerald' ? 'text-emerald-700' :
    color === 'red' ? 'text-red-600' :
    color === 'amber' ? 'text-amber-700' :
    'text-slate-900'
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      <p className={`text-base font-bold tabular-nums font-mono leading-none ${valClass}`}>{value}</p>
    </div>
  )
}
