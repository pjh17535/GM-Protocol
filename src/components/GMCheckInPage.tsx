import { useEffect } from 'react'
import {
  useAccount, useReadContract, useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { parseUnits, formatUnits, type Address } from 'viem'
import { arcTestnet } from 'viem/chains'
import { toast } from 'sonner'

// ── Contract addresses ────────────────────────────────────────────────────────
const CHECKIN_ADDR   = '0xA66Af89712660e0b6c1AACc666f74f0A4Df3BEF7' as Address
const POOL_ADDR      = '0xC3832c0169C1602D581cC6816414Ad05A855e713' as Address
const USDC_ADDR      = '0x3600000000000000000000000000000000000000' as Address
const GARC_ADDR      = '0x742f1c4D413d13913c80D9b6A35002C2b7D8b9Fc' as Address
const CHAIN_ID       = arcTestnet.id

// ── Minimal ABIs ─────────────────────────────────────────────────────────────
const CHECKIN_ABI = [
  { name: 'checkinFee',        type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'getUserInfo',       type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ name: 'lastCheckinDay', type: 'uint256' }, { name: 'currentStreak', type: 'uint256' }, { name: 'totalCheckins', type: 'uint256' }] },
  { name: 'pendingClaimDay',   type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }, { type: 'uint8' }], outputs: [{ type: 'uint256' }] },
  { name: 'pendingClaimUsdc',  type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }, { type: 'uint8' }], outputs: [{ type: 'uint256' }] },
  { name: 'snapshotExecuted',  type: 'function', stateMutability: 'view', inputs: [{ type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'milestoneLastClaimedDay', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }, { type: 'uint8' }], outputs: [{ type: 'uint256' }] },
  { name: 'checkin',           type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { name: 'queueMilestoneClaim', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'tier', type: 'uint8' }], outputs: [] },
  { name: 'executeSnapshot',   type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'dayIndex', type: 'uint256' }], outputs: [] },
  { name: 'claimMilestone',    type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'tier', type: 'uint8' }], outputs: [] },
] as const

const ERC20_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'approve',   type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
] as const

