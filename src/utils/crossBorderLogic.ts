import type {
  CrossBorderComparison,
  CurrencyCode,
  PaymentCorridor,
  PaymentMethod,
  PaymentMethodType,
} from '../types/crossBorder'

const USD_VALUE: Record<CurrencyCode, number> = {
  SAR: 0.2667,
  USD: 1,
  EUR: 1.08,
  AED: 0.2723,
  CNY: 0.138,
  GBP: 1.27,
  PKR: 0.00359,
  INR: 0.012,
  BDT: 0.0085,
  EGP: 0.0203,
  JOD: 1.41,
}

const CURRENCY_NAMES: Record<CurrencyCode, string> = {
  SAR: 'Saudi Riyal',
  USD: 'US Dollar',
  EUR: 'Euro',
  AED: 'UAE Dirham',
  CNY: 'Chinese Yuan',
  GBP: 'British Pound',
  PKR: 'Pakistani Rupee',
  INR: 'Indian Rupee',
  BDT: 'Bangladeshi Taka',
  EGP: 'Egyptian Pound',
  JOD: 'Jordanian Dinar',
}

const PURPOSE_LABELS = {
  tourist: 'Tourist Payment',
  remittance: 'Wallet Remittance',
  merchant_settlement: 'Merchant Settlement',
  b2b: 'B2B Invoice',
}
const ARAB_CURRENCIES: CurrencyCode[] = ['SAR', 'AED', 'EGP', 'JOD']

function toUsd(amount: number, currency: CurrencyCode) {
  return amount * USD_VALUE[currency]
}

function fromUsd(amountUsd: number, currency: CurrencyCode) {
  return amountUsd / USD_VALUE[currency]
}

function isGccLocal(corridor: PaymentCorridor) {
  const pair = [corridor.sendCurrency, corridor.receiveCurrency].sort().join(':')
  return pair === 'AED:SAR'
}

function buildFees(corridor: PaymentCorridor, amountUsd: number, type: PaymentMethodType, available: boolean) {
  if (!available) {
    return {
      sendingFee: 0,
      intermediaryFees: [],
      receivingFee: 0,
      fxSpread: 0,
      total: 0,
      totalPct: 0,
    }
  }

  if (type === 'correspondent_banking') {
    const rateByPurpose = {
      tourist: 0.108,
      remittance: 0.081,
      merchant_settlement: 0.00655,
      b2b: 0.0075,
    }
    const total = amountUsd * rateByPurpose[corridor.purpose]
    const sendingFee = total * 0.25
    const intermediaryFees = [total * 0.2, total * 0.15]
    const receivingFee = total * 0.1
    return {
      sendingFee,
      intermediaryFees,
      receivingFee,
      fxSpread: rateByPurpose[corridor.purpose] * 30,
      total,
      totalPct: amountUsd > 0 ? (total / amountUsd) * 100 : 0,
    }
  }

  if (type === 'stablecoin') {
    const rateByPurpose = {
      tourist: 0.038,
      remittance: 0.027,
      merchant_settlement: 0.004,
      b2b: 0.006,
    }
    const gasFee = Math.min(2, amountUsd * 0.003)
    const total = amountUsd * rateByPurpose[corridor.purpose]
    return {
      sendingFee: total * 0.28,
      intermediaryFees: [gasFee],
      receivingFee: total * 0.42,
      fxSpread: rateByPurpose[corridor.purpose] * 30,
      total,
      totalPct: amountUsd > 0 ? (total / amountUsd) * 100 : 0,
    }
  }

  if (type === 'buna') {
    const rateByPurpose = {
      tourist: 0.009,
      remittance: 0.007,
      merchant_settlement: 0.005,
      b2b: 0.006,
    }
    const total = amountUsd * rateByPurpose[corridor.purpose]
    return {
      sendingFee: total * 0.35,
      intermediaryFees: [total * 0.3],
      receivingFee: total * 0.35,
      fxSpread: rateByPurpose[corridor.purpose] * 20,
      total,
      totalPct: amountUsd > 0 ? (total / amountUsd) * 100 : 0,
    }
  }

  const networkFee = 2
  const fxFee = amountUsd * 0.003
  const total = networkFee + fxFee
  return {
    sendingFee: networkFee,
    intermediaryFees: [],
    receivingFee: 0,
    fxSpread: 0.3,
    total,
    totalPct: amountUsd > 0 ? (total / amountUsd) * 100 : 0,
  }
}

