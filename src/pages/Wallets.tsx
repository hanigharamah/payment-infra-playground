import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RotateCcw, WalletCards } from 'lucide-react'
import Nav from '../components/common/Nav'
import { DEFAULT_WALLET_INPUTS, WALLET_PRESETS } from '../data/walletPresets'
import { calculateWallet, formatCount, formatSar } from '../utils/walletLogic'
import type { WalletInputs, WalletMode, WalletPresetId } from '../types/wallet'

const SECTION_LABEL = 'text-xs font-semibold uppercase tracking-wider text-slate-500'

export default function Wallets() {
  const [inputs, setInputs] = useState<WalletInputs>(DEFAULT_WALLET_INPUTS)
  const [activePreset, setActivePreset] = useState<WalletPresetId>('expo-cashless')
  const result = useMemo(() => calculateWallet(inputs), [inputs])

  function setMode(mode: WalletMode) {
    const preset = WALLET_PRESETS.find((item) => item.inputs.mode === mode)
    if (!preset) return
    setActivePreset(preset.id)
    setInputs(preset.inputs)
  }

  function setPreset(id: WalletPresetId) {
    const preset = WALLET_PRESETS.find((item) => item.id === id)
    if (!preset) return
    setActivePreset(id)
    setInputs(preset.inputs)
  }

  function setSlider<K extends keyof WalletInputs>(key: K, value: number) {
    setActivePreset(activePreset)
    setInputs((prev) => ({ ...prev, [key]: value as WalletInputs[K] }))
  }

  function setWalletModel(model: WalletInputs['walletModel']) {
    const mixByModel = {
      hybrid: { storedBalanceShare: 40, tokenizedCardShare: 40 },
      'stored-value': { storedBalanceShare: 70, tokenizedCardShare: 10 },
      'tokenized-card': { storedBalanceShare: 10, tokenizedCardShare: 75 },
    }
    setInputs((prev) => ({
      ...prev,
      walletModel: model,
      ...mixByModel[model],
    }))
  }

  const modeLabel = inputs.mode === 'event' ? 'Event wallet' : 'Super-app wallet'
  const holdLabel = inputs.mode === 'event' ? 'Refund review backlog' : 'Payout holds'
  const timeSavedLabel = inputs.mode === 'event' ? 'Queue minutes saved' : 'Checkout minutes saved'

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link to="/" className="hover:text-slate-900 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-900">Digital Wallet Simulator</span>
        </div>

        <div className="mb-8 pb-6 border-b border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Digital Wallet Simulator</h1>
            <p className="text-base text-slate-600 max-w-2xl">
              Compare Expo-style cashless wallets against super-app wallets for adoption, payment success, fee cost, operational load, and settlement risk.
            </p>
          </div>
          <div className="lg:col-span-5 flex items-end justify-start lg:justify-end">
            <div className="inline-flex border border-slate-300 rounded-lg bg-white p-1" role="tablist" aria-label="Wallet simulator mode">
              {(['event', 'super-app'] as WalletMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setMode(mode)}
                  role="tab"
                  aria-selected={inputs.mode === mode}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                    inputs.mode === mode
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {mode === 'event' ? 'Event' : 'Super-App'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <aside className="lg:col-span-4 space-y-6">
            <section>
              <p className={`${SECTION_LABEL} mb-4`}>Scenario</p>
              <div className="space-y-2">
                {WALLET_PRESETS.filter((preset) => preset.inputs.mode === inputs.mode).map((preset) => (
                  <button
                    key={preset.id}
                  onClick={() => setPreset(preset.id)}
                    aria-pressed={activePreset === preset.id}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                      activePreset === preset.id
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <span className="block text-sm font-semibold">{preset.label}</span>
                    <span className={`block text-xs leading-snug mt-1 ${activePreset === preset.id ? 'text-slate-300' : 'text-slate-500'}`}>
                      {preset.description}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-5">
                <p className={SECTION_LABEL}>Inputs</p>
                <button
                  onClick={() => setPreset(activePreset)}
                  aria-label="Reset wallet inputs to active preset"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
                >
                  <RotateCcw size={13} />
                  Reset
                </button>
              </div>

              <div className="space-y-5">
                <SelectRow
                  label="Wallet model"
                  value={inputs.walletModel}
                  onChange={(value) => setWalletModel(value as WalletInputs['walletModel'])}
                  options={[
                    { value: 'hybrid', label: 'Hybrid' },
                    { value: 'stored-value', label: 'Stored value' },
                    { value: 'tokenized-card', label: 'Tokenized card' },
                  ]}
                />
                <Slider label="Daily transactions" value={inputs.dailyTransactions} min={10000} max={500000} step={5000} onChange={(value) => setSlider('dailyTransactions', value)} />
                <Slider label="Avg value" value={inputs.avgTransactionValue} min={10} max={150} step={1} suffix=" SAR" onChange={(value) => setSlider('avgTransactionValue', value)} />
                <Slider label="Wallet adoption" value={inputs.walletAdoption} min={10} max={90} step={1} suffix="%" onChange={(value) => setSlider('walletAdoption', value)} />
                <Slider label="Stored balance share" value={inputs.storedBalanceShare} min={0} max={90} step={1} suffix="%" onChange={(value) => setSlider('storedBalanceShare', value)} />
                <Slider label="Tokenized card share" value={inputs.tokenizedCardShare} min={0} max={90} step={1} suffix="%" onChange={(value) => setSlider('tokenizedCardShare', value)} />
                <Slider label="Fallback coverage" value={inputs.fallbackCoverage} min={40} max={100} step={1} suffix="%" onChange={(value) => setSlider('fallbackCoverage', value)} />
                {inputs.mode === 'event' ? (
                  <Slider label="Offline POS share" value={inputs.offlinePosShare} min={0} max={35} step={1} suffix="%" onChange={(value) => setSlider('offlinePosShare', value)} />
                ) : (
                  <Slider label="Instant payout share" value={inputs.instantPayoutShare} min={0} max={80} step={1} suffix="%" onChange={(value) => setSlider('instantPayoutShare', value)} />
                )}
                <Slider label="Refund rate" value={inputs.refundRate} min={0} max={10} step={0.1} suffix="%" onChange={(value) => setSlider('refundRate', value)} />
                <Slider label="Risk hold rate" value={inputs.riskHoldRate} min={0} max={8} step={0.1} suffix="%" onChange={(value) => setSlider('riskHoldRate', value)} />
              </div>
            </section>
          </aside>

          <main className="lg:col-span-8 space-y-6">
            <section>
              <div className="flex items-center justify-between mb-4">
                <p className={SECTION_LABEL}>Operating Snapshot</p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <WalletCards size={14} />
                  <span>{modeLabel}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <Metric label="Wallet txns" value={formatCount(result.walletTransactions)} sub="per day" />
                <Metric label="Success rate" value={`${result.successRate.toFixed(1)}%`} sub="expected approval" />
                <Metric label="P95 latency" value={`${formatCount(result.p95LatencyMs)} ms`} sub="payment path" />
                <Metric label="Fee savings" value={formatSar(result.savingsVsOpenCard)} sub="vs open-card only" />
              </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-5 gap-6">
              <div className="xl:col-span-3 bg-white border border-slate-200 rounded-lg p-5">
                <p className={`${SECTION_LABEL} mb-4`}>Rail Mix</p>
                <div className="space-y-4">
                  {result.railItems.map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-slate-700">{item.label}</span>
                        <span className="font-mono tabular-nums text-xs text-slate-500">{item.share.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${item.share}%` }} />
                      </div>
                      <div className="flex items-center justify-between mt-1 text-xs text-slate-400">
                        <span className="font-mono tabular-nums">{formatCount(Math.round(item.volume))} txns</span>
                        <span className="font-mono tabular-nums">{item.feeRate.toFixed(2)}% · {formatCount(item.latencyMs)} ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="xl:col-span-2 space-y-3">
                <Metric label={timeSavedLabel} value={formatCount(result.queueMinutesSaved)} sub="daily operational time" />
                <Metric label="Support load" value={`${result.supportTicketsPer10k.toFixed(1)}`} sub="tickets per 10k txns" />
                <Metric label="Reconciliation breaks" value={formatCount(result.reconciliationBreaks)} sub="estimated daily cases" />
              </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-lg p-5">
                <p className={`${SECTION_LABEL} mb-4`}>Risk Queue</p>
                <div className="flex items-end justify-between border-b border-slate-200 pb-4 mb-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{holdLabel}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Driven by refund pressure, payout eligibility, and configured risk holds.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono tabular-nums text-2xl font-bold text-slate-900">{formatCount(result.heldTransactions)}</p>
                    <p className="font-mono tabular-nums text-xs text-slate-500">{formatSar(result.heldAmount)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <SmallStat label="Wallet GMV" value={formatSar(result.walletGMV)} />
                  <SmallStat label="Fee cost" value={formatSar(result.netFeeCost)} />
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-5">
                <p className={`${SECTION_LABEL} mb-4`}>Sample Event</p>
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono tabular-nums text-xs text-slate-500">{result.sampleId}</span>
                    <span className="font-mono tabular-nums text-xs text-slate-500">{result.sampleTime}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">{inputs.walletModel.replace('-', ' ')}</span>
                    <span className="font-mono tabular-nums text-sm font-semibold text-slate-900">
                      {formatSar(inputs.avgTransactionValue)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>{inputs.mode === 'event' ? 'Concession POS' : 'Wallet ledger'}</span>
                    <span className="font-mono tabular-nums">{result.successRate.toFixed(1)}% expected success</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                  * Assumes partner-operated rails: wallet balance for low-cost closed-loop spend, tokenized cards for higher authorization quality, and card or bank fallback for continuity.
                </p>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}

function Slider({
  label, value, min, max, step, suffix = '', onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  suffix?: string
  onChange: (value: number) => void
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-sm text-slate-700">{label}</label>
        <span className="font-mono tabular-nums text-sm font-semibold text-slate-900">
          {value.toLocaleString('en-US')}{suffix}
        </span>
      </div>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-slate-900"
      />
    </div>
  )
}

function SelectRow({
  label, value, options, onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className="text-sm text-slate-700 block mb-1.5">{label}</label>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  )
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">{label}</p>
      <p className="font-mono tabular-nums text-xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{sub}</p>
    </div>
  )
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-slate-200 rounded-lg p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="font-mono tabular-nums text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}
