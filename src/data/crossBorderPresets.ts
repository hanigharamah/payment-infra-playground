import type { CrossBorderPreset } from '../types/crossBorder'

export const CROSS_BORDER_PRESETS: CrossBorderPreset[] = [
  {
    id: 'china-fifa',
    label: 'Chinese Tourist -> FIFA Tickets (CNY -> SAR)',
    useCase: '50+ currencies at FIFA 2034. Optimize for tourist experience and low-friction payment.',
    corridor: {
      sendCurrency: 'CNY',
      receiveCurrency: 'SAR',
      amount: 500,
      purpose: 'tourist',
    },
  },
  {
    id: 'driver-remittance',
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
    useCase: 'Mega-event merchant settlements. Balance cost, speed, and regulatory comfort.',
    corridor: {
      sendCurrency: 'USD',
      receiveCurrency: 'SAR',
      amount: 50000,
      purpose: 'merchant_settlement',
    },
  },
]
