# Payment Infrastructure Playground

Interactive simulators for reasoning through payment infrastructure decisions in MENA-scale products and events.

The app is built as a portfolio-grade internal tooling artifact: it is not a consumer checkout UI. Each tool lets a PM, payments operator, risk analyst, or finance stakeholder change assumptions and see operational tradeoffs immediately.

## Tools

### Payment Routing Simulator

Routes synthetic transactions across Checkout.com, HyperPay MENA, and Moyasar.

- Configure gateway availability and success rates.
- Load preset scenarios for mega-event ticketing, super-app wallet, and merchant payouts.
- Build priority routing rules by currency, amount, and transaction type.
- Generate and process transaction batches.
- Compare approvals, declines, fallback usage, fees, and gateway distribution.

### Merchant Settlement Calculator

Models merchant payout economics across payment method mix and settlement timing.

- Presets for mega-event F&B vendors, food delivery platform cloud kitchens, and driver instant payouts.
- Calculates gross GMV, interchange, scheme fees, acquirer margin, gateway fees, instant payout premium, platform commission, net payout, and float cost.
- Exports a plain-text settlement report.

### Fraud Detection Playground

Tests configurable fraud rules against a deterministic synthetic dataset.

- Presets for ticket scalping, promo abuse, and card testing.
- Generates 100 transactions with known ground truth.
- Evaluates velocity, amount, device, IP, and decline-heavy rules.
- Reports confusion matrix, precision, recall, F1 score, false positive rate, fraud prevented, friction cost, and net benefit.

### Wallet Operations Dashboard

Simulates the internal dashboard used by a closed-loop wallet operations team.

- Monitors live ledger activity, float positions, approval queues, KYC limits, and cost of acceptance.
- Includes six views: Activity, Balances, Reconciliation, Approvals, KYC & Limits, and Cost Analytics.
- Simulates a day of wallet transactions and updates all views in memory.
- Shows double-entry ledger lines for expanded transactions.

### Cross-Border Payment Visualizer

Compares international payment rails for the same corridor.

- Presets for tourist payment, platform-wallet remittance, and merchant settlement.
- Compares correspondent banking, stablecoin rails, and regional payment networks.
- Shows fee breakdown, speed, recipient value, availability, regulatory risk, and compliance workflows.
- Supports custom corridor inputs with validation.

## Design System

The UI follows a strict operational design system:

- Slate-based palette with emerald accents.
- White and `slate-50` backgrounds.
- Borders instead of shadows.
- No gradients or purple styling.
- Inter for UI text.
- JetBrains Mono for transaction IDs, timestamps, and numeric values.
- `tabular-nums` for numeric displays.
- Compact section labels: `text-xs font-semibold uppercase tracking-wider text-slate-500`.

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Recharts
- Lucide React

## Getting Started

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Routes

- `/` - Landing page
- `/routing` - Payment Routing Simulator
- `/settlement` - Merchant Settlement Calculator
- `/fraud` - Fraud Detection Playground
- `/cross-border` - Cross-Border Payment Visualizer
- `/wallet-ops` - Wallet Operations Dashboard

## Validation Checklist

Before shipping changes:

- Run `npm run build`.
- Verify all preset scenarios load.
- Generate/process routing transactions.
- Export a settlement report.
- Generate and run fraud tests.
- Switch cross-border presets and custom amounts.
- Run Wallet Ops simulation, review approvals, inject a variance, and resolve exceptions.
- Check mobile layout around 375px width.
- Confirm charts render without console errors.

## Build Decisions

### Tool 1: Payment Routing Simulator

**The business problem**

Merchants in Saudi Arabia using a single payment gateway face two issues. Every 1% drop in authorization rate on SAR 10M/month volume costs around SAR 100K in lost revenue. And they overpay on fees for transactions where a cheaper gateway would work just as well. Mid-to-large merchants solve this with payment orchestration platforms like Payrails (which ride-hailing platform uses) or Spreedly. This tool demonstrates the routing logic those platforms run internally.

**Critical thinking moment**

When I started scoping this, I was planning to build separate routing simulators for mega-events, super-apps, and delivery platforms. Three different demos. Then I realized the underlying routing mechanics are the same across all three. Building three "different" versions would actually weaken the demo by suggesting they were more different than they are. I cut it down to one routing engine with multiple presets, which is closer to how real orchestration platforms work in production.

