import { useMemo } from 'react'
import { useReadContract, useReadContracts } from 'wagmi'
import { arcTestnet } from 'viem/chains'
import type { Address } from 'viem'

const CHAIN_ID = arcTestnet.id
const SBT_ADDR: Address = '0xB845E2f69d7D5426896B4083594B3C26D4bB8ff2'
const EXPLORER = 'https://explorer.testnet.arc.io'

const SBT_ABI = [
  { name: 'getUserTokens', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256[]' }] },
  {
    name: 'getTokenInfo', type: 'function', stateMutability: 'view', inputs: [{ type: 'uint256' }],
    outputs: [{ name: 'tier', type: 'uint8' }, { name: 'owner', type: 'address' }, { name: 'mintedAt', type: 'uint256' }, { name: 'partnerName', type: 'string' }],
  },
  { name: 'tokenURI', type: 'function', stateMutability: 'view', inputs: [{ type: 'uint256' }], outputs: [{ type: 'string' }] },
] as const

const TIERS = [
  { name: 'Bronze', days: '30-day streak', color: '#CD7F32' },
  { name: 'Gold', days: '90-day streak', color: '#F59E0B' },
  { name: 'Platinum', days: '180-day streak', color: '#CBD5E1' },
  { name: 'Legend', days: '365-day streak', color: '#A855F7' },
  { name: 'Partner', days: 'Partner milestone', color: '#3B82F6' },
]

/** Decode the fully onchain tokenURI (base64 JSON with an inline SVG image). */
function decodeImage(uri: string | undefined): string | null {
  if (!uri) return null
  const prefix = 'data:application/json;base64,'
  if (!uri.startsWith(prefix)) return null
  try {
    const json = JSON.parse(atob(uri.slice(prefix.length))) as { image?: unknown }
    return typeof json.image === 'string' && json.image.startsWith('data:image/svg+xml;base64,') ? json.image : null
  } catch {
    return null
  }
}

export default function SbtBadges({ address }: { address: Address }) {
  const { data: ids, isLoading } = useReadContract({
    address: SBT_ADDR, abi: SBT_ABI, functionName: 'getUserTokens', args: [address], chainId: CHAIN_ID,
  })

  const calls = useMemo(
    () => (ids ?? []).flatMap(id => [
      { address: SBT_ADDR, abi: SBT_ABI, functionName: 'getTokenInfo' as const, args: [id] as const, chainId: CHAIN_ID },
      { address: SBT_ADDR, abi: SBT_ABI, functionName: 'tokenURI' as const, args: [id] as const, chainId: CHAIN_ID },
    ]),
    [ids],
  )
  const { data: details } = useReadContracts({ contracts: calls, query: { enabled: calls.length > 0 } })

  const badges = (ids ?? []).map((id, i) => {
    const info = details?.[i * 2]?.result as readonly [number, string, bigint, string] | undefined
    const uri = details?.[i * 2 + 1]?.result as string | undefined
    return { id, tier: info?.[0], mintedAt: info?.[2], partner: info?.[3], image: decodeImage(uri) }
  })

  return (
    <div className="bg-white/3 border border-white/8 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-gray-400 text-xs uppercase tracking-wider">SBT Badges</p>
        <a href={`${EXPLORER}/address/${SBT_ADDR}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs">
          Contract ↗
        </a>
      </div>

      {isLoading ? (
        <p className="text-gray-600 text-sm py-4 text-center">Loading badges…</p>
      ) : badges.length === 0 ? (
        <div className="py-4 text-center">
          <p className="text-gray-300 text-sm">No badges yet</p>
          <p className="text-gray-600 text-xs mt-1">
            Reach a 30-day streak and claim your first milestone to mint a soulbound Bronze badge.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {badges.map(b => {
            const t = b.tier !== undefined ? TIERS[b.tier] : undefined
            return (
              <div key={b.id.toString()} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${t?.color ?? '#374151'}55` }}>
                <div className="aspect-square rounded-lg overflow-hidden flex items-center justify-center mb-2" style={{ background: 'rgba(0,0,0,0.25)' }}>
                  {b.image ? (
                    <img src={b.image} alt={`${t?.name ?? 'GM'} badge`} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-gray-600 text-xs">Loading art…</span>
                  )}
                </div>
                <p className="text-sm font-semibold" style={{ color: t?.color ?? '#E5E7EB' }}>
                  {t?.name ?? 'Badge'}{b.partner ? ` · ${b.partner}` : ''}
                </p>
                <p className="text-gray-500 text-[11px]">{t?.days ?? ''}</p>
                <p className="text-gray-600 text-[11px] mt-1">
                  #{b.id.toString()}
                  {b.mintedAt ? ` · minted ${new Date(Number(b.mintedAt) * 1000).toISOString().slice(0, 10)}` : ''}
                </p>
                <p className="text-gray-600 text-[10px] mt-0.5">Soulbound, cannot be transferred</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
