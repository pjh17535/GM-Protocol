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
| GMCheckIn v3 (快照+女巫验证+GMPool，已弃用) | `0xA66Af89712660e0b6c1AACc666f74f0A4Df3BEF7` | [View](https://explorer.testnet.arc.io/address/0xA66Af89712660e0b6c1AACc666f74f0A4Df3BEF7) |
| GMCheckIn v3.1 (含partnerCheckin，正式) | `0xDb04Dd85fDbcE5b76d63230264475Fcb07c316A8` | [View](https://explorer.testnet.arc.io/address/0xDb04Dd85fDbcE5b76d63230264475Fcb07c316A8) |
| GMPartner (合作项目模板，测试实例: GM Protocol test) | `0x353ecd9a42F908D2BE7f59572D9f8cCCAEd8Fa70` | [View](https://explorer.testnet.arc.io/address/0x353ecd9a42F908D2BE7f59572D9f8cCCAEd8Fa70) |
| GMSoulBound (SBT 灵魂绑定徽章) | `0xB845E2f69d7D5426896B4083594B3C26D4bB8ff2` | [View](https://explorer.testnet.arc.io/address/0xB845E2f69d7D5426896B4083594B3C26D4bB8ff2) |
| GMBuyback (回购销毁执行器) | `0x611F40BdaEfF0e247b0C454725d8e531256a070a` | [View](https://explorer.testnet.arc.io/address/0x611F40BdaEfF0e247b0C454725d8e531256a070a) |
| GMPool v1 (已弃用) | `0x9f128829b987C970cbe7E29037A11a37E453FDC9` | [View](https://explorer.testnet.arc.io/address/0x9f128829b987C970cbe7E29037A11a37E453FDC9) |
| GMPool v2 (含gARC Claim池，正式) | `0xC3832c0169C1602D581cC6816414Ad05A855e713` | [View](https://explorer.testnet.arc.io/address/0xC3832c0169C1602D581cC6816414Ad05A855e713) |
| USDC/gARC LP Pair (Uniswap V2) | `0xc0e9695ab4e41f4477074845046b3d152c4c8958` | [View](https://explorer.testnet.arc.io/address/0xc0e9695ab4e41f4477074845046b3d152c4c8958) |

## gARC Token Distribution (Arc Testnet, 正式)
| 分配 | 数量 | 状态 |
|------|------|------|
| 铸造总量 | 100 亿 (10B) | 一次性铸造 |
| 初期立即销毁 | 2.1 亿 | ✅ TX: 0x6997a996b4a6e3f223165fb4004ce5e3ce38dfdd59c2645b644bde0ef7c19b9c |
| 初始流动性 LP | 50 亿 | ✅ 38.56 USDC + 50 亿 gARC（2026-11-04 修复后） |
| Claim 池 (GMPool v2) | ~47.9 亿 | ✅ gArcClaimBalance ≈ 4.79B |
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


---

## Feedback boards and Swap (added 2026-11-04)

- Feedback: `src/components/FeedbackBoard.tsx` (UI) + `netlify/functions/comments.mts` (API) + `netlify/lib/comments-core.ts` (logic) + `src/lib/feedback.ts` (shared message format).
  - Zero gas: users sign an EIP-191 message; the server recovers the signer. Timestamp must be within 5 minutes; each signature is single-use.
  - Limit: 3 comments per address per UTC day (atomic slot keys in Netlify Blobs store `gm-feedback`).
  - Scopes: `protocol` (Protocol page) and `partner:<partner-id>` (Partners cards).
  - Moderation: set Netlify env `COMMENTS_ADMIN_TOKEN`, then `DELETE /.netlify/functions/comments?scope=<scope>&id=<id>` with header `x-admin-token`.
  - Needs a Netlify deploy that includes functions (`netlify.toml` sets `netlify/functions`). A static-only upload will not serve the API.
  - Logic test: `bun run ./scripts/test-comments.ts`.
- Swap: `src/components/SwapModal.tsx`, opened from the nav "Swap gARC" button and the Protocol page. Uses UniswapV2Router02 `0xE27d5D256B370604F1Ff060fB489c6A8E3F8A6D9` with path USDC <-> gARC.
- LP repair 2026-11-04 (done): the first LP add on 2026-10-26 used the router while the pair still held dust reserves (1 raw USDC : 1e11 raw gARC) left from an earlier remove. The router followed that ratio and added only 38.56 USDC + 3.856 gARC instead of 5B gARC (amountMin was 0, so nothing reverted), and the remaining gARC was then deposited into GMPool. Fixed with `scripts/fix-lp.ts`: owner set GMPool.checkinContract to the deployer, `withdrawGArc(5B)`, restored checkinContract to GMCheckIn v3.1, removed the bad liquidity, transferred 38.56 USDC + 5B gARC straight to the pair and called `pair.mint` (bypasses router ratio logic). Result: pair = 38.56 USDC : 5,000,000,000 gARC; GMPool gArcClaimBalance = ~4.79B. LP tokens (~38.56e9) are held by the deployer wallet 0xe5096Af190d36CBc4363699D561EE651C07c276a.
  - setCheckinContract(deployer): 0x3fd1bb498e6f71af217b5e3c5741b4da39ba631c0003c553b6823727baa1bd7c
  - withdrawGArc(5B): 0x8510ad67f0122739384be625ec3da26831e7e0a53ada6e8551d27e26fe050fa3
  - setCheckinContract(GMCheckIn v3.1): 0x54dfaabff2b10fab8b93bcc43ebae15c693be797ac1ffd164bb3041fe1c8c220
  - removeLiquidity: 0xd862351964e7ed7c95d5f19b4eef41aaaaade8eccac2d3382e4389ba00012ff4
  - transfer gARC to pair: 0x603a762351116e8c14da2878a7dab241d2549dd9bc2f7bb77341b240625f152a
  - transfer USDC to pair: 0xd241314755fcbcf18260c19f3d871596037c4a7b33bda36851f7909222d6708e
  - pair.mint: 0x0e11a2944d7e080b1e0f2d5fe05cd17101c3aa3b09525721b4dfca2b7c5c2a65
- Lesson: after any addLiquidity, read pair reserves and assert them. On a re-seed of a non-empty pair, use direct transfer + `pair.mint`, or set amountMin close to desired.
- SECURITY (mainnet blocker): `GMPool.setCheckinContract` is onlyOwner, so the owner can point it at any address and call `withdrawGArc`, draining the Claim pool. This contradicts the "no privileged exit" claim. Before mainnet make checkinContract immutable or put it behind a timelock/multisig.
- Mainnet launch checklist: split the supply at TGE (4.79B to GMPool, 5B to LP, then abandon LP authority).
