import { useState } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  FEEDBACK_DAILY_LIMIT,
  FEEDBACK_ENDPOINT,
  FEEDBACK_MAX_CHARS,
  buildFeedbackMessage,
  normalizeFeedbackText,
  type FeedbackComment,
} from '../lib/feedback'

const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`

function timeAgo(ms: number, now: number): string {
  const s = Math.max(0, Math.floor((now - ms) / 1000))
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`
  return new Date(ms).toISOString().slice(0, 10)
}

async function fetchComments(scope: string): Promise<FeedbackComment[]> {
  const res = await fetch(`${FEEDBACK_ENDPOINT}?scope=${encodeURIComponent(scope)}&limit=50`)
  const type = res.headers.get('content-type') ?? ''
  if (!res.ok || !type.includes('application/json')) throw new Error('unavailable')
  const data = (await res.json()) as { comments: FeedbackComment[] }
  return data.comments
}

interface Props {
  scope: string
  title?: string
  description?: string
  /** Compact variant for use inside cards. */
  compact?: boolean
}

export default function FeedbackBoard({ scope, title = 'Community Feedback', description, compact = false }: Props) {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const qc = useQueryClient()
  const [text, setText] = useState('')
  // Captured once per mount so render stays pure.
  const [now] = useState(() => Date.now())

  const query = useQuery({
    queryKey: ['feedback', scope],
    queryFn: () => fetchComments(scope),
    refetchInterval: 60_000,
    retry: 1,
  })

  const submit = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error('Connect your wallet first')
      const clean = normalizeFeedbackText(text)
      if (!clean) throw new Error('Write something first')
      if (clean.length > FEEDBACK_MAX_CHARS) throw new Error(`Max ${FEEDBACK_MAX_CHARS} characters`)
      const timestamp = Date.now()
      const signature = await signMessageAsync({ message: buildFeedbackMessage(scope, clean, timestamp) })
      const res = await fetch(FEEDBACK_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scope, text: clean, timestamp, address, signature }),
      })
      const type = res.headers.get('content-type') ?? ''
      if (!type.includes('application/json')) throw new Error('Feedback service is not reachable right now')
      const data = (await res.json()) as { comment?: FeedbackComment; error?: string }
      if (!res.ok || !data.comment) throw new Error(data.error ?? 'Could not post feedback')
      return data.comment
    },
    onSuccess: comment => {
      setText('')
      qc.setQueryData<FeedbackComment[]>(['feedback', scope], old => [comment, ...(old ?? [])])
      toast.success('Feedback posted')
    },
    onError: (e: Error) => {
      const msg = /user rejected|denied/i.test(e.message) ? 'Signature cancelled' : e.message
      toast.error(msg)
    },
  })

  const comments = query.data ?? []
  const remaining = FEEDBACK_MAX_CHARS - text.length

  return (
    <div className={compact ? 'space-y-3' : 'bg-white/3 border border-white/8 rounded-2xl p-5 space-y-4'}>
      <div>
        <h3 className={compact ? 'text-white text-sm font-semibold' : 'text-white text-base font-semibold'}>{title}</h3>
        {description && <p className="text-gray-500 text-xs mt-1 leading-relaxed">{description}</p>}
      </div>

      {/* Composer */}
      {isConnected ? (
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={compact ? 2 : 3}
            maxLength={FEEDBACK_MAX_CHARS + 50}
            placeholder="Share your thoughts, questions or suggestions…"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 resize-none"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-gray-600">
              Free. You only sign a message, no transaction. Up to {FEEDBACK_DAILY_LIMIT} posts per day.
            </p>
            <div className="flex items-center gap-3 shrink-0">
              <span className={`text-[11px] tabular-nums ${remaining < 0 ? 'text-red-400' : 'text-gray-600'}`}>{remaining}</span>
              <button
                onClick={() => submit.mutate()}
                disabled={submit.isPending || !text.trim() || remaining < 0}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
              >
                {submit.isPending ? 'Waiting for signature…' : 'Sign & Post'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 bg-white/3 border border-white/8 rounded-xl px-4 py-3">
          <p className="text-gray-400 text-xs">Connect your wallet to leave feedback. No gas required.</p>
          <ConnectKitButton.Custom>
            {({ show }) => (
              <button onClick={show} className="shrink-0 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors">
                Connect
              </button>
            )}
          </ConnectKitButton.Custom>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {query.isLoading && <p className="text-gray-600 text-xs animate-pulse">Loading feedback…</p>}
        {query.isError && (
          <p className="text-gray-600 text-xs">Feedback is temporarily unavailable. Please try again later.</p>
        )}
        {!query.isLoading && !query.isError && comments.length === 0 && (
          <p className="text-gray-600 text-xs">No feedback yet. Be the first to share your thoughts.</p>
        )}
        {comments.map(c => (
          <div key={c.id} className="bg-white/3 border border-white/6 rounded-xl px-3.5 py-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-blue-400 font-mono text-[11px]">
                {shortAddr(c.address)}
                {address && c.address.toLowerCase() === address.toLowerCase() && <span className="ml-1.5 text-gray-500">(you)</span>}
              </span>
              <span className="text-gray-600 text-[11px]">{timeAgo(c.createdAt, Math.max(now, c.createdAt))}</span>
            </div>
            <p className="text-gray-300 text-sm whitespace-pre-wrap break-words">{c.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
