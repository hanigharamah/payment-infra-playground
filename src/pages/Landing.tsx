import { Link } from 'react-router-dom'
import {
  Workflow, Calculator, Shield, WalletCards, Globe, ArrowRight, Github, Linkedin,
} from 'lucide-react'
import Button from '../components/common/Button'
import Nav from '../components/common/Nav'

const problemItems = [
  {
    label: 'FIFA 2034 & Expo Riyadh 2030',
    body: '3.4 million ticket transactions in 90 days. Peak throughput hits 40,000 per minute during group-stage draws. About 70% are domestic mada payments; the rest split across 22 currencies. Single-gateway setups fail here. The question is not whether routing matters, but how many milliseconds you can afford to lose on a fallback.',
  },
  {
    label: 'Careem Pay',
    body: 'One app, 14 verticals, three settlement cycles. A ride payment, food delivery, wallet top-up, and instant payout can look similar on the surface but need different rails: speed for rides, cost control for food, risk checks for wallet balance, and compliance-grade flows for embedded remittance. The orchestration layer is the product.',
  },
  {
    label: 'Cloud Kitchen Payouts',
    body: '8,000 cloud kitchen operators on Careem NOW want same-day payouts. Banks offer T+2. The float cost at scale is real. Instant payout rails change the unit economics for the whole marketplace, not just for the operators who ask for it.',
  },
  {
    label: 'Cross-border Payment Corridors',
    body: 'A Chinese tourist paying for FIFA tickets, an international merchant settling into SAR, and a super-app wallet sending earnings home all ask the same question: which rail gives the best mix of cost, speed, transparency, and regulatory comfort?',
  },
]

