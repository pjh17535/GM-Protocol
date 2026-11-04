import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useReadContract, useReadContracts } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { formatUnits, type Address } from 'viem'

// ── Contract addresses (v3.1 — current active checkin contract) ───────────────
const CHECKIN_ADDR = '0xDb04Dd85fDbcE5b76d63230264475Fcb07c316A8' as Address
const GARC_ADDR    = '0x742f1c4D413d13913c80D9b6A35002C2b7D8b9Fc' as Address
const USDC_ADDR    = '0x3600000000000000000000000000000000000000' as Address
const SBT_ADDR     = '0xB845E2f69d7D5426896B4083594B3C26D4bB8ff2' as Address
const POOL_ADDR    = '0xC3832c0169C1602D581cC6816414Ad05A855e713' as Address

// ── ABIs ──────────────────────────────────────────────────────────────────────
const CHECKIN_ABI = [
  { name: 'getUserInfo', type: 'function', stateMutability: 'view',
    inputs: [{ type: 'address' }],
    outputs: [
      { name: 'lastCheckinDay', type: 'uint256' },
      { name: 'currentStreak',  type: 'uint256' },
      { name: 'totalCheckins',  type: 'uint256' },
    ] },
  { name: 'pendingClaimDay',  type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }, { type: 'uint8' }], outputs: [{ type: 'uint256' }] },
  { name: 'pendingClaimUsdc', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }, { type: 'uint8' }], outputs: [{ type: 'uint256' }] },
  { name: 'milestoneLastClaimedDay', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }, { type: 'uint8' }], outputs: [{ type: 'uint256' }] },
] as const

const ERC20_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }] },
] as const

const SBT_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'tokenOfOwnerByIndex', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }, { type: 'uint256' }], outputs: [{ type: 'uint256' }] },
  { name: 'tokenTier', type: 'function', stateMutability: 'view', inputs: [{ type: 'uint256' }], outputs: [{ type: 'uint8' }] },
] as const

const POOL_ABI = [
  { name: 'poolBalance', type: 'function', stateMutability: 'view', inputs: [{ type: 'uint8' }], outputs: [{ type: 'uint256' }] },
] as const

// ── Milestone config ───────────────────────────────────────────────────────────
const MILESTONES = [
  { tier: 0, label: 'Bronze',   days: 30,  releaseBps: 150,  color: 'from-orange-700 to-orange-500',  ring: 'border-orange-500/40',  icon: '🥉' },
  { tier: 1, label: 'Gold',     days: 90,  releaseBps: 1000, color: 'from-yellow-600 to-yellow-400',  ring: 'border-yellow-400/40',  icon: '🥇' },
  { tier: 2, label: 'Platinum', days: 180, releaseBps: 1500, color: 'from-slate-400 to-slate-200',    ring: 'border-slate-300/40',   icon: '💎' },
  { tier: 3, label: 'Legend',   days: 365, releaseBps: 1800, color: 'from-purple-600 to-purple-400',  ring: 'border-purple-400/40',  icon: '👑' },
]

// ── Helper ─────────────────────────────────────────────────────────────────────
function fmtUsdc(raw: bigint | undefined): string {
  if (raw === undefined) return '—'
  return Number(formatUnits(raw, 6)).toFixed(2)
}

function fmtGarc(raw: bigint | undefined): string {
  if (raw === undefined) return '—'
  const n = Number(formatUnits(raw, 18))
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  return n.toFixed(2)
}

