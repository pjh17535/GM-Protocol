import { keccak256, recoverMessageAddress, toBytes, type Hex } from 'viem'
import {
  FEEDBACK_DAILY_LIMIT,
  FEEDBACK_MAX_CHARS,
  FEEDBACK_SIGNATURE_TTL_MS,
  buildFeedbackMessage,
  isValidScope,
  normalizeFeedbackText,
  utcDayIndex,
  type FeedbackComment,
} from '../../src/lib/feedback'

/** Minimal storage surface so the logic can be tested without Netlify. */
export interface CommentStore {
  /** Create the key only if it does not exist. Returns true when created. */
  setIfNew(key: string, value: string): Promise<boolean>
  get(key: string): Promise<string | null>
  list(prefix: string): Promise<string[]>
  delete(key: string): Promise<void>
}

export interface CoreResult {
  status: number
  body: unknown
}

const MAX_TS = 9_000_000_000_000
const LIST_LIMIT_MAX = 100

const err = (status: number, error: string): CoreResult => ({ status, body: { error } })

const commentKey = (scope: string, createdAt: number, id: string) =>
  // Reverse timestamp so a lexicographic listing is newest first.
  `c/${scope}/${String(MAX_TS - createdAt).padStart(13, '0')}-${id}`

export async function listComments(store: CommentStore, scope: string, limitRaw: number): Promise<CoreResult> {
  if (!isValidScope(scope)) return err(400, 'Invalid scope')
  const limit = Math.min(Math.max(Math.floor(limitRaw) || 50, 1), LIST_LIMIT_MAX)
  const keys = (await store.list(`c/${scope}/`)).sort().slice(0, limit)
  const rows = await Promise.all(keys.map(k => store.get(k)))
  const comments: FeedbackComment[] = []
  for (const raw of rows) {
    if (!raw) continue
    try {
      comments.push(JSON.parse(raw) as FeedbackComment)
    } catch {
      // skip corrupt row
    }
  }
  return { status: 200, body: { comments } }
}

interface PostBody {
  scope?: unknown
  text?: unknown
  timestamp?: unknown
  address?: unknown
  signature?: unknown
}

export async function postComment(store: CommentStore, input: unknown, now: number): Promise<CoreResult> {
  const b = (input ?? {}) as PostBody
  if (typeof b.scope !== 'string' || !isValidScope(b.scope)) return err(400, 'Invalid scope')
  if (typeof b.text !== 'string') return err(400, 'Missing text')
  if (typeof b.timestamp !== 'number' || !Number.isFinite(b.timestamp)) return err(400, 'Missing timestamp')
  if (typeof b.signature !== 'string' || !/^0x[0-9a-fA-F]{130}$/.test(b.signature)) return err(400, 'Invalid signature')
  if (typeof b.address !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(b.address)) return err(400, 'Invalid address')

  const text = normalizeFeedbackText(b.text)
  if (text.length === 0) return err(400, 'Comment is empty')
  if (text.length > FEEDBACK_MAX_CHARS) return err(400, `Comment exceeds ${FEEDBACK_MAX_CHARS} characters`)
  if (Math.abs(now - b.timestamp) > FEEDBACK_SIGNATURE_TTL_MS) return err(400, 'Signature expired. Please sign again.')

  // The signed message must be rebuilt from the normalized text, exactly as the client did.
  let recovered: string
  try {
    recovered = await recoverMessageAddress({
      message: buildFeedbackMessage(b.scope, text, b.timestamp),
      signature: b.signature as Hex,
    })
  } catch {
    return err(400, 'Signature could not be verified')
  }
  if (recovered.toLowerCase() !== b.address.toLowerCase()) return err(401, 'Signature does not match address')

  const address = recovered.toLowerCase()
  const id = keccak256(toBytes(b.signature)).slice(2, 18)

  // Replay guard: one signature, one comment.
  if (!(await store.setIfNew(`sig/${id}`, '1'))) return err(409, 'Duplicate submission')

  // Daily limit via atomic slot claims (no read-modify-write race).
  const day = utcDayIndex(now)
  let slotTaken = false
  for (let i = 0; i < FEEDBACK_DAILY_LIMIT; i++) {
    if (await store.setIfNew(`rl/${address}/${day}/${i}`, String(now))) {
      slotTaken = true
      break
    }
  }
  if (!slotTaken) return err(429, `Daily limit reached (${FEEDBACK_DAILY_LIMIT} comments per day). Try again tomorrow (UTC).`)

  const comment: FeedbackComment = { id, scope: b.scope, address, text, createdAt: now }
  await store.setIfNew(commentKey(b.scope, now, id), JSON.stringify(comment))
  return { status: 201, body: { comment } }
}

export async function deleteComment(
  store: CommentStore,
  scope: string,
  id: string,
  adminTokenEnv: string | undefined,
  adminTokenHeader: string | null,
): Promise<CoreResult> {
  if (!adminTokenEnv) return err(403, 'Moderation is not enabled')
  if (!adminTokenHeader || adminTokenHeader !== adminTokenEnv) return err(403, 'Forbidden')
  if (!isValidScope(scope) || !/^[0-9a-f]{16}$/.test(id)) return err(400, 'Invalid request')
  const keys = await store.list(`c/${scope}/`)
  const key = keys.find(k => k.endsWith(`-${id}`))
  if (!key) return err(404, 'Not found')
  await store.delete(key)
  return { status: 200, body: { deleted: id } }
}
