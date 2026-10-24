import { useState } from 'react'
import {
  PoolAllocationChart,
  ReleaseRateChart,
  DeflationCurveChart,
  ClaimFlowChart,
  QuarterlyInjectionChart,
  VotingPowerChart,
  ROIComparisonChart,
  RewardHeatmapChart,
} from './EconomicsCharts'

// ── Utility Components ───────────────────────────────────────────────────────
function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-xl font-bold text-white border-b border-gray-700 pb-2 mb-4">{title}</h2>
      {children}
    </section>
  )
}
function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-base font-semibold text-blue-300 mb-3">{title}</h3>
      {children}
    </div>
  )
}
function Sub2({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h4 className="text-sm font-semibold text-gray-300 mb-2">{title}</h4>
      {children}
    </div>
  )
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-300 text-sm leading-relaxed mb-2">{children}</p>
}
function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-gray-800 rounded-lg p-3 text-xs text-green-300 overflow-x-auto mb-3 whitespace-pre-wrap">
      {children}
    </pre>
  )
}
function Table({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-800">
            {headers.map((h, i) => (
              <th key={i} className="text-left text-gray-300 font-medium px-3 py-2 border border-gray-700">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-850'}>
              {row.map((cell, j) => (
                <td key={j} className="text-gray-300 px-3 py-2 border border-gray-700">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
function ChartBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="my-4 border border-blue-900 rounded-xl overflow-hidden">
      <div className="bg-blue-950 px-4 py-1.5 text-xs text-blue-300 font-medium">📊 {label}</div>
      {children}
    </div>
  )
}
function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-blue-950 border border-blue-700 rounded-xl p-4 mb-4 text-blue-100 text-sm leading-relaxed">
      {children}
    </div>
  )
}
function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-orange-950 border border-orange-800 rounded-lg p-3 text-orange-200 text-xs mb-3">
      {children}
    </div>
  )
}
function InfoBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-4">
      <div className="text-white font-semibold text-sm mb-2">{title}</div>
      <div className="text-gray-300 text-xs leading-relaxed space-y-1">{children}</div>
    </div>
  )
}
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-gray-900 rounded-xl p-3 border border-gray-700 text-center">
      <div className="text-gray-400 text-xs mb-1">{label}</div>
      <div className="text-white font-bold text-base">{value}</div>
      {sub && <div className="text-gray-500 text-xs mt-0.5">{sub}</div>}
    </div>
  )
}

// ── TOC ──────────────────────────────────────────────────────────────────────
const TOC = [
  { id: 'exec',       label: '0. Executive Summary' },
  { id: 's1',         label: '1. Project Overview' },
  { id: 's2',         label: '2. Market Opportunity' },
  { id: 's3',         label: '3. Product Design' },
  { id: 's4',         label: '4. Economic Model' },
  { id: 's5',         label: '5. gArc Tokenomics' },
  { id: 's6',         label: '6. Technical Architecture' },
  { id: 's7',         label: '7. Security Design' },
  { id: 's8',         label: '8. Roadmap' },
  { id: 's9',         label: '9. Team & Funding' },
  { id: 's10',        label: '10. Risk Analysis' },
  { id: 'appendix',  label: 'Appendix: Formula Reference' },
]

