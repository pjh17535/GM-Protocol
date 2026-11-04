import { useState } from 'react'
import { useAccount, usePublicClient, useReadContract, useSwitchChain, useWriteContract } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { ConnectKitButton } from 'connectkit'
import { formatUnits, type Address } from 'viem'
import { arcTestnet } from 'viem/chains'
import { toast } from 'sonner'
import { PARTNERS, type Partner } from '../data/partners'

const CHAIN_ID = arcTestnet.id
const USDC: Address = '0x3600000000000000000000000000000000000000'

const PARTNER_ABI = [
  { name: 'isActive', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'bool' }] },
  { name: 'CHECKIN_FEE', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  {
    name: 'getUserInfo', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: 'lastCheckinDay', type: 'uint256' }, { name: 'currentStreak', type: 'uint256' }, { name: 'totalUserCheckins', type: 'uint256' }],
  },
  { name: 'checkin', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
] as const

const ERC20_ABI = [
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'o', type: 'address' }, { name: 's', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 's', type: 'address' }, { name: 'v', type: 'uint256' }], outputs: [{ type: 'bool' }] },
] as const

const LABEL: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#6B7280', textTransform: 'uppercase', marginBottom: 12 }
const CARD: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 16 }

function errMsg(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e)
  if (/user rejected|denied/i.test(m)) return 'Transaction cancelled'
  return m.split('\n')[0].slice(0, 140)
}

function PartnerCheckinCard({ partner }: { partner: Partner }) {
  const { address, isConnected, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const publicClient = usePublicClient({ chainId: CHAIN_ID })
  const { writeContractAsync } = useWriteContract()
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState<null | 'approve' | 'checkin'>(null)
  const [today] = useState(() => Math.floor(Date.now() / 86_400_000))

  const contract = partner.contractAddress as Address
  const { data: isActive } = useReadContract({ address: contract, abi: PARTNER_ABI, functionName: 'isActive', chainId: CHAIN_ID })
  const { data: fee } = useReadContract({ address: contract, abi: PARTNER_ABI, functionName: 'CHECKIN_FEE', chainId: CHAIN_ID })
  const { data: info, refetch: refetchInfo } = useReadContract({
    address: contract, abi: PARTNER_ABI, functionName: 'getUserInfo',
    args: address ? [address] : undefined, chainId: CHAIN_ID, query: { enabled: !!address },
  })
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC, abi: ERC20_ABI, functionName: 'allowance',
    args: address ? [address, contract] : undefined, chainId: CHAIN_ID, query: { enabled: !!address },
  })

  const streak = Number(info?.[1] ?? 0n)
  const total = Number(info?.[2] ?? 0n)
  const last = Number(info?.[0] ?? 0n)
  const doneToday = last === today && total > 0
  const feeAmt = fee ?? 100_000n
  const needsApproval = allowance !== undefined && allowance < feeAmt
  const wrongChain = isConnected && chainId !== CHAIN_ID

  async function wait(hash: `0x${string}`) {
    const r = await publicClient?.waitForTransactionReceipt({ hash })
    if (r?.status === 'reverted') throw new Error('Transaction reverted')
  }

  async function approve() {
    setBusy('approve')
    try {
      const hash = await writeContractAsync({ address: USDC, abi: ERC20_ABI, functionName: 'approve', args: [contract, feeAmt * 30n], chainId: CHAIN_ID })
      await wait(hash)
      await refetchAllowance()
      toast.success('USDC allowed')
    } catch (e) { toast.error(errMsg(e)) } finally { setBusy(null) }
  }

  async function checkin() {
    setBusy('checkin')
    try {
      const hash = await writeContractAsync({ address: contract, abi: PARTNER_ABI, functionName: 'checkin', chainId: CHAIN_ID })
      await wait(hash)
      toast.success(`GM sent to ${partner.name}`)
      await Promise.all([refetchInfo(), refetchAllowance()])
      await queryClient.invalidateQueries()
    } catch (e) { toast.error(errMsg(e)) } finally { setBusy(null) }
  }

  const grad = 'linear-gradient(135deg, #3B82F6, #8B5CF6)'
  let action: React.ReactNode
  const btn = (label: string, onClick?: () => void, disabled?: boolean) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ width: '100%', padding: 12, borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 700, color: '#fff', background: disabled ? 'rgba(255,255,255,0.08)' : grad, opacity: disabled ? 0.7 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      {label}
    </button>
  )
  if (!isConnected) {
    action = <ConnectKitButton.Custom>{({ show }) => btn('Connect wallet', show)}</ConnectKitButton.Custom>
  } else if (wrongChain) {
    action = btn('Switch to Arc Testnet', () => switchChain({ chainId: CHAIN_ID }))
  } else if (isActive === false) {
    action = btn('Not live yet', undefined, true)
  } else if (doneToday) {
    action = (
      <div style={{ padding: 12, borderRadius: 12, textAlign: 'center', fontSize: 14, fontWeight: 700, background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)' }}>
        GM sent today
      </div>
    )
  } else if (needsApproval) {
    action = btn(busy === 'approve' ? 'Allowing USDC…' : 'Allow USDC', () => void approve(), busy !== null)
  } else {
    action = btn(busy === 'checkin' ? 'Confirming…' : `GM ${partner.name} (${formatUnits(feeAmt, 6)} USDC)`, () => void checkin(), busy !== null || isActive === undefined)
  }

  return (
    <div style={CARD}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ color: '#F9FAFB', fontWeight: 700, fontSize: 14 }}>{partner.name}</div>
          <div style={{ color: '#6B7280', fontSize: 11, marginTop: 2 }}>
            {isActive ? 'Live' : isActive === false ? 'Awaiting funds' : 'Loading…'}
          </div>
        </div>
        {isConnected && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#F9FAFB', fontWeight: 700, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>{streak}</div>
            <div style={{ color: '#6B7280', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>day streak</div>
          </div>
        )}
      </div>
      {action}
    </div>
  )
}

export default function PartnerCheckins() {
  const live = PARTNERS.filter(p => p.contractAddress)
  return (
    <div style={{ marginTop: 28 }}>
      <div style={LABEL}>Partner Check-ins</div>
      {live.length === 0 ? (
        <div style={{ ...CARD, textAlign: 'center', color: '#6B7280', fontSize: 13 }}>No partner projects are live yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {live.map(p => <PartnerCheckinCard key={p.id} partner={p} />)}
        </div>
      )}
      <div style={{ fontSize: 11, color: '#4B5563', marginTop: 10, lineHeight: 1.5 }}>
        Your first partner check-in of the day also counts as your main GM, so your streak keeps going. Each partner check-in costs 0.1 USDC.
      </div>
    </div>
  )
}
