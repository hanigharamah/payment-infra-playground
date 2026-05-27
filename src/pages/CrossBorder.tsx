import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, RotateCcw } from 'lucide-react'
import Nav from '../components/common/Nav'
import { CROSS_BORDER_PRESETS } from '../data/crossBorderPresets'
import {
  compareCrossBorder,
  currencyLabel,
  formatCurrency,
  formatUsd,
  purposeLabel,
} from '../utils/crossBorderLogic'
import type {
  CrossBorderPreset,
  CurrencyCode,
  PaymentCorridor,
  PaymentMethod,
} from '../types/crossBorder'

const SECTION_LABEL = 'text-xs font-semibold uppercase tracking-wider text-slate-500'

const SEND_CURRENCIES: CurrencyCode[] = ['SAR', 'USD', 'EUR', 'AED', 'CNY', 'GBP', 'INR', 'EGP', 'JOD']
const RECEIVE_CURRENCIES: CurrencyCode[] = ['PKR', 'SAR', 'USD', 'EUR', 'GBP', 'AED', 'INR', 'BDT', 'EGP', 'JOD']
const PURPOSES: PaymentCorridor['purpose'][] = ['tourist', 'remittance', 'merchant_settlement', 'b2b']

export default function CrossBorder() {
  const [corridor, setCorridor] = useState<PaymentCorridor>(CROSS_BORDER_PRESETS[0].corridor)
  const [activePreset, setActivePreset] = useState(CROSS_BORDER_PRESETS[0].id)
  const validationError = corridor.amount < 100 || corridor.amount > 100000
    ? 'Amount must be between 100 and 100,000.'
    : null
  const safeCorridor = validationError ? { ...corridor, amount: Math.min(100000, Math.max(100, corridor.amount || 100)) } : corridor
  const comparison = useMemo(() => compareCrossBorder(safeCorridor), [safeCorridor])
  const selectedPreset = CROSS_BORDER_PRESETS.find((preset) => preset.id === activePreset)

  function loadPreset(preset: CrossBorderPreset) {
    setActivePreset(preset.id)
    setCorridor(preset.corridor)
  }

  function updateCorridor(next: Partial<PaymentCorridor>) {
    setActivePreset('custom')
    setCorridor((prev) => ({ ...prev, ...next }))
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link to="/" className="hover:text-slate-900 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-900">Cross-Border Payment Visualizer</span>
        </div>

        <div className="mb-8 pb-6 border-b border-slate-200">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Cross-Border Payment Visualizer
          </h1>
          <p className="text-base text-slate-600 max-w-2xl">
            Compare correspondent banking, stablecoin rails, AFAQ-style GCC routing, and Buna network flows for the same international payment corridor.
          </p>
        </div>

        <section className="bg-white border border-slate-200 rounded-lg p-6 mb-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-slate-900">Payment Corridor</h2>
            <button
              onClick={() => loadPreset(CROSS_BORDER_PRESETS[0])}
              aria-label="Reset cross-border corridor to default preset"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              <RotateCcw size={13} />
              Reset
            </button>
          </div>

          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {CROSS_BORDER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => loadPreset(preset)}
                aria-pressed={activePreset === preset.id}
                className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap border transition-colors ${
                  activePreset === preset.id
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
            <SelectField
              label="Send Currency"
              value={corridor.sendCurrency}
              onChange={(value) => updateCorridor({ sendCurrency: value as CurrencyCode })}
              options={SEND_CURRENCIES.map((currency) => ({ value: currency, label: currencyLabel(currency) }))}
            />
            <SelectField
              label="Receive Currency"
              value={corridor.receiveCurrency}
              onChange={(value) => updateCorridor({ receiveCurrency: value as CurrencyCode })}
              options={RECEIVE_CURRENCIES.map((currency) => ({ value: currency, label: currencyLabel(currency) }))}
            />
            <div>
              <label className={`block mb-2 ${SECTION_LABEL}`}>Amount</label>
              <input
                type="number"
                min={100}
                max={100000}
                value={corridor.amount}
                onChange={(event) => updateCorridor({ amount: Number(event.target.value) })}
                aria-invalid={Boolean(validationError)}
                aria-describedby={validationError ? 'cross-border-amount-error' : undefined}
                className={`w-full px-4 py-2.5 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono tabular-nums ${
                  validationError ? 'border-red-300' : 'border-slate-300'
                }`}
              />
              {validationError && (
                <p id="cross-border-amount-error" className="text-xs text-red-600 mt-1">
                  {validationError}
                </p>
              )}
            </div>
            <SelectField
              label="Purpose"
              value={corridor.purpose}
              onChange={(value) => updateCorridor({ purpose: value as PaymentCorridor['purpose'] })}
              options={PURPOSES.map((purpose) => ({ value: purpose, label: purposeLabel(purpose) }))}
            />
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            {selectedPreset?.useCase ?? 'Custom corridor. Results update as currency, amount, and purpose change.'}
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
          {comparison.methods.map((method) => (
            <MethodCard
              key={method.type}
              method={method}
              corridor={safeCorridor}
              isBest={method.type === comparison.bestValue}
            />
          ))}
        </section>

        <section className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
          <h3 className="font-bold text-slate-900 mb-4">Side-by-Side Comparison</h3>
          <div className="overflow-x-auto">
          <ComparisonTable methods={comparison.methods} corridor={safeCorridor} />
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {comparison.methods.map((method) => (
            <ComplianceCard key={method.type} method={method} />
          ))}
        </section>

        <p className="text-xs text-slate-400 mt-6 leading-relaxed border-t border-slate-200 pt-4">
          * Exchange rates are illustrative and fixed for modeling. SAR/USD reflects the official peg (3.75). Other rates are approximate. Stablecoin rails require regulated on-ramp and off-ramp partners; availability and licensing vary by jurisdiction.
        </p>
      </div>
    </div>
  )
}

function MethodCard({
  method,
  corridor,
  isBest,
}: {
  method: PaymentMethod
  corridor: PaymentCorridor
  isBest: boolean
}) {
  return (
    <div className={`bg-white border rounded-lg overflow-hidden ${isBest ? 'border-emerald-500 ring-2 ring-emerald-500' : 'border-slate-200'}`}>
      {isBest && method.available && (
        <div className="bg-emerald-50 px-6 py-2 border-b border-emerald-200 flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full" />
          <span className="text-xs font-semibold text-emerald-700">BEST VALUE</span>
        </div>
      )}

      <div className="bg-slate-100 px-6 py-4 border-b border-slate-200">
        <h3 className="font-bold text-slate-900">{method.name}</h3>
        <p className="text-xs text-slate-600 mt-1">{method.description}</p>
      </div>

      <div className="p-6 space-y-6">
        <FlowDiagram method={method} />
        {method.available ? (
          <>
            <CostBreakdown method={method} />
            <Timeline method={method} />
            <RecipientAmount method={method} corridor={corridor} />
          </>
        ) : (
          <div className="py-12 text-center border border-slate-200 rounded-lg bg-slate-50">
            <p className="text-sm text-slate-700">Not available for this corridor</p>
            <p className="text-xs text-slate-500 mt-2">{method.unavailableReason}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function FlowDiagram({ method }: { method: PaymentMethod }) {
  return (
    <div>
      <p className={`${SECTION_LABEL} mb-3`}>Flow</p>
      <div className="space-y-2 text-sm">
        {method.flowSteps.map((step, index) => (
          <div key={`${method.type}-${step}`}>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 border rounded flex items-center justify-center text-xs font-bold ${
                index === method.flowSteps.length - 1 && method.available
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-slate-100 border-slate-300 text-slate-700'
              }`}
              >
                {index + 1}
              </div>
              <span className="text-slate-700">{step}</span>
            </div>
            {index < method.flowSteps.length - 1 && (
              <div className="flex justify-center py-1">
                <ArrowDown className="w-4 h-4 text-slate-400" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function CostBreakdown({ method }: { method: PaymentMethod }) {
  if (method.type === 'stablecoin') {
    return (
      <CostBlock
        rows={[
          ['On-ramp / liquidity', formatUsd(method.fees.sendingFee)],
          ['Blockchain network fee', formatUsd(method.fees.intermediaryFees[0] ?? 0)],
          ['Off-ramp / payout', formatUsd(method.fees.receivingFee)],
          ['FX and spread estimate', `${method.fees.fxSpread.toFixed(1)}%`],
        ]}
        total={method.fees.total}
        totalPct={method.fees.totalPct}
      />
    )
  }

  if (method.type === 'local_network') {
    return (
      <CostBlock
      rows={[
        ['Network fee', formatUsd(method.fees.sendingFee)],
        ['FX and spread estimate', `${method.fees.fxSpread.toFixed(1)}%`],
        ]}
        total={method.fees.total}
        totalPct={method.fees.totalPct}
      />
    )
  }

  if (method.type === 'buna') {
    return (
      <CostBlock
        rows={[
          ['Participant bank fee', formatUsd(method.fees.sendingFee)],
          ['Buna processing fee', formatUsd(method.fees.intermediaryFees.reduce((sum, fee) => sum + fee, 0))],
          ['Receiving bank fee', formatUsd(method.fees.receivingFee)],
          ['FX and spread estimate', `${method.fees.fxSpread.toFixed(1)}%`],
        ]}
        total={method.fees.total}
        totalPct={method.fees.totalPct}
      />
    )
  }

  return (
    <CostBlock
      rows={[
        ['Sending bank fee', formatUsd(method.fees.sendingFee)],
        ['Correspondent fees', formatUsd(method.fees.intermediaryFees.reduce((sum, fee) => sum + fee, 0))],
        ['Receiving bank fee', formatUsd(method.fees.receivingFee)],
        ['FX and bank spread', `${method.fees.fxSpread.toFixed(1)}%`],
      ]}
      total={method.fees.total}
      totalPct={method.fees.totalPct}
    />
  )
}

function CostBlock({
  rows,
  total,
  totalPct,
}: {
  rows: [string, string][]
  total: number
  totalPct: number
}) {
  return (
    <div>
      <p className={`${SECTION_LABEL} mb-3`}>Costs</p>
      <div className="space-y-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <span className="text-slate-600">{label}</span>
            <span className="font-mono tabular-nums font-semibold text-slate-900 text-right">{value}</span>
          </div>
        ))}
        <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between gap-4">
          <span className="font-semibold text-slate-900">Total fees</span>
          <span className="font-mono tabular-nums font-bold text-slate-900 text-right">
            {formatUsd(total)} ({totalPct.toFixed(1)}%)
          </span>
        </div>
      </div>
    </div>
  )
}

function Timeline({ method }: { method: PaymentMethod }) {
  return (
    <div>
      <p className={`${SECTION_LABEL} mb-3`}>Speed</p>
      <div className="bg-slate-50 border border-slate-200 rounded p-3">
        <p className="text-sm font-semibold text-slate-900">{method.timeline}</p>
        <p className="text-xs text-slate-600 mt-1">
          {method.type === 'correspondent_banking'
            ? 'Depends on bank processing, cutoffs, and time zones'
            : method.type === 'stablecoin'
              ? 'Depends on exchange processing and on-chain confirmation'
              : 'Depends on participating bank and network availability'}
        </p>
      </div>
    </div>
  )
}

function RecipientAmount({
  method,
  corridor,
}: {
  method: PaymentMethod
  corridor: PaymentCorridor
}) {
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-2">Recipient Gets</p>
      <p className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
        {formatCurrency(method.finalAmount, corridor.receiveCurrency)}
      </p>
      <p className="text-xs text-emerald-600 mt-1">After fees and FX conversion</p>
    </div>
  )
}

function ComparisonTable({
  methods,
  corridor,
}: {
  methods: PaymentMethod[]
  corridor: PaymentCorridor
}) {
  const rows = [
    ['Total Cost', (method: PaymentMethod) => method.available ? `${formatUsd(method.fees.total)} (${method.fees.totalPct.toFixed(1)}%)` : 'N/A'],
    ['Recipient Gets', (method: PaymentMethod) => method.available ? formatCurrency(method.finalAmount, corridor.receiveCurrency) : 'N/A'],
    ['Speed', (method: PaymentMethod) => method.timeline],
    ['Transparency', (method: PaymentMethod) => method.transparency],
    ['Availability', (method: PaymentMethod) => method.availability],
    ['Regulatory Risk', (method: PaymentMethod) => method.risk],
    ['Min/Max Amount', (method: PaymentMethod) => method.limits],
    ['Best For', (method: PaymentMethod) => method.bestFor],
  ] as const

  return (
    <table className="w-full min-w-[820px] text-sm">
      <thead>
        <tr className="border-b-2 border-slate-300">
          <th className="text-left py-3 px-3 text-slate-600 font-semibold">Metric</th>
          {methods.map((method) => (
            <th key={method.type} className="text-center py-3 px-3 text-slate-600 font-semibold">
              {method.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} className="border-b border-slate-100 hover:bg-slate-50">
            <td className="py-3 px-3 text-slate-700 font-semibold">{label}</td>
            {methods.map((method) => (
              <td key={`${label}-${method.type}`} className="text-center py-3 px-3 text-slate-700">
                <span className={label === 'Total Cost' || label === 'Recipient Gets' ? 'font-mono tabular-nums font-semibold' : ''}>
                  {value(method)}
                </span>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ComplianceCard({ method }: { method: PaymentMethod }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <h3 className="font-bold text-slate-900 mb-4">{method.name}: Compliance Steps</h3>
      <div className="space-y-3">
        {method.regulatorySteps.map((step, index) => (
          <div key={`${method.type}-${step.label}`} className="flex gap-3">
            <div className={`flex-shrink-0 w-6 h-6 border rounded-full flex items-center justify-center text-xs font-bold ${
              index === method.regulatorySteps.length - 1 && method.available
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-slate-100 border-slate-300 text-slate-700'
            }`}
            >
              {index + 1}
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">{step.label}</p>
              <p className="text-xs text-slate-600 mt-1">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-4">
        Timeline: {method.timeline}
      </p>
    </div>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className={`block mb-2 ${SECTION_LABEL}`}>{label}</label>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  )
}
