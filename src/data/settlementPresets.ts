import type { SettlementPreset } from '../types/settlement'

export const SETTLEMENT_PRESETS: SettlementPreset[] = [
  {
    id: 'megaevent-fnb',
    label: 'Mega-Event F&B Vendor',
    description: 'High-volume, low-ticket concession stand inside stadium. mada-heavy, instant payout required.',
    inputs: {
      dailyVolume: 2400,
      avgTicketSize: 38,
      currency: 'SAR',
      merchantCategory: 'fnb',
      paymentMix: { mada: 72, visa: 18, wallet: 10, cod: 0 },
      settlementTiming: 'T+0',
      platformCommission: 3,
    },
  },
  {
    id: 'superapp-kitchen',
    label: 'Super-App Cloud Kitchen',
    description: '8,000 operators on a delivery platform. T+2 batch settlement, mixed payment methods.',
    inputs: {
      dailyVolume: 340,
      avgTicketSize: 65,
      currency: 'SAR',
      merchantCategory: 'fnb',
      paymentMix: { mada: 48, visa: 22, wallet: 30, cod: 0 },
      settlementTiming: 'T+2',
      platformCommission: 15,
    },
  },
  {
    id: 'driver-payout',
    label: 'Driver Instant Payout',
    description: 'Per-trip earnings disbursement. T+0 required. Low ticket, extremely high volume.',
    inputs: {
      dailyVolume: 18,
      avgTicketSize: 22,
      currency: 'SAR',
      merchantCategory: 'services',
      paymentMix: { mada: 35, visa: 15, wallet: 50, cod: 0 },
      settlementTiming: 'T+0',
      platformCommission: 20,
    },
  },
]

export const DEFAULT_INPUTS = SETTLEMENT_PRESETS[0].inputs
