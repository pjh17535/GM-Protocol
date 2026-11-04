import { useState } from 'react'
import { useAccount, usePublicClient, useReadContract, useSwitchChain, useWriteContract } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { formatUnits, parseUnits, type Address } from 'viem'
import { arcTestnet } from 'viem/chains'
import { toast } from 'sonner'

// ── Arc Testnet addresses ─────────────────────────────────────────────────────
const ROUTER: Address = '0xE27d5D256B370604F1Ff060fB489c6A8E3F8A6D9'
const PAIR: Address   = '0xc0e9695ab4e41f4477074845046b3d152c4c8958'
const USDC: Address   = '0x3600000000000000000000000000000000000000'
const GARC: Address   = '0x742f1c4D413d13913c80D9b6A35002C2b7D8b9Fc'
const CHAIN_ID = arcTestnet.id

const ROUTER_ABI = [
  { name: 'getAmountsOut', type: 'function', stateMutability: 'view', inputs: [{ name: 'amountIn', type: 'uint256' }, { name: 'path', type: 'address[]' }], outputs: [{ type: 'uint256[]' }] },
  {
    name: 'swapExactTokensForTokens', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'amountIn', type: 'uint256' }, { name: 'amountOutMin', type: 'uint256' }, { name: 'path', type: 'address[]' }, { name: 'to', type: 'address' }, { name: 'deadline', type: 'uint256' }],
    outputs: [{ type: 'uint256[]' }],
  },
] as const

const ERC20_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'a', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'o', type: 'address' }, { name: 's', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 's', type: 'address' }, { name: 'v', type: 'uint256' }], outputs: [{ type: 'bool' }] },
] as const