function finalAmount(amountUsd: number, feesUsd: number, receiveCurrency: CurrencyCode, available: boolean) {
  if (!available) return 0
  return Math.max(0, fromUsd(amountUsd - feesUsd, receiveCurrency))
}

function methodConfig(type: PaymentMethodType, corridor: PaymentCorridor): Omit<PaymentMethod, 'fees' | 'finalAmount'> {
  if (type === 'correspondent_banking') {
    return {
      name: 'Correspondent Banking',
      type,
      description: 'SWIFT wire through sending, intermediary, and receiving banks',
      available: true,
      timeline: corridor.amount > 25000 ? '2 business days' : '2-5 business days',
      timelineMinutes: corridor.amount > 25000 ? 2880 : 5760,
      flowSteps: [
        `Sender bank (${corridor.sendCurrency})`,
        'Correspondent bank (USD clearing)',
        'Intermediary bank',
        `Recipient bank (${corridor.receiveCurrency})`,
      ],
      regulatorySteps: [
        { label: 'KYC verification', description: 'Sender bank verifies account identity' },
        { label: 'AML screening', description: 'Transaction screened before release' },
        { label: 'Sanctions screening', description: 'USD and correspondent banks check restricted parties' },
        { label: 'Intermediary review', description: 'Correspondent banks may hold or reject details' },
        { label: 'Recipient verification', description: 'Receiving bank confirms account and purpose' },
      ],
      bestFor: 'Large B2B, established accounts',
      transparency: 'Low',
      availability: 'Bank processing windows',
      risk: 'Low',
      limits: 'Broad limits',
    }
  }

  if (type === 'stablecoin') {
    const isSarCorridor = corridor.sendCurrency === 'SAR' || corridor.receiveCurrency === 'SAR'
    return {
      name: 'Stablecoin Rails',
      type,
      description: 'On-ramp, USDC transfer, off-ramp into recipient currency',
      available: !isSarCorridor,
      unavailableReason: isSarCorridor
        ? 'Not modeled as an available licensed payment rail for SAR corridors'
        : undefined,
      timeline: corridor.purpose === 'remittance' ? '30 minutes - 2 hours' : '15 minutes - 2 hours',
      timelineMinutes: corridor.purpose === 'remittance' ? 30 : 60,
      flowSteps: [
        `${corridor.sendCurrency} on-ramp`,
        'Convert to USDC',
        'On-chain transfer',
        `${corridor.receiveCurrency} off-ramp`,
      ],
      regulatorySteps: [
        { label: 'KYC at on-ramp', description: 'Exchange or PSP verifies sender identity' },
        { label: 'Wallet screening', description: 'Blockchain analytics checks wallet exposure' },
        { label: 'On-chain transfer', description: 'Transfer settles with transparent transaction record' },
        { label: 'KYC at off-ramp', description: 'Recipient or payout partner is verified' },
        { label: 'Funds released', description: 'Local account or wallet receives payout' },
      ],
      bestFor: 'Fast remittances, 24/7 transfers',
      transparency: 'High',
      availability: isSarCorridor ? 'Unavailable for SAR corridor' : '24/7',
      risk: 'Medium',
      limits: 'Usually capped by ramps',
    }
  }

  if (type === 'buna') {
    const available = ARAB_CURRENCIES.includes(corridor.sendCurrency) && ARAB_CURRENCIES.includes(corridor.receiveCurrency)
    return {
      name: 'Buna Network',
      type,
      description: 'Arab Monetary Fund cross-border payment platform',
      available,
      unavailableReason: 'Modeled only for Arab-currency corridors (SAR, AED, EGP, JOD)',
      timeline: available ? 'Same business day' : 'Not available',
      timelineMinutes: available ? 720 : Number.POSITIVE_INFINITY,
      flowSteps: available
        ? ['Participant bank', 'Buna network screening', 'Central bank settlement']
        : ['Corridor not in Buna model', 'Fallback to correspondent or regulated local rails'],
      regulatorySteps: available
        ? [
            { label: 'Account verification', description: 'Participating institution verifies sender and beneficiary' },
            { label: 'Network screening', description: 'Buna compliance and sanctions controls run before release' },
            { label: 'Central bank settlement', description: 'Funds settle through participating monetary authorities' },
          ]
        : [
            { label: 'Corridor check', description: 'Both currencies must be in the modeled Buna set' },
            { label: 'Fallback required', description: 'Route through correspondent or regional rail alternatives' },
          ],
      bestFor: 'Arab-currency regional transfers',
      transparency: available ? 'Medium' : 'N/A',
      availability: available ? 'Business-day processing' : 'Unavailable',
      risk: available ? 'Low' : 'N/A',
      limits: available ? 'Institution-defined limits' : 'N/A',
    }
  }

  const available = isGccLocal(corridor)
  return {
    name: 'AFAQ / GCC RTGS',
    type,
    description: 'GCC cross-border interbank settlement for SAR <-> AED participating banks',
    available,
    unavailableReason: 'Only available for SAR <-> AED corridors in this model',
    timeline: available ? 'Same business day' : 'Not available',
    timelineMinutes: available ? 480 : Number.POSITIVE_INFINITY,
    flowSteps: available
      ? ['Sender bank', 'Regional payment switch', 'Recipient bank']
      : ['No supported local network', 'Use SWIFT or stablecoin alternative'],
    regulatorySteps: available
      ? [
          { label: 'Account verification', description: 'Banks already hold customer KYC' },
          { label: 'Transaction check', description: 'Network screens purpose, limits, and sanctions' },
          { label: 'Central switch', description: 'Regional infrastructure routes the payment' },
          { label: 'Funds settled', description: 'Recipient account is credited' },
        ]
      : [
          { label: 'Corridor check', description: 'No supported regional rail for this currency pair' },
          { label: 'Fallback required', description: 'Route via bank wire or regulated on/off-ramp partners' },
        ],
    bestFor: 'Regional bank transfers',
    transparency: available ? 'Medium' : 'N/A',
    availability: available ? 'Business-day batch windows' : 'Unavailable',
    risk: available ? 'Low' : 'N/A',
    limits: available ? 'Bank and network limits' : 'N/A',
  }
}

