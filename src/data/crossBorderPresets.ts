import type { CrossBorderPreset } from '../types/crossBorder'

export const CROSS_BORDER_PRESETS: CrossBorderPreset[] = [
  {
    id: 'international-tourist',
    label: 'International Tourist Purchase (CNY -> SAR)',
    useCase: 'High-volume tourist traffic during a large-scale sporting event. Optimize for low-friction payment.',
    corridor: {
      sendCurrency: 'CNY',
      receiveCurrency: 'SAR',
      amount: 500,
      purpose: 'tourist',
    },
  },
  {
    id: 'wallet-remittance',
    label: 'Super-App Wallet Remittance (SAR -> PKR)',
    useCase: 'A driver keeps earnings in the platform wallet, then sends part of that balance home through an embedded remittance feature. The platform chooses the payout rail, fee, speed, and compliance flow.',
    corridor: {
      sendCurrency: 'SAR',
      receiveCurrency: 'PKR',
      amount: 3000,
      purpose: 'remittance',
    },
  },
  {
    id: 'merchant-settlement',
    label: 'International Merchant Settlement (USD -> SAR)',
    useCase: 'Large-event merchant settlements. Balance cost, speed, and regulatory comfort.',
    corridor: {
      sendCurrency: 'USD',
      receiveCurrency: 'SAR',
      amount: 50000,
      purpose: 'merchant_settlement',
    },
  },
  {
    id: 'gcc-transfer',
    label: 'GCC Treasury Transfer (SAR -> AED)',
    useCase: 'Regional treasury movement where AFAQ/GCC RTGS and Buna can both be compared against correspondent banking.',
    corridor: {
      sendCurrency: 'SAR',
      receiveCurrency: 'AED',
      amount: 25000,
      purpose: 'b2b',
    },
  },
]
