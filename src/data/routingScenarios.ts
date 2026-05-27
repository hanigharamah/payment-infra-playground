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
    supportedTransactionTypes: ['ticket_purchase', 'food_delivery', 'ride_payment', 'retail', 'p2p_transfer', 'instant_payout', 'standard_payout'],
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
    supportedTransactionTypes: ['mada_domestic', 'ticket_purchase', 'food_delivery', 'ride_payment', 'retail', 'instant_payout', 'standard_payout'],
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
    supportedTransactionTypes: ['ticket_purchase', 'food_delivery', 'ride_payment', 'retail', 'standard_payout'],
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
  mega_event: {
    id: 'mega_event',
    label: 'Mega-Event Ticketing',
    description:
      '3.4M ticket transactions in 90 days. Domestic mada routes through local acquiring; high-value EUR routes to Checkout.com; CNY routes to Checkout.com for international coverage.',
    txnPrefix: 'EVNT',
    rules: [
      {
        id: 'event-1',
        condition: { transactionType: 'mada_domestic' },
        action: { primaryGateway: 'gw-b' },
        note: 'mada is modeled as domestic Saudi processing and cannot route to international acquirers.',
      },
      {
        id: 'event-2',
        condition: { currency: 'SAR', amountOperator: '<', amount: 50 },
        action: { primaryGateway: 'gw-c' },
      },
      {
        id: 'event-3',
        condition: { currency: 'EUR', amountOperator: '>', amount: 100 },
        action: { primaryGateway: 'gw-a' },
      },
      {
        id: 'event-4',
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
        { type: 'mada_domestic', weight: 45 },
        { type: 'ticket_purchase', weight: 35 },
        { type: 'retail', weight: 20 },
      ],
      amountRange: [15, 500],
    },
  },
  super_app: {
    id: 'super_app',
    label: 'Super-App Multi-Vertical',
    description:
      'One platform, multiple verticals, three settlement cycles. Rides route to HyperPay, food to Moyasar, P2P to Checkout.com for compliance controls.',
    txnPrefix: 'SAPP',
    rules: [
      {
        id: 'super-1',
        condition: { transactionType: 'ride_payment' },
        action: { primaryGateway: 'gw-b' },
      },
      {
        id: 'super-2',
        condition: { transactionType: 'food_delivery' },
        action: { primaryGateway: 'gw-c' },
      },
      {
        id: 'super-3',
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
  merchant_payouts: {
    id: 'merchant_payouts',
    label: 'Merchant Payouts',
    description:
      '8,000 cloud kitchen operators want same-day payouts. Instant routes via Checkout.com; standard batch routes via Moyasar.',
    txnPrefix: 'PYOT',
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
  'mada_domestic',
  'ticket_purchase',
  'food_delivery',
  'ride_payment',
  'retail',
  'p2p_transfer',
  'instant_payout',
  'standard_payout',
]
