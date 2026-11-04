import { useState } from 'react'
import GMPoolChart from './components/GMPoolChart'
import EconomicsCharts from './components/EconomicsCharts'
import ProjectPlan from './components/ProjectPlan'
import ProjectPlanEN from './components/ProjectPlanEN'
import Whitepaper from './components/Whitepaper'
import GMProtocolLogo from './components/GMProtocolLogo'
import GMCheckInPage from './components/GMCheckInPage'
import PartnersPage from './components/PartnersPage'
import MyGMPage from './components/MyGMPage'
import ProtocolPage from './components/ProtocolPage'
import WhitepaperPage from './components/WhitepaperPage'
import SwapModal from './components/SwapModal'
import WalletButton from './components/WalletButton'

// Public tabs (user-facing, English only)
type PublicView = 'gm' | 'protocol' | 'partners' | 'mygm' | 'docs'

// Internal tabs (dev/admin, hidden from public nav — accessible via ?dev=1)
type InternalView = 'whitepaper-cn' | 'plan' | 'planEN' | 'pool' | 'economics'

// Sub-views (not in nav, accessed via in-page buttons)
type SubView = 'whitepaper-en'

type View = PublicView | InternalView | SubView

const PUBLIC_TABS: { id: PublicView; label: string }[] = [
  { id: 'gm',       label: 'GM' },
  { id: 'protocol', label: 'Protocol' },
  { id: 'partners', label: 'Partners' },
  { id: 'mygm',     label: 'My GM' },
  { id: 'docs',     label: 'Docs' },
]