export default function ProjectPlanEN() {
  const [tocOpen, setTocOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="sticky top-12 z-40 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-2 flex items-center justify-between">
        <div>
          <span className="text-white font-bold text-sm">GM Protocol</span>
          <span className="text-gray-500 text-xs ml-2">Investor Brief v1.0 — Confidential</span>
        </div>
        <button onClick={() => setTocOpen(o => !o)}
          className="text-xs text-gray-400 hover:text-white border border-gray-700 rounded px-2 py-1">
          {tocOpen ? 'Close TOC' : 'Table of Contents'}
        </button>
      </div>

      {/* TOC Dropdown */}
      {tocOpen && (
        <div className="sticky top-24 z-30 mx-auto max-w-4xl px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 grid grid-cols-2 md:grid-cols-3 gap-1 shadow-2xl">
            {TOC.map(t => (
              <a key={t.id} href={`#${t.id}`} onClick={() => setTocOpen(false)}
                className="text-xs text-blue-300 hover:text-white py-1 px-2 rounded hover:bg-gray-800 transition-colors">
                {t.label}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">

        {/* Cover */}
        <div className="text-center py-10 border-b border-gray-800">
          <div className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
            Investor Brief — Confidential
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-2">GM Protocol</h1>
          <p className="text-blue-300 text-lg font-medium mb-4">
            The On-Chain Daily Check-In Identity System for Arc Network
          </p>
          <p className="text-gray-400 text-sm max-w-xl mx-auto leading-relaxed">
            A self-sustaining, deflationary protocol where daily check-ins generate perpetual
            USDC yield, build verifiable on-chain identity, and drive gArc token scarcity —
            all without external subsidy.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-8 max-w-lg mx-auto">
            <StatCard label="Native Chain" value="Arc Network" sub="USDC as Gas" />
            <StatCard label="gArc Supply" value="10 Billion" sub="Fixed — Deflationary Only" />
            <StatCard label="Target Circulation" value="210 Million" sub="By 2032 (BTC parity)" />
          </div>
        </div>

        {/* 0. Executive Summary */}
        <Section id="exec" title="0. Executive Summary">
          <Highlight>
            <p className="font-semibold text-white mb-2">The One-Line Pitch</p>
            <p>
              GM Protocol is the on-chain identity and loyalty infrastructure for Arc Network —
              users pay 0.1 USDC daily to check in, dropouts subsidize stayers, and every
              reward claim burns gArc at a 9:8 ratio. The system is mathematically self-sustaining,
              requires zero ongoing subsidy, and grows stronger as more users participate.
            </p>
          </Highlight>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <InfoBox title="Why Now">
              <p>Arc Network launched its first L1 with USDC as native gas — a first in the industry. The ecosystem currently has ~44,944 DAU but lacks any native identity or loyalty infrastructure. GM Protocol is the natural first layer to build.</p>
            </InfoBox>
            <InfoBox title="Why This Model Works">
              <p>The economic insight: in any streak-based system, users who break their streak inevitably subsidize users who persist. GM Protocol formalises this into an on-chain perpetual engine. No VC top-up required after initial seeding.</p>
            </InfoBox>
            <InfoBox title="Sustainable by Design">
              <p>The reward pool operates on a percentage basis — it can never reach zero. Every USDC that enters the system can only exit through a 9:8 gArc buyback-and-burn. There is no leakage path that bypasses deflation.</p>
            </InfoBox>
            <InfoBox title="Comparable Solo Launches">
              <p>Uniswap v1 (Hayden Adams, solo, self-taught), Yearn Finance (Andre Cronje, solo, weeks to launch, peak TVL $6B). GM Protocol's contract complexity sits between these two precedents.</p>
            </InfoBox>
          </div>

          <Table
            headers={['Metric', 'Value']}
            rows={[
              ['Check-in fee', '0.1 USDC / day (DAO-adjustable)'],
              ['Reward pool allocation', '80% of all fees'],
              ['Buyback-burn ratio', '(9/8)×R per Claim — no bypass possible'],
              ['gArc total supply', '10 Billion (one-time mint, no re-issue)'],
              ['Target final circulation', '210 Million by 2032'],
              ['Deflation curve reference', 'BTC halving schedule (reverse quadratic)'],
              ['Cold-start sustainability', 'Pool never reaches zero (% model)'],
              ['External subsidy required', 'None after initial seeding'],
              ['Chain', 'Arc Network (Arc Testnet now → Arc Mainnet on TGE)'],
            ]}
          />
        </Section>

        {/* 1. Project Overview */}
        <Section id="s1" title="1. Project Overview">
          <Sub title="1.1 Positioning">
            <P>
              GM Protocol is deployed on Arc Network — the first EVM-compatible L1 where USDC is
              the native gas token. It operates as both a consumer-facing daily check-in incentive
              system and as Arc's foundational on-chain identity infrastructure layer.
            </P>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                <div className="text-blue-300 font-semibold text-sm mb-2">Surface Layer (Consumer Product)</div>
                <div className="text-gray-300 text-xs leading-relaxed">
                  Daily GM check-in with USDC micro-fee. Streak-based milestones unlock gArc rewards.
                  Simple, addictive, transparent — think a Duolingo streak backed by real economic incentives.
                </div>
              </div>
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                <div className="text-blue-300 font-semibold text-sm mb-2">Infrastructure Layer (Identity Protocol)</div>
                <div className="text-gray-300 text-xs leading-relaxed">
                  Time-weighted on-chain identity. Streak records + tiered KYC = verifiable real-user
                  credential. Third-party contracts can query any address's milestone level via a
                  public interface — Arc's Sybil-resistance primitive.
                </div>
              </div>
            </div>
          </Sub>

          <Sub title="1.2 Competitive Differentiation">
            <Table
              headers={['Dimension', 'Typical Competitors', 'GM Protocol']}
              rows={[
                ['Economic model', 'Pure subsidy, no self-loop', 'Self-sustaining perpetual engine'],
                ['Incentive source', 'One-directional VC spend', 'Dropouts subsidize persisters'],
                ['Identity value', 'None', 'Time-weighted on-chain credential (SBT)'],
                ['Sybil resistance', 'Weak or absent', 'Multi-tier progressive verification'],
                ['Token economics', 'Pure inflation', 'Fixed supply, deflation only, floor at 210M'],
                ['Transparency', 'Partial on-chain', '85–90% on-chain by design'],
                ['Sustainability', 'Collapses when subsidies end', 'Mathematically perpetual'],
              ]}
            />
          </Sub>

          <Sub title="1.3 Core Thesis">
            <Highlight>
              "Prove you are a real Arc user by showing up every day. Build on-chain reputation
              through time. Let the protocol reward persistence — not speculation."
            </Highlight>
          </Sub>
        </Section>

        {/* 2. Market Opportunity */}
        <Section id="s2" title="2. Market Opportunity">
          <Sub title="2.1 Arc Network — The Native Opportunity">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <StatCard label="Arc DAU" value="44,944" sub="Measured 2026" />
              <StatCard label="Est. Real Users" value="~4,500" sub="10% after bot filter" />
              <StatCard label="Identity Layer" value="None" sub="Zero incumbents" />
              <StatCard label="USDC as Gas" value="First L1" sub="Unique globally" />
            </div>
            <P>
              Arc is the first blockchain where USDC is the native gas token — a structural
              advantage that eliminates the "need ETH to buy ETH" onboarding problem. Every
              Arc user already holds USDC. GM Protocol's 0.1 USDC check-in fee is frictionless
              by design. No token swap required, no gas token to acquire separately.
            </P>
          </Sub>

          <Sub title="2.2 Web3 Identity — A $Billion Unmet Need">
            <P>
              The Web3 identity market (Sybil resistance, on-chain reputation, KYC-lite credentials)
              has no dominant Arc-native solution. Gitcoin Passport, Worldcoin, and ZKPassport
              are infrastructure pieces — GM Protocol is the first <em>application layer</em> that
              aggregates them into a consumer-facing product and mints durable SBT identity credentials.
            </P>
            <Table
              headers={['Use Case for GM Identity Data', 'Addressable Market Segment']}
              rows={[
                ['Airdrop Sybil filtering', 'Every Arc protocol doing a token launch'],
                ['DAO governance voting weight', 'Every Arc DAO (including GM Protocol itself)'],
                ['Partner project user qualification', 'DeFi, gaming, NFT projects on Arc'],
                ['KYC-lite compliance layer', 'RWA, lending, regulated DeFi on Arc'],
              ]}
            />
          </Sub>

          <Sub title="2.3 Total Addressable Market (Conservative Scenario)">
            <P>
              Based on Arc Network trajectory and comparable check-in protocols across EVM chains:
            </P>
            <Table
              headers={['Scenario', 'Daily Active Users', 'Annual Check-in Revenue', 'Annual GM Pool Flow']}
              rows={[
                ['Cold Start (Year 1)', '450 users', '~$16,425', '~$13,140 (80%)'],
                ['Base Case (Year 2–3)', '2,000 users', '~$73,000', '~$58,400 (80%)'],
                ['Growth Case (Year 4–5)', '10,000 users', '~$365,000', '~$292,000 (80%)'],
                ['Bull Case (Year 5+)', '44,944 users (full DAU)', '~$1,640,000', '~$1,312,000 (80%)'],
              ]}
            />
            <Warning>
              ⚠️ All projections above are model estimates based on 2026 Arc DAU data and industry
              churn-rate benchmarks. Actual participation rates could diverge significantly in either
              direction as the ecosystem scales. The protocol remains solvent in every scenario due
              to its percentage-based pool model.
            </Warning>
          </Sub>
        </Section>

        {/* 3. Product Design */}
        <Section id="s3" title="3. Product Design">
          <Sub title="3.1 Check-In Mechanics">
            <P>
              Each check-in costs <strong className="text-white">0.1 USDC</strong>, processed
              on-chain via the GMCheckIn contract. The daily window resets at{' '}
              <strong className="text-white">UTC 00:00</strong> — a fixed daily cadence, not a
              rolling 24-hour cooldown, ensuring fair and consistent participation across global time zones.
            </P>
            <Table
              headers={['Parameter', 'Value', 'Governance']}
              rows={[
                ['Check-in fee (f)', '0.1 USDC', 'DAO-adjustable'],
                ['Daily reset', 'UTC 00:00', 'Fixed'],
                ['Record', 'On-chain, permanent', 'Immutable'],
                ['Gas token', 'USDC (Arc native)', 'No separate gas needed'],
              ]}
            />
          </Sub>

          <Sub title="3.2 Milestone System">
            <P>
              Four milestone tiers based on consecutive check-in streaks. Each milestone mints a
              non-transferable SBT (Soul-Bound Token) as a permanent identity credential.
              Milestones can be re-triggered after a streak break — the system rewards every
              new commitment, not just the first.
            </P>
            <Table
              headers={['Milestone', 'Streak Required', 'Badge', 'Reward Pool Release %']}
              rows={[
                ['Bronze', '30 days', 'Bronze SBT', '1.5% (r = 0.015)'],
                ['Gold', '90 days', 'Gold SBT', '10% (r = 0.10)'],
                ['Platinum', '180 days', 'Platinum SBT', '15% (r = 0.15)'],
                ['Legend', '365 days', 'Legend SBT', '18% (r = 0.18)'],
              ]}
            />
            <P>
              The release percentages follow a reverse cubic function — Bronze is intentionally
              low (filters speculators), Gold jumps sharply (rewards commitment), Platinum/Legend
              flatten (scarcity premium for the most dedicated).
            </P>
            <ChartBlock label="C.5 Milestone Release Rate Curve">
              <ReleaseRateChart />
            </ChartBlock>
          </Sub>

          <Sub title="3.3 SBT Identity Credentials">
            <P>
              Each milestone mints a non-transferable SBT recording: achievement timestamp,
              streak length, and iteration count (e.g. "3rd time reaching Gold"). These credentials
              form Arc's native Sybil-resistance and reputation layer — any third-party contract
              can query an address's highest milestone tier via a public interface.
            </P>
          </Sub>

          <Sub title="3.4 Partner Project Integration">
            <P>
              Partner projects can deploy independent reward pools within GM Protocol. Users who
              complete a partner GM check-in simultaneously satisfy the main GM streak requirement
              (shared cooldown). Partners define their own milestone schedule (1–52 week tiers)
              and reward amounts; the same 8:1:1 flow applies to their pool.
            </P>
            <Table
              headers={['Task Type', 'Examples', 'Education Intent']}
              rows={[
                ['A — On-chain action', 'Swap, deposit, hold token', 'Verifiable usage'],
                ['B — Educational content', 'Watch 3-min video, read article, 1-question quiz', 'Knowledge verification'],
                ['C — Composite', 'Read + quiz, video + on-chain action', 'Deepest engagement'],
              ]}
            />
          </Sub>

          <Sub title="3.5 Identity Verification Stack">
            <Table
              headers={['Layer', 'Trigger', 'Requirement', 'Anti-Sybil Cost']}
              rows={[
                ['Layer 0', 'First check-in', 'Human Passport API scan (silent)', 'Zero (open participation)'],
                ['Layer 1', 'Bronze Claim', 'Gitcoin Passport Stamps ≥ 20', 'Low (social accounts)'],
                ['Layer 2', 'Gold/Platinum Claim', 'Stamps ≥ 20 + ZKPassport OR Stamps ≥ 35', 'High (real passport)'],
                ['Layer 3', 'Legend Claim', 'Layer 2 + dual-exchange KYC', 'Extreme (2× real-world KYC)'],
              ]}
            />
          </Sub>
        </Section>

        {/* 4. Economic Model */}
        <Section id="s4" title="4. Economic Model">
          <Sub title="4.1 GM Pool Allocation">
            <P>
              Every 0.1 USDC check-in fee is split on-chain at the contract level — no discretionary
              allocation, no admin key controls the split.
            </P>
            <Table
              headers={['Destination', 'Allocation', 'Purpose']}
              rows={[
                ['Milestone Reward Pool', '80%', 'Milestone Claim rewards — the primary user incentive'],
                ['Reserve Treasury', '10%', 'Provides the extra (1/8)×R for each Claim buyback'],
                ['Protocol Treasury', '5%', 'Founder/team allocation — vested via Claim mechanism'],
                ['Partner Reserve', '5%', 'Partner project reward channel — same burn mechanics'],
              ]}
            />
            <ChartBlock label="GM Pool Allocation">
              <PoolAllocationChart />
            </ChartBlock>
          </Sub>

          <Sub title="4.2 The Buyback-Burn Engine (Core Mechanism)">
            <Highlight>
              <p className="font-semibold text-white mb-1">The Key Insight</p>
              <p>
                Every single USDC that enters the GM pool can only exit through a gArc
                buyback-and-burn. There is no leakage path. User rewards, founder allocation,
                and partner payouts all share the same exit mechanic — buy gArc from the open
                market, burn it, release equivalent gArc from the Claim pool to the recipient.
              </p>
            </Highlight>
            <Code>{`For a single Claim of user reward R (USDC):

  ① Pool deduction    = (9/8) × R  =  1.125R USDC
  ② Primary buyback   = R USDC  →  buy gArc from AMM  →  burn
  ③ Extra buyback     = (1/8)×R USDC  →  from Reserve Treasury  →  burn
  ④ User receives     = R / Pg  gArc  (released from Claim pool, 1:1)
  ⑤ Total gArc burned = (9/8) × R / Pg

Example (Gold milestone, P = 3,246 USDC, N = 54 users, Pg = 0.00002 USDC/token):
  R           = 3,246 × 0.10 / 54   =  6.01 USDC
  Pool deducts = 1.125 × 6.01       =  6.76 USDC
  Primary burn = 6.01 / 0.00002     =  300,500 gArc
  Extra burn   = (6.01/8)/0.00002   =   37,563 gArc
  User gets    = 300,500 gArc (from Claim pool)
  Net burn/user=  37,563 gArc  (the 1/8 portion)

Extreme scenario validation (full pool = 10,000 USDC, all users Claim same day):
  Reward pool R_total = 8,000 USDC → Pool deducts 9,000 USDC
    8,000 USDC  →  primary buyback burn
    1,000 USDC  →  from Reserve Treasury (10%) extra burn
  Pool remaining = 10,000 - 9,000 = 1,000 USDC
    = Protocol Treasury 5% (500) + Partner Reserve 5% (500)
  ✓ Pool allocation is internally consistent: 80% + 10% = 90% = (9/8) × 80%`}</Code>
            <ChartBlock label="C.3 Single Claim Fund Flow">
              <ClaimFlowChart />
            </ChartBlock>
          </Sub>

          <Sub title="4.3 Sustainability Model">
            <div className="bg-blue-950 border border-blue-800 rounded-lg p-3 mb-3 space-y-1">
              <div className="text-blue-300 text-xs font-semibold mb-1">📋 Model Assumptions (Cold-Start Baseline)</div>
              <div className="text-blue-200 text-xs space-y-0.5">
                <div>· Arc Network DAU = 44,944 (2026 measured)</div>
                <div>· Real user rate = 10% (~4,500 after bot filter)</div>
                <div>· Check-in adoption = 10% of real users = 450 participants (conservative cold-start)</div>
                <div>· User cohorts: C1 persistent 10% (45) / C2 goal-driven 25% (112) / C3 casual churn 65% (293)</div>
                <div>· C3 churn rates: ~63–78% by day 30, ~91–98% by day 180 (industry benchmark)</div>
              </div>
            </div>
            <P>
              The perpetual engine: users who break their streak continue funding the pool
              without receiving milestone rewards. Their daily 0.1 USDC automatically
              replenishes whatever the previous day's Claims withdrew. The pool is structurally
              never exhausted — it operates on percentages, not absolute values.
            </P>
            <Table
              headers={['Year', 'Reward Pool Balance', 'Reserve Treasury', 'Cumulative USDC Burned']}
              rows={[
                ['Year 1', '2,284 USDC', '286 USDC', '251 USDC'],
                ['Year 3', '3,056 USDC', '382 USDC', '974 USDC'],
                ['Year 5', '3,246 USDC', '406 USDC', '1,769 USDC'],
              ]}
            />
            <Warning>
              ⚠️ These figures represent the cold-start steady state (zero external injection,
              450 participants). Real participation at 2,000+ users scales these numbers
              proportionally — pool balance at 2,000 users ≈ 7× higher. The model is linear
              in participation; the deflation mechanics accelerate non-linearly.
            </Warning>
          </Sub>

          <Sub title="4.4 Milestone Return Analysis">
            <Warning>
              ⚠️ All figures below are model estimates for cold-start conditions (zero external
              injection, steady-state pool P ≈ 3,246 USDC). These numbers reflect pure USDC
              return only. Real user return = USDC reward + gArc appreciation. Cold-start
              negative USDC returns are a deliberate design choice to filter speculators.
            </Warning>
            <Table
              headers={['Milestone', 'Release %', 'Est. Users (N)', 'Single Reward (R)', 'Check-in Cost', 'USDC ROI (cold)']}
              rows={[
                ['Bronze 30d', '1.5%', '79 ⚠️ est.', '0.09 USDC ⚠️ est.', '3.0 USDC', '-97% ⚠️ est.'],
                ['Gold 90d', '10%', '54 ⚠️ est.', '6.01 USDC ⚠️ est.', '9.0 USDC', '-33% ⚠️ est.'],
                ['Platinum 180d', '15%', '48 ⚠️ est.', '10.14 USDC ⚠️ est.', '18.0 USDC', '-44% ⚠️ est.'],
                ['Legend 365d', '18%', '46 ⚠️ est.', '12.70 USDC ⚠️ est.', '36.5 USDC', '-65% ⚠️ est.'],
              ]}
            />
            <P>
              Break-even formula: <strong className="text-white">P_min = D × f × N / r</strong>
            </P>
            <Table
              headers={['Milestone', 'Break-Even Pool (P_min)', 'At P = 16,000 USDC (hot-start)  USDC ROI']}
              rows={[
                ['Bronze', '≥ 15,800 USDC', '+6%'],
                ['Gold', '≥ 4,860 USDC', '+233%'],
                ['Platinum', '≥ 5,760 USDC', '+137%'],
                ['Legend', '≥ 9,328 USDC', '+75%'],
              ]}
            />
            <ChartBlock label="D. Milestone ROI — Cold Start vs Hot Start">
              <ROIComparisonChart />
            </ChartBlock>
            <ChartBlock label="C.2 Single Reward Heatmap (P × N → R)">
              <RewardHeatmapChart />
            </ChartBlock>
          </Sub>
        </Section>

        {/* 5. gArc Tokenomics */}
        <Section id="s5" title="5. gArc Tokenomics">
          <Sub title="5.1 Supply Structure">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
              <StatCard label="Total Supply" value="10 Billion" sub="One-time mint, no re-issue" />
              <StatCard label="Inflation" value="Zero" sub="Deflation only" />
              <StatCard label="Target Circulation" value="210 Million" sub="By 2032" />
              <StatCard label="Initial Liquidity" value="5 Billion (50%)" sub="One-time AMM injection" />
              <StatCard label="Claim Pool (bridge)" value="4.79 Billion (47.9%)" sub="Buyback-released to users" />
              <StatCard label="Permanent Floor" value="210 Million (2.1%)" sub="Never destroyed" />
            </div>
            <Code>{`Supply equation:
  10B = 2.1B (permanent floor)
      + 4.79B (Claim pool — bridge, not new issuance)
      + 5.0B (initial liquidity)

  The 5.0B liquidity figure is the natural solution to the equation:
  L = 2.1B + 4.79B × (10/9) = 5.0B  ✓

Claim pool internal allocation (mirrors GM pool split):
  User GM rewards   : 80% × 4.79B = 4.258B gArc
  Founder/team      :  5% × 4.79B = 0.266B gArc
  Partner projects  :  5% × 4.79B = 0.266B gArc`}</Code>
          </Sub>

          <Sub title="5.2 The Deflationary Closed Loop">
            <Code>{`User checks in → USDC enters GM pool (80% reward / 10% reserve / 5% protocol / 5% partner)
      ↓
Any Claim event → USDC buys gArc from AMM → burned
      ↓
Claim pool releases equal gArc → to user/team/partner
      ↓
Reserve treasury simultaneously → extra (1/8)×R buyback burn
      ↓
Liquidity pool gArc supply shrinks → approaches 210M floor
      ↓
Price support strengthens → each gArc becomes scarcer
      ↓
gArc appreciation amplifies real user return beyond pure USDC ROI`}</Code>
            <P>
              This loop has no leakage: every USDC that enters the system must exit
              through a buyback-burn. Protocol treasury and partner pools face the same
              mechanic — locked, then claimable only via the same burn pathway.
            </P>
          </Sub>

          <Sub title="5.3 Deflation Curve — Inspired by Bitcoin">
            <P>
              The gArc deflation schedule follows a <strong className="text-white">reverse quadratic curve</strong>,
              front-loaded like Bitcoin's halving structure — aggressive early deflation, tapering
              to near-zero by year 6. The 2032 target aligns with BTC's estimated 95.24% supply
              issuance milestone.
            </P>
            <Code>{`Cumulative burn formula:   C(t) = 1 − (1 − t/6)²     t ∈ [0, 6]
Annual burn rate:          d(t) = (13 − 2t) / 36

Year 1: d(1) = 11/36 ≈ 30.56%  →  burn ≈ 1.464B gArc
Year 3: d(3) = 7/36  ≈ 19.44%  →  burn ≈ 0.931B gArc
Year 6: d(6) = 1/36  ≈  2.78%  →  burn ≈ 0.133B gArc
Cumulative by 2032: ≈ 4.789B burned → circulation ≈ 211M`}</Code>
            <ChartBlock label="C.6 gArc Deflation Curve vs BTC Reference">
              <DeflationCurveChart />
            </ChartBlock>
          </Sub>

          <Sub title="5.4 Initial Capital Allocation Formula">
            <P>
              The split between GM pool seeding (G) and liquidity injection (L) is derived
              mathematically from the Year 1 target burn rate of 30.56%:
            </P>
            <Code>{`G / L = (Year 1 target burn rate × Claim pool) / (Initial liquidity × Reserve rate)
       = (30.56% × 4.79B) / (5.0B × 10%)
       ≈ 2.926

G = F × 74.5%  (seeded into GM pool, disbursed quarterly over 6 years)
L = F × 25.5%  (one-time AMM liquidity injection, admin key burned after)

Example (F = $10,000 USDC):
  G = $7,450  →  quarterly injections over 24 quarters
  L = $2,550  →  one-time, permissionless thereafter`}</Code>
          </Sub>

          <Sub title="5.5 Quarterly DAO Injection Schedule">
            <P>
              The G portion is released via DAO vote over 24 quarters. The formula is fixed —
              DAO can only vote to execute on time or delay by up to one month.
            </P>
            <Code>{`Q(q) = G × (49 − 2q) / 576     q = 1, 2, …, 24

Q(1)  = G × 47/576  ≈  8.16% of G  (largest quarter)
Q(12) = G × 25/576  ≈  4.34% of G
Q(24) = G × 1/576   ≈  0.17% of G  (smallest quarter)`}</Code>
            <ChartBlock label="C.8 Quarterly DAO Injection Schedule (24 Quarters)">
              <QuarterlyInjectionChart />
            </ChartBlock>
          </Sub>
        </Section>

        {/* 6. Technical Architecture */}
        <Section id="s6" title="6. Technical Architecture">
          <Sub title="6.1 Contract System">
            <Table
              headers={['Contract', 'Function', 'On-Chain %']}
              rows={[
                ['GMToken (gArc)', 'ERC-20, fixed supply, burn-only', '100%'],
                ['GMCheckIn', 'Check-in logic, UTC reset, fee split', '100%'],
                ['GMMilestone', 'Streak tracking, SBT minting, Claim calc', '100%'],
                ['GMRewardPool', 'Pool management, snapshot, distribution', '100%'],
                ['GMReserve', 'Reserve treasury, buyback trigger, burn exec', '100%'],
                ['GMClaimBridge', 'Claim pool management, gArc release', '100%'],
                ['GMPartner', 'Partner registry, independent pools, milestones', '100%'],
                ['GMIdentity', 'Passport/ZKPassport integration interface', 'Verify on-chain, proof off-chain'],
                ['GMGovernance', 'DAO voting, injection proposals, weight calc', '100%'],
              ]}
            />
          </Sub>

          <Sub title="6.2 On-Chain Coverage: 85–90%">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="bg-green-950 border border-green-800 rounded-xl p-3">
                <div className="text-green-300 font-semibold text-xs mb-2">100% On-Chain</div>
                <div className="text-green-100 text-xs space-y-0.5">
                  <div>· All fund flows (check-in fee → pool split)</div>
                  <div>· Milestone determination and reward calculation</div>
                  <div>· SBT minting and identity queries</div>
                  <div>· Buyback-burn execution via AMM</div>
                  <div>· DAO voting, weight calculation</div>
                  <div>· Partner pool management</div>
                </div>
              </div>
              <div className="bg-yellow-950 border border-yellow-800 rounded-xl p-3">
                <div className="text-yellow-300 font-semibold text-xs mb-2">Off-Chain Assist (10–15%)</div>
                <div className="text-yellow-100 text-xs space-y-0.5">
                  <div>· ZKPassport ZK proof generation (mobile, verified on-chain)</div>
                  <div>· Human Passport Stamps aggregation (verified on-chain)</div>
                  <div>· Partner video/article verification (frontend soft-check)</div>
                  <div>· Chainlink Automation fallback trigger (pending Arc availability)</div>
                </div>
              </div>
            </div>
          </Sub>

          <Sub title="6.3 MEV Defense — Three-Layer Architecture">
            <Table
              headers={['Layer', 'Trigger', 'Incentive', 'Fallback']}
              rows={[
                ['Layer 1', 'User-triggered', '0.1% bounty (grows to 1% over time)', 'Primary'],
                ['Layer 2', 'Chainlink Automation', 'None (protocol cost)', 'Secondary'],
                ['Layer 3', 'Project bot', 'None (transparent, replaceable)', 'Last resort'],
              ]}
            />
            <P>
              Each buyback uses a random USDC amount (10–30% of reserve) derived from{' '}
              <code className="text-green-300 bg-gray-800 px-1 rounded">block.prevrandao</code>,
              with a 30-minute cooldown and 0.5% maximum slippage protection.
            </P>
          </Sub>

          <Sub title="6.4 Frontend (5-Page Transparency Dashboard)">
            <Table
              headers={['Page', 'Priority', 'Key Features']}
              rows={[
                ['GM Check-In', 'P0', 'Connect wallet, one-tap check-in, streak counter, milestone progress bar'],
                ['Protocol Dashboard', 'P0', 'Live pool balances, gArc circulation, deflation progress, burn history'],
                ['Personal Profile', 'P1', 'SBT badge cabinet, check-in calendar heatmap, Claim history'],
                ['Partner Projects', 'P2', 'Available tasks, partner pool balances, contribution stats'],
                ['Economics Model', 'P2', 'Live curves, Sankey fund-flow chart, 3-scenario projections'],
              ]}
            />
          </Sub>
        </Section>

        {/* 7. Security Design */}
        <Section id="s7" title="7. Security Design">
          <Sub title="7.1 Sybil Resistance">
            <P>Progressive multi-layer verification — cost of attack escalates with milestone tier.
              Bronze-level Sybil attacks are tolerated and actually welcome (they fund the pool).
              Legend-level requires dual real-world KYC — attack cost is prohibitive.</P>
          </Sub>
          <Sub title="7.2 Governance Attack Defense (50% Attack)">
            <P>Three-layer protection replaces naive token-weighted voting:</P>
            <Table
              headers={['Layer', 'Mechanism', 'What It Prevents']}
              rows={[
                ['1 — SBT Gate', 'Fund-related votes require Gold+ SBT (90+ day streak)', 'Day-1 whale takeover'],
                ['2 — Streak Coefficient', 'Voting weight = gArc held × S (0.1×–6×, real-time streak)', 'Passive large-holder dominance'],
                ['3 — Time Lock', '24h–7d execution delay by proposal type', 'Flash-governance attacks'],
              ]}
            />
            <ChartBlock label="C.9 DAO Voting Power — Streak Coefficient Impact">
              <VotingPowerChart />
            </ChartBlock>
          </Sub>
          <Sub title="7.3 Contract Security Principles">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <InfoBox title="No Upgrade Proxy">
                <p>Contracts are immutable post-deployment. No admin key can alter logic.
                   Fully decentralised from day one.</p>
              </InfoBox>
              <InfoBox title="No Admin Key Holds Funds">
                <p>All USDC flows through contract logic only. No multisig can unilaterally
                   withdraw pool funds.</p>
              </InfoBox>
              <InfoBox title="Liquidity Permissions Burned">
                <p>After initial AMM liquidity injection, the LP admin key is permanently
                   burned. Liquidity is irremovable.</p>
              </InfoBox>
              <InfoBox title="Open Audit Policy">
                <p>Community public audit on Testnet, professional audit before Mainnet launch.
                   All source code open-sourced.</p>
              </InfoBox>
            </div>
          </Sub>
        </Section>

        {/* 8. Roadmap */}
        <Section id="s8" title="8. Roadmap">
          <Table
            headers={['Phase', 'Timeline', 'Key Milestones']}
            rows={[
              ['Phase 0 — Design & Build', '2026 Q4 (current)', 'Economics finalised ✓, Architecture complete ✓, Contract development, Arc Testnet deploy, Basic frontend'],
              ['Phase 1 — Testnet Full', '2027 Q1', 'Full contract suite, Human Passport integration, Transparency dashboard, 100 real test users, Parameter calibration'],
              ['Phase 2 — Ecosystem', '2027 Q2', 'First 3–5 Arc partner integrations, ZKPassport live, DAO governance contract, Arc official outreach, Seed funding close'],
              ['Phase 3 — Mainnet Launch (TGE)', '2027 Q3', 'Token Generation Event, AMM liquidity injection (L = F×25.5%), Q1 DAO injection (G×8.16%), Live on Arc Mainnet'],
              ['Phase 4 — Long-Term', '2027 Q4+', 'Quarterly DAO injections, Partner expansion, Identity API open to third parties, 2032 target: ~211M gArc circulation'],
            ]}
          />
        </Section>

        {/* 9. Team & Funding */}
        <Section id="s9" title="9. Team & Use of Funds">
          <Sub title="9.1 Team">
            <Highlight>
              <p className="font-semibold text-white mb-1">Solo Founder / Full-Stack Developer</p>
              <p>
                One person. Full-stack capability across Solidity smart contracts, React/TypeScript
                frontend, and economic system design. This project's contract complexity sits between
                Uniswap v1 (Hayden Adams, solo, self-taught) and Yearn Finance (Andre Cronje, solo,
                weeks to deploy, peak TVL $6B). Arc Studio AI-assisted development accelerates delivery.
                The hardest part — the economic design — is already complete.
              </p>
            </Highlight>
          </Sub>

          <Sub title="9.2 Funding Request & Use of Funds">
            <P>
              GM Protocol can launch at any funding level. The system is self-sustaining
              post-launch — no recurring subsidy required. Funding determines launch quality,
              not launch viability.
            </P>
            <Table
              headers={['Funding Scenario', 'GM Pool Seed (G = 74.5%)', 'Liquidity (L = 25.5%)', 'Expected Hot-Start Reward Pool']}
              rows={[
                ['Minimum ($10K)', '$7,450 USDC', '$2,550 USDC', '~$4,860+ (Gold positive ROI immediate)'],
                ['Seed ($50K)', '$37,250 USDC', '$12,750 USDC', '~$24,000+ (all milestones positive ROI)'],
                ['Series A ($200K)', '$149,000 USDC', '$51,000 USDC', '~$96,000+ (deep positive ROI, viral incentive)'],
              ]}
            />
            <Code>{`Formula:
  G = F × 74.5%  →  distributed to GM pool over 24 quarters
  L = F × 25.5%  →  one-time AMM liquidity, irremovable after launch

Hot-start reward pool (Year 1 Q1 injection):
  P_Q1 ≈ G × 8.16% = F × 74.5% × 8.16%
  At F = $50,000:  P_Q1 ≈ $3,041 USDC per quarter injection
  Total Year 1 pool from injections: G × (47+41+33+25)/576 ≈ G × 25.35%`}</Code>
          </Sub>

          <Sub title="9.3 Founder Token Allocation">
            <P>
              Zero pre-allocated tokens. Founder/team compensation flows exclusively through
              the Protocol Treasury channel (5% of daily check-in fees), subject to the
              same Claim mechanism and buyback-burn as all other participants. Founder
              incentives are fully aligned with protocol health.
            </P>
          </Sub>
        </Section>

        {/* 10. Risk Analysis */}
        <Section id="s10" title="10. Risk Analysis">
          <Sub title="10.1 Technical Risks">
            <Table
              headers={['Risk', 'Level', 'Mitigation']}
              rows={[
                ['Smart contract vulnerability', 'High', 'Open-source audit, community review, no upgrade proxy limits attack surface'],
                ['MEV front-running on buyback', 'Medium', 'Three-layer trigger arch, 0.5% slippage cap, randomised amount via prevrandao'],
                ['No DEX available on Arc', 'Medium', 'Deploy minimal AMM or integrate first DEX on Arc; monitor ecosystem maturation'],
                ['Chainlink not yet on Arc', 'Low', 'User-trigger layer + project bot is sufficient fallback; Layer 2 is optional'],
              ]}
            />
          </Sub>
          <Sub title="10.2 Economic Risks">
            <Table
              headers={['Risk', 'Level', 'Mitigation']}
              rows={[
                ['Low initial participation', 'Medium', 'System solvent at any participation level; economics scale linearly'],
                ['gArc price decline', 'Medium', 'USDC-anchored buyback increases in gArc terms during price drops — anti-fragile'],
                ['Sybil attack at Bronze tier', 'Medium', 'Tolerated by design — Sybil users contribute to pool without extracting disproportionate value'],
                ['Reward unattractive in cold-start', 'Low', 'Negative USDC ROI is intentional filter; gArc upside is primary user incentive'],
              ]}
            />
          </Sub>
          <Sub title="10.3 Ecosystem Risks">
            <Table
              headers={['Risk', 'Level', 'Mitigation']}
              rows={[
                ['Arc Network underperforms', 'Medium', 'Arc is Circle\'s own L1, USDC-native — strong institutional backing'],
                ['No partner projects onboard', 'Low', 'Protocol operates standalone; partners are additive, not load-bearing'],
                ['Regulatory scrutiny', 'Low', 'No ICO, no presale, no investment solicitation — pure on-chain participation mechanics'],
              ]}
            />
          </Sub>
        </Section>

        {/* Appendix */}
        <Section id="appendix" title="Appendix: Formula Reference">
          <Sub title="Variable Definitions">
            <Table
              headers={['Symbol', 'Definition', 'Unit']}
              rows={[
                ['f', 'Single check-in fee', 'USDC'],
                ['U', 'Daily check-in participants', 'persons'],
                ['P', 'Current reward pool balance', 'USDC'],
                ['r', 'Milestone release ratio (decimal)', '—'],
                ['N', 'Users achieving milestone on a given day', 'persons'],
                ['R', 'Single-user reward', 'USDC'],
                ['D', 'Consecutive days required for milestone', 'days'],
                ['Pg', 'Current gArc market price', 'USDC/token'],
                ['F', 'Total raise amount', 'USDC'],
                ['G', 'Raise allocated to GM pool', 'USDC'],
                ['L', 'Raise allocated to liquidity', 'USDC'],
                ['t', 'Year index (1–6)', 'year'],
                ['q', 'Quarter index (1–24)', 'quarter'],
                ['C(t)', 'Cumulative burn ratio at end of year t', '—'],
                ['d(t)', 'Annual burn rate in year t', '—'],
                ['Q(q)', 'DAO injection amount in quarter q', 'USDC'],
                ['V', 'Address voting weight', 'votes'],
                ['S', 'Streak coefficient (0.1×–6×)', 'multiplier'],
              ]}
            />
          </Sub>

          <Sub title="Core Formulas">
            <Sub2 title="C.1 — Daily Pool Inflow">
              <Code>{`Reward pool daily inflow   = f × U × 80%
Reserve treasury daily     = f × U × 10%
Protocol treasury daily    = f × U × 5%
Partner reserve daily      = f × U × 5%

Example (f = 0.1, U = 450):  Reward pool += 36 USDC/day`}</Code>
            </Sub2>
            <Sub2 title="C.2 — Single-User Reward">
              <Code>{`R = P × r / N

Example (P = 3,246, r = 0.10, N = 54):  R = 6.01 USDC`}</Code>
              <ChartBlock label="C.2 Reward Heatmap (P × N → R, select milestone)">
                <RewardHeatmapChart />
              </ChartBlock>
            </Sub2>
            <Sub2 title="C.3 — Buyback-Burn per Claim">
              <Code>{`Pool deduction = (9/8) × R
Primary burn   = R / Pg  gArc
Extra burn     = (1/8) × R / Pg  gArc
User receives  = R / Pg  gArc  (from Claim pool)
Total burned   = (9/8) × R / Pg  gArc`}</Code>
            </Sub2>
            <Sub2 title="C.4 — Break-Even Pool Size">
              <Code>{`P_min = D × f × N / r

Example (Gold: D=90, f=0.1, N=54, r=0.10):  P_min = 4,860 USDC`}</Code>
            </Sub2>
            <Sub2 title="C.5 — Release Rate Curve">
              <Code>{`Discrete anchors: r(30)=1.5%, r(90)=10%, r(180)=15%, r(365)=18%
Interpolation: reverse cubic S-curve  r(D) ≈ 18% × (3t² − 2t³), t = D/365`}</Code>
              <ChartBlock label="C.5 Milestone Release Rate Curve">
                <ReleaseRateChart />
              </ChartBlock>
            </Sub2>
            <Sub2 title="C.6 — Deflation Curve">
              <Code>{`C(t) = 1 − (1 − t/6)²        t ∈ [0, 6]
d(t) = (13 − 2t) / 36         t = 1…6

t=1: C=30.56%, burn ≈ 1.464B gArc
t=6: C=100%,   cumulative ≈ 4.789B gArc burned`}</Code>
              <ChartBlock label="C.6 gArc Deflation Curve">
                <DeflationCurveChart />
              </ChartBlock>
            </Sub2>
            <Sub2 title="C.7 — Capital Allocation">
              <Code>{`G/L = (d(1) × Claim pool) / (Initial liquidity × Reserve rate)
    = (30.56% × 4.79B) / (5.0B × 10%) ≈ 2.926
G = F × 74.5%,   L = F × 25.5%`}</Code>
            </Sub2>
            <Sub2 title="C.8 — Quarterly Injection">
              <Code>{`Q(q) = G × (49 − 2q) / 576     q = 1…24`}</Code>
              <ChartBlock label="C.8 Quarterly DAO Injection">
                <QuarterlyInjectionChart />
              </ChartBlock>
            </Sub2>
            <Sub2 title="C.9 — DAO Voting Weight">
              <Code>{`V = H × S
S: 0-day=0.1×  |  1–29d=0.5×  |  30–89d=1×  |  90–179d=2×  |  180–364d=3.5×  |  365d+=6×

Example: 1M gArc held, 91-day streak (Gold tier, S=2×) → V = 2,000,000 votes
Attack: 2.5B gArc, day 1 (S=0.5×) → V = 1,250,000,000 votes
  → Attacker needs 2,500× more tokens to achieve same votes as a 365-day Legend user with 1M gArc
     (Legend 1M gArc × 6× = 6M vs attacker need for 6M = 12M gArc day-1)`}</Code>
              <ChartBlock label="C.9 DAO Voting Power by Streak Level">
                <VotingPowerChart />
              </ChartBlock>
            </Sub2>
          </Sub>

          <Sub title="D. Milestone ROI Reference">
            <div className="bg-blue-950 border border-blue-800 rounded-lg p-3 text-blue-200 text-xs mb-3 space-y-1">
              <div className="font-semibold text-blue-300">📋 Baseline Parameters (Cold-Start Estimates)</div>
              <div>· P = 3,246 USDC (450 participants, zero external injection, Year 5 steady state)</div>
              <div>· N = derived from C1/C2/C3 churn model — all figures are estimates</div>
              <div>· Actual outcomes will diverge significantly at higher participation levels</div>
            </div>
            <Table
              headers={['Milestone', 'USDC ROI (cold, est.)', 'Break-Even P_min', 'USDC ROI (hot P=16k, est.)']}
              rows={[
                ['Bronze', '-97% ⚠️', '≥ 15,800 USDC', '+6%'],
                ['Gold', '-33% ⚠️', '≥ 4,860 USDC', '+233%'],
                ['Platinum', '-44% ⚠️', '≥ 5,760 USDC', '+137%'],
                ['Legend', '-65% ⚠️', '≥ 9,328 USDC', '+75%'],
              ]}
            />
            <InfoBox title="Why Negative Cold-Start ROI is Intentional">
              <p>Bronze negative ROI filters speculators from the early community. Users who check in despite negative USDC return are signal — they believe in gArc appreciation and the identity value of the SBT. These are exactly the users who build lasting protocol health.</p>
              <p className="mt-1">Gold break-even at P = 4,860 USDC is achievable with ~490 daily participants (no external injection) or immediately with a modest hot-start injection. Any VC seed round makes all milestones positive-ROI from day one.</p>
            </InfoBox>
          </Sub>
        </Section>

        {/* Footer */}
        <div className="border-t border-gray-800 pt-6 text-center text-gray-500 text-xs">
          <p className="text-gray-300 font-medium mb-1">GM Protocol — Investor Brief v1.0</p>
          <p>Confidential. For discussion purposes only. Not an offer or solicitation of investment.</p>
          <p className="mt-1">All tokenomics parameters subject to adjustment based on Testnet data.</p>
          <p className="mt-1 text-gray-600">Next milestone: Arc Testnet deployment → Community beta → Seed round close.</p>
        </div>

      </div>
    </div>
  )
}