// ── Streak bar visual ──────────────────────────────────────────────────────────
function StreakBar({ streak, target, color }: { streak: number; target: number; color: string }) {
  const pct = Math.min(100, Math.round((streak / target) * 100))
  return (
    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// ── Calendar heat row (last 30 days) ───────────────────────────────────────────
function CheckinCalendar({ lastCheckinDay, streak }: { lastCheckinDay: number; streak: number }) {
  const [todayDay] = useState(() => Math.floor(Date.now() / 1000 / 86400))
  const cells = Array.from({ length: 30 }, (_, i) => {
    const day = todayDay - 29 + i
    const active = lastCheckinDay > 0 && day >= lastCheckinDay - streak + 1 && day <= lastCheckinDay
    const isToday = day === todayDay
    return { day, active, isToday }
  })
  return (
    <div className="flex gap-1 flex-wrap">
      {cells.map(c => (
        <div
          key={c.day}
          title={`Day ${c.day}${c.isToday ? ' (today)' : ''}`}
          className={`w-5 h-5 rounded-sm transition-colors ${
            c.active
              ? 'bg-blue-500/80 border border-blue-400/40'
              : c.isToday
              ? 'bg-white/8 border border-white/20'
              : 'bg-white/4 border border-white/5'
          }`}
        />
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MyGMPage() {
  const { address, isConnected } = useAccount()
  // Capture today's day index once at mount (avoids impure Date.now in render)
  const [todayDay] = useState(() => Math.floor(Date.now() / 1000 / 86400))

  // User checkin state
  const { data: userInfo, isLoading: loadingUser } = useReadContract({
    address: CHECKIN_ADDR,
    abi: CHECKIN_ABI,
    functionName: 'getUserInfo',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  // Pool reward balance (for milestone reward estimates)
  const { data: rewardPool } = useReadContract({
    address: POOL_ADDR,
    abi: POOL_ABI,
    functionName: 'poolBalance',
    args: [0],
  })

  // Balances
  const { data: balances } = useReadContracts({
    contracts: address ? [
      { address: USDC_ADDR, abi: ERC20_ABI, functionName: 'balanceOf', args: [address] },
      { address: GARC_ADDR, abi: ERC20_ABI, functionName: 'balanceOf', args: [address] },
    ] : [],
    query: { enabled: !!address },
  })

  // SBT count
  const { data: sbtBalance } = useReadContract({
    address: SBT_ADDR,
    abi: SBT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  // Milestone pending claims (all 4 tiers)
  const { data: pendingDays } = useReadContracts({
    contracts: address ? MILESTONES.map(m => ({
      address: CHECKIN_ADDR,
      abi: CHECKIN_ABI,
      functionName: 'pendingClaimDay' as const,
      args: [address, m.tier] as [Address, number],
    })) : [],
    query: { enabled: !!address },
  })

  const { data: pendingUsdcs } = useReadContracts({
    contracts: address ? MILESTONES.map(m => ({
      address: CHECKIN_ADDR,
      abi: CHECKIN_ABI,
      functionName: 'pendingClaimUsdc' as const,
      args: [address, m.tier] as [Address, number],
    })) : [],
    query: { enabled: !!address },
  })

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#060D1A] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🌅</div>
          <h1 className="text-2xl font-bold mb-2">My GM</h1>
          <p className="text-gray-400 text-sm mb-6">Connect your wallet to see your check-in history and milestone progress.</p>
          <ConnectKitButton />
        </div>
      </div>
    )
  }

  const streak  = Number(userInfo?.[1] ?? 0n)
  const total   = Number(userInfo?.[2] ?? 0n)
  const lastDay = Number(userInfo?.[0] ?? 0n)
  const checkedInToday = lastDay === todayDay

  const usdcBal = balances?.[0]?.result
  const garcBal = balances?.[1]?.result

  // Highest SBT tier earned (based on streak history)
  const highestTier = MILESTONES.filter(m => total >= m.days).length - 1

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#060D1A] text-white flex items-center justify-center">
        <div className="text-center text-gray-500 text-sm animate-pulse">Loading your GM data...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#060D1A] text-white">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">My GM</h1>
          <p className="text-gray-500 text-xs mt-1 font-mono">
            {address?.slice(0, 6)}…{address?.slice(-4)}
          </p>
        </div>

        {/* Streak hero card */}
        <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/20 border border-blue-500/20 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Current Streak</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-white">{streak}</span>
                <span className="text-gray-400 text-lg">days</span>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                checkedInToday
                  ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                  : 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${checkedInToday ? 'bg-green-400' : 'bg-orange-400'}`} />
                {checkedInToday ? 'GM today' : 'Not checked in'}
              </div>
              <p className="text-gray-500 text-xs mt-1.5">Total: {total} check-ins</p>
            </div>
          </div>

          {/* Calendar heatmap */}
          <div className="mb-2">
            <p className="text-gray-500 text-xs mb-2">Last 30 days</p>
            <CheckinCalendar lastCheckinDay={lastDay} streak={streak} />
          </div>
        </div>

        {/* Balances */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/3 border border-white/8 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-1">USDC Balance</p>
            <p className="text-xl font-bold text-white">{fmtUsdc(usdcBal)}</p>
            <p className="text-gray-600 text-xs">USDC</p>
          </div>
          <div className="bg-white/3 border border-white/8 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-1">gARC Balance</p>
            <p className="text-xl font-bold text-white">{fmtGarc(garcBal)}</p>
            <p className="text-gray-600 text-xs">gARC</p>
          </div>
        </div>

        {/* SBT badges */}
        {sbtBalance !== undefined && sbtBalance > 0n && (
          <div className="bg-white/3 border border-white/8 rounded-xl p-4">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">SBT Badges Earned</p>
            <div className="flex gap-2 flex-wrap">
              {MILESTONES.slice(0, highestTier + 1).map(m => (
                <div key={m.tier} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${m.ring} bg-white/4 text-xs font-medium`}>
                  <span>{m.icon}</span>
                  <span className="text-gray-200">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Milestone progress cards */}
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">Milestone Progress</p>
          <div className="space-y-3">
            {MILESTONES.map((m, i) => {
              const reached = streak >= m.days
              const pendingDay = pendingDays?.[i]?.result
              const pendingUsdc = pendingUsdcs?.[i]?.result
              const hasQueued = pendingDay !== undefined && pendingDay > 0n
              const rewardEst = rewardPool
                ? Number(formatUnits(rewardPool * BigInt(m.releaseBps) / 10000n, 6)).toFixed(2)
                : '—'

              return (
                <div key={m.tier} className={`border rounded-xl p-4 transition-all ${
                  reached
                    ? `border-white/15 bg-white/4`
                    : 'border-white/5 bg-white/2 opacity-60'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{m.icon}</span>
                      <span className={`font-semibold text-sm ${reached ? 'text-white' : 'text-gray-500'}`}>{m.label}</span>
                      <span className="text-gray-600 text-xs">{m.days}d streak</span>
                    </div>
                    <div className="text-right">
                      {reached && !hasQueued && (
                        <span className="text-xs text-green-400 font-medium">Ready to queue</span>
                      )}
                      {hasQueued && (
                        <span className="text-xs text-yellow-400 font-medium">
                          Queued · ~{fmtUsdc(pendingUsdc)} USDC
                        </span>
                      )}
                      {!reached && (
                        <span className="text-xs text-gray-600">{m.days - streak}d remaining</span>
                      )}
                    </div>
                  </div>
                  <StreakBar streak={streak} target={m.days} color={m.color} />
                  <p className="text-gray-600 text-xs mt-1.5">
                    Est. reward: ~{rewardEst} USDC · releases {m.releaseBps / 100}% of pool
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-gray-700 text-xs text-center pb-4">
          Data read live from GMCheckIn on Arc Testnet · {CHECKIN_ADDR.slice(0, 6)}…{CHECKIN_ADDR.slice(-4)}
        </p>

      </div>
    </div>
  )
}
