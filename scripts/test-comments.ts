// Logic test for the feedback backend, using an in-memory store.
// Run: bun run ./scripts/test-comments.ts
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { deleteComment, listComments, postComment, type CommentStore } from '../netlify/lib/comments-core'
import { buildFeedbackMessage, FEEDBACK_SIGNATURE_TTL_MS } from '../src/lib/feedback'

function memStore(): CommentStore {
  const m = new Map<string, string>()
  return {
    setIfNew: (k, v) => {
      if (m.has(k)) return Promise.resolve(false)
      m.set(k, v)
      return Promise.resolve(true)
    },
    get: k => Promise.resolve(m.get(k) ?? null),
    list: p => Promise.resolve([...m.keys()].filter(k => k.startsWith(p))),
    delete: k => {
      m.delete(k)
      return Promise.resolve()
    },
  }
}

let failed = 0
function check(name: string, ok: boolean, extra?: unknown) {
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  -> ${JSON.stringify(extra)}`}`)
}

const store = memStore()
const alice = privateKeyToAccount(generatePrivateKey())
const bob = privateKeyToAccount(generatePrivateKey())
const T0 = Date.UTC(2026, 10, 4, 12, 0, 0)

async function send(acct: typeof alice, scope: string, text: string, ts: number, now = ts) {
  const signature = await acct.signMessage({ message: buildFeedbackMessage(scope, text, ts) })
  return postComment(store, { scope, text, timestamp: ts, address: acct.address, signature }, now)
}

// 1. valid post
const r1 = await send(alice, 'protocol', 'First!', T0)
check('valid post -> 201', r1.status === 201, r1)

// 2. ordering: newest first
await send(bob, 'protocol', 'Second', T0 + 1000)
await send(alice, 'protocol', 'Third', T0 + 2000)
const list = (await listComments(store, 'protocol', 50)).body as { comments: { id: string; text: string }[] }
check('list newest first', list.comments.map(c => c.text).join(',') === 'Third,Second,First!', list)

// 3. daily limit: alice has 2 so far, 3rd ok, 4th rejected
const r3 = await send(alice, 'protocol', 'Fourth (3rd by alice today)', T0 + 3000)
check('3rd comment of day -> 201', r3.status === 201, r3)
const r4 = await send(alice, 'partner:gm-protocol-test', 'One too many', T0 + 4000)
check('4th comment of day -> 429', r4.status === 429, r4)

// 4. next UTC day resets
const r5 = await send(alice, 'protocol', 'New day', T0 + 86_400_000)
check('next UTC day -> 201', r5.status === 201, r5)

// 5. replay of same signature -> 409
const sig = await bob.signMessage({ message: buildFeedbackMessage('protocol', 'replay me', T0 + 5000) })
const body = { scope: 'protocol', text: 'replay me', timestamp: T0 + 5000, address: bob.address, signature: sig }
const a = await postComment(store, body, T0 + 5000)
const b = await postComment(store, body, T0 + 5001)
check('first submit ok', a.status === 201, a)
check('replay -> 409', b.status === 409, b)

// 6. wrong signer / tampered text
const tamperSig = await alice.signMessage({ message: buildFeedbackMessage('protocol', 'original', T0 + 6000) })
const rt = await postComment(store, { scope: 'protocol', text: 'tampered', timestamp: T0 + 6000, address: alice.address, signature: tamperSig }, T0 + 6000)
check('tampered text -> 401', rt.status === 401, rt)
const spoof = await postComment(store, { scope: 'protocol', text: 'original', timestamp: T0 + 6000, address: bob.address, signature: tamperSig }, T0 + 6000)
check('spoofed address -> 401', spoof.status === 401, spoof)

// 7. stale signature
const rs = await send(bob, 'protocol', 'late', T0, T0 + FEEDBACK_SIGNATURE_TTL_MS + 1)
check('expired signature -> 400', rs.status === 400, rs)

// 8. validation
const re = await send(bob, 'protocol', '   ', T0 + 7000)
check('empty text -> 400', re.status === 400, re)
const rl = await send(bob, 'protocol', 'x'.repeat(501), T0 + 7000)
check('too long -> 400', rl.status === 400, rl)
const rsc = await send(bob, 'nope', 'hi', T0 + 7000)
check('bad scope -> 400', rsc.status === 400, rsc)

// 9. scopes are isolated
const pl = (await listComments(store, 'partner:gm-protocol-test', 50)).body as { comments: unknown[] }
check('partner scope isolated (empty)', pl.comments.length === 0, pl)

// 10. moderation
const target = list.comments[0]
const d1 = await deleteComment(store, 'protocol', target.id, undefined, 'x')
check('delete disabled without env token -> 403', d1.status === 403, d1)
const d2 = await deleteComment(store, 'protocol', target.id, 'secret', 'wrong')
check('delete wrong token -> 403', d2.status === 403, d2)
const d3 = await deleteComment(store, 'protocol', target.id, 'secret', 'secret')
check('delete ok -> 200', d3.status === 200, d3)
const after = (await listComments(store, 'protocol', 50)).body as { comments: { id: string }[] }
check('deleted comment gone', !after.comments.some(c => c.id === target.id), after)

console.log(failed === 0 ? '\nAll checks passed' : `\n${failed} check(s) FAILED`)
process.exit(failed === 0 ? 0 : 1)
