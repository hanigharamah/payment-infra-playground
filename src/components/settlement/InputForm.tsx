import type { SettlementInputs, MerchantCategory, SettlementTiming, Currency, PaymentMethodMix } from '../../types/settlement'
import type { PresetId } from '../../types/settlement'
import { SETTLEMENT_PRESETS } from '../../data/settlementPresets'

interface Props {
  inputs: SettlementInputs
  activePreset: PresetId
  onChange: (next: SettlementInputs) => void
  onPreset: (id: PresetId) => void
}

const CATEGORIES: { value: MerchantCategory; label: string }[] = [
  { value: 'fnb', label: 'F&B (0.8%)' },
  { value: 'retail', label: 'Retail (0.6%)' },
  { value: 'services', label: 'Services (0.75%)' },
  { value: 'ticketing', label: 'Ticketing (1.0%)' },
  { value: 'digital', label: 'Digital goods (0.5%)' },
]

const CURRENCIES: Currency[] = ['SAR', 'AED', 'USD', 'EUR']
const TIMINGS: SettlementTiming[] = ['T+0', 'T+1', 'T+2']

export default function InputForm({ inputs, activePreset, onChange, onPreset }: Props) {
  function set<K extends keyof SettlementInputs>(key: K, value: SettlementInputs[K]) {
    onChange({ ...inputs, [key]: value })
  }

  function setMix(key: keyof PaymentMethodMix, raw: number) {
    const clamped = Math.max(0, Math.min(100, raw))
    const others = (['mada', 'visa', 'wallet', 'cod'] as (keyof PaymentMethodMix)[]).filter(k => k !== key)
    const remaining = 100 - clamped
    const currentOtherTotal = others.reduce((s, k) => s + inputs.paymentMix[k], 0)

    let newMix = { ...inputs.paymentMix, [key]: clamped }

    if (currentOtherTotal > 0) {
      // Scale others proportionally to fill remaining
      others.forEach(k => {
        newMix[k] = Math.round((inputs.paymentMix[k] / currentOtherTotal) * remaining)
      })
      // Fix rounding: assign remainder to the first non-zero other
      const total = Object.values(newMix).reduce((s, v) => s + v, 0)
      const diff = 100 - total
      if (diff !== 0) {
        const target = others.find(k => newMix[k] > 0) ?? others[0]
        newMix[target] = Math.max(0, newMix[target] + diff)
      }
    }

    onChange({ ...inputs, paymentMix: newMix })
  }

  const mixTotal = Object.values(inputs.paymentMix).reduce((s, v) => s + v, 0)
  const mixOff = mixTotal !== 100

  return (
    <div className="space-y-6">

      {/* Presets */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Presets</p>
        <div className="space-y-2">
          {SETTLEMENT_PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => onPreset(p.id)}
              className={`w-full text-left px-3 py-2.5 rounded border text-sm transition-colors ${
                activePreset === p.id
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
              }`}
            >
              <span className="font-medium block">{p.label}</span>
              <span className={`text-xs mt-0.5 block leading-snug ${activePreset === p.id ? 'text-slate-300' : 'text-slate-400'}`}>
                {p.description}
              </span>
            </button>
          ))}
          <button
            onClick={() => onPreset('custom')}
            className={`w-full text-left px-3 py-2 rounded border text-sm transition-colors ${
              activePreset === 'custom'
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Volume + ticket size */}
      <div className="border-t border-slate-200 pt-6 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Volume</p>

        <div>
          <div className="flex justify-between items-baseline mb-1.5">
            <label className="text-sm text-slate-700">Daily transactions</label>
            <span className="text-sm font-semibold tabular-nums text-slate-900">{inputs.dailyVolume.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={10}
            max={5000}
            step={10}
            value={inputs.dailyVolume}
            onChange={e => set('dailyVolume', Number(e.target.value))}
            className="w-full accent-slate-900"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-0.5">
            <span>10</span><span>5,000</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-baseline mb-1.5">
            <label className="text-sm text-slate-700">Avg ticket size</label>
            <span className="text-sm font-semibold tabular-nums text-slate-900">{inputs.avgTicketSize}</span>
          </div>
          <input
            type="range"
            min={5}
            max={500}
            step={5}
            value={inputs.avgTicketSize}
            onChange={e => set('avgTicketSize', Number(e.target.value))}
            className="w-full accent-slate-900"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-0.5">
            <span>5</span><span>500</span>
          </div>
        </div>
      </div>

      {/* Category + currency */}
      <div className="border-t border-slate-200 pt-6 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Classification</p>

        <div>
          <label className="text-sm text-slate-700 block mb-1.5">Merchant category</label>
          <select
            value={inputs.merchantCategory}
            onChange={e => set('merchantCategory', e.target.value as MerchantCategory)}
            className="w-full border border-slate-200 rounded px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-slate-400"
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-slate-700 block mb-1.5">Currency</label>
          <div className="flex gap-2">
            {CURRENCIES.map(c => (
              <button
                key={c}
                onClick={() => set('currency', c)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded border transition-colors ${
                  inputs.currency === c
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payment mix */}
      <div className="border-t border-slate-200 pt-6 space-y-3">
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Payment mix</p>
          <span className={`text-xs tabular-nums font-medium ${mixOff ? 'text-red-500' : 'text-slate-400'}`}>
            {mixTotal}% {mixOff ? '(must = 100)' : ''}
          </span>
        </div>

        {(['mada', 'visa', 'wallet', 'cod'] as (keyof PaymentMethodMix)[]).map(key => {
          const labels: Record<keyof PaymentMethodMix, string> = {
            mada: 'mada', visa: 'Visa / MC', wallet: 'STC Pay / Wallet', cod: 'COD',
          }
          return (
            <div key={key}>
              <div className="flex justify-between items-baseline mb-1">
                <label className="text-sm text-slate-700">{labels[key]}</label>
                <span className="text-xs tabular-nums text-slate-500">{inputs.paymentMix[key]}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={inputs.paymentMix[key]}
                onChange={e => setMix(key, Number(e.target.value))}
                className="w-full accent-slate-700"
              />
            </div>
          )
        })}
      </div>

      {/* Settlement timing */}
      <div className="border-t border-slate-200 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Settlement timing</p>
        <div className="flex gap-2">
          {TIMINGS.map(t => (
            <button
              key={t}
              onClick={() => set('settlementTiming', t)}
              className={`flex-1 py-2 text-sm font-semibold rounded border transition-colors ${
                inputs.settlementTiming === t
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {inputs.settlementTiming === 'T+0' && (
          <p className="text-xs text-amber-600 mt-2 leading-snug">
            Instant payout premium applies: +0.5% on gross GMV
          </p>
        )}
      </div>

      {/* Platform commission */}
      <div className="border-t border-slate-200 pt-6">
        <div className="flex justify-between items-baseline mb-1.5">
          <label className="text-sm text-slate-700">Platform commission</label>
          <span className="text-sm font-semibold tabular-nums text-slate-900">{inputs.platformCommission}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={30}
          step={0.5}
          value={inputs.platformCommission}
          onChange={e => set('platformCommission', Number(e.target.value))}
          className="w-full accent-slate-900"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-0.5">
          <span>0%</span><span>30%</span>
        </div>
      </div>
    </div>
  )
}
