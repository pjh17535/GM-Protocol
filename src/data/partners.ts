// GM Protocol — Partner Registry
// This file is the source of truth for all partner projects.
// After a Google Form submission is approved (human review), add an entry here.
// After deploying the partner contract, fill in contractAddress and set status to "deployed".
// Contract isActive state is read on-chain in real time.

export type PartnerStatus = 'pending' | 'deployed' | 'active' | 'expired'

export interface PartnerMilestone {
  days: number
  label: string
}

export interface Partner {
  id: string
  name: string
  description: string
  website: string
  twitter: string
  github: string
  logoURI: string               // project logo URL (empty string = use placeholder)
  operatorAddress: string       // the wallet that can inject funds
  contractAddress: string       // GMPartner contract address (empty = not yet deployed)
  milestoneDays: number[]       // e.g. [7, 14] for 2 milestones
  isTestnet: boolean            // true = no minimum injection enforced on frontend
  status: PartnerStatus         // manually set; "active" is also confirmed on-chain
  approvedAt: string            // ISO date string of approval
  note: string                  // internal note (visible on Partners page)
}

// ─── Partner List ────────────────────────────────────────────────────────────
// Add new partners below. Keep chronological order (oldest first).

export const PARTNERS: Partner[] = [
  {
    id: 'gm-protocol-test',
    name: 'GM Protocol test',
    description:
      'Internal test partner for GM Protocol. Used to validate the partner integration pipeline end-to-end on Arc Testnet before onboarding external projects.',
    website: 'https://marvelous-lebkuchen-e5523d.netlify.app',
    twitter: '',
    github: 'https://github.com/pjh17535/GM-Protocol',
    logoURI: '',
    operatorAddress: '0x1697acd9b8b212705d4cdba6706f38ded5a5ffc9',
    contractAddress: '0x353ecd9a42F908D2BE7f59572D9f8cCCAEd8Fa70',
    milestoneDays: [7, 14],
    isTestnet: true,
    status: 'active',
    approvedAt: '2026-10-28',
    note: 'Internal test — operator is dev wallet 0x1697...',
  },
]

// ─── Constants ────────────────────────────────────────────────────────────────
export const PARTNER_MIN_INJECTION_MAINNET = 2_000_000_000n // 2000 USDC (6 decimals)
export const PARTNER_MIN_INJECTION_TESTNET = 1_000_000n     // 1 USDC minimum on testnet (symbolic)
// Partner application form. Set to an empty string to show the "Coming Soon" button instead.
export const GOOGLE_FORM_URL = 'https://forms.gle/bv6cUHCgAVhU7WmY9'
