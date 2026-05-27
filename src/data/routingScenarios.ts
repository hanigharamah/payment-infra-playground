import type { Gateway, RoutingRule, ScenarioId } from '../types/routing'

export const DEFAULT_GATEWAYS: Gateway[] = [
  {
    id: 'gw-a',
    name: 'Checkout.com',
    shortName: 'Checkout.com',
    successRate: 98.7,
    baseFee: 0.29,
    percentageFee: 2.87,
    latency: 182,
    supportedCurrencies: ['USD', 'EUR', 'SAR', 'AED', 'PKR', 'CNY'],
    enabled: true,
  },
  {
    id: 'gw-b',
    name: 'HyperPay MENA',
    shortName: 'HyperPay',
    successRate: 94.3,
    baseFee: 0.14,
    percentageFee: 2.23,
    latency: 387,
    supportedCurrencies: ['SAR', 'AED', 'PKR'],
    enabled: true,
  },
  {
    id: 'gw-c',
    name: 'Moyasar',
    shortName: 'Moyasar',
    successRate: 91.8,
    baseFee: 0.09,
    percentageFee: 1.91,
    latency: 583,
    supportedCurrencies: ['USD', 'EUR', 'SAR'],
    enabled: true,
  },
]

export const SUCCESS_RATE_MIN: Record<string, number> = {
  'gw-a': 88,
  'gw-b': 83,
  'gw-c': 78,
}

export interface ScenarioConfig {
  id: ScenarioId
  label: string
  description: string
  rules: RoutingRule[]
  txnPrefix: string
  transactionProfile: {
    currencies: { currency: string; weight: number }[]
    types: { type: string; weight: number }[]
    amountRange: [number, number]
  }
}

export const SCENARIOS: Record<Exclude<ScenarioId, 'custom'>, ScenarioConfig> = {
  fifa: {
    id: 'fifa',
    label: 'FIFA 2034 Ticketing',
    description:
      '3.4M ticket transactions in 90 days. Low-value SAR to Moyasar (cheap), high-value EUR to Checkout.com (reliable), CNY always to Checkout.com (compliance).',
    txnPrefix: 'FIFA',
    rules: [
      {
        id: 'fifa-1',
        condition: { currency: 'SAR', amountOperator: '<', amount: 50 },
        action: { primaryGateway: 'gw-c' },
      },
      {
        id: 'fifa-2',
        condition: { currency: 'EUR', amountOperator: '>', amount: 100 },
        action: { primaryGateway: 'gw-a' },
      },
      {
        id: 'fifa-3',
        condition: { currency: 'CNY' },
        action: { primaryGateway: 'gw-a' },
      },
    ],
    transactionProfile: {
      currencies: [
        { currency: 'SAR', weight: 70 },
        { currency: 'USD', weight: 10 },
        { currency: 'EUR', weight: 10 },
        { currency: 'CNY', weight: 7 },
        { currency: 'AED', weight: 3 },
      ],
      types: [
        { type: 'ticket_purchase', weight: 80 },
        { type: 'retail', weight: 20 },
      ],
      amountRange: [15, 500],
    },
  },
  careem: {
    id: 'careem',
    label: 'Careem Pay Multi-Vertical',
    description:
      'One platform, 14 verticals, three settlement cycles. Rides to HyperPay (fast settlement), food to Moyasar (low cost), P2P to Checkout.com (compliance).',
    txnPrefix: 'CARM',
    rules: [
      {
        id: 'careem-1',
        condition: { transactionType: 'ride_payment' },
        action: { primaryGateway: 'gw-b' },
      },
      {
        id: 'careem-2',
        condition: { transactionType: 'food_delivery' },
        action: { primaryGateway: 'gw-c' },
      },
      {
        id: 'careem-3',
        condition: { transactionType: 'p2p_transfer' },
        action: { primaryGateway: 'gw-a' },
      },
    ],
    transactionProfile: {
      currencies: [
        { currency: 'SAR', weight: 55 },
        { currency: 'AED', weight: 30 },
        { currency: 'PKR', weight: 15 },
      ],
      types: [
        { type: 'ride_payment', weight: 40 },
        { type: 'food_delivery', weight: 35 },
        { type: 'p2p_transfer', weight: 25 },
      ],
      amountRange: [5, 150],
    },
  },
  ubereats: {
    id: 'ubereats',
    label: 'Uber Eats Merchant Payouts',
    description:
      '8,000 cloud kitchen operators want same-day payouts. Instant via Checkout.com (costly but fast), standard batch via Moyasar (cheap, T+2).',
    txnPrefix: 'UBER',
    rules: [
      {
        id: 'ue-1',
        condition: { transactionType: 'instant_payout' },
        action: { primaryGateway: 'gw-a' },
      },
      {
        id: 'ue-2',
        condition: { transactionType: 'standard_payout' },
        action: { primaryGateway: 'gw-c' },
      },
    ],
    transactionProfile: {
      currencies: [
        { currency: 'USD', weight: 70 },
        { currency: 'SAR', weight: 20 },
        { currency: 'AED', weight: 10 },
      ],
      types: [
        { type: 'standard_payout', weight: 60 },
        { type: 'instant_payout', weight: 40 },
      ],
      amountRange: [20, 500],
    },
  },
}

export const ALL_CURRENCIES = ['SAR', 'USD', 'EUR', 'AED', 'PKR', 'CNY']

export const ALL_TRANSACTION_TYPES = [
  'ticket_purchase',
  'food_delivery',
  'ride_payment',
  'retail',
  'p2p_transfer',
  'instant_payout',
  'standard_payout',
]
