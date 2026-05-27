import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download } from 'lucide-react'
import Nav from '../components/common/Nav'
import InputForm from '../components/settlement/InputForm'
import SummaryCards from '../components/settlement/SummaryCards'
import FeeBreakdown from '../components/settlement/FeeBreakdown'
import SettlementTimeline from '../components/settlement/SettlementTimeline'
import { calculateSettlement, formatAmount } from '../utils/settlementLogic'
import { SETTLEMENT_PRESETS, DEFAULT_INPUTS } from '../data/settlementPresets'
import type { SettlementInputs, PresetId } from '../types/settlement'

export default function Settlement() {
  const [inputs, setInputs] = useState<SettlementInputs>(DEFAULT_INPUTS)
  const [activePreset, setActivePreset] = useState<PresetId>('megaevent-fnb')

  const result = useMemo(() => calculateSettlement(inputs), [inputs])

  function handlePreset(id: PresetId) {
    setActivePreset(id)
    if (id !== 'custom') {
      const preset = SETTLEMENT_PRESETS.find(p => p.id === id)
      if (preset) setInputs(preset.inputs)
    }
  }

  function handleInputChange(next: SettlementInputs) {
    setActivePreset('custom')
    setInputs(next)
  }

  function handleDownload() {
    const lines = [
      '# Merchant Settlement Report',
      `Generated: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Riyadh' })} (AST)`,
      '',
      '## Inputs',
      `Daily transactions: ${inputs.dailyVolume.toLocaleString()}`,
      `Avg ticket size: ${formatAmount(inputs.avgTicketSize, inputs.currency)}`,
      `Merchant category: ${inputs.merchantCategory}`,
      `Currency: ${inputs.currency}`,
      `Payment mix: mada ${inputs.paymentMix.mada}% / Visa ${inputs.paymentMix.visa}% / Wallet ${inputs.paymentMix.wallet}% / COD ${inputs.paymentMix.cod}%`,
      `Settlement timing: ${inputs.settlementTiming}`,
      `Platform commission: ${inputs.platformCommission}%`,
      'VAT: 15% modeled separately on taxable PSP/platform fees',
      '',
      '## Results',
      `Gross GMV: ${formatAmount(result.grossGMV, inputs.currency)}`,
      `Total fees: ${formatAmount(result.totalFees, inputs.currency)} (${result.effectiveRate.toFixed(2)}%)`,
      `Net payout: ${formatAmount(result.netPayout, inputs.currency)}`,
      `Settlement: ${result.settlementDate}`,
      ...(result.floatCost > 0 ? [`Float cost: ${formatAmount(result.floatCost, inputs.currency)}/day`] : []),
      '',
      '## Fee breakdown',
      ...result.lineItems.map(item =>
        `${item.label}: ${formatAmount(item.amount, inputs.currency)} (${item.pct.toFixed(2)}%)`
      ),
      '',
      '* Assumes mada domestic transactions. Visa and Mastercard rates vary by card type (consumer vs. commercial).',
      '* VAT is modeled on taxable processing/platform fees; merchant recoverability depends on VAT status.',
      '* Cross-border settlements add 1.5-3% FX spread depending on corridor.',
      '* Float cost assumes 5% annual cost of capital.',
    ]

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `settlement-${inputs.currency}-${inputs.merchantCategory}-${inputs.settlementTiming.replace('+', '')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link to="/" className="hover:text-slate-900 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-900">Merchant Settlement Calculator</span>
        </div>

        {/* Page header */}
        <div className="mb-8 pb-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Merchant Settlement Calculator
            </h1>
            <p className="text-base text-slate-600 max-w-2xl">
              At 8,000 food delivery merchants, one day of T+2 float is roughly SAR 4.2M held by the platform. Model T+0 vs. T+2, MDR waterfall, and per-transaction economics for any merchant category.
            </p>
          </div>
          <button
            onClick={handleDownload}
            aria-label="Export settlement report"
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded text-sm text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors whitespace-nowrap flex-shrink-0"
          >
            <Download size={14} />
            Export report
          </button>
        </div>

        {/* Main layout: 2/5 form + 3/5 results */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Left: inputs */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <InputForm
                inputs={inputs}
                activePreset={activePreset}
                onChange={handleInputChange}
                onPreset={handlePreset}
              />
            </div>
          </div>

          {/* Right: results */}
          <div className="lg:col-span-3 space-y-6">

            {/* Summary metrics */}
            <SummaryCards result={result} currency={inputs.currency} />

            {/* Fee breakdown + timeline in a 2-col sub-grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-white border border-slate-200 rounded-lg p-5">
                <FeeBreakdown result={result} currency={inputs.currency} />
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-5">
                <SettlementTimeline result={result} currency={inputs.currency} />
              </div>
            </div>

            {/* Footnote */}
            <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-200 pt-4">
              * Fees include a separate 15% VAT estimate on taxable PSP/platform fees. VAT recoverability depends on merchant status. Assumes mada domestic transactions. Visa and Mastercard rates vary by card type. Cross-border settlements add 1.5-3% FX spread depending on corridor. mada e-commerce economics are modeled separately from international card rails. Instant payout premium of 0.5% applies when T+0 is selected.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
