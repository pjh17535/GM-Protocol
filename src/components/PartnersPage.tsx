import { useState } from 'react'
import { toast } from 'sonner'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatUnits } from 'viem'
import FeedbackBoard from './FeedbackBoard'
import { PARTNERS, GOOGLE_FORM_URL, PARTNER_MIN_INJECTION_MAINNET, PARTNER_MIN_INJECTION_TESTNET, type Partner, type PartnerStatus } from '../data/partners'

// ─── ABIs ─────────────────────────────────────────────────────────────────────
const USDC_ABI = [
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
] as const

const GMPARTNER_ABI = [
  { name: 'isActive', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'bool' }] },
  { name: 'isExpired', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'bool' }] },
  { name: 'rewardPoolBalance', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'totalInjected', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'activationDeadline', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'injectFunds', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] },
  { name: 'milestoneCount', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
] as const

const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as const

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:  { label: 'Under Review',  cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
    deployed: { label: 'Awaiting Funds', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    active:   { label: 'Live',           cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
    expired:  { label: 'Expired',        cls: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
  }
  const s = map[status] ?? map['pending']
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-current opacity-70'}`} />
      {s.label}
    </span>
  )
}

type InjectStep = 'approve' | 'inject' | 'done'

// ─── Inject Funds Modal ───────────────────────────────────────────────────────
function InjectModal({ partner, onClose }: { partner: Partner; onClose: () => void }) {
  const minRaw = partner.isTestnet ? PARTNER_MIN_INJECTION_TESTNET : PARTNER_MIN_INJECTION_MAINNET
  const minUsdc = Number(formatUnits(minRaw, 6))
  const [amount, setAmount] = useState(String(minUsdc))
  const [step, setStep] = useState<InjectStep>('approve')

  const { writeContract: approve, data: approveTxHash } = useWriteContract()
  const { writeContract: inject, data: injectTxHash } = useWriteContract()
  const { isLoading: approveLoading, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveTxHash })
  const { isLoading: injectLoading, isSuccess: injectSuccess } = useWaitForTransactionReceipt({ hash: injectTxHash })

  const amountBig = BigInt(Math.floor(parseFloat(amount || '0') * 1_000_000))
  const valid = amountBig >= minRaw

  function handleApprove() {
    if (!valid) { toast.error(`Minimum injection is ${minUsdc} USDC`); return }
    approve({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'approve',
      args: [partner.contractAddress as `0x${string}`, amountBig],
    })
  }

  function handleInject() {
    inject({
      address: partner.contractAddress as `0x${string}`,
      abi: GMPARTNER_ABI,
      functionName: 'injectFunds',
      args: [amountBig],
    })
  }

  if (approveSuccess && step === 'approve') setStep('inject')
  if (injectSuccess && step === 'inject') setStep('done')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0F1B2D] border border-blue-500/20 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white mb-1">Inject Funds</h3>
        <p className="text-sm text-gray-400 mb-4">{partner.name}</p>

        {step === 'done' ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-2">🎉</div>
            <p className="text-green-400 font-semibold">Funds injected successfully!</p>
            <p className="text-gray-400 text-sm mt-1">The partner project is now active.</p>
            <button onClick={onClose} className="mt-4 w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors">Close</button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-1 block">Amount (USDC)</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min={minUsdc}
                step="1"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum: {minUsdc.toLocaleString()} USDC {partner.isTestnet ? '(testnet)' : '(mainnet)'}
              </p>
            </div>

            <div className="flex gap-2 mb-4">
              {['approve', 'inject'].map((s, i) => (
                <div key={s} className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium border transition-colors
                  ${step === s ? 'border-blue-500 bg-blue-500/15 text-blue-400' :
                    (step === 'inject' && i === 0) || (step as string) === 'done' ? 'border-green-500/30 bg-green-500/10 text-green-400' :
                    'border-white/10 text-gray-500'}`}>
                  {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
                </div>
              ))}
            </div>

            {step === 'approve' && (
              <button
                onClick={handleApprove}
                disabled={!valid || approveLoading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors"
              >
                {approveLoading ? 'Approving…' : 'Step 1: Approve USDC'}
              </button>
            )}
            {step === 'inject' && (
              <button
                onClick={handleInject}
                disabled={injectLoading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors"
              >
                {injectLoading ? 'Injecting…' : 'Step 2: Inject Funds'}
              </button>
            )}

            <p className="text-xs text-gray-500 mt-3 text-center">
              Split: 80% reward pool · 10% main GM · 10% buyback
            </p>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Partner Card ─────────────────────────────────────────────────────────────
function PartnerCard({ partner }: { partner: Partner }) {
  const { address } = useAccount()
  const [showInject, setShowInject] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  // Capture current time once at mount (avoids impure Date.now in render)
  const [nowSec] = useState(() => Math.floor(Date.now() / 1000))

  const isOperator = address?.toLowerCase() === partner.operatorAddress.toLowerCase()
  const hasContract = !!partner.contractAddress

  // On-chain reads (only when contract exists)
  const { data: isActive } = useReadContract({
    address: hasContract ? partner.contractAddress as `0x${string}` : undefined,
    abi: GMPARTNER_ABI,
    functionName: 'isActive',
    query: { enabled: hasContract },
  })
  const { data: rewardBalance } = useReadContract({
    address: hasContract ? partner.contractAddress as `0x${string}` : undefined,
    abi: GMPARTNER_ABI,
    functionName: 'rewardPoolBalance',
    query: { enabled: hasContract },
  })
  const { data: deadline } = useReadContract({
    address: hasContract ? partner.contractAddress as `0x${string}` : undefined,
    abi: GMPARTNER_ABI,
    functionName: 'activationDeadline',
    query: { enabled: hasContract },
  })

  const nowBig = BigInt(nowSec)
  // Chain read takes priority once loaded; fall back to static partner.status while loading
  const liveStatus: PartnerStatus = !hasContract
    ? 'pending'
    : isActive === true
      ? 'active'
      : isActive === false
        ? (deadline && nowBig > deadline ? 'expired' : 'deployed')
        : partner.status   // isActive still undefined (loading) — use static value

  const daysLeft = deadline
    ? Math.max(0, Math.ceil((Number(deadline) - nowSec) / 86400))
    : null

  return (
    <>
      <div className="bg-white/3 border border-white/8 hover:border-blue-500/30 rounded-2xl p-5 transition-all duration-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {partner.logoURI ? (
              <img src={partner.logoURI} alt={partner.name} className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg">
                {partner.name.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="text-white font-semibold text-sm">{partner.name}</h3>
              <StatusBadge status={liveStatus} />
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-400 text-xs leading-relaxed mb-3">{partner.description}</p>

        {/* Milestones */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {partner.milestoneDays.map((d, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs">
              {['Bronze','Gold','Platinum','Legend'][i]} · {d}d
            </span>
          ))}
        </div>

        {/* On-chain info */}
        {hasContract && (
          <div className="border-t border-white/8 pt-3 mb-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-gray-500">Contract</p>
              <a
                href={`https://explorer.testnet.arc.io/address/${partner.contractAddress}`}
                target="_blank" rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-mono"
              >
                {partner.contractAddress.slice(0, 6)}…{partner.contractAddress.slice(-4)} ↗
              </a>
            </div>
            {isActive && rewardBalance !== undefined && (
              <div>
                <p className="text-gray-500">Reward Pool</p>
                <p className="text-white font-medium">{Number(formatUnits(rewardBalance, 6)).toFixed(2)} USDC</p>
              </div>
            )}
            {liveStatus === 'deployed' && daysLeft !== null && (
              <div>
                <p className="text-gray-500">Funding window</p>
                <p className="text-yellow-400 font-medium">{daysLeft}d remaining</p>
              </div>
            )}
          </div>
        )}

        {/* Links */}
        <div className="flex gap-2 flex-wrap text-xs">
          {partner.website && (
            <a href={partner.website} target="_blank" rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors">Website ↗</a>
          )}
          {partner.twitter && (
            <a href={partner.twitter} target="_blank" rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors">Twitter ↗</a>
          )}
          {partner.github && (
            <a href={partner.github} target="_blank" rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors">GitHub ↗</a>
          )}
        </div>

        {/* Inject button — operator only */}
        {isOperator && hasContract && liveStatus !== 'active' && liveStatus !== 'expired' && (
          <button
            onClick={() => setShowInject(true)}
            className="mt-3 w-full py-2.5 rounded-xl bg-blue-600/80 hover:bg-blue-600 border border-blue-500/50 text-white text-sm font-semibold transition-colors"
          >
            Inject Funds →
          </button>
        )}

        {/* Community feedback (expandable) */}
        {liveStatus !== 'expired' && (
          <div className="mt-3 border-t border-white/8 pt-3">
            <button
              onClick={() => setShowFeedback(v => !v)}
              className="w-full flex items-center justify-between text-xs text-gray-400 hover:text-white transition-colors"
            >
              <span>
                {liveStatus === 'active' ? 'Community feedback' : 'Public notice: share your feedback'}
              </span>
              <span>{showFeedback ? '−' : '+'}</span>
            </button>
            {showFeedback && (
              <div className="mt-3">
                <FeedbackBoard
                  scope={`partner:${partner.id}`}
                  compact
                  title={`Feedback on ${partner.name}`}
                  description="Free to post. You only sign a message."
                />
              </div>
            )}
          </div>
        )}

        {isOperator && liveStatus === 'active' && (
          <div className="mt-3 py-2 text-center text-xs text-green-400 bg-green-500/10 rounded-xl border border-green-500/20">
            ✓ Your project is live. Top-up anytime.
          </div>
        )}
      </div>

      {showInject && <InjectModal partner={partner} onClose={() => setShowInject(false)} />}
    </>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-[#060D1A] text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Partner Projects</h1>
          <p className="text-gray-400 text-sm max-w-xl">
            Partner projects integrate with GM Protocol to offer their users additional daily check-in milestones.
            Every partner check-in shares the main GM streak and sends 10% of the check-in fee to buyback-and-burn.
          </p>
        </div>

        {/* Apply CTA */}
        <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/20 border border-blue-500/20 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-white font-semibold mb-1">Integrate Your Project</h2>
            <p className="text-gray-400 text-sm">
              Minimum injection: <span className="text-white font-medium">2,000 USDC</span> (mainnet) ·
              Milestones: 1–4 tiers · Funding window: 7 days after approval
            </p>
          </div>
          {GOOGLE_FORM_URL ? (
            <a
              href={GOOGLE_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
            >
              Apply to Partner →
            </a>
          ) : (
            <span className="shrink-0 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-500 text-sm font-semibold cursor-not-allowed select-none">
              Applications Opening Soon
            </span>
          )}
        </div>

        {/* Partner list */}
        {PARTNERS.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">🤝</p>
            <p className="font-medium">No partner projects yet.</p>
            <p className="text-sm mt-1">Be the first to integrate with GM Protocol.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PARTNERS.map(p => <PartnerCard key={p.id} partner={p} />)}
          </div>
        )}

        {/* How it works */}
        <div className="mt-12 border-t border-white/8 pt-8">
          <h2 className="text-white font-semibold mb-4">How Partner Integration Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm">
            {[
              { n: '01', title: 'Apply', desc: 'Submit project info via Google Form. Team reviews within 48h.' },
              { n: '02', title: 'Deploy', desc: 'Upon approval, a dedicated smart contract is deployed onchain.' },
              { n: '03', title: 'Fund', desc: 'Operator wallet injects USDC. Contract activates automatically.' },
              { n: '04', title: 'Live', desc: 'Users can check in, earn milestones, and claim gArc rewards.' },
            ].map(s => (
              <div key={s.n} className="bg-white/3 border border-white/8 rounded-xl p-4">
                <span className="text-blue-400 font-mono text-xs font-bold">{s.n}</span>
                <p className="text-white font-medium mt-1 mb-1">{s.title}</p>
                <p className="text-gray-400 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
