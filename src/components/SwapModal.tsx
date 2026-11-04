import { useEffect, useRef, useState } from 'react'
import { useAccount, usePublicClient, useReadContract, useSwitchChain, useWriteContract } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { formatUnits, parseUnits, type Address } from 'viem'
import { arcTestnet } from 'viem/chains'
import { TokenUSDC } from '@web3icons/react'
import { ArrowDown, ChevronDown, ExternalLink, Info, Loader2, Settings2, X } from 'lucide-react'
import { toast } from 'sonner'
import WalletButton from './WalletButton'

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

// Uniswap-like surfaces
const CARD = '#131A2A'
const PANEL = '#1B2236'
const PILL = '#2A3350'
const LINE = 'rgba(255,255,255,0.08)'
const PINK = '#FC72FF'
const FONT = "'DM Sans', ui-sans-serif, system-ui, sans-serif"

function fmtAmount(v: bigint | undefined, decimals: number, maxFrac = 6): string {
  if (v === undefined) return '—'
  const n = Number(formatUnits(v, decimals))
  if (n === 0) return '0'
  if (n < 0.0001) return n.toPrecision(3)
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

function TokenBadge({ side }: { side: Side }) {
  return (
    <span className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full text-white font-semibold text-base" style={{ background: PILL }}>
      {side.symbol === 'USDC' ? (
        <TokenUSDC size={26} variant="branded" />
      ) : (
        <span className="size-[26px] rounded-full flex items-center justify-center text-[13px] font-bold text-[#1a0b2e]" style={{ background: `linear-gradient(135deg, ${PINK}, #7C5CFF)` }}>g</span>
      )}
      {side.symbol}
    </span>
  )
}

export default function SwapModal({ onClose }: { onClose: () => void }) {
  const { address, isConnected, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const publicClient = usePublicClient({ chainId: CHAIN_ID })
  const { writeContractAsync } = useWriteContract()

  const [usdcToGarc, setUsdcToGarc] = useState(true)
  const [amountStr, setAmountStr] = useState('')
  const [slippageBps, setSlippageBps] = useState(100)
  const [showSettings, setShowSettings] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [busy, setBusy] = useState<null | 'approve' | 'swap'>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

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
      ? `1 ${from.symbol} = ${fmtAmount((amountOut * 10n ** BigInt(from.decimals)) / amountIn, to.decimals)} ${to.symbol}`
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

  function onAmountChange(raw: string) {
    const v = raw.replace(/[^0-9.]/g, '')
    if (v === '' || /^\d*\.?\d*$/.test(v)) setAmountStr(v)
  }

  // Primary action
  let action: React.ReactNode
  if (!isConnected) {
    action = (
      <ConnectKitButton.Custom>
        {({ show }) => <Cta onClick={show}>Connect wallet</Cta>}
      </ConnectKitButton.Custom>
    )
  } else if (wrongChain) {
    action = <Cta onClick={() => switchChain({ chainId: CHAIN_ID })}>Switch to Arc Testnet</Cta>
  } else if (amountIn === 0n) {
    action = <Cta disabled>Enter an amount</Cta>
  } else if (insufficient) {
    action = <Cta disabled>Insufficient {from.symbol} balance</Cta>
  } else if (quoteError || amountOut === undefined) {
    action = <Cta disabled>{quoteError ? 'Insufficient liquidity' : 'Fetching quote…'}</Cta>
  } else if (needsApproval) {
    action = (
      <Cta onClick={() => void handleApprove()} disabled={busy !== null}>
        {busy === 'approve' ? <Spinner label="Approving…" /> : `Allow ${from.symbol}`}
      </Cta>
    )
  } else {
    action = (
      <Cta onClick={() => void handleSwap()} disabled={busy !== null} danger={highImpact}>
        {busy === 'swap' ? <Spinner label="Swapping…" /> : highImpact ? 'Swap anyway' : 'Swap'}
      </Cta>
    )
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center bg-black/65 backdrop-blur-sm px-3 pt-20 sm:pt-0 overflow-y-auto"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Swap"
        className="w-full p-2 mb-6"
        style={{ background: CARD, fontFamily: FONT, maxWidth: 460, borderRadius: 28, border: `1px solid ${LINE}`, boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-3 pt-2.5 pb-2">
          <h3 className="text-white text-lg font-semibold">Swap</h3>
          <div className="flex items-center gap-1.5">
            <WalletButton />
            <IconButton label="Slippage settings" active={showSettings} onClick={() => setShowSettings(v => !v)}>
              <Settings2 className="size-[18px]" />
            </IconButton>
            <IconButton label="Close" onClick={onClose}>
              <X className="size-[18px]" />
            </IconButton>
          </div>
        </div>

        {showSettings && (
          <div className="mx-1 mb-2 rounded-2xl px-4 py-3 flex items-center justify-between" style={{ background: PANEL }}>
            <div>
              <p className="text-sm text-white font-medium">Max slippage</p>
              <p className="text-[11px] text-gray-500">Your swap reverts if the price moves more than this.</p>
            </div>
            <div className="flex gap-1 rounded-full p-1" style={{ background: CARD }}>
              {SLIPPAGE_OPTIONS.map(bps => (
                <button
                  key={bps}
                  onClick={() => setSlippageBps(bps)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${slippageBps === bps ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                  style={slippageBps === bps ? { background: PILL } : undefined}
                >
                  {bps / 100}%
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sell */}
        <div className="swap-panel rounded-2xl px-4 pt-3.5 pb-3" style={{ background: PANEL }}>
          <p className="text-sm text-gray-400 mb-1.5">Sell</p>
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              inputMode="decimal"
              autoComplete="off"
              value={amountStr}
              onChange={e => onAmountChange(e.target.value)}
              placeholder="0"
              aria-label={`Amount of ${from.symbol} to sell`}
              className="swap-input"
              style={{ flex: 1, minWidth: 0, width: '100%', background: 'transparent', border: 'none', outline: 'none', padding: 0, color: '#fff', caretColor: PINK, fontFamily: 'inherit', fontSize: 40, lineHeight: '48px', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}
            />
            <TokenBadge side={from} />
          </div>
          <div className="flex items-center justify-end gap-2 mt-1.5 text-sm text-gray-400 tabular-nums">
            <span>Balance: {isConnected ? fmtAmount(fromBal, from.decimals) : '—'}</span>
            {isConnected && fromBal !== undefined && fromBal > 0n && (
              <button
                onClick={() => setAmountStr(formatUnits(fromBal, from.decimals))}
                className="px-2 py-0.5 rounded-lg text-xs font-semibold hover:opacity-80 transition-opacity"
                style={{ background: `${PINK}26`, color: PINK }}
              >
                Max
              </button>
            )}
          </div>
        </div>

        {/* Flip */}
        <div className="relative h-0 flex justify-center z-10">
          <button
            onClick={flip}
            aria-label="Switch tokens"
            className="absolute -translate-y-1/2 size-10 rounded-xl flex items-center justify-center text-gray-300 hover:text-white transition-colors"
            style={{ background: PANEL, border: `4px solid ${CARD}` }}
          >
            <ArrowDown className="size-[18px]" />
          </button>
        </div>

        {/* Buy */}
        <div className="rounded-2xl px-4 pt-3.5 pb-3 mt-1" style={{ background: PANEL }}>
          <p className="text-sm text-gray-400 mb-1.5">Buy</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0 truncate" style={{ fontSize: 40, lineHeight: '48px', fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: amountOut !== undefined ? '#fff' : '#4B5563' }}>
              {amountOut !== undefined ? fmtAmount(amountOut, to.decimals) : '0'}
            </div>
            <TokenBadge side={to} />
          </div>
          <div className="flex items-center justify-end mt-1.5 text-sm text-gray-400 tabular-nums">
            Balance: {isConnected ? fmtAmount(toBal, to.decimals) : '—'}
          </div>
        </div>

        {/* Details */}
        {rateText && (
          <div className="mx-1 mt-2 rounded-2xl" style={{ border: `1px solid ${LINE}` }}>
            <button
              onClick={() => setShowDetails(v => !v)}
              className="w-full flex items-center justify-between px-3.5 py-3 text-sm text-gray-300 tabular-nums"
              aria-expanded={showDetails}
            >
              <span>{rateText}</span>
              <ChevronDown className={`size-4 text-gray-500 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
            </button>
            {showDetails && (
              <div className="px-3.5 pb-3 space-y-2 text-[13px] pt-3" style={{ borderTop: `1px solid ${LINE}` }}>
                {impactBps !== null && (
                  <Row
                    label="Price impact"
                    value={`${(impactBps / 100).toFixed(2)}%`}
                    valueClass={impactBps >= 500 ? 'text-red-400' : impactBps >= 100 ? 'text-yellow-300' : 'text-gray-200'}
                  />
                )}
                {minOut !== undefined && <Row label={`Min. received (${slippageBps / 100}%)`} value={`${fmtAmount(minOut, to.decimals)} ${to.symbol}`} />}
                <Row label="Network" value="Arc Testnet" />
              </div>
            )}
          </div>
        )}

        {/* Notices */}
        {highImpact && (
          <Notice tone="danger">
            This pool is shallow, so your trade moves the price a lot. Try a smaller amount.
          </Notice>
        )}
        {reserves && !highImpact && (
          <Notice>
            Testnet pool depth is only {Number(formatUnits(reserves[0], 6)).toLocaleString('en-US', { maximumFractionDigits: 2 })} USDC
            against {fmtAmount(reserves[1], 18)} gARC. Prices are not market prices.
          </Notice>
        )}

        <div className="mt-2 px-1 pb-1">{action}</div>

        <p className="px-3 pt-2 pb-2.5 text-[11px] text-gray-500 text-center">
          Testnet only. Tokens have no real value.{' '}
          <a href={`https://explorer.testnet.arc.io/address/${PAIR}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 hover:text-gray-300 underline underline-offset-2">
            Pool <ExternalLink className="size-3" />
          </a>
        </p>
      </div>
    </div>
  )
}

function Row({ label, value, valueClass = 'text-gray-200' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-400">{label}</span>
      <span className={`${valueClass} text-right tabular-nums`}>{value}</span>
    </div>
  )
}

function Notice({ children, tone = 'info' }: { children: React.ReactNode; tone?: 'info' | 'danger' }) {
  const cls = tone === 'danger' ? 'text-red-300' : 'text-gray-400'
  const bg = tone === 'danger' ? 'rgba(240,71,91,0.10)' : 'rgba(255,255,255,0.04)'
  return (
    <div className={`mx-1 mt-2 flex gap-2 rounded-2xl px-3.5 py-3 text-xs leading-relaxed ${cls}`} style={{ background: bg }}>
      <Info className="size-4 shrink-0 mt-px" />
      <p>{children}</p>
    </div>
  )
}

function IconButton({ children, label, onClick, active }: { children: React.ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`size-9 rounded-full flex items-center justify-center transition-colors ${active ? 'text-white bg-white/[0.12]' : 'text-gray-400 hover:text-white hover:bg-white/[0.08]'}`}
    >
      {children}
    </button>
  )
}

function Spinner({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <Loader2 className="size-4 animate-spin" /> {label}
    </span>
  )
}

function Cta({ children, onClick, disabled, danger }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; danger?: boolean }) {
  const style = disabled
    ? { background: PILL, color: '#8B93AD' }
    : danger
      ? { background: '#F0475B', color: '#fff' }
      : { background: PINK, color: '#2B0B33' }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full h-14 rounded-2xl text-base font-semibold transition-[filter,transform] enabled:hover:brightness-110 enabled:active:scale-[0.99] disabled:cursor-not-allowed"
      style={style}
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