const POOL_ABI = [
  { name: 'poolBalance',         type: 'function', stateMutability: 'view', inputs: [{ type: 'uint8' }], outputs: [{ type: 'uint256' }] },
  { name: 'gArcClaimBalance',    type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'totalCheckins',       type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
] as const

// ── Milestone config ──────────────────────────────────────────────────────────
const MILESTONES = [
  { tier: 0, label: 'Bronze',   days: 30,  bps: 150,  color: '#CD7F32', bg: 'rgba(205,127,50,0.12)',  border: 'rgba(205,127,50,0.3)' },
  { tier: 1, label: 'Gold',     days: 90,  bps: 1000, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)' },
  { tier: 2, label: 'Platinum', days: 180, bps: 1500, color: '#CBD5E1', bg: 'rgba(203,213,225,0.10)', border: 'rgba(203,213,225,0.3)' },
  { tier: 3, label: 'Legend',   days: 365, bps: 1800, color: '#A855F7', bg: 'rgba(168,85,247,0.12)',  border: 'rgba(168,85,247,0.3)' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const currentDayIndex = () => Math.floor(Date.now() / 1000 / 86400)
const fmt6 = (v: bigint) => parseFloat(formatUnits(v, 6)).toLocaleString('en-US', { maximumFractionDigits: 2 })
const fmt18 = (v: bigint) => {
  const n = parseFloat(formatUnits(v, 18))
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

// ── Sub-component: Pool Stats ─────────────────────────────────────────────────
function PoolStats() {
  const r0 = useReadContract({ address: POOL_ADDR, abi: POOL_ABI, functionName: 'poolBalance', args: [0], chainId: CHAIN_ID })
  const r1 = useReadContract({ address: POOL_ADDR, abi: POOL_ABI, functionName: 'poolBalance', args: [1], chainId: CHAIN_ID })
  const r2 = useReadContract({ address: POOL_ADDR, abi: POOL_ABI, functionName: 'poolBalance', args: [2], chainId: CHAIN_ID })
  const r3 = useReadContract({ address: POOL_ADDR, abi: POOL_ABI, functionName: 'poolBalance', args: [3], chainId: CHAIN_ID })
  const rg = useReadContract({ address: POOL_ADDR, abi: POOL_ABI, functionName: 'gArcClaimBalance', chainId: CHAIN_ID })
  const rt = useReadContract({ address: POOL_ADDR, abi: POOL_ABI, functionName: 'totalCheckins', chainId: CHAIN_ID })

  const pools = [
    { label: 'Reward Pool',     value: r0.data, unit: 'USDC', pct: '80%', color: '#3B82F6' },
    { label: 'Reserve Vault',   value: r1.data, unit: 'USDC', pct: '10%', color: '#10B981' },
    { label: 'Protocol',        value: r2.data, unit: 'USDC', pct: '5%',  color: '#8B5CF6' },
    { label: 'Partner Reserve', value: r3.data, unit: 'USDC', pct: '5%',  color: '#F59E0B' },
  ]

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#6B7280', textTransform: 'uppercase', marginBottom: 12 }}>
        GMPool — Live State
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {pools.map(p => (
          <div key={p.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
              {p.pct} · {p.label}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#F9FAFB', fontVariantNumeric: 'tabular-nums' }}>
              {p.value !== undefined ? `${fmt6(p.value)} USDC` : '—'}
            </div>
          </div>
        ))}
      </div>
      {/* gARC Claim pool + total checkins */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
        <div style={{ background: 'rgba(168,85,247,0.08)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(168,85,247,0.2)' }}>
          <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>gARC Claim Pool</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#A855F7', fontVariantNumeric: 'tabular-nums' }}>
            {rg.data !== undefined ? `${fmt18(rg.data)} gARC` : '—'}
          </div>
        </div>
        <div style={{ background: 'rgba(59,130,246,0.08)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Total Check-ins</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#60A5FA', fontVariantNumeric: 'tabular-nums' }}>
            {rt.data !== undefined ? rt.data.toString() : '—'}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-component: Milestone Card ─────────────────────────────────────────────
function MilestoneCard({ m, streak, address, rewardBalance }: {
  m: typeof MILESTONES[0]
  streak: bigint
  address: Address
  rewardBalance: bigint
}) {
  const streakN = Number(streak)
  const progress = Math.min(streakN % m.days || (streakN >= m.days ? m.days : 0), m.days)
  const pct = Math.min((progress / m.days) * 100, 100)
  const reached = streakN >= m.days

  const { data: pendingDay } = useReadContract({
    address: CHECKIN_ADDR, abi: CHECKIN_ABI, functionName: 'pendingClaimDay',
    args: [address, m.tier], chainId: CHAIN_ID,
  })
  const { data: pendingUsdc } = useReadContract({
    address: CHECKIN_ADDR, abi: CHECKIN_ABI, functionName: 'pendingClaimUsdc',
    args: [address, m.tier], chainId: CHAIN_ID,
  })
  const { data: snapshotDone } = useReadContract({
    address: CHECKIN_ADDR, abi: CHECKIN_ABI, functionName: 'snapshotExecuted',
    args: [pendingDay ?? 0n], chainId: CHAIN_ID,
    query: { enabled: (pendingDay ?? 0n) > 0n },
  })

  const isQueued     = (pendingDay ?? 0n) > 0n
  const canClaim     = isQueued && snapshotDone
  const canQueue     = reached && !isQueued
  const claimableUsdc = pendingUsdc ?? 0n

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  useEffect(() => {
    if (isSuccess) toast.success(`${m.label} milestone action confirmed!`)
  }, [isSuccess, m.label])

  const handleQueue = () => {
    writeContract({
      address: CHECKIN_ADDR, abi: CHECKIN_ABI, functionName: 'queueMilestoneClaim',
      args: [m.tier], chainId: CHAIN_ID,
    })
  }
  const handleClaim = () => {
    writeContract({
      address: CHECKIN_ADDR, abi: CHECKIN_ABI, functionName: 'claimMilestone',
      args: [m.tier], chainId: CHAIN_ID,
    })
  }

  const loading = isPending || isConfirming

  // Estimated reward
  const estReward = rewardBalance > 0n
    ? (Number(formatUnits(rewardBalance, 6)) * m.bps / 10000).toFixed(4)
    : '—'

  return (
    <div style={{ background: m.bg, borderRadius: 16, padding: '14px 16px', border: `1px solid ${m.border}`, transition: 'all 0.2s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.label}</span>
          <span style={{ fontSize: 11, color: '#6B7280', marginLeft: 8 }}>{m.days} days · {m.bps / 100}%</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', fontVariantNumeric: 'tabular-nums' }}>
          {Math.min(streakN, m.days)}/{m.days}d
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 10, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: m.color, borderRadius: 2, transition: 'width 0.4s ease' }} />
      </div>

      {/* State + action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: '#9CA3AF' }}>
          {canClaim
            ? <span style={{ color: '#10B981', fontWeight: 600 }}>Ready to claim · {fmt6(claimableUsdc)} USDC equiv.</span>
            : isQueued
              ? <span style={{ color: '#F59E0B' }}>Queued · awaiting snapshot</span>
              : reached
                ? <span style={{ color: m.color, fontWeight: 600 }}>~{estReward} USDC reward</span>
                : <span>{m.days - streakN > 0 ? `${m.days - streakN} days to go` : 'Keep going!'}</span>
          }
        </div>
        {canQueue && (
          <button onClick={handleQueue} disabled={loading} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: m.color, color: '#000', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? '...' : 'Queue'}
          </button>
        )}
        {canClaim && (
          <button onClick={handleClaim} disabled={loading} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#10B981', color: '#000', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? '...' : 'Claim gARC'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GMCheckInPage() {
  const { address, isConnected, chainId } = useAccount()
  const wrongChain = isConnected && chainId !== CHAIN_ID

  // Contract reads
  const { data: fee } = useReadContract({ address: CHECKIN_ADDR, abi: CHECKIN_ABI, functionName: 'checkinFee', chainId: CHAIN_ID })
  const { data: userInfo, refetch: refetchUser } = useReadContract({
    address: CHECKIN_ADDR, abi: CHECKIN_ABI, functionName: 'getUserInfo',
    args: [address!], chainId: CHAIN_ID, query: { enabled: !!address },
  })
  const { data: usdcBalance } = useReadContract({ address: USDC_ADDR, abi: ERC20_ABI, functionName: 'balanceOf', args: [address!], chainId: CHAIN_ID, query: { enabled: !!address } })
  const { data: gArcBalance } = useReadContract({ address: GARC_ADDR, abi: ERC20_ABI, functionName: 'balanceOf', args: [address!], chainId: CHAIN_ID, query: { enabled: !!address } })
  const { data: allowance, refetch: refetchAllowance } = useReadContract({ address: USDC_ADDR, abi: ERC20_ABI, functionName: 'allowance', args: [address!, CHECKIN_ADDR], chainId: CHAIN_ID, query: { enabled: !!address } })
  const { data: rewardBalance } = useReadContract({ address: POOL_ADDR, abi: POOL_ABI, functionName: 'poolBalance', args: [0], chainId: CHAIN_ID })

  const streak = userInfo?.[1] ?? 0n
  const lastDay = userInfo?.[0] ?? 0n
  const totalCheckins = userInfo?.[2] ?? 0n
  const todayIndex = BigInt(currentDayIndex())
  const alreadyCheckedIn = lastDay === todayIndex
  const feeAmt = fee ?? 0n
  const hasAllowance = (allowance ?? 0n) >= feeAmt

  // Write contracts
  const { writeContract: doApprove, data: approveTx, isPending: approvePending } = useWriteContract()
  const { writeContract: doCheckin, data: checkinTx, isPending: checkinPending } = useWriteContract()

  const { isLoading: approveConfirming, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveTx })
  const { isLoading: checkinConfirming, isSuccess: checkinSuccess } = useWaitForTransactionReceipt({ hash: checkinTx })

  useEffect(() => {
    if (approveSuccess) { refetchAllowance(); toast.success('USDC approved!') }
  }, [approveSuccess, refetchAllowance])

  useEffect(() => {
    if (checkinSuccess) { refetchUser(); toast.success('GM! Check-in confirmed.') }
  }, [checkinSuccess, refetchUser])

  const handleApprove = () => {
    doApprove({ address: USDC_ADDR, abi: ERC20_ABI, functionName: 'approve', args: [CHECKIN_ADDR, parseUnits('1000', 6)], chainId: CHAIN_ID })
  }
  const handleCheckin = () => {
    doCheckin({ address: CHECKIN_ADDR, abi: CHECKIN_ABI, functionName: 'checkin', chainId: CHAIN_ID })
  }

  const approveLoading = approvePending || approveConfirming
  const checkinLoading = checkinPending || checkinConfirming

  // Streak ring params
  const streakN = Number(streak)
  const nextMilestone = MILESTONES.find(m => streakN < m.days)
  const ringMax = nextMilestone?.days ?? 365
  const ringPct = Math.min(streakN / ringMax, 1)
  const R = 52, cx = 64, cy = 64
  const circumference = 2 * Math.PI * R
  const offset = circumference * (1 - ringPct)

  return (
    <div style={{ minHeight: '100dvh', background: '#030712', color: '#F9FAFB', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px 80px' }}>

        {/* Header: connect wallet */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: '#F9FAFB' }}>GM Protocol</div>
            <div style={{ fontSize: 11, color: '#4B5563', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Arc Testnet</div>
          </div>
          <ConnectKitButton />
        </div>

        {wrongChain && (
          <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#FCA5A5' }}>
            Please switch to Arc Testnet to use GM Protocol.
          </div>
        )}

        {!isConnected ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>👋</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Connect your wallet</div>
            <div style={{ fontSize: 14, color: '#6B7280' }}>Connect to start your daily GM streak on Arc Network</div>
          </div>
        ) : (
          <>
            {/* Hero card: streak ring + check-in */}
            <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(168,85,247,0.06) 100%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, padding: '28px 24px', marginBottom: 20, textAlign: 'center' }}>

              {/* Streak ring */}
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
                <svg width={128} height={128} viewBox="0 0 128 128">
                  <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
                  <circle cx={cx} cy={cy} r={R} fill="none"
                    stroke={nextMilestone?.color ?? '#A855F7'} strokeWidth={8}
                    strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
                    transform={`rotate(-90 ${cx} ${cy})`}
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em', color: '#F9FAFB', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{streakN}</div>
                  <div style={{ fontSize: 10, color: '#6B7280', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>day streak</div>
                </div>
              </div>

              {/* Next milestone hint */}
              {nextMilestone && (
                <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
                  <span style={{ color: nextMilestone.color, fontWeight: 600 }}>{nextMilestone.days - streakN}</span> days to {nextMilestone.label}
                </div>
              )}

              {/* Stats row */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginBottom: 24 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#F9FAFB', fontVariantNumeric: 'tabular-nums' }}>{totalCheckins.toString()}</div>
                  <div style={{ fontSize: 10, color: '#6B7280', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Total GMs</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#60A5FA', fontVariantNumeric: 'tabular-nums' }}>{usdcBalance !== undefined ? fmt6(usdcBalance) : '—'}</div>
                  <div style={{ fontSize: 10, color: '#6B7280', letterSpacing: '0.06em', textTransform: 'uppercase' }}>USDC Bal.</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#A855F7', fontVariantNumeric: 'tabular-nums' }}>{gArcBalance !== undefined ? fmt18(gArcBalance) : '—'}</div>
                  <div style={{ fontSize: 10, color: '#6B7280', letterSpacing: '0.06em', textTransform: 'uppercase' }}>gARC Bal.</div>
                </div>
              </div>

              {/* Check-in button */}
              {!hasAllowance ? (
                <button onClick={handleApprove} disabled={approveLoading}
                  style={{ width: '100%', padding: '14px', borderRadius: 14, fontSize: 15, fontWeight: 700, background: '#3B82F6', color: '#fff', border: 'none', cursor: approveLoading ? 'not-allowed' : 'pointer', opacity: approveLoading ? 0.7 : 1, letterSpacing: '-0.01em' }}>
                  {approveLoading ? 'Approving USDC...' : 'Approve USDC to Check In'}
                </button>
              ) : alreadyCheckedIn ? (
                <div style={{ padding: '14px', borderRadius: 14, fontSize: 15, fontWeight: 700, background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)', textAlign: 'center' }}>
                  ✓ GM sent today!
                </div>
              ) : (
                <button onClick={handleCheckin} disabled={checkinLoading || wrongChain}
                  style={{ width: '100%', padding: '14px', borderRadius: 14, fontSize: 16, fontWeight: 800, background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', color: '#fff', border: 'none', cursor: checkinLoading ? 'not-allowed' : 'pointer', opacity: checkinLoading ? 0.7 : 1, letterSpacing: '-0.01em' }}>
                  {checkinLoading ? 'Confirming...' : `GM! (${feeAmt > 0n ? fmt6(feeAmt) : '0.1'} USDC)`}
                </button>
              )}

              <div style={{ fontSize: 11, color: '#374151', marginTop: 10 }}>
                {fee !== undefined ? `Fee: ${fmt6(feeAmt)} USDC · Resets midnight UTC` : 'Loading...'}
              </div>
            </div>

            {/* Milestone cards */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#6B7280', textTransform: 'uppercase', marginBottom: 12 }}>
                Milestones
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {MILESTONES.map(m => (
                  <MilestoneCard key={m.tier} m={m} streak={streak} address={address!} rewardBalance={rewardBalance ?? 0n} />
                ))}
              </div>
            </div>

            {/* Pool stats */}
            <PoolStats />
          </>
        )}
      </div>
    </div>
  )
}
