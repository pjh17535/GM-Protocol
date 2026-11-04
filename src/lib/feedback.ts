// Shared between the browser (signing) and the Netlify function (verification).
// Keep this file free of browser-only or node-only imports.

export const FEEDBACK_MAX_CHARS = 500
export const FEEDBACK_DAILY_LIMIT = 3
export const FEEDBACK_SIGNATURE_TTL_MS = 5 * 60 * 1000
export const FEEDBACK_ENDPOINT = '/.netlify/functions/comments'

export interface FeedbackComment {
  id: string
  scope: string
  address: string
  text: string
  createdAt: number
}

/** Scope is either the protocol page or a single partner project. */
export function isValidScope(scope: string): boolean {
  return scope === 'protocol' || /^partner:[a-z0-9-]{1,48}$/.test(scope)
}

/** Strip control characters and collapse excessive blank lines. */
export function normalizeFeedbackText(raw: string): string {
  return raw
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * The exact message a wallet signs. Gasless (EIP-191 personal_sign).
 * The text itself is included so a signature can never be replayed
 * for different content, and the timestamp bounds replay in time.
 */
export function buildFeedbackMessage(scope: string, text: string, timestamp: number): string {
  return [
    'GM Protocol feedback',
    '',
    `Scope: ${scope}`,
    `Timestamp: ${timestamp}`,
    '',
    text,
    '',
    'Signing is free and sends no transaction.',
  ].join('\n')
}

export function utcDayIndex(ms: number): number {
  return Math.floor(ms / 86_400_000)
}