**Trade-off I made**

I looked at three approaches for the rules engine. Static IF/THEN rules. Weighted distribution where 70% goes to one gateway and 30% to another for redundancy. Or ML-based dynamic scoring. I went with static rules. Weighted distribution is more realistic in production, and ML routing is the actual frontier. But static rules are legible. A hiring manager can immediately see "this transaction matched Rule 2 because it was a mada card." For a portfolio demo, clarity beats sophistication.

**Decision I'd defend**

I made Moyasar the default gateway and Checkout.com a routing destination only for high-value or international transactions. Someone could argue you should distribute evenly or A/B test instead. My defense: 60-70% of Saudi e-commerce is mada, Moyasar has the best mada economics and approval rates locally, and "mada-first" is the right default for the Saudi market. International gateways are fallbacks, not equal options.

**Honest limitation**

The simulator doesn't model gateway downtime or latency variance. Real payment ops obsess over uptime (99.95% vs 99.5% is a major operational difference) and p95 latency. I have static success rate sliders but no failure injection, no degraded modes, no failover triggers. That's the realistic operational stress test that's missing.

**Next step**

I'd add cost-vs-success-rate tension. Right now routing optimizes one variable at a time. The harder PM problem is the trade-off. Moyasar has lower fees but a slightly lower approval rate than Checkout.com. For a SAR 5,000 transaction, is 0.3% in fee savings worth a 0.4% approval rate risk? A simulator that shows expected value (success rate × amount minus fees) would force this trade-off explicitly.

---

### Tool 2: Merchant Settlement Calculator

**The business problem**

Marketplace platforms like food delivery platform, food delivery platform, HungerStation, and Jahez take a percentage of every transaction. Payment processors take another percentage on top. For a cloud kitchen doing SAR 7,500/day in orders, the difference between a 20% effective take rate and a 22% take rate is SAR 5,500/month. That's life or death for thin-margin restaurants. This calculator shows where the money actually goes between gross revenue and net merchant payout.

**Critical thinking moment**

When I was researching mega-event payment infrastructure for the emagine Riyadh role, I was about to build the calculator with generic merchant categories. Then I realized real merchant economics depend heavily on payment method mix, not just category. A cloud kitchen with 90% mada cards has very different unit economics than one with 30% cash on delivery. I rebuilt the calculator with payment method mix as a first-class input. That's how ride-hailing platform and Stripe Capital actually model merchant cash flow.

**Trade-off I made**

I thought about modeling settlement complexity more accurately. Chargebacks, hold-back reserves, dispute escrow, monthly minimums. I cut all of it. A real merchant agreement has 20+ fee variables. Modeling them all would obscure the core lesson. I kept six: interchange, scheme fees, acquirer markup, gateway fees, instant settlement premium, and platform commission. These cover around 95% of effective take rate variation, which is the point.

**Decision I'd defend**

I included food delivery platform (18% commission) and driver (25%) as presets even though they're "competitor" platforms in some sense. Someone might argue I should make them generic. My defense: marketplace economics are real and recognizable. Showing them with actual platform numbers proves I've thought about real businesses, not toy examples. A super-app wallet PM would immediately recognize the math.

**Honest limitation**

The instant settlement premium is modeled as a flat 0.5% on T+0. In reality, instant payout pricing is often dynamic. ride-hailing platform charges drivers up to 1.5% for instant cash-out, with different rates by region and rider tier. I oversimplified to keep the model legible, but this understates how lucrative instant payouts actually are for platforms. It's a major revenue stream.

**Next step**

I'd add a "merchant cash flow over 30 days" view that shows working capital impact, not just per-transaction fees. The real PM insight isn't "instant payout costs 0.5%." It's "instant payout costs 0.5% but enables the driver to take more rides because they're not waiting on a paycheck, which increases platform GMV by X%." That second-order effect is where wallet PMs actually live.

---

### Tool 3: Fraud Detection Playground

**The business problem**

Fraud isn't a one-shot problem. It's a continuous trade-off between catching bad actors and creating friction for legitimate users. A false positive rate of 2% sounds low until you realize it means rejecting 2 out of every 100 real customers, who then go to a competitor. This tool makes that trade-off visible through precision/recall metrics and a cost analysis showing fraud prevented vs. friction cost.