const PAIR_ABI = [
  { name: 'getReserves', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint112' }, { type: 'uint112' }, { type: 'uint32' }] },
] as const

interface Side { symbol: 'USDC' | 'gARC'; address: Address; decimals: number }
const USDC_SIDE: Side = { symbol: 'USDC', address: USDC, decimals: 6 }
const GARC_SIDE: Side = { symbol: 'gARC', address: GARC, decimals: 18 }

const SLIPPAGE_OPTIONS = [50, 100, 300] // basis points

function fmtAmount(v: bigint | undefined, decimals: number, maxFrac = 6): string {
  if (v === undefined) return '—'
  const n = Number(formatUnits(v, decimals))
  if (n === 0) return '0'
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  return n.toLocaleString('en-US', { maximumFractionDigits: n < 1 ? maxFrac : 4 })
}

function parseAmount(value: string, decimals: number): bigint {
  if (!value || !/^\d*\.?\d*$/.test(value) || value === '.') return 0n
  try {
    return parseUnits(value, decimals)
  } catch {
    return 0n
  }
}

export default function SwapModal({ onClose }: { onClose: () => void }) {
  const { address, isConnected, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const publicClient = usePublicClient({ chainId: CHAIN_ID })
  const { writeContractAsync } = useWriteContract()

  const [usdcToGarc, setUsdcToGarc] = useState(true)
  const [amountStr, setAmountStr] = useState('')
  const [slippageBps, setSlippageBps] = useState(100)
  const [busy, setBusy] = useState<null | 'approve' | 'swap'>(null)

  const from = usdcToGarc ? USDC_SIDE : GARC_SIDE
  const to   = usdcToGarc ? GARC_SIDE : USDC_SIDE
  const amountIn = parseAmount(amountStr, from.decimals)
  const path: readonly [Address, Address] = [from.address, to.address]

  const { data: fromBal, refetch: refetchFromBal } = useReadContract({
    address: from.address, abi: ERC20_ABI, functionName: 'balanceOf',
    args: address ? [address] : undefined, chainId: CHAIN_ID, query: { enabled: !!address },
  })
  const { data: toBal, refetch: refetchToBal } = useReadContract({
    address: to.address, abi: ERC20_ABI, functionName: 'balanceOf',
    args: address ? [address] : undefined, chainId: CHAIN_ID, query: { enabled: !!address },
  })
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: from.address, abi: ERC20_ABI, functionName: 'allowance',
    args: address ? [address, ROUTER] : undefined, chainId: CHAIN_ID, query: { enabled: !!address },
  })
  const { data: reserves } = useReadContract({
    address: PAIR, abi: PAIR_ABI, functionName: 'getReserves', chainId: CHAIN_ID,
  })
  const { data: amounts, isError: quoteError } = useReadContract({
    address: ROUTER, abi: ROUTER_ABI, functionName: 'getAmountsOut',
    args: [amountIn, path], chainId: CHAIN_ID,
    query: { enabled: amountIn > 0n, refetchInterval: 15_000 },
  })

  const amountOut = amounts?.[1]
  const minOut = amountOut !== undefined ? (amountOut * BigInt(10_000 - slippageBps)) / 10_000n : undefined

  // Price impact vs. spot price (token0 = USDC, token1 = gARC)
  let impactBps: number | null = null
  if (reserves && amountOut !== undefined && amountIn > 0n) {
    const [r0, r1] = [reserves[0], reserves[1]]
    const spotOut = usdcToGarc ? (amountIn * r1) / r0 : (amountIn * r0) / r1
    if (spotOut > 0n) impactBps = Number(((spotOut - amountOut) * 10_000n) / spotOut)
  }

  const rateText =
    amountOut !== undefined && amountIn > 0n
      ? `1 ${from.symbol} ≈ ${fmtAmount((amountOut * 10n ** BigInt(from.decimals)) / amountIn, to.decimals)} ${to.symbol}`
      : null

  const wrongChain = isConnected && chainId !== CHAIN_ID
  const insufficient = fromBal !== undefined && amountIn > fromBal
  const needsApproval = allowance !== undefined && amountIn > 0n && allowance < amountIn
  const highImpact = impactBps !== null && impactBps >= 500

  async function waitFor(hash: `0x${string}`) {
    const receipt = await publicClient?.waitForTransactionReceipt({ hash })
    if (receipt?.status === 'reverted') throw new Error('Transaction reverted')
  }

  async function handleApprove() {
    setBusy('approve')
    try {
      const hash = await writeContractAsync({
        address: from.address, abi: ERC20_ABI, functionName: 'approve',
        args: [ROUTER, amountIn], chainId: CHAIN_ID,
      })
      await waitFor(hash)
      await refetchAllowance()
      toast.success(`${from.symbol} approved`)
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(null)
    }
  }

  async function handleSwap() {
    if (!address || minOut === undefined) return
    setBusy('swap')
    try {
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60)
      const hash = await writeContractAsync({
        address: ROUTER, abi: ROUTER_ABI, functionName: 'swapExactTokensForTokens',
        args: [amountIn, minOut, path, address, deadline], chainId: CHAIN_ID,
      })
      await waitFor(hash)
      toast.success(`Swapped ${from.symbol} for ${to.symbol}`)
      setAmountStr('')
      await Promise.all([refetchFromBal(), refetchToBal(), refetchAllowance()])
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(null)
    }
  }

  function flip() {
    setUsdcToGarc(v => !v)
    setAmountStr('')
  }

  let action: React.ReactNode
  if (!isConnected) {
    action = (
      <ConnectKitButton.Custom>
        {({ show }) => (
          <button onClick={show} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors">Connect Wallet</button>
        )}
      </ConnectKitButton.Custom>
    )
  } else if (wrongChain) {
    action = <ActionButton onClick={() => switchChain({ chainId: CHAIN_ID })}>Switch to Arc Testnet</ActionButton>
  } else if (amountIn === 0n) {
    action = <ActionButton disabled>Enter an amount</ActionButton>
  } else if (insufficient) {
    action = <ActionButton disabled>Insufficient {from.symbol} balance</ActionButton>
  } else if (quoteError || amountOut === undefined) {
    action = <ActionButton disabled>{quoteError ? 'Not enough liquidity' : 'Fetching quote…'}</ActionButton>
  } else if (needsApproval) {
    action = <ActionButton onClick={() => void handleApprove()} disabled={busy !== null}>{busy === 'approve' ? 'Approving…' : `Approve ${from.symbol}`}</ActionButton>
  } else {
    action = (
      <ActionButton onClick={() => void handleSwap()} disabled={busy !== null} danger={highImpact}>
        {busy === 'swap' ? 'Swapping…' : highImpact ? 'Swap anyway' : 'Swap'}
      </ActionButton>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-[#0F1B2D] border border-blue-500/20 rounded-2xl p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-bold">Swap gARC</h3>
            <p className="text-gray-500 text-[11px]">Arc Testnet · Uniswap V2 pool</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none px-2" aria-label="Close">×</button>
        </div>

        {reserves && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-[11px] text-yellow-200/90 leading-snug">
            Testnet pool is a small test seed: {Number(formatUnits(reserves[0], 6)).toLocaleString('en-US', { maximumFractionDigits: 2 })} USDC
            / {Number(formatUnits(reserves[1], 18)).toLocaleString('en-US', { maximumFractionDigits: 3 })} gARC.
            Prices are not market prices and trades move them sharply.
          </div>
        )}

        {/* From */}
        <div className="bg-white/4 border border-white/8 rounded-xl p-3">
          <div className="flex justify-between text-[11px] text-gray-500 mb-1.5">
            <span>You pay</span>
            <button
              className="hover:text-blue-400 transition-colors"
              onClick={() => fromBal !== undefined && setAmountStr(formatUnits(fromBal, from.decimals))}
            >
              Balance: {fmtAmount(fromBal, from.decimals)} (Max)
            </button>
          </div>
          <div className="flex items-center gap-3">
            <input
              inputMode="decimal"
              value={amountStr}
              onChange={e => setAmountStr(e.target.value.trim())}
              placeholder="0.0"
              className="flex-1 min-w-0 bg-transparent text-xl text-white placeholder-gray-600 focus:outline-none"
            />
            <span className="px-2.5 py-1 rounded-lg bg-white/8 text-white text-sm font-semibold">{from.symbol}</span>
          </div>
        </div>

        <div className="flex justify-center -my-2 relative z-10">
          <button onClick={flip} className="w-8 h-8 rounded-full bg-[#0F1B2D] border border-white/15 text-gray-300 hover:text-white hover:border-blue-500/50 transition-colors" aria-label="Flip direction">⇅</button>
        </div>

        {/* To */}
        <div className="bg-white/4 border border-white/8 rounded-xl p-3">
          <div className="flex justify-between text-[11px] text-gray-500 mb-1.5">
            <span>You receive (estimated)</span>
            <span>Balance: {fmtAmount(toBal, to.decimals)}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0 text-xl text-white truncate">{amountOut !== undefined ? fmtAmount(amountOut, to.decimals) : <span className="text-gray-600">0.0</span>}</div>
            <span className="px-2.5 py-1 rounded-lg bg-white/8 text-white text-sm font-semibold">{to.symbol}</span>
          </div>
        </div>

        {/* Details */}
        <div className="mt-3 space-y-1.5 text-[11px]">
          {rateText && <Row label="Rate" value={rateText} />}
          {impactBps !== null && (
            <Row
              label="Price impact"
              value={`${(impactBps / 100).toFixed(2)}%`}
              valueClass={impactBps >= 500 ? 'text-red-400' : impactBps >= 100 ? 'text-yellow-400' : 'text-gray-300'}
            />
          )}
          {minOut !== undefined && <Row label={`Minimum received (${slippageBps / 100}% slippage)`} value={`${fmtAmount(minOut, to.decimals)} ${to.symbol}`} />}
          <div className="flex items-center justify-between pt-1">
            <span className="text-gray-500">Max slippage</span>
            <div className="flex gap-1">
              {SLIPPAGE_OPTIONS.map(bps => (
                <button
                  key={bps}
                  onClick={() => setSlippageBps(bps)}
                  className={`px-2 py-0.5 rounded-md border text-[11px] transition-colors ${slippageBps === bps ? 'border-blue-500 bg-blue-500/15 text-blue-300' : 'border-white/10 text-gray-400 hover:text-white'}`}
                >
                  {bps / 100}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {highImpact && (
          <p className="mt-3 text-[11px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 leading-relaxed">
            This pool is shallow, so your trade moves the price a lot. Try a smaller amount.
          </p>
        )}

        <div className="mt-4">{action}</div>

        <p className="mt-3 text-[10px] text-gray-600 text-center leading-relaxed">
          Testnet only. Tokens have no real value. Pool:{' '}
          <a href={`https://explorer.testnet.arc.io/address/${PAIR}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">view on explorer ↗</a>
        </p>
      </div>
    </div>
  )
}

function Row({ label, value, valueClass = 'text-gray-300' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-500">{label}</span>
      <span className={`${valueClass} text-right`}>{value}</span>
    </div>
  )
}

function ActionButton({ children, onClick, disabled, danger }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3 rounded-xl text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${danger ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}
    >
      {children}
    </button>
  )
}

function errMsg(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e)
  if (/user rejected|denied/i.test(m)) return 'Transaction cancelled'
  return m.split('\n')[0].slice(0, 140)
}
