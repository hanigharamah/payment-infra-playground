import type { WalletInputs, WalletResult, WalletRailItem } from '../types/wallet'

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function stableHex(seed: number) {
  return Math.abs(Math.round(seed * 9973))
    .toString(16)
    .toUpperCase()
    .padStart(6, '0')
    .slice(0, 6)
}

function railItems(inputs: WalletInputs, walletTransactions: number): WalletRailItem[] {
  const directCardShare = clamp(
    100 - inputs.storedBalanceShare - inputs.tokenizedCardShare,
    0,
    100,
  )

  const items: WalletRailItem[] = [
    {
      label: 'Stored balance',
      share: inputs.storedBalanceShare,
      volume: walletTransactions * (inputs.storedBalanceShare / 100),
      feeRate: inputs.mode === 'event' ? 0.55 : 0.45,
      latencyMs: inputs.mode === 'event' ? 190 : 160,
    },
    {
      label: 'Tokenized card',
      share: inputs.tokenizedCardShare,
      volume: walletTransactions * (inputs.tokenizedCardShare / 100),
      feeRate: inputs.mode === 'event' ? 1.25 : 1.35,
      latencyMs: inputs.mode === 'event' ? 420 : 360,
    },
    {
      label: 'Card fallback',
      share: directCardShare,
      volume: walletTransactions * (directCardShare / 100),
      feeRate: 1.85,
      latencyMs: inputs.mode === 'event' ? 760 : 620,
    },
  ]

  if (inputs.mode === 'super-app' && inputs.instantPayoutShare > 0) {
    items.push({
      label: 'Instant payout',
      share: inputs.instantPayoutShare,
      volume: walletTransactions * (inputs.instantPayoutShare / 100),
      feeRate: 0.65,
      latencyMs: 900,
    })
  }

  return items.filter((item) => item.share > 0.1)
}

export function calculateWallet(inputs: WalletInputs): WalletResult {
  const walletTransactions = Math.round(inputs.dailyTransactions * (inputs.walletAdoption / 100))
  const grossGMV = inputs.dailyTransactions * inputs.avgTransactionValue
  const walletGMV = walletTransactions * inputs.avgTransactionValue
  const items = railItems(inputs, walletTransactions)

  const weightedFeeRate = items.reduce((sum, item) => sum + item.share * item.feeRate, 0) / 100
  const weightedLatency = items.reduce((sum, item) => sum + item.share * item.latencyMs, 0) / 100
  const netFeeCost = walletGMV * (weightedFeeRate / 100)
  const openCardCost = walletGMV * 0.0185

  const eventSuccess = 94.2
    + inputs.tokenizedCardShare * 0.018
    + inputs.storedBalanceShare * 0.011
    + inputs.fallbackCoverage * 0.012
    - inputs.offlinePosShare * 0.14
    - inputs.riskHoldRate * 0.18

  const appSuccess = 92.8
    + inputs.tokenizedCardShare * 0.024
    + inputs.storedBalanceShare * 0.014
    + inputs.fallbackCoverage * 0.01
    - inputs.instantPayoutShare * 0.018
    - inputs.riskHoldRate * 0.32

  const successRate = clamp(inputs.mode === 'event' ? eventSuccess : appSuccess, 82, 99.4)
  const p95LatencyMs = Math.round(
    weightedLatency
      + inputs.offlinePosShare * 9
      + inputs.instantPayoutShare * 3.5
      + inputs.riskHoldRate * 18
      - inputs.fallbackCoverage * 1.4,
  )

  const secondsSavedPerWalletTxn = inputs.mode === 'event'
    ? clamp(18 - (p95LatencyMs / 1000), 4, 16)
    : clamp(7 - (p95LatencyMs / 1000), 1, 6)

  const supportTicketsPer10k = clamp(
    6
      + inputs.refundRate * 1.2
      + inputs.riskHoldRate * 1.7
      + inputs.offlinePosShare * 0.55
      - inputs.fallbackCoverage * 0.045,
    2,
    42,
  )

  const reconciliationBreaks = Math.round(
    (walletTransactions / 10000)
      * clamp(0.9 + inputs.refundRate * 0.08 + inputs.offlinePosShare * 0.05 - inputs.fallbackCoverage * 0.004, 0.2, 4),
  )

  const heldTransactions = Math.round(
    walletTransactions
      * ((inputs.mode === 'event' ? inputs.refundRate : inputs.riskHoldRate + inputs.instantPayoutShare * 0.04) / 100),
  )

  const prefix = inputs.mode === 'event' ? 'WLT-EXPO-2030' : 'WLT-APP-PAYOUT'
  const sampleHour = inputs.mode === 'event' ? 14 : 21
  const sampleMinute = Math.round((inputs.walletAdoption + inputs.refundRate) % 60)
  const sampleSecond = Math.round((inputs.fallbackCoverage + inputs.riskHoldRate) % 60)

  return {
    walletTransactions,
    grossGMV,
    walletGMV,
    successRate: Math.round(successRate * 10) / 10,
    p95LatencyMs,
    netFeeCost,
    savingsVsOpenCard: openCardCost - netFeeCost,
    queueMinutesSaved: Math.round((walletTransactions * secondsSavedPerWalletTxn) / 60),
    supportTicketsPer10k: Math.round(supportTicketsPer10k * 10) / 10,
    reconciliationBreaks,
    heldTransactions,
    heldAmount: heldTransactions * inputs.avgTransactionValue,
    railItems: items,
    sampleId: `${prefix}-${stableHex(inputs.dailyTransactions + inputs.avgTransactionValue + inputs.walletAdoption)}`,
    sampleTime: `${String(sampleHour).padStart(2, '0')}:${String(sampleMinute).padStart(2, '0')}:${String(sampleSecond).padStart(2, '0')} UTC`,
  }
}

export function formatSar(amount: number) {
  return `SAR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatCount(value: number) {
  return value.toLocaleString('en-US')
}
