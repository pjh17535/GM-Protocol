# GM Protocol

**A daily check-in protocol built on Arc Network, where persistence is rewarded and every exit burns.**

Built with [Arc Studio](https://studio.arc.io)

---

## What is GM Protocol?

GM Protocol is a daily onchain check-in system built on Arc Network. Users pay a small USDC fee each day to check in. Those who persist to milestone streaks (30 / 90 / 180 / 365 days) earn gArc token rewards. Those who break their streak leave their funds in the pool — funding the rewards of those who persist.

Every single USDC that leaves the system — whether as user rewards, founder allocation, or partner payouts — triggers a (9/8)x buyback-and-burn of gArc. No USDC exits without burning.

**Live preview:** https://marvelous-lebkuchen-e5523d.netlify.app

---

## Key Features

- Daily GM check-in with USDC (0.1 USDC/day on Arc Testnet)
- 4-tier milestone system: Bronze (30d) / Gold (90d) / Platinum (180d) / Legend (365d)
- Soulbound Token (SBT) identity credentials per milestone
- gArc token: 10B total supply, mint-once, burn-only, deflationary curve modeled after Bitcoin
- (9/8)x buyback-and-burn on every single Claim — no exceptions
- Partner ecosystem: education-first tasks, shared GM streak, independent reward pools
- DAO governance: SBT + consecutive check-in weighted voting, 50% attack resistant
- Progressive identity verification (silent at entry, increasingly strict at higher milestones)

---

## Tech Stack

- **Blockchain:** Arc Network (EVM-compatible, USDC as native gas)
- **Smart Contracts:** Solidity + Foundry
- **Frontend:** React + TypeScript + Vite + Tailwind CSS + Recharts
- **Identity:** Human Passport + ZKPassport + Exchange KYC
- **Token Standard:** ERC-20 (gArc) + ERC-5192 (SBT)

---

## Project Documents

| Document | Description |
|----------|-------------|
| [白皮书 / Whitepaper](./docs/whitepaper.md) | Vision, philosophy, economic model (CN/EN) |
| [项目计划书 v0.6](./docs/project-plan.md) | Full technical and economic specification (CN) |

---

## Economic Model (Summary)

```
GM Pool Allocation (per check-in fee):
  80% → Reward Pool (milestone claims)
  10% → Reserve Vault (buyback-and-burn fuel)
   5% → Protocol Treasury (founder/team, locked)
   5% → Partner Reserve

Claim Formula (for reward R USDC):
  Pool deducts: (9/8) × R = 1.125R USDC
  → R USDC buys back gArc from market → burned
  → R USDC equivalent gArc released from Claim Pool → to user
  → (1/8)R USDC additional buyback → burned

gArc Supply:
  Total:              10,000,000,000 (mint-once)
  Permanent floor:       210,000,000
  Claim pool:          4,790,000,000
  Initial liquidity:   5,000,000,000

Deflationary curve: C(t) = 4.79B × (1 - (1 - t/6)²)
Target by 2032: ~210M circulating (mirrors BTC 95.24% issuance)
```

---

## Development Setup

### Prerequisites

- [Bun](https://bun.sh) v1.x
- [Foundry](https://getfoundry.sh) (for contracts)
- Node.js 18+

### Install

```bash
bun install
```

### Environment Variables

| Variable | Purpose | Required |
|----------|---------|---------|
| `RPC_PROXY_BASE_URL` | Arc Studio RPC proxy (optional outside Arc Studio) | No |
| `RPC_PROXY_TOKEN` | Arc Studio RPC proxy token | No |
| `RPC_PROXY_CHAINS` | Comma-separated proxy chain keys | No |

### Run

```bash
bun run dev
```

### Build

```bash
bun run build
```

### Test Contracts

```bash
bun run contracts:test
```

---

## Contract Architecture (Planned)

| Contract | Role |
|----------|------|
| `GMToken` | gArc ERC-20, mint-once, burn-only |
| `GMPool` | Core check-in pool, daily UTC reset |
| `GMCheckIn` | Check-in logic, streak tracking |
| `GMMilestone` | Milestone claim, (9/8)x burn trigger |
| `GMSoulBound` | SBT credentials, ERC-5192 |
| `GMBuyback` | Buyback-and-burn executor, 3-layer trigger |
| `GMPartner` | Partner project reward pools |
| `GMGovernance` | DAO voting, time-lock |
| `GMIdentity` | Identity verification layer manager |

> Contracts are under development. See `contracts/` directory.

---

## License

MIT License — Copyright (c) 2026 GM Protocol

---

*Built on [Arc Network](https://arc.io) — where USDC is the native gas token.*