**Critical thinking moment**

I was initially planning to use real fraud ML model concepts. Risk scoring, gradient boosting, all of that. Then I stopped and asked what the actual point of this demo is. A portfolio piece for PM roles isn't about ML implementation. It's about decision-making. The interesting PM question isn't "how does the model score risk." It's "where do you set the threshold, and what does it cost when you get it wrong." I rebuilt it as a rule engine where users see the precision/recall trade-off in real time, because that's the conversation PMs actually have with risk teams.

**Trade-off I made**

I considered separating the three preset rule sets into complexity tiers. Beginner velocity rules, intermediate device fingerprinting, advanced behavioral patterns. I rejected it. Real fraud teams don't operate in tiers. They layer all of it simultaneously. The presets show different fraud patterns (scalping, promo abuse, card testing) using the same rule engine. That mirrors how production fraud systems actually work.

**Decision I'd defend**

I designed the cost analysis to value fraud prevented at full transaction amount and friction cost at 20% of false-positive transaction value (representing cart abandonment). Someone could argue friction cost is much higher because alienating a customer has lifetime value implications. My defense for the conservative number: in interviews, I'd rather be challenged for understating friction than for using made-up customer lifetime numbers I can't defend.

**Honest limitation**

The fraud transaction generator uses static patterns. Eight small declines from one card means card testing, for example. Real fraud is adversarial and adaptive. Patterns change as defenses are deployed. A more sophisticated demo would show what happens when fraudsters adapt to your rules. That's the harder PM problem, and it's why teams at Adyen invest heavily in ML over rules.

**Next step**

I'd add a "what gets missed" view showing the false negatives in detail. Right now I show metrics, but the user doesn't see the fraud that slipped through. A PM working in risk would want to inspect those. Why didn't your rules catch it? What would catching it require? What's the trade-off cost? That's the conversation that gets you promoted.

---

### Tool 4: Cross-Border Payment Visualizer

**The business problem**

Saudi Arabia has around 13.5M expatriates, mostly remitting to South Asia. The remittance market is SAR 150B+ annually. Traditional correspondent banking takes 2-5 days and charges 8-10% in fees. super-app wallet, super-app wallet, and super-app wallet are competing for this market by offering faster, cheaper alternatives. This tool shows the three main rails (correspondent banking, stablecoin, and local networks) side by side, so a PM can see where the competitive opportunity actually is.

**Critical thinking moment**

I almost built this as a stablecoin showcase, treating crypto rails as the obvious winner. Then I caught the bias. The honest comparison includes use cases where correspondent banking is the right answer. Large B2B settlements where the parties already have established banking relationships, and where regulatory comfort matters more than 200bps in savings. I rebuilt the comparison to show realistic trade-offs across all three rails. Not a sales pitch for one.

**Trade-off I made**

I considered including more corridors. SAR to India, SAR to Bangladesh, SAR to Egypt, AED to Philippines. I picked three. Adding more would make the tool feel exhaustive but dilute the focus. The three I chose (CNY tourist, SAR/PKR remittance, USD merchant) cover the three distinct use cases. One-time consumer, recurring worker, B2B. Adding more would just be more permutations of the same three patterns.

**Decision I'd defend**

I labeled stablecoin rails as "Best Value" in the SAR/PKR remittance corridor. Someone could argue this is biased toward crypto. My defense: in that specific corridor, with current fees and the current regulatory environment, the numbers genuinely favor stablecoin rails. The recommendation isn't ideological. It's mathematical. If correspondent banking offered better rates in that corridor, I'd label it best value there.

**Honest limitation**

The regulatory steps are simplified. I show 4-5 compliance checkpoints per method, but real cross-border payments touch many more. FATF travel rule, OFAC screening, transaction monitoring, sanctions lists, AML risk scoring, beneficiary verification. I didn't go deeper because compliance depth would obscure the user experience comparison. A regulator-facing version of this tool would need much more.

**Next step**

I'd add liquidity and FX risk, which are the hidden costs that aren't on the receipt. When you off-ramp USDC to PKR, the exchange's PKR liquidity affects your effective rate. FX volatility means the rate quoted at 9am isn't the rate at 9:30am. Real cross-border PMs spend most of their time on liquidity sourcing and FX hedging, not on the visible fee structure.

