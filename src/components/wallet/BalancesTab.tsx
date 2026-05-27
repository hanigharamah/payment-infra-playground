import { AlertTriangle, TrendingDown, TrendingUp, Zap } from 'lucide-react'
import type { WalletUser, BankAccount, Variance } from '../../types/walletOps'
import { formatSAR, formatSARCompact, formatRelative, varianceTypeLabel } from '../../utils/walletOpsLogic'

interface Props {
  users: WalletUser[]
  bankAccounts: BankAccount[]
  variances: Variance[]
  onInjectVariance: () => void
  onResolveVariance: (id: string) => void
}

export default function BalancesTab({ users, bankAccounts, variances, onInjectVariance, onResolveVariance }: Props) {
  const totalUserBalance = users.reduce((s, u) => s + u.balance, 0)
  const totalBankBalance = bankAccounts.reduce((s, a) => s + a.balance, 0)
  const netFloat = totalBankBalance - totalUserBalance
  const openVariances = variances.filter(v => v.status === 'open' || v.status === 'investigating')

  return (
    <div className="space-y-6">

      {/* Float reconciliation summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FloatCard
          label="Total User Balances"
          value={formatSARCompact(totalUserBalance)}
          sub="sum of all wallet balances"
        />
        <FloatCard
          label="Total Bank Float"
          value={formatSARCompact(totalBankBalance)}
          sub="across 3 bank accounts"
          color="emerald"
        />
        <FloatCard
          label="Net Float Position"
          value={formatSARCompact(Math.abs(netFloat))}
          sub={netFloat >= 0 ? 'surplus — review periodically' : 'shortfall — investigate immediately'}
          color={netFloat >= 0 ? 'emerald' : 'red'}
        />
      </div>

      {/* Bank accounts */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Bank Accounts</p>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Account</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 hidden sm:table-cell">Today Inflows</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 hidden sm:table-cell">Today Outflows</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Balance</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 hidden md:table-cell">Reconciled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bankAccounts.map(acc => (
                <tr key={acc.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 text-sm">{acc.label}</div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">{acc.bank} ···{acc.accountLast4}</div>
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    <span className="flex items-center justify-end gap-1 text-emerald-700 text-sm font-mono tabular-nums">
                      <TrendingUp size={12} />
                      {formatSARCompact(acc.todayInflows)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    <span className="flex items-center justify-end gap-1 text-red-600 text-sm font-mono tabular-nums">
                      <TrendingDown size={12} />
                      {formatSARCompact(acc.todayOutflows)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-slate-900">
                    {formatSAR(acc.balance)}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-slate-400 hidden md:table-cell">
                    {formatRelative(acc.lastReconciled)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User balances */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">User Wallet Balances</p>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">User</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 hidden sm:table-cell">Type</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 hidden md:table-cell">KYC Tier</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Balance</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 hidden sm:table-cell">Monthly Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(user => {
                const utilizationPct = (user.monthlyVolume / user.monthlyLimit) * 100
                const isNearLimit = utilizationPct > 85
                return (
                  <tr key={user.id} className={`hover:bg-slate-50 ${isNearLimit ? 'bg-amber-50/50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                          {user.avatarInitials}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 text-sm">{user.name}</div>
                          <div className="font-mono text-xs text-slate-400">{user.id}</div>
                        </div>
                        {isNearLimit && (
                          <AlertTriangle size={13} className="text-amber-500 shrink-0" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="capitalize text-xs text-slate-600">{user.type}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        user.kycTier === 1 ? 'text-amber-700 bg-amber-50' :
                        user.kycTier === 2 ? 'text-slate-700 bg-slate-100' :
                        'text-emerald-700 bg-emerald-50'
                      }`}>
                        Tier {user.kycTier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-slate-900">
                      {formatSAR(user.balance)}
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      <div className="flex flex-col items-end gap-1">
                        <span className={`font-mono text-xs tabular-nums ${isNearLimit ? 'text-amber-700 font-semibold' : 'text-slate-600'}`}>
                          {formatSARCompact(user.monthlyVolume)} / {formatSARCompact(user.monthlyLimit)}
                        </span>
                        <div className="w-24 h-1 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              utilizationPct > 90 ? 'bg-red-500' : utilizationPct > 75 ? 'bg-amber-400' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, utilizationPct)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Variance exceptions + inject button */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Ledger vs Bank Variances
            {openVariances.length > 0 && (
              <span className="ml-2 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-xs">
                {openVariances.length} open
              </span>
            )}
          </p>
          <button
            onClick={onInjectVariance}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded hover:bg-slate-100 hover:border-slate-300 transition-colors text-slate-700"
          >
            <Zap size={12} />
            Inject Test Variance
          </button>
        </div>

        {variances.length === 0 ? (
          <div className="border border-slate-200 rounded-lg p-6 text-center text-sm text-slate-400">
            No variances detected. Click "Inject Test Variance" to simulate an exception.
          </div>
        ) : (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">ID</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 hidden sm:table-cell">Type</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 hidden md:table-cell">Expected</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 hidden md:table-cell">Actual</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Variance</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Status</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {variances.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{v.id}</td>
                    <td className="px-4 py-3 text-xs text-slate-700 hidden sm:table-cell">{varianceTypeLabel(v.type)}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-slate-600 hidden md:table-cell">
                      {formatSAR(v.expectedAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-slate-600 hidden md:table-cell">
                      {formatSAR(v.actualAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-sm font-semibold text-red-600">
                      {formatSAR(v.variance)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        v.status === 'resolved' ? 'text-emerald-700 bg-emerald-50' :
                        v.status === 'investigating' ? 'text-amber-700 bg-amber-50' :
                        'text-red-600 bg-red-50'
                      }`}>
                        {v.status === 'resolved' ? 'Resolved' : v.status === 'investigating' ? 'Investigating' : 'Open'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {v.status !== 'resolved' && (
                        <button
                          onClick={() => onResolveVariance(v.id)}
                          className="text-xs text-slate-500 hover:text-slate-900 underline underline-offset-2"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function FloatCard({ label, value, sub, color }: {
  label: string; value: string; sub: string; color?: 'emerald' | 'red'
}) {
  const valueClass =
    color === 'emerald' ? 'text-emerald-700' :
    color === 'red' ? 'text-red-600' :
    'text-slate-900'

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">{label}</p>
      <p className={`text-xl font-bold tabular-nums font-mono leading-tight ${valueClass}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  )
}