function buildMethod(type: PaymentMethodType, corridor: PaymentCorridor): PaymentMethod {
  const amountUsd = toUsd(corridor.amount, corridor.sendCurrency)
  const config = methodConfig(type, corridor)
  const fees = buildFees(corridor, amountUsd, type, config.available)

  return {
    ...config,
    fees,
    finalAmount: finalAmount(amountUsd, fees.total, corridor.receiveCurrency, config.available),
  }
}

export function compareCrossBorder(corridor: PaymentCorridor): CrossBorderComparison {
  const methods = (['correspondent_banking', 'stablecoin', 'local_network', 'buna'] as PaymentMethodType[])
    .map((type) => buildMethod(type, corridor))

  const bestValue = methods
    .filter((method) => method.available)
    .sort((a, b) => a.fees.total - b.fees.total)[0]?.type ?? 'correspondent_banking'

  return { corridor, methods, bestValue }
}

export function currencyLabel(currency: CurrencyCode) {
  return `${currency} (${CURRENCY_NAMES[currency]})`
}

export function purposeLabel(purpose: PaymentCorridor['purpose']) {
  return PURPOSE_LABELS[purpose]
}

export function formatCurrency(amount: number, currency: CurrencyCode) {
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatUsd(amount: number) {
  return `USD ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
