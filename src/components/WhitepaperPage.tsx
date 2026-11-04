import { useState, useEffect, useRef } from 'react'

// ── Chapter data ───────────────────────────────────────────────────────────────
const CHAPTERS = [
  { id: 'preface',      label: 'Preface' },
  { id: 'problem',      label: 'I. The Problem' },
  { id: 'insight',      label: 'II. The Insight' },
  { id: 'protocol',     label: 'III. GM Protocol' },
  { id: 'garc',         label: 'IV. gArc Token' },
  { id: 'sustainability', label: 'V. Sustainability' },
  { id: 'identity',     label: 'VI. Onchain Identity' },
  { id: 'sybil',        label: 'VII. Sybil Defense' },
  { id: 'partners',     label: 'VIII. Partners' },
  { id: 'dao',          label: 'IX. DAO Governance' },
  { id: 'note',         label: 'X. Builder\'s Note' },
  { id: 'roadmap',      label: 'XI. Roadmap' },
  { id: 'closing',      label: 'Closing' },
]

// ── Shared prose styles ────────────────────────────────────────────────────────
const P  = ({ children }: { children: React.ReactNode }) => (
  <p className="text-gray-300 text-[15px] leading-relaxed mb-4">{children}</p>
)
const H2 = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <h2 id={id} className="text-xl font-bold text-white mt-12 mb-4 scroll-mt-24 border-b border-white/8 pb-3">{children}</h2>
)
const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-base font-semibold text-gray-100 mt-6 mb-2">{children}</h3>
)
const Block = ({ children }: { children: React.ReactNode }) => (
  <pre className="bg-white/3 border border-white/8 rounded-xl p-4 text-xs text-gray-400 font-mono overflow-x-auto mb-4 whitespace-pre-wrap">{children}</pre>
)
const Table = ({ rows }: { rows: string[][] }) => (
  <div className="overflow-x-auto mb-4">
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr>{rows[0].map((h, i) => <th key={i} className="text-left text-gray-400 text-xs uppercase tracking-wider py-2 px-3 border-b border-white/8 font-semibold">{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.slice(1).map((r, i) => (
          <tr key={i} className="border-b border-white/5 hover:bg-white/2">
            {r.map((c, j) => <td key={j} className="py-2.5 px-3 text-gray-300 text-[13px]">{c}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)
const Bold = ({ children }: { children: React.ReactNode }) => (
  <strong className="text-white font-semibold">{children}</strong>
)
const Quote = ({ children }: { children: React.ReactNode }) => (
  <blockquote className="border-l-2 border-blue-500/40 pl-4 my-4 text-gray-400 italic text-[14px]">{children}</blockquote>
)

// ── Main component ─────────────────────────────────────────────────────────────
export default function WhitepaperPage({ onBack }: { onBack: () => void }) {
  const [active, setActive] = useState('preface')
  const [menuOpen, setMenuOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // Track active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id)
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )
    CHAPTERS.forEach(c => {
      const el = document.getElementById(c.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#060D1A] text-white">
      {/* Top bar */}
      <div className="sticky top-14 z-40 bg-[#060D1A]/95 backdrop-blur border-b border-white/8">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs transition-colors">
            ← Back to Docs
          </button>
          <div className="w-px h-4 bg-white/10" />
          <span className="text-white text-xs font-semibold">GM Protocol Whitepaper v1.0</span>
          <span className="text-gray-600 text-xs">· October 2026</span>
          {/* Mobile menu toggle */}
          <button
            className="ml-auto sm:hidden text-gray-400 hover:text-white text-xs px-3 py-1.5 rounded-lg border border-white/10"
            onClick={() => setMenuOpen(m => !m)}
          >
            Chapters ▾
          </button>
        </div>
        {/* Mobile chapter menu */}
        {menuOpen && (
          <div className="sm:hidden px-4 pb-3 flex flex-wrap gap-1.5">
            {CHAPTERS.map(c => (
              <button key={c.id} onClick={() => scrollTo(c.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${active === c.id ? 'bg-blue-600/70 text-white' : 'bg-white/5 text-gray-400'}`}>
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-8">
        {/* Sidebar TOC — desktop only */}
        <aside className="hidden sm:block w-52 shrink-0">
          <div className="sticky top-32">
            <p className="text-gray-600 text-[10px] uppercase tracking-widest font-semibold mb-3">Contents</p>
            <nav className="flex flex-col gap-0.5">
              {CHAPTERS.map(c => (
                <button key={c.id} onClick={() => scrollTo(c.id)}
                  className={`text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    active === c.id ? 'bg-blue-600/15 text-blue-400 font-medium' : 'text-gray-500 hover:text-gray-300 hover:bg-white/3'
                  }`}>
                  {c.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div ref={contentRef} className="flex-1 max-w-2xl">

          {/* Title block */}
          <div className="mb-10 pb-8 border-b border-white/8">
            <div className="text-xs text-blue-400 font-semibold uppercase tracking-widest mb-3">Whitepaper</div>
            <h1 className="text-3xl font-bold text-white mb-2 leading-tight">GM Protocol</h1>
            <p className="text-gray-400 text-base mb-4">An onchain daily check-in protocol and identity infrastructure for the Arc ecosystem.</p>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              <span>Version 1.0</span>
              <span>·</span>
              <span>October 2026</span>
              <span>·</span>
              <span>Arc Network</span>
              <span>·</span>
              <span className="text-gray-600 italic">All parameters subject to revision based on testnet data.</span>
            </div>
          </div>

          {/* ── Preface ──────────────────────────────────────────── */}
          <section id="preface">
            <H2 id="preface">Preface</H2>
            <P>I am not building a project. I am trying to answer a question:</P>
            <Quote><Bold>In the blockchain world, what can a daily GM prove?</Bold></Quote>
            <P>GM — short for Good Morning — is the oldest greeting in crypto culture. Every day, millions of people across X, Discord, and Farcaster send these two letters. It is an expression of belonging, a declaration of "I am still here."</P>
            <P>But these two letters have never left a trace onchain.</P>
            <P>I started to think: what if we brought this daily ritual onchain? Not simply recording an event, but making this behavior carry real economic weight. Rewarding those who persist with the funds left behind by those who quit. Making the process generate an onchain, unforgeable identity credential. And letting gArc — the protocol's native token — serve as a pure deflationary vessel, recording the system's trajectory in a unique way.</P>
            <P>This is where GM Protocol begins.</P>
          </section>

          {/* ── I. The Problem ───────────────────────────────────── */}
          <section id="problem">
            <H2 id="problem">I. The Root of the Problem</H2>
            <H3>1.1 Web3's Trust Crisis</H3>
            <P>We are in a strange moment. Blockchain technology promised decentralization, transparency, trustlessness. Yet in practice, most Web3 projects are built on a fundamental contradiction: they claim decentralization while relying on centralized incentive mechanisms to sustain themselves.</P>
            <P>Every airdrop is a project team subsidizing users in one direction. Once the subsidy stops, users leave. The project goes to zero. The cycle repeats. This is not sustainable.</P>
            <H3>1.2 Sybil Attacks: The Omnipresent Ghost</H3>
            <P>The deeper problem: onchain, we cannot distinguish a real person from a thousand bots. Every airdrop gets harvested by bot farms. Every governance vote gets manipulated by whales. Every partner project integration brings in hollow traffic.</P>
            <P>The value of real users is diluted, extracted, and ignored. This is not fair. But this is the reality of the onchain world.</P>
            <H3>1.3 The Structural Trap of Tokenomics</H3>
            <P>Almost every Web3 token faces the same problem: tokens are issued to incentivize, incentives generate demand, demand supports price, price attracts more holders, holders expect higher prices — until someone starts selling, and the entire cycle collapses.</P>
            <P>This is a Ponzi structure. Not malicious, but fragile. I do not want to build such a system.</P>
          </section>

          {/* ── II. Insight ──────────────────────────────────────── */}
          <section id="insight">
            <H2 id="insight">II. The Insight: Dropouts Fund Persisters</H2>
            <P>In thinking through these problems, I discovered a simple but profound economic insight:</P>
            <Quote><Bold>A consecutive check-in system is, by nature, an economic model where those who quit fund those who persist.</Bold></Quote>
            <P>Every check-in fee that enters the system accumulates in the reward pool. Most people will quit midway, leaving their funds in the pool while their streak resets to zero. Only those who genuinely persist to a milestone can claim the accumulated reward.</P>
            <P>No external subsidy required. This is a self-sustaining economic system. <Bold>Persistence itself is the source of value.</Bold></P>
          </section>

          {/* ── III. Protocol ────────────────────────────────────── */}
          <section id="protocol">
            <H2 id="protocol">III. What GM Protocol Is</H2>
            <P>GM Protocol is an <Bold>onchain daily check-in protocol</Bold> deployed on Arc Network, and simultaneously an <Bold>onchain identity infrastructure layer</Bold> for the Arc ecosystem. It is composed of two intertwined systems:</P>
            <H3>The First System: Economic Incentives</H3>
            <P>Pay 0.1 USDC daily to check in, accumulate consecutively. Upon reaching milestone checkpoints (30 / 90 / 180 / 365 days), claim gArc tokens released from the reward pool. Rewards come from the funds left behind by those who could not persist.</P>
            <H3>The Second System: Identity Proof</H3>
            <P>Each check-in is an onchain timestamp. The record of consecutive check-ins, weighted by time, forms an identity credential that no one can forge — you were genuinely here, continuously present, with real actions to back it up.</P>
            <P>These two systems reinforce each other. Economic incentives encourage persistence; persistence accumulates identity value; identity value brings more privileges; privileges further strengthen economic incentives.</P>
          </section>

          {/* ── IV. gArc ─────────────────────────────────────────── */}
          <section id="garc">
            <H2 id="garc">IV. gArc: A Pure Deflationary Vessel</H2>
            <P>gArc is GM Protocol's native token. But it is not a "project token" in the conventional sense.</P>
            <Quote>The design philosophy of gArc is captured in one sentence: <Bold>It is a bridge, not a destination.</Bold></Quote>
            <H3>4.1 Token Structure</H3>
            <P>gArc has a total supply of 10 billion tokens, minted all at once, never to be increased. Immediately upon minting, 210 million tokens are burned onchain (irreversible). The effective circulating cap is 9.79 billion.</P>
            <Block>{`Total Minted:  10,000,000,000
Instant Burn:    -210,000,000  (TX irreversible, day one)
─────────────────────────────
Effective Cap:  9,790,000,000
                = 4,790,000,000  (Claim Pool)
                + 5,000,000,000  (Initial Liquidity)

Terminal state: Claim Pool exhausted → LP retains 210M permanent floor`}</Block>
            <P>5 billion tokens are injected as initial liquidity into an AMM. The contract authority will be permanently abandoned at mainnet launch. From that moment, no one can mint more or interfere with liquidity.</P>
            <H3>4.2 The Deflationary Mechanism: Every Claim Is a Burn</H3>
            <P>The only way gArc enters circulation is through Claims. The only way it leaves is also through Claims. When a user claims a reward of R USDC equivalent in gArc:</P>
            <Block>{`1. Reward pool withdraws (9/8) × R USDC
2. R USDC → market buyback → gArc burned
3. (1/8)R USDC from reserve treasury → additional gArc burned
4. Claim pool releases R/Pg gArc tokens to the user

Every Claim: net-neutral circulation + 12.5% excess burn`}</Block>
            <P>No USDC can leave this system without triggering a buyback-and-burn. This is an unavoidable design.</P>
            <H3>4.3 The Deflationary Curve: A Tribute to Bitcoin</H3>
            <P>gArc's deflationary path follows a reverse quadratic curve, modeled after Bitcoin's issuance schedule:</P>
            <Block>{`C(t) = 1 - (1 - t/6)²     t ∈ [0, 6] years

Fast burn in early years → gradually stabilizing → 
converging to 210M anchor by ~2032

210M derives from Bitcoin's 95.24% mined-by-2032 ratio.`}</Block>
          </section>

          {/* ── V. Sustainability ─────────────────────────────────── */}
          <section id="sustainability">
            <H2 id="sustainability">V. Sustainability: Why the System Never Collapses</H2>
            <H3>5.1 The Closed Capital Loop</H3>
            <Block>{`Check-in fee (0.1 USDC)
    ├── 80% → Milestone Reward Pool
    ├── 10% → Reserve Treasury (funds 1/8 extra buyback)
    ├── 5%  → Protocol Treasury (team, same Claim rules)
    └── 5%  → Partner Reserve (same burn mechanic)`}</Block>
            <P><Bold>Core insight:</Bold> The majority of users will quit midway. Their check-in fees flow into the reward pool continuously, but they never trigger a Claim. These funds become the source of rewards for persisters. The higher the dropout rate, the more abundant the reward pool.</P>
            <H3>5.2 Trustless Perpetuity</H3>
            <P>The Protocol Treasury (5%) and Partner Reserve (5%) follow identical Claim logic. For the founding team to receive any value, they must go through the same milestone Claim process, triggering the same (9/8)x buyback-and-burn.</P>
            <P><Bold>No exceptions. No privileged exits. The only path for USDC to leave the system is through burning gArc.</Bold></P>
            <H3>5.3 Why the Reward Pool Never Reaches Zero</H3>
            <P>Even in an extreme scenario — all active users triggering their highest milestone Claim on the same day — the pool withdrawal equals (9/8) × 80% = 90% of the total pool. The remaining 10% corresponds precisely to the Protocol Treasury and Partner Reserve.</P>
            <P>The minimum balance of the system is always equal to the inflow of new check-in fees for that day. <Bold>As long as anyone checks in, the system will not stop.</Bold></P>
          </section>

          {/* ── VI. Onchain Identity ─────────────────────────────── */}
          <section id="identity">
            <H2 id="identity">VI. Onchain Identity: The Second Layer of Value</H2>
            <P>Every SBT (Soulbound Token) minted through a milestone Claim is an onchain proof of time. It records: you were here. How long you persisted. How many times you made it.</P>
            <P>SBTs cannot be transferred, cannot be forged, cannot be purchased. They can only be earned through genuine consecutive check-in behavior.</P>
            <P>This makes GM Protocol the <Bold>onchain reputation infrastructure</Bold> for the Arc ecosystem:</P>
            <ul className="space-y-2 mb-4 pl-4">
              {[
                'Projects can query an address\'s highest milestone tier as a user filter.',
                'DAO governance voting weight is bound in real time to current consecutive check-in days (not historical peak).',
                'Partner projects can set SBT thresholds to ensure participants are genuine long-term Arc users.',
              ].map((s, i) => (
                <li key={i} className="flex gap-2 text-gray-300 text-[14px]">
                  <span className="text-blue-400 mt-0.5 shrink-0">·</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* ── VII. Sybil Defense ───────────────────────────────── */}
          <section id="sybil">
            <H2 id="sybil">VII. Identity Verification: Progressive Sybil Defense</H2>
            <P>Real identity verification should not be a burden. It should naturally match the depth of a user's participation.</P>
            <Table rows={[
              ['Layer', 'Trigger', 'Verification Requirement'],
              ['Layer 0', 'First check-in', 'Human Passport background scan (silent)'],
              ['Layer 1', 'Bronze Claim (30d)', 'Gitcoin Passport Stamps ≥ 20'],
              ['Layer 2', 'Gold/Platinum Claim', 'Stamps ≥ 20 + ZKPassport, or Stamps ≥ 35'],
              ['Layer 3', 'Legend Claim (365d)', 'Layer 2 + Dual Exchange KYC'],
            ]} />
            <P>Layer 0 has zero barrier — anyone can join. Sybil accounts' funds equally enter the reward pool, which actually benefits legitimate users. Layer 3 requires a real passport plus KYC from two exchanges. Mass-producing sybil accounts at this level carries extreme cost, and all behavior is fully transparent onchain.</P>
          </section>

          {/* ── VIII. Partners ───────────────────────────────────── */}
          <section id="partners">
            <H2 id="partners">VIII. The Partner Ecosystem: Education-First Connections</H2>
            <P>GM Protocol is not an isolated system. It is a connector for the Arc ecosystem. Partner projects can integrate to provide users with additional daily check-in milestones.</P>
            <P>We hold a clear position on partner tasks: <Bold>we only accept education-purpose tasks</Bold> — video viewing, article reading, knowledge quizzes, onchain interaction verification. These genuinely filter for users who understand the project.</P>
            <P><Bold>We explicitly reject all social propagation tasks.</Bold> Retweets, follows, referrals — these only bring hollow traffic. We do not do that.</P>
            <P>Partner projects have independent reward pools. Every user Claim triggers the same (9/8)x buyback-and-burn. Every USDC from every partner project contributes to gArc's deflation. Completing any partner check-in is equivalent to completing the main GM check-in for the day — consecutive streaks are shared.</P>
          </section>

          {/* ── IX. DAO ──────────────────────────────────────────── */}
          <section id="dao">
            <H2 id="dao">IX. DAO Governance: Manipulation-Resistant Decentralization</H2>
            <P>The governance goal of GM Protocol: <Bold>no single force can manipulate the system, including the founder.</Bold></P>
            <H3>9.1 Voting Weight Design</H3>
            <P>Voting Power = gArc Holdings × Consecutive Check-in Coefficient</P>
            <Table rows={[
              ['Check-in Streak', 'Coefficient'],
              ['0 days (inactive)', '0.1×'],
              ['1–29 days', '0.5×'],
              ['30–89 days', '1.0×'],
              ['90–179 days', '2.0×'],
              ['180–364 days', '3.5×'],
              ['365+ days', '6.0×'],
            ]} />
            <P>An attacker buying large amounts of gArc without checking in has only 0.1× voting power. On day one, their voting weight is 60× lower than a user with equal holdings but one year of consecutive check-ins.</P>
            <H3>9.2 Three-Layer Defense</H3>
            <ul className="space-y-2 mb-4 pl-4">
              {[
                'SBT eligibility threshold + real-time consecutive check-in decay',
                'gArc voting weight × check-in coefficient (no lockup; check-in behavior itself is the skin in the game)',
                '72-hour timelock on all fund-related proposals',
              ].map((s, i) => (
                <li key={i} className="flex gap-2 text-gray-300 text-[14px]">
                  <span className="text-blue-400 shrink-0">{i + 1}.</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
            <H3>9.3 Governance Evolution</H3>
            <Table rows={[
              ['Phase', 'Timeline', 'Governance State'],
              ['Phase 0–1', 'Testnet (2026 Q4)', 'Founder multisig; decisions publicly disclosed'],
              ['Phase 2', '2027 Q2–Q3', 'Community voting; founder retains emergency veto'],
              ['Phase 3', '2027 Q4+', 'Full DAO; founder as ordinary holder'],
              ['Phase 4', '2028+', 'Founder veto relinquished via time-lock, one right per year'],
            ]} />
          </section>

          {/* ── X. Builder's Note ────────────────────────────────── */}
          <section id="note">
            <H2 id="note">X. A Builder's Note</H2>
            <P>This project is built by one person.</P>
            <P>Not because I don't want a team, but because I believe a sufficiently clear idea can be realized from zero to one by a single person. Hayden Adams built Uniswap v1 alone. Andre Cronje wrote the core contracts of Yearn Finance in a matter of weeks, solo. Single-person protocol launches have precedent.</P>
            <P>But more importantly, I want the birth of this project to itself be proof of what it advocates:</P>
            <Quote><Bold>Things of genuine value require genuine persistence.</Bold></Quote>
            <P>I have not benefited from any pre-mine, private sale, or insider allocation. Every gArc the founding team earns comes through the exact same Claim path as any ordinary user. If I do not GM every day, I get nothing.</P>
            <P>This is what I consider most important: <Bold>the founder and users share the same rules.</Bold></P>
            <P>GM Protocol is built transparently, in public, with every commit and discussion on GitHub. The full development history — including early explorations, design pivots, and implementation decisions — is preserved without censorship. This transparency is not incidental; it is load-bearing. A protocol asking users to trust it onchain should first demonstrate trustworthiness offchain.</P>
          </section>

          {/* ── XI. Roadmap ──────────────────────────────────────── */}
          <section id="roadmap">
            <H2 id="roadmap">XI. Roadmap</H2>
            <Table rows={[
              ['Phase', 'Timeline', 'Milestone'],
              ['Phase 0', '2026 Q4', 'Contract development and testing; Arc Testnet deployment'],
              ['Phase 1', '2027 Q1', 'Mainnet launch; TGE; initial liquidity injection; LP authority abandoned'],
              ['Phase 2', '2027 Q2–Q3', 'Partner project integrations; identity verification layer live'],
              ['Phase 3', '2027 Q4', 'DAO governance live; founder begins authority handover'],
              ['Phase 4', '2028+', 'Ecosystem expansion; Arc identity infrastructure open to ecosystem'],
            ]} />
          </section>

          {/* ── Closing ──────────────────────────────────────────── */}
          <section id="closing">
            <H2 id="closing">Closing</H2>
            <P>GM Protocol is not a project about USDC. It is not a project about token prices.</P>
            <P>It is a project about <Bold>persistence</Bold>.</P>
            <P>In this world, saying GM every day and acting on it leaves an immutable mark onchain. The longer you persist, the greater the value you accumulate, the more recognition you earn.</P>
            <P>And those who leave midway have not lost anything. Their departure becomes the foundation upon which those who remain are rewarded.</P>
            <P>This is a truly fair system: every person's choice produces its corresponding consequence, completely transparently.</P>
            <div className="mt-8 pt-8 border-t border-white/8 text-center">
              <p className="text-2xl font-bold text-white mb-6">GM.</p>
              <p className="text-gray-600 text-xs">GM Protocol Whitepaper v1.0 · October 2026<br />All parameters are subject to adjustment based on testnet data.<br />The next version will be updated following mainnet launch.</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
