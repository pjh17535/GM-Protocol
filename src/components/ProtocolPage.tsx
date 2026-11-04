import { useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { arcTestnet } from 'viem/chains'
import FeedbackBoard from './FeedbackBoard'

const CHAIN_ID = arcTestnet.id

// ── Addresses ─────────────────────────────────────────────────────────────────
const POOL_ADDR    = '0xC3832c0169C1602D581cC6816414Ad05A855e713' as const
const CHECKIN_ADDR = '0xDb04Dd85fDbcE5b76d63230264475Fcb07c316A8' as const
const GARC_ADDR    = '0x742f1c4D413d13913c80D9b6A35002C2b7D8b9Fc' as const
const PAIR_ADDR    = '0xc0e9695ab4e41f4477074845046b3d152c4c8958' as const

// ── ABIs ──────────────────────────────────────────────────────────────────────
const POOL_ABI = [
  { name: 'poolBalance',      type: 'function', stateMutability: 'view', inputs: [{ type: 'uint8' }],  outputs: [{ type: 'uint256' }] },
  { name: 'gArcClaimBalance', type: 'function', stateMutability: 'view', inputs: [],                   outputs: [{ type: 'uint256' }] },
] as const

const CHECKIN_ABI = [
  { name: 'totalCheckins',        type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'totalMilestoneClaims', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'totalUsdcClaimed',     type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'totalGArcDistributed', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
] as const

const PAIR_ABI = [
  { name: 'getReserves', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint112' }, { type: 'uint112' }, { type: 'uint32' }] },
] as const

const ERC20_ABI = [
  { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
] as const

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt6 = (v: bigint | undefined) =>
  v !== undefined ? parseFloat(formatUnits(v, 6)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'

const fmt18B = (v: bigint | undefined) => {
  if (v === undefined) return '—'
  const n = parseFloat(formatUnits(v, 18))
  if (n >= 1e9) return `${(n / 1e9).toFixed(3)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

// ── Contract registry ─────────────────────────────────────────────────────────
const CONTRACTS = [
  { name: 'GMToken (gARC)',      addr: '0x742f1c4D413d13913c80D9b6A35002C2b7D8b9Fc', note: 'ERC-20, mint-once 10B, burn-only' },
  { name: 'GMCheckIn v3.1',      addr: '0xDb04Dd85fDbcE5b76d63230264475Fcb07c316A8', note: 'Daily check-in, milestone queue, partner integration' },
  { name: 'GMPool v2',           addr: '0xC3832c0169C1602D581cC6816414Ad05A855e713', note: '80/10/5/5 USDC split, gARC claim pool' },
  { name: 'GMBuyback',           addr: '0x611F40BdaEfF0e247b0C454725d8e531256a070a', note: 'Uniswap V2 buyback-and-burn, 3-layer trigger' },
  { name: 'GMSoulBound (SBT)',   addr: '0xB845E2f69d7D5426896B4083594B3C26D4bB8ff2', note: 'Non-transferable identity badges, 5 on-chain SVG tiers' },
  { name: 'USDC/gARC LP Pair',   addr: '0xc0e9695ab4e41f4477074845046b3d152c4c8958', note: 'Uniswap V2 pair, 38.56 USDC + 5B gARC' },
]

const EXPLORER = 'https://explorer.testnet.arc.io/address/'

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
      <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-2xl font-bold font-mono ${accent ?? 'text-white'}`}>{value}</p>
      {sub && <p className="text-gray-600 text-xs mt-1">{sub}</p>}
    </div>
  )
}

// ── Pool row ──────────────────────────────────────────────────────────────────
function PoolRow({ label, pct, value, color }: { label: string; pct: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
        <div>
          <span className="text-white text-sm font-medium">{label}</span>
          <span className="text-gray-600 text-xs ml-2">{pct} of check-in fees</span>
        </div>
      </div>
      <span className="text-white font-mono text-sm font-semibold">{value} USDC</span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProtocolPage({ onOpenSwap }: { onOpenSwap?: () => void }) {
  const r0 = useReadContract({ address: POOL_ADDR, abi: POOL_ABI, functionName: 'poolBalance', args: [0], chainId: CHAIN_ID })
  const r1 = useReadContract({ address: POOL_ADDR, abi: POOL_ABI, functionName: 'poolBalance', args: [1], chainId: CHAIN_ID })
  const r2 = useReadContract({ address: POOL_ADDR, abi: POOL_ABI, functionName: 'poolBalance', args: [2], chainId: CHAIN_ID })
  const r3 = useReadContract({ address: POOL_ADDR, abi: POOL_ABI, functionName: 'poolBalance', args: [3], chainId: CHAIN_ID })
  const rg = useReadContract({ address: POOL_ADDR, abi: POOL_ABI, functionName: 'gArcClaimBalance', chainId: CHAIN_ID })

  const tc  = useReadContract({ address: CHECKIN_ADDR, abi: CHECKIN_ABI, functionName: 'totalCheckins',        chainId: CHAIN_ID })
  const tmc = useReadContract({ address: CHECKIN_ADDR, abi: CHECKIN_ABI, functionName: 'totalMilestoneClaims', chainId: CHAIN_ID })
  const tuc = useReadContract({ address: CHECKIN_ADDR, abi: CHECKIN_ABI, functionName: 'totalUsdcClaimed',     chainId: CHAIN_ID })
  const tgd = useReadContract({ address: CHECKIN_ADDR, abi: CHECKIN_ABI, functionName: 'totalGArcDistributed', chainId: CHAIN_ID })
  const ts  = useReadContract({ address: GARC_ADDR,    abi: ERC20_ABI,   functionName: 'totalSupply',          chainId: CHAIN_ID })
  const lp  = useReadContract({ address: PAIR_ADDR,    abi: PAIR_ABI,    functionName: 'getReserves',         chainId: CHAIN_ID })
  const lpUsdc  = lp.data ? Number(formatUnits(lp.data[0], 6))  : undefined
  const lpGarc  = lp.data ? Number(formatUnits(lp.data[1], 18)) : undefined
  const lpPrice = lpUsdc !== undefined && lpGarc ? lpUsdc / lpGarc : undefined

  return (
    <div className="min-h-screen bg-[#060D1A] text-white">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Protocol</h1>
          <p className="text-gray-400 text-sm">
            All data read live from Arc Testnet. Every number is onchain and verifiable.
          </p>
        </div>

        {/* ── Protocol Stats ─────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Protocol Activity</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total Check-ins"    value={tc.data?.toString()  ?? '—'} />
            <StatCard label="Milestones Claimed" value={tmc.data?.toString() ?? '—'} />
            <StatCard label="USDC Distributed"   value={fmt6(tuc.data)}  sub="USDC" accent="text-green-400" />
            <StatCard label="gARC Distributed"   value={fmt18B(tgd.data)} sub="gARC" accent="text-purple-400" />
          </div>
        </section>

        {/* ── Pool Balances ──────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">GMPool — Live Balances</h2>
          <div className="bg-white/3 border border-white/8 rounded-2xl px-5 py-2">
            <PoolRow label="Reward Pool"     pct="80%" value={fmt6(r0.data)} color="#3B82F6" />
            <PoolRow label="Reserve Vault"   pct="10%" value={fmt6(r1.data)} color="#10B981" />
            <PoolRow label="Protocol"        pct="5%"  value={fmt6(r2.data)} color="#8B5CF6" />
            <PoolRow label="Partner Reserve" pct="5%"  value={fmt6(r3.data)} color="#F59E0B" />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="bg-purple-900/20 border border-purple-500/20 rounded-2xl p-4">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">gARC Claim Pool</p>
              <p className="text-xl font-bold text-purple-400 font-mono">{fmt18B(rg.data)}</p>
              <p className="text-gray-600 text-xs">gARC held for milestone claims</p>
            </div>
            <div className="bg-blue-900/20 border border-blue-500/20 rounded-2xl p-4">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">gARC Total Supply</p>
              <p className="text-xl font-bold text-blue-400 font-mono">{fmt18B(ts.data)}</p>
              <p className="text-gray-600 text-xs">gARC total supply (burn-only)</p>
            </div>
          </div>
        </section>

        {/* ── Tokenomics snapshot ───────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">Tokenomics</h2>
            {onOpenSwap && (
              <button
                onClick={onOpenSwap}
                className="px-3 py-1 rounded-lg bg-purple-600/80 hover:bg-purple-500 text-white text-xs font-semibold transition-colors"
              >
                Swap gARC →
              </button>
            )}
          </div>
          <div className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-3 text-sm">
            {[
              { label: 'Total minted',          value: '10,000,000,000 gARC', note: 'One-time, no future issuance' },
              { label: 'Initial burn (Day 1)',   value: '210,000,000 gARC',   note: 'Irreversible, verified onchain' },
              { label: 'Supply after burn',      value: '9,790,000,000 gARC', note: '4.79B Claim pool + 5B initial liquidity' },
              { label: 'Claim pool', value: '4,790,000,000 gARC', note: 'Held in GMPool v2, released through milestones' },
              { label: 'Initial liquidity', value: '5,000,000,000 gARC', note: '38.56 USDC + 5B gARC on Uniswap V2 (live below)' },
              { label: 'Terminal floor',         value: '210,000,000 gARC',   note: 'What remains in liquidity once the Claim pool is fully used' },
              { label: 'Claim mechanism',        value: '(9/8)× buyback-burn', note: 'Every USDC out triggers an extra 12.5% burn' },
            ].map(r => (
              <div key={r.label} className="flex items-start justify-between gap-4 py-2 border-b border-white/5 last:border-0">
                <div>
                  <span className="text-white font-medium">{r.label}</span>
                  <p className="text-gray-600 text-xs mt-0.5">{r.note}</p>
                </div>
                <span className="text-gray-200 font-mono text-xs text-right shrink-0">{r.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Testnet liquidity (live) ──────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Testnet Liquidity — Live</h2>
          <div className="bg-yellow-900/10 border border-yellow-500/20 rounded-2xl p-5">
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <p className="text-gray-500 text-xs mb-1">USDC in pool</p>
                <p className="text-white font-mono text-sm">{lpUsdc !== undefined ? lpUsdc.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">gARC in pool</p>
                <p className="text-white font-mono text-sm">{lpGarc !== undefined ? lpGarc.toLocaleString('en-US', { maximumFractionDigits: 3 }) : '—'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Implied price</p>
                <p className="text-white font-mono text-sm">{lpPrice !== undefined ? `${lpPrice.toFixed(2)} USDC` : '—'}</p>
              </div>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              The pool holds 5,000,000,000 gARC against a small amount of testnet USDC, so the implied price is
              tiny and any trade with meaningful USDC moves it sharply. It is not a market price.
            </p>
          </div>
        </section>

        {/* ── Contract Addresses ────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Deployed Contracts — Arc Testnet</h2>
          <div className="space-y-2">
            {CONTRACTS.map(c => (
              <div key={c.addr} className="bg-white/3 border border-white/8 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div>
                  <span className="text-white text-sm font-medium">{c.name}</span>
                  <p className="text-gray-600 text-xs">{c.note}</p>
                </div>
                <a
                  href={`${EXPLORER}${c.addr}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-mono text-xs shrink-0 transition-colors"
                >
                  {c.addr.slice(0, 6)}…{c.addr.slice(-4)} ↗
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* ── Community feedback ────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Community Feedback</h2>
          <FeedbackBoard
            scope="protocol"
            title="Tell us what you think"
            description="Suggestions, questions and concerns about GM Protocol. Connect a wallet and sign a message to post. It costs no gas. Newest feedback appears first."
          />
        </section>

        {/* ── Audit note ────────────────────────────────────────────── */}
        <section className="bg-green-900/10 border border-green-500/15 rounded-2xl p-5">
          <h2 className="text-green-400 text-xs font-semibold uppercase tracking-widest mb-2">Security</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            All contracts have been reviewed for security issues and tested with a comprehensive Foundry suite
            (316 tests, 0 failures). Source code is fully open on{' '}
            <a href="https://github.com/pjh17535/GM-Protocol" target="_blank" rel="noopener noreferrer"
              className="text-blue-400 hover:underline">GitHub</a>.
            Testnet deployment only — mainnet launch is subject to independent professional audit.
          </p>
        </section>

      </div>
    </div>
  )
}