const toolCards = [
  {
    icon: Workflow,
    title: 'Payment Routing Simulator',
    description:
      'Configure Checkout.com, HyperPay, and Moyasar as gateways. Build rules: SAR under SAR 50 routes to Moyasar, EUR over €100 goes to Checkout.com. Run 50 transactions and see the fee delta.',
    useCases: 'FIFA ticketing · Careem multi-vertical · instant vs. standard payouts',
    href: '/routing',
    cta: 'Try Routing',
  },
  {
    icon: Calculator,
    title: 'Merchant Settlement Calculator',
    description:
      'Model T+0 instant payouts vs. T+2 batch for cloud kitchens. Calculate the float cost, MDR impact, and per-transaction economics across merchant categories.',
    useCases: 'Event vendors · cloud kitchens · driver payouts',
    href: '/settlement',
    cta: 'Calculate Settlement',
  },
  {
    icon: Shield,
    title: 'Fraud Detection Playground',
    description:
      'Write velocity rules: flag anyone buying 100+ tickets in 2 minutes. Test them against generated transaction sets and watch precision and recall update in real time.',
    useCases: 'Ticket scalping · promo abuse · card testing patterns',
    href: '/fraud',
    cta: 'Detect Fraud',
  },
  {
    icon: WalletCards,
    title: 'Digital Wallet Simulator',
    description:
      'Switch between Expo-style event wallets and super-app wallets. Tune adoption, stored balance, tokenized cards, fallback coverage, refund pressure, and payout holds.',
    useCases: 'Expo cashless sites · prepaid fallback · delivery app wallets · driver payouts',
    href: '/wallets',
    cta: 'Simulate Wallets',
  },
  {
    icon: Globe,
    title: 'Cross-Border Payment Visualizer',
    description:
      'Compare correspondent banking, stablecoin rails, and regional payment networks for the same corridor. Model tourist payments, platform-wallet remittance, and merchant settlement side by side.',
    useCases: 'FIFA tourists · Expo merchants · super-app wallet remittance · vendor payouts',
    href: '/cross-border',
    cta: 'Visualize Cross-Border',
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />

      {/* ── Hero ── */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-20">

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full mb-8">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-slate-700">Live Portfolio Project</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight text-slate-900 mb-6 max-w-3xl">
            Payment Infrastructure
            <br />
            Playground
          </h1>

          <p className="text-xl leading-relaxed text-slate-600 mb-4 max-w-2xl">
            How do you route 3 million FIFA 2034 ticket purchases across 40 currencies in 30 days without a meltdown?
          </p>
          <p className="text-base text-slate-500 mb-3 max-w-xl">
            This is the sandbox. Five tools built around real infrastructure decisions in MENA payments.
          </p>
          <p className="text-sm text-slate-400 mb-10 max-w-lg">
            Not tutorials. Not explainers. Interactive simulators where you set the parameters and watch what breaks.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <a href="#tools">
              <Button size="lg">
                Explore the Tools
                <ArrowRight size={15} />
              </Button>
            </a>
            <a href="#problems">
              <Button variant="secondary" size="lg">
                What problems does this cover?
              </Button>
            </a>
          </div>

          {/* Stats: compact portfolio summary */}
          <div className="mt-16 pt-8 border-t border-slate-200 flex flex-wrap items-center gap-x-12 gap-y-4">
            {[
              { value: '3M+', label: 'FIFA transactions modeled' },
              { value: '5', label: 'payment simulators' },
              { value: 'SAR · USD · EUR · GBP · AED · INR · CNY', label: 'supported currencies' },
              { value: '182ms', label: 'best gateway latency in stack' },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-lg font-bold tabular-nums text-slate-900">{value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem Space ── */}
      <section id="problems" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">

          {/* Asymmetric header: 4/8 split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16">
            <div className="lg:col-span-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
                What this simulates
              </p>
              <h2 className="text-4xl font-bold tracking-tight text-slate-900 leading-tight">
                Real problems.<br />Specific numbers.
              </h2>
            </div>
            <div className="lg:col-span-8 self-end">
              <p className="text-base leading-relaxed text-slate-600 max-w-xl">
                Saudi Arabia is at the center of a payment infrastructure inflection point. FIFA 2034. Expo 2030. Vision 2030 fintech licensing. The decisions made in the next three years will define the stack for a decade.
              </p>
            </div>
          </div>

          {/* 4-item editorial list */}
          <div className="divide-y divide-slate-200 border-t border-slate-200">
            {problemItems.map(({ label, body }, idx) => (
              <div key={label} className="flex gap-8 py-8">
                <span className="text-xs font-bold tabular-nums text-slate-300 w-6 pt-1 shrink-0">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-900 mb-2">{label}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tools ── */}
      <section id="tools" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">

          {/* Asymmetric header: 5/7 split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-12">
            <div className="lg:col-span-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
                The Tools
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">
                Five simulators.<br />Each solves a different piece.
              </h2>
            </div>
            <div className="lg:col-span-7 self-end">
              <p className="text-sm leading-relaxed text-slate-600">
                Configure the parameters yourself. The routing engine applies your rules in order, simulates gateway success rates, and shows you the P&amp;L. No mock data. Your rules, your transactions.
              </p>
            </div>
          </div>

          {/* Numbered vertical list */}
          <div className="divide-y divide-slate-200 border-t border-slate-200">
            {toolCards.map(({ icon: Icon, title, description, useCases, href, cta }, idx) => (
              <div key={href} className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8 py-10">
                <span className="text-xs font-bold tabular-nums text-slate-300 w-6 pt-1 shrink-0">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <Icon size={20} className="text-slate-700 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-2">{description}</p>
                  <p className="text-xs text-slate-400">{useCases}</p>
                </div>
                <Link to={href} className="shrink-0 mt-1" aria-label={cta}>
                  <Button size="sm">
                    {cta}
                    <ArrowRight size={12} />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-semibold text-slate-900 mb-1">
              Payment Infrastructure Playground
            </p>
            <p className="text-sm text-slate-600">
              A sandbox for thinking through MENA payment infrastructure decisions.
            </p>
            <p className="text-xs text-slate-400 mt-2">
              v1.2 · Last updated May 2026 · React + TypeScript + Tailwind + Recharts
            </p>
            <p className="text-xs text-slate-400">© 2026 Hani Gharamah</p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 transition-colors"
            >
              <Github size={14} />
              Source
            </a>
            <span className="text-slate-300">·</span>
            <a
              href="#"
              className="flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 transition-colors"
            >
              <Linkedin size={14} />
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
