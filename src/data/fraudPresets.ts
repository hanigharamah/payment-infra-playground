import type { FraudPreset, FraudRule } from '../types/fraud'

function rule(
  id: string,
  name: string,
  metric: FraudRule['condition']['metric'],
  scope: FraudRule['condition']['scope'],
  timeWindow: FraudRule['condition']['timeWindow'],
  operator: FraudRule['condition']['operator'],
  threshold: number,
  action: FraudRule['action'],
): FraudRule {
  return { id, name, enabled: true, condition: { metric, scope, timeWindow, operator, threshold }, action }
}

export const FRAUD_PRESETS: FraudPreset[] = [
  {
    id: 'scalping',
    label: 'Event Ticket Scalping',
    description: 'Mega-event on-sale windows see 10x fraud spike. Ticket scalpers use multiple cards and rapid-fire purchases. This rule set catches scalpers while blocking fewer than 2% of legitimate fans.',
    rules: [
      rule('r1', 'Max 5 txns per card per hour', 'transactions', 'card', 'hour', '>', 5, 'flag'),
      rule('r2', 'Max 50 txns per device per day', 'transactions', 'device', 'day', '>', 50, 'decline'),
      rule('r3', 'High-speed card usage (>3 in 1 min)', 'transactions', 'card', 'minute', '>', 3, 'challenge'),
      rule('r4', 'High-value rapid device activity', 'amount', 'device', 'hour', '>', 400, 'decline'),
    ],
  },
  {
    id: 'promo',
    label: 'Super-App Promo Abuse',
    description: 'Super-app promo abuse costs millions. Fraudsters create accounts with fake referrals and claim first-time discounts repeatedly. Prioritises recall (catching fraud) over precision.',
    rules: [
      rule('r1', 'Multiple cards same device (>3/day)', 'transactions', 'device', 'day', '>', 3, 'flag'),
      rule('r2', 'High-volume device activity', 'transactions', 'device', 'hour', '>', 8, 'decline'),
      rule('r3', 'Suspicious IP burst (>5/hour)', 'transactions', 'ip', 'hour', '>', 5, 'challenge'),
      rule('r4', 'Large amount from flagged device', 'amount', 'device', 'day', '>', 300, 'decline'),
    ],
  },
  {
    id: 'card-test',
    label: 'Card Testing Prevention',
    description: 'Card testing is how fraudsters validate stolen cards before making big purchases. Catching rapid micro-transactions early stops fraud before the large hit lands.',
    rules: [
      rule('r1', 'Micro-transaction burst (amount < 5)', 'amount', 'card', 'hour', '<', 5, 'flag'),
      rule('r2', 'Decline-heavy card (>5 declines sim)', 'declines', 'card', 'hour', '>', 5, 'decline'),
      rule('r3', 'High-freq card (>4 in 1 min)', 'transactions', 'card', 'minute', '>', 4, 'decline'),
      rule('r4', 'Rapid IP transactions (>10/hour)', 'transactions', 'ip', 'hour', '>', 10, 'decline'),
    ],
  },
]

export const DEFAULT_RULES: FraudRule[] = FRAUD_PRESETS[0].rules
