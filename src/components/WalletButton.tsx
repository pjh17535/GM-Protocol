import { useEffect, useRef, useState } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { Check, Copy, ExternalLink, LogOut } from 'lucide-react'
import { toast } from 'sonner'

const EXPLORER = 'https://explorer.testnet.arc.io/address/'

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`

/**
 * Wallet control: "Connect wallet" when disconnected; when connected an
 * address pill with a menu to copy, view on the explorer, and disconnect.
 */
export default function WalletButton({ className = '' }: { className?: string }) {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!isConnected || !address) {
    return (
      <ConnectKitButton.Custom>
        {({ show }) => (
          <button
            onClick={show}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#FC72FF]/15 text-[#FC72FF] hover:bg-[#FC72FF]/25 transition-colors ${className}`}
          >
            Connect wallet
          </button>
        )}
      </ConnectKitButton.Custom>
    )
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(address as string)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Could not copy the address')
    }
  }

  return (
    <div ref={ref} className={`relative shrink-0 ${className}`}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-full text-xs font-medium text-white bg-white/8 hover:bg-white/12 border border-white/10 transition-colors"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span className="tabular-nums">{short(address)}</span>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-52 rounded-2xl border border-white/10 bg-[#0F1626] shadow-2xl shadow-black/50 p-1.5 z-[70]">
          <div className="px-3 py-2 text-[11px] text-gray-500">Connected wallet</div>
          <MenuItem onClick={() => void copy()} icon={copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}>
            {copied ? 'Copied' : 'Copy address'}
          </MenuItem>
          <a
            href={`${EXPLORER}${address}`}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-gray-200 hover:bg-white/6 transition-colors"
          >
            <ExternalLink className="size-4" /> View on explorer
          </a>
          <div className="my-1 h-px bg-white/8" />
          <MenuItem
            onClick={() => { disconnect(); setOpen(false) }}
            icon={<LogOut className="size-4" />}
            danger
          >
            Disconnect
          </MenuItem>
        </div>
      )}
    </div>
  )
}

function MenuItem({ children, icon, onClick, danger }: { children: React.ReactNode; icon: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm transition-colors hover:bg-white/6 ${danger ? 'text-red-400' : 'text-gray-200'}`}
    >
      {icon}
      {children}
    </button>
  )
}
