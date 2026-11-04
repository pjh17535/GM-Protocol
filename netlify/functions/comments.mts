import { getStore } from '@netlify/blobs'
import { deleteComment, listComments, postComment, type CommentStore } from '../lib/comments-core'

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })

function blobStore(): CommentStore {
  const store = getStore({ name: 'gm-feedback', consistency: 'strong' })
  return {
    async setIfNew(key, value) {
      const res = await store.set(key, value, { onlyIfNew: true })
      return res.modified
    },
    async get(key) {
      return await store.get(key, { type: 'text' })
    },
    async list(prefix) {
      const keys: string[] = []
      for await (const page of store.list({ prefix, paginate: true })) {
        for (const b of page.blobs) keys.push(b.key)
      }
      return keys
    },
    async delete(key) {
      await store.delete(key)
    },
  }
}

export default async (req: Request): Promise<Response> => {
  const store = blobStore()
  const url = new URL(req.url)

  try {
    if (req.method === 'GET') {
      const scope = url.searchParams.get('scope') ?? ''
      const limit = Number(url.searchParams.get('limit') ?? '50')
      const r = await listComments(store, scope, limit)
      return json(r.status, r.body)
    }

    if (req.method === 'POST') {
      let body: unknown
      try {
        body = await req.json()
      } catch {
        return json(400, { error: 'Invalid JSON' })
      }
      const r = await postComment(store, body, Date.now())
      return json(r.status, r.body)
    }

    if (req.method === 'DELETE') {
      const r = await deleteComment(
        store,
        url.searchParams.get('scope') ?? '',
        url.searchParams.get('id') ?? '',
        process.env.COMMENTS_ADMIN_TOKEN,
        req.headers.get('x-admin-token'),
      )
      return json(r.status, r.body)
    }

    return json(405, { error: 'Method not allowed' })
  } catch (e) {
    console.error('comments function error', e)
    return json(500, { error: 'Internal error' })
  }
}
