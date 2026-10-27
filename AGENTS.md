# GM Protocol

> Built with Arc Studio - money-powered apps in minutes

This is the **project memory** - what Arc Studio remembers about building this app. It helps future agents (or humans) understand and extend the project.

---

## What This App Does

GM Protocol is a daily onchain check-in system built on Arc Network. Users pay a small USDC fee to check in each day. Consecutive check-ins accumulate toward milestones (Bronze/Gold/Platinum/Legend), which unlock gArc token rewards. Every claim triggers a (9/8)x buyback-and-burn of gArc, creating a deflationary tokenomics loop.

## Deployed Contracts (Arc Testnet)

| Contract | Address | Explorer |
|----------|---------|---------|
| GMToken (gARC ERC-20) — 平台钱包持有（弃用） | `0xacf3a991e4ca2311affd5d138efd1e27be134306` | [View](https://explorer.testnet.arc.io/address/0xacf3a991e4ca2311affd5d138efd1e27be134306) |
| GMToken (gARC ERC-20) — 用户钱包持有（正式） | `0x742f1c4D413d13913c80D9b6A35002C2b7D8b9Fc` | [View](https://explorer.testnet.arc.io/address/0x742f1c4D413d13913c80D9b6A35002C2b7D8b9Fc) |
| GMCheckIn v1 (已弃用) | `0x15631A27ab630477A28d43f3096A60F79370f445` | [View](https://explorer.testnet.arc.io/address/0x15631A27ab630477A28d43f3096A60F79370f445) |
| GMCheckIn v2 (已弃用) | `0x61CaF38cd22D8cc9567f48274f1137Cf3395cC9c` | [View](https://explorer.testnet.arc.io/address/0x61CaF38cd22D8cc9567f48274f1137Cf3395cC9c) |
| GMCheckIn v3 (快照+女巫验证+GMPool，正式) | `0xA66Af89712660e0b6c1AACc666f74f0A4Df3BEF7` | [View](https://explorer.testnet.arc.io/address/0xA66Af89712660e0b6c1AACc666f74f0A4Df3BEF7) |
| GMSoulBound (SBT 灵魂绑定徽章) | `0xB845E2f69d7D5426896B4083594B3C26D4bB8ff2` | [View](https://explorer.testnet.arc.io/address/0xB845E2f69d7D5426896B4083594B3C26D4bB8ff2) |
| GMBuyback (回购销毁执行器) | `0x611F40BdaEfF0e247b0C454725d8e531256a070a` | [View](https://explorer.testnet.arc.io/address/0x611F40BdaEfF0e247b0C454725d8e531256a070a) |
| GMPool v1 (已弃用) | `0x9f128829b987C970cbe7E29037A11a37E453FDC9` | [View](https://explorer.testnet.arc.io/address/0x9f128829b987C970cbe7E29037A11a37E453FDC9) |
| GMPool v2 (含gARC Claim池，正式) | `0xC3832c0169C1602D581cC6816414Ad05A855e713` | [View](https://explorer.testnet.arc.io/address/0xC3832c0169C1602D581cC6816414Ad05A855e713) |
| USDC/gARC LP Pair (Uniswap V2) | `0xc0e9695ab4e41f4477074845046b3d152c4c8958` | [View](https://explorer.testnet.arc.io/address/0xc0e9695ab4e41f4477074845046b3d152c4c8958) |

## gARC Token Distribution (Arc Testnet, 正式)
| 分配 | 数量 | 状态 |
|------|------|------|
| 铸造总量 | 100 亿 | 一次性铸造 |
| 初期立即销毁 | 2.1 亿 | ✅ TX: 0x6997a996b4a6e3f223165fb4004ce5e3ce38dfdd59c2645b644bde0ef7c19b9c |
| 初始流动性 LP | 50 亿 | ✅ USDC/gARC Pair |
| Claim 池 (GMPool v2) | ~47.9 亿 | ✅ 全部存入 GMPool v2 |
| 终态流通底线 (LP剩余) | 2.1 亿 | 自然剩余于 LP |

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS
- Web3: wagmi v2, viem v2, ConnectKit
- Contracts: Solidity 0.8.28 + Foundry. Sources in `contracts/`, unit tests in `contracts/test/*.t.sol`. Build with `bun run contracts:build` (`forge build`), test with `bun run contracts:test` (`forge test`).
- Wallet: injected (MetaMask, etc.)
- Chain: Arc Testnet (Chain ID: 5042002, imported from `viem/chains`)
- Token: USDC (6 decimals) (Address: 0x3600000000000000000000000000000000000000, Chain: Arc Testnet)
- Toasts: Sonner

## Key Files

- `src/App.tsx` - Main application logic
- `src/components/` - UI components
- `src/config.ts` - wagmi config (chains, connectors, transports)

## To Run

```bash
bun install
bun run dev
```
