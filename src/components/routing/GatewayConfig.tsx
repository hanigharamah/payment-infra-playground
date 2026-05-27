import type { Gateway } from '../../types/routing'
import { SUCCESS_RATE_MIN } from '../../data/routingScenarios'

interface Props {
  gateways: Gateway[]
  onToggle: (id: string) => void
  onSuccessRateChange: (id: string, rate: number) => void
}

export default function GatewayConfig({ gateways, onToggle, onSuccessRateChange }: Props) {
  return (
    <div className="space-y-3">
      {gateways.map((gw) => (
        <div
          key={gw.id}
          className={`bg-white border rounded-lg p-4 transition-colors ${
            gw.enabled ? 'border-slate-200' : 'border-slate-100 opacity-50'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{gw.name}</p>
              <p className="text-xs text-slate-400 font-mono">{gw.shortName}</p>
            </div>
            <button
              onClick={() => onToggle(gw.id)}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                gw.enabled ? 'bg-slate-900' : 'bg-slate-200'
              }`}
              aria-label={gw.enabled ? 'Disable gateway' : 'Enable gateway'}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                  gw.enabled ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Success rate slider — step 0.1 to preserve decimals */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500">Success rate</span>
              <span className="text-xs font-semibold tabular-nums text-slate-900">
                {gw.successRate.toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min={SUCCESS_RATE_MIN[gw.id] ?? 78}
              max={100}
              step={0.1}
              value={gw.successRate}
              disabled={!gw.enabled}
              onChange={(e) => onSuccessRateChange(gw.id, parseFloat(e.target.value))}
              className="w-full h-1.5 accent-slate-900 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="flex justify-between mt-0.5">
              <span className="text-xs text-slate-400">{SUCCESS_RATE_MIN[gw.id]}%</span>
              <span className="text-xs text-slate-400">100%</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400">Fee</span>
              <p className="font-medium text-slate-700 tabular-nums">
                ${gw.baseFee.toFixed(2)} + {gw.percentageFee}%
              </p>
            </div>
            <div>
              <span className="text-slate-400">Latency</span>
              <p className="font-medium text-slate-700 tabular-nums">{gw.latency}ms</p>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400">Currencies</span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {gw.supportedCurrencies.map((c) => (
                  <span
                    key={c}
                    className="inline-flex px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