export default function App() {
  const [view, setView] = useState<View>('gm')
  const [swapOpen, setSwapOpen] = useState(false)

  // Internal dev mode: ?dev=1
  const isDevMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('dev') === '1'

  const INTERNAL_TABS: { id: InternalView; label: string }[] = [
    { id: 'whitepaper-cn', label: '📜 Whitepaper CN' },
    { id: 'plan',          label: '📄 Project Plan CN' },
    { id: 'planEN',        label: '🇺🇸 Investor Brief' },
    { id: 'pool',          label: '📈 Pool Chart' },
    { id: 'economics',     label: '📊 Economics' },
  ]

  const isPublic = PUBLIC_TABS.some(t => t.id === view)

  return (
    <div className="min-h-screen bg-[#060D1A]">
      {/* ── Navigation ──────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#060D1A]/95 backdrop-blur border-b border-white/8">
        <div className="max-w-6xl mx-auto flex items-center gap-4 px-4 py-2.5">

          {/* Logo */}
          <button onClick={() => setView('gm')} className="flex items-center gap-2 shrink-0 group">
            <GMProtocolLogo size={32} variant="icon" className="shrink-0" />
            <div className="hidden sm:block leading-tight">
              <span className="text-white font-bold text-sm group-hover:text-blue-400 transition-colors">GM Protocol</span>
              <span className="text-gray-500 text-[10px] block">gArc · Arc Network</span>
            </div>
          </button>

          <div className="w-px h-5 bg-white/10 shrink-0" />

          {/* Public tabs */}
          <div className="flex gap-1 flex-1 min-w-0 overflow-x-auto">
            {PUBLIC_TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setView(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  view === t.id
                    ? 'bg-blue-600/80 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* gARC swap */}
          <button
            onClick={() => setSwapOpen(true)}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/15 text-white transition-colors"
          >
            Swap<span className="hidden sm:inline"> gARC</span>
          </button>

          {/* Testnet faucet */}
          <a
            href="https://faucet.circle.com"
            target="_blank"
            rel="noopener noreferrer"
            title="Get test USDC on Arc Testnet"
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-colors"
          >
            Faucet
          </a>

          {/* Wallet: connect / copy / disconnect */}
          <WalletButton />

          {/* Dev mode tabs (hidden from public) */}
          {isDevMode && (
            <>
              <div className="w-px h-5 bg-yellow-500/30 shrink-0" />
              <div className="flex gap-1 flex-wrap">
                {INTERNAL_TABS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setView(t.id)}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                      view === t.id ? 'bg-yellow-600/80 text-white' : 'text-yellow-500/70 hover:text-yellow-400 hover:bg-yellow-500/10'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </nav>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="pt-14">
        {/* Public views */}
        {view === 'gm'           && <GMCheckInPage />}
        {view === 'protocol'     && <ProtocolPage onOpenSwap={() => setSwapOpen(true)} />}
        {view === 'partners'     && <PartnersPage />}
        {view === 'mygm'         && <MyGMPage />}
        {view === 'docs'         && <DocsPage onWhitepaper={() => setView('whitepaper-en')} />}
        {view === 'whitepaper-en' && <WhitepaperPage onBack={() => setView('docs')} />}

        {/* Internal views — dev mode only */}
        {view === 'whitepaper-cn' && <Whitepaper />}
        {view === 'plan'          && <ProjectPlan />}
        {view === 'planEN'        && <ProjectPlanEN />}
        {view === 'pool'          && <GMPoolChart />}
        {view === 'economics'     && <EconomicsCharts />}
      </div>

      {swapOpen && <SwapModal onClose={() => setSwapOpen(false)} />}

      {/* Dev mode badge */}
      {isDevMode && !isPublic && (
        <div className="fixed bottom-4 right-4 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/40 rounded-lg text-yellow-400 text-xs font-mono">
          DEV MODE
        </div>
      )}
    </div>
  )
}

// ─── Docs Page ────────────────────────────────────────────────────────────────
function DocsPage({ onWhitepaper }: { onWhitepaper: () => void }) {
  return (
    <div className="min-h-screen bg-[#060D1A] text-white">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold mb-1">Docs</h1>
          <p className="text-gray-400 text-sm">Documentation, whitepaper, and resources for GM Protocol.</p>
        </div>

        {/* Whitepaper summary card */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Whitepaper</h2>
          <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/10 border border-blue-500/20 rounded-2xl p-6">
            <div className="mb-4">
              <p className="text-white font-bold text-lg mb-1">GM Protocol Whitepaper v1.0</p>
              <p className="text-gray-400 text-xs">October 2026 · Arc Network · 11 Chapters</p>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              GM Protocol is an onchain daily check-in protocol and identity infrastructure layer built on Arc Network.
              The core insight: a consecutive check-in system is, by nature, an economic model where{' '}
              <strong className="text-white">those who quit fund those who persist</strong>.
            </p>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              The whitepaper covers the protocol's economic design, the gARC deflationary token model, progressive Sybil defense,
              the partner ecosystem, DAO governance structure, and the builder's development philosophy.
              All USDC flows are closed-loop — no value exits without burning gARC.
            </p>
            {/* Chapter previews */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-5">
              {[
                'I. The Problem', 'II. Core Insight', 'III. GM Protocol',
                'IV. gARC Token', 'V. Sustainability', 'VI. Onchain Identity',
                'VII. Sybil Defense', 'VIII. Partners', 'IX. DAO Governance',
                'X. Builder\'s Note', 'XI. Roadmap', 'Closing',
              ].map(c => (
                <div key={c} className="px-2.5 py-1.5 bg-white/4 border border-white/6 rounded-lg text-gray-400 text-[11px]">{c}</div>
              ))}
            </div>
            <button
              onClick={onWhitepaper}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
            >
              Read Full Whitepaper →
            </button>
          </div>
        </section>

        {/* Partner integration */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Partner Integration</h2>
          <div className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-3 text-sm text-gray-300">
            <p>
              Projects can integrate with GM Protocol by deploying a <strong className="text-white">GMPartner contract</strong>.
              Users who check in through a partner project automatically share the main GM streak.
            </p>
            <ul className="space-y-1.5 list-none">
              {[
                'Minimum injection: 2,000 USDC (mainnet) — funds user milestone rewards.',
                'Check-in fee: 0.1 USDC/day, fixed, non-adjustable.',
                'Fund split: 80% user rewards / 10% main GM pool / 10% buyback-burn.',
                'Milestones: 1–4 tiers, minimum 1 week, maximum 1 year per tier.',
                'Activation window: 7 days after contract deployment.',
              ].map(s => (
                <li key={s} className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5 shrink-0">→</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
            <p className="text-gray-500 text-xs pt-2">
              Arc House partner guide — coming soon. For inquiries, see the Partners page.
            </p>
          </div>
        </section>

        {/* Resources */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Resources</h2>
          <div className="space-y-2">
            {[
              { label: 'GitHub Repository',      href: 'https://github.com/pjh17535/GM-Protocol',     desc: 'Full source code, contracts, and development history' },
              { label: 'Arc Network',             href: 'https://arc.io',                               desc: 'The chain GM Protocol is built on — USDC as native gas' },
              { label: 'Arc Testnet Explorer',    href: 'https://explorer.testnet.arc.io',              desc: 'Browse all onchain activity' },
              { label: 'Arc Microgrants Hackathon', href: 'https://dorahacks.io/hackathon/arc-microgrants-2/detail', desc: 'GM Protocol submitted to Arc Microgrants 2' },
            ].map(l => (
              <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between bg-white/3 border border-white/8 hover:border-blue-500/30 rounded-xl px-4 py-3 transition-colors group"
              >
                <div>
                  <p className="text-white text-sm font-medium group-hover:text-blue-400 transition-colors">{l.label} ↗</p>
                  <p className="text-gray-500 text-xs">{l.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
