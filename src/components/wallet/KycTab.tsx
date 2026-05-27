import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import type { WalletUser, BlockedTx } from '../../types/walletOps'
import { formatSAR, formatSARCompact, formatRelative, TIER_LIMITS } from '../../utils/walletOpsLogic'

interface Props {
  users: WalletUser[]
  blockedTxs: BlockedTx[]
}

const TIER_INFO = {
  1: { label: 'Tier 1 — Basic', limit: TIER_LIMITS[1], color: 'text-amber-700 bg-amber-50', desc: 'ID + selfie verified. SAR 5,000/month.' },
  2: { label: 'Tier 2 — Verified', limit: TIER_LIMITS[2], color: 'text-slate-700 bg-slate-100', desc: 'Full KYC. SAR 20,000/month.' },
  3: { label: 'Tier 3 — Enhanced', limit: TIER_LIMITS[3], color: 'text-emerald-700 bg-emerald-50', desc: 'Business / high-value. SAR 200,000/month.' },
}

export default function KycTab({ users, blockedTxs }: Props) {
  const tier1 = users.filter(u => u.kycTier === 1)
  const tier2 = users.filter(u => u.kycTier === 2)
  const tier3 = users.filter(u => u.kycTier === 3)

  const nearLimit = users.filter(u => {
    const limit = TIER_LIMITS[u.kycTier]
    return (u.monthlyVolume / limit) > 0.85
  })

  return (
    <div className="space-y-6">

      {/* Tier distribution */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {([1, 2, 3] as const).map(tier => {
          const group = tier === 1 ? tier1 : tier === 2 ? tier2 : tier3
          const info = TIER_INFO[tier]
          return (
            <div key={tier} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${info.color}`}>
                  {info.label}
                </span>
                <span className="text-xl font-bold tabular-nums text-slate-900">{group.length}</span>
              </div>
              <p className="text-xs text-slate-500 mb-2">{info.desc}</p>
              <p className="text-xs font-mono text-slate-400">
                Limit: {formatSARCompact(info.limit)}/month
              </p>
            </div>
          )
        })}
      </div>

      {/* Near-limit warning */}
      {nearLimit.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                {nearLimit.length} user{nearLimit.length > 1 ? 's' : ''} approaching monthly limit
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                {nearLimit.map(u => u.shortName).join(', ')} {nearLimit.length > 1 ? 'are' : 'is'} above 85% of their tier limit. Transactions will be blocked when the limit is reached.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* User KYC detail table */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">User KYC Status</p>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">User</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 hidden sm:table-cell">Type</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500">KYC Tier</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Monthly Usage</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 hidden md:table-cell">Remaining</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 hidden lg:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(user => {
                const limit = TIER_LIMITS[user.kycTier]
                const utilizationPct = Math.min(100, (user.monthlyVolume / limit) * 100)
                const remaining = Math.max(0, limit - user.monthlyVolume)
                const isNear = utilizationPct > 85
                const isMax = utilizationPct >= 100

                return (
                  <tr key={user.id} className={`hover:bg-slate-50 ${isMax ? 'bg-red-50/30' : isNear ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                          {user.avatarInitials}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 text-sm">{user.name}</div>
                          <div className="font-mono text-xs text-slate-400">{user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="capitalize text-xs text-slate-600">{user.type}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${TIER_INFO[user.kycTier].color}`}>
                        Tier {user.kycTier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className={`font-mono text-xs tabular-nums ${isMax ? 'text-red-600 font-semibold' : isNear ? 'text-amber-700 font-semibold' : 'text-slate-600'}`}>
                          {formatSARCompact(user.monthlyVolume)} / {formatSARCompact(limit)}
                        </span>
                        <div className="w-24 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isMax ? 'bg-red-500' : isNear ? 'bg-amber-400' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${utilizationPct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs tabular-nums hidden md:table-cell">
                      {isMax
                        ? <span className="text-red-600 font-semibold flex items-center justify-end gap-1"><XCircle size={12} /> Limit reached</span>
                        : <span className="text-slate-600">{formatSAR(remaining)}</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 hidden lg:table-cell">
                      {user.joinedMonthsAgo === 0
                        ? 'This month'
                        : `${user.joinedMonthsAgo}mo ago`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Blocked transactions */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          KYC-Blocked Transactions
          {blockedTxs.length > 0 && (
            <span className="ml-2 text-red-600 bg-red-50 px-1.5 py-0.5 rounded text-xs">
              {blockedTxs.length}
            </span>
          )}
        </p>

        {blockedTxs.length === 0 ? (
          <div className="border border-slate-200 rounded-lg p-6 text-center">
            <CheckCircle size={18} className="text-emerald-500 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No blocked transactions</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">User</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Attempted</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 hidden sm:table-cell">Reason</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Status</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 hidden md:table-cell">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {blockedTxs.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50 bg-red-50/20">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{b.userName}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-sm text-red-600">
                      {formatSAR(b.attemptedAmount)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 hidden sm:table-cell max-w-xs">
                      {b.reason}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        b.status === 'rejected' ? 'text-red-600 bg-red-50' :
                        b.status === 'upgrade_pending' ? 'text-amber-700 bg-amber-50' :
                        'text-slate-700 bg-slate-100'
                      }`}>
                        {b.status === 'rejected' ? 'Rejected' :
                         b.status === 'upgrade_pending' ? 'Upgrade Pending' : 'Notified'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-400 hidden md:table-cell">
                      {formatRelative(b.time)}
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