---

### Tool 5: Wallet Operations Dashboard

**The business problem**

Closed-loop wallets like super-app wallet, super-app wallet, and Hala are infrastructure-heavy products. The customer sees a balance and a send button. Behind that, payment operations teams spend their day monitoring ledger integrity, reconciling customer float against bank accounts, managing KYC tiers, approving high-value transactions, and optimizing cost of acceptance. This dashboard simulates what those teams actually see. The back-office reality of running a wallet at scale.

**Critical thinking moment**

I started by conflating two different things. Payment wallets like Apple Pay and mada Pay, and stored-value wallets like super-app wallet and super-app wallet. When I researched what wallet PMs actually do, I realized these are different product categories with different infrastructure underneath. I rebuilt the simulator focused specifically on closed-loop stored-value wallets, because that's where the super-app wallet / super-app wallet / super-app wallet infrastructure PM roles actually exist. The Apple Pay angle is interesting but it's not where this category of PM works.

I also pushed back when the scope was creeping toward "add a transit ticketing simulator" because Saudi Metro uses open-loop EMV payments. The reasoning sounded good. Apple Pay express transit is real infrastructure. But mega-events don't use that flow. Tickets are pre-purchased. Catching that misalignment before building saved a week of work on something that wouldn't have strengthened the portfolio.

**Trade-off I made**

I thought about building this with full SAMA KYC tier compliance. Document upload simulations, AML alert workflows, sanctions screening. I cut it down to KYC tiers as a transaction constraint only. Tier 1 users hit their SAR 5,000 monthly limit and get blocked, with no compliance system around it. Building a real compliance flow would take weeks for marginal portfolio value. The transaction-level constraint demonstrates the concept without overbuilding.

**Decision I'd defend**

I included a "ledger vs. bank" reconciliation view with an "Inject Test Variance" button. Someone could argue this is too technical for a PM demo. My defense: reconciliation variance is the single most-mentioned skill in wallet PM job descriptions. HighLevel, Stripe, and Modern Treasury all list it. A PM portfolio piece that demonstrates understanding of double-entry ledgers and reconciliation is rarer than one that shows another consumer flow. And rare is what gets interviews.

**Honest limitation**

The "Simulate Day" function generates around 100 transactions, which is unrealistic for actual wallet scale. super-app wallet processes hundreds of thousands of transactions daily. super-app wallet processes millions. The simulator is a visualization of mechanics, not a stress test of infrastructure. A real wallet ops dashboard would need to handle millions of events per minute, which is an engineering problem I haven't addressed.

**Next step**

I'd add policy simulation on top of the current cost recommendations. The dashboard shows that card top-ups and instant payouts are expensive, but a real PM would want to test policy changes before rollout. For example: default drivers to standard payout, add a fee for instant payout, or nudge Tier 1 users toward bank transfer top-ups. The next version should show expected savings, approval impact, and user friction before a policy is shipped.

---

### What changed from the AI version

I went through the original draft and stripped out the things that sound like AI even when the content is right:

**Em-dashes are gone.** Every one of them. Replaced with periods, commas, or new sentences. AI loves the em-dash because it creates rhythm and packs in qualifiers. People writing under their own voice break thoughts into separate sentences.

**The "perfect three" pattern is broken.** AI defaults to lists of three. Three trade-offs, three reasons, three options. I varied to two, four, and five where it reads more naturally.

**Sentence length varies.** AI tends to write at one consistent length. I mixed short punchy lines ("Three different demos.") with longer ones to match how people actually talk.

**Contractions added where natural.** "It's" instead of "it is," "I'd" instead of "I would." Reads more like speech.

**Filler phrases removed.** Things like "demonstrates the back-office reality" became "shows what those teams actually see." Cleaner, less performative.

**The "rhythmic transitions" pattern is gone.** No more "And then." "Then I realized." "Catching that." AI overuses these to create momentum. I just let the next sentence start.

---

## Assumptions

All rates, fees, FX values, success rates, fraud labels, and settlement assumptions are hardcoded planning models. They are meant to demonstrate product and infrastructure tradeoffs, not provide financial, legal, or regulatory advice.
