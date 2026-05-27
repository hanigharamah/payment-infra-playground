import { Check, X } from 'lucide-react'
import type { PendingApproval, ApprovalDecisions } from '../../types/walletOps'
import { TX_TYPE_LABELS, formatSAR, formatRelative, riskColor } from '../../utils/walletOpsLogic'

interface Props {
  approvals: PendingApproval[]
  decisions: ApprovalDecisions
  onApprove: (id: string) => void
  onReject: (id: string) => void
}

export default function ApprovalsTab({ approvals, decisions, onApprove, onReject }: Props) {
  const total = decisions.approved + decisions.rejected + approvals.length
  const approvalRate = total > approvals.length
    ? ((decisions.approved / (decisions.approved + decisions.rejected)) * 100).toFixed(0)
    : null

  return (
    <div className="space-y-6">

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Pending" value={String(approvals.length)} sub="require action" color={approvals.length > 0 ? 'amber' : 'slate'} />
        <StatCard label="Approved Today" value={String(decisions.approved)} sub="this session" color="emerald" />
        <StatCard label="Rejected Today" value={String(decisions.rejected)} sub="this session" color="red" />
        <StatCard label="Approval Rate" value={approvalRate ? `${approvalRate}%` : '—'} sub="session total" />
      </div>

      {/* Queue */}
      {approvals.length === 0 ? (
        <div className="border border-slate-200 rounded-lg p-8 text-center">
          <Check size={20} className="text-emerald-500 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">Queue clear</p>
          <p className="text-xs text-slate-400 mt-1">
            All transactions are within auto-approve thresholds. New high-value transactions will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Pending Queue ({approvals.length})
          </p>
          {approvals.map(apr => (
            <ApprovalCard
              key={apr.id}
              approval={apr}
              onApprove={() => onApprove(apr.id)}
              onReject={() => onReject(apr.id)}
            />
          ))}
        </div>
      )}

      {/* Approval rules legend */}
      <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Auto-Approve Rules</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <RuleRow label="P2P Transfer" threshold="SAR 5,000" />
          <RuleRow label="Driver Payout" threshold="SAR 10,000" />
          <RuleRow label="Merchant Settlement" threshold="SAR 12,000" />
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Transactions above these thresholds are held for manual review. High-risk scores trigger review at any amount.
        </p>
      </div>
    </div>
  )
}

function ApprovalCard({ approval, onApprove, onReject }: {
  approval: PendingApproval
  onApprove: () => void
  onReject: () => void
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-mono text-xs text-slate-400">{approval.id}</span>
            <span className="font-mono text-xs text-slate-300">·</span>
            <span className="text-xs text-slate-500">{TX_TYPE_LABELS[approval.txType]}</span>
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${riskColor(approval.riskScore)}`}>
              {approval.riskScore} risk
            </span>
          </div>

          {/* Detail grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5">
            <Detail label="From" value={approval.fromUser} />
            <Detail label="To" value={approval.toUser} />
            <Detail label="Amount" value={formatSAR(approval.amount)} mono />
            <Detail label="Submitted" value={formatRelative(approval.submittedAt)} />
          </div>

          <p className="mt-2 text-xs text-slate-500">
            <span className="font-medium">Hold reason:</span> {approval.reason}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onReject}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-red-200 text-red-700 rounded hover:bg-red-50 transition-colors"
          >
            <X size={12} />
            Reject
          </button>
          <button
            onClick={onApprove}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded hover:bg-slate-700 transition-colors"
          >
            <Check size={12} />
            Approve
          </button>
        </div>
      </div>
    </div>
  )
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-xs font-medium text-slate-800 mt-0.5 ${mono ? 'font-mono tabular-nums' : ''}`}>{value}</p>
    </div>
  )
}

function RuleRow({ label, threshold }: { label: string; threshold: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-600">{label}</span>
      <span className="font-mono text-slate-900 font-medium">&gt; {threshold}</span>
    </div>
  )
}

function StatCard({ label, value, sub, color }: {
  label: string; value: string; sub: string
  color?: 'emerald' | 'red' | 'amber' | 'slate'
}) {
  const valueClass =
    color === 'emerald' ? 'text-emerald-700' :
    color === 'red' ? 'text-red-600' :
    color === 'amber' ? 'text-amber-700' :
    'text-slate-900'

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">{label}</p>
      <p className={`text-xl font-bold tabular-nums leading-tight ${valueClass}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  )
}
