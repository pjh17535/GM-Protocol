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
| GMCheckIn v3.1 (已弃用: 领奖gARC未换算、快照USDC卡住) | `0xDb04Dd85fDbcE5b76d63230264475Fcb07c316A8` | [View](https://explorer.testnet.arc.io/address/0xDb04Dd85fDbcE5b76d63230264475Fcb07c316A8) |
| GMPartner v1 测试实例 (已弃用: 10%回购份额未转出) | `0x353ecd9a42F908D2BE7f59572D9f8cCCAEd8Fa70` | [View](https://explorer.testnet.arc.io/address/0x353ecd9a42F908D2BE7f59572D9f8cCCAEd8Fa70) |
| GMSoulBound (SBT 灵魂绑定徽章) | `0xB845E2f69d7D5426896B4083594B3C26D4bB8ff2` | [View](https://explorer.testnet.arc.io/address/0xB845E2f69d7D5426896B4083594B3C26D4bB8ff2) |
| GMBuyback v1 (已弃用: 从未成功执行) | `0x611F40BdaEfF0e247b0C454725d8e531256a070a` | [View](https://explorer.testnet.arc.io/address/0x611F40BdaEfF0e247b0C454725d8e531256a070a) |
| GMCheckIn v3.2 (当前，正式；领奖按LP即时价换算，快照全额买入销毁) | `0xBBf46cE9E2e3bA2819c113Ef05857023d68AfcAf` | [View](https://explorer.testnet.arc.io/address/0xBBf46cE9E2e3bA2819c113Ef05857023d68AfcAf) |
| GMBuyback v2 (当前，正式；snapshot买入销毁 + 合作项目份额由keeper触发) | `0xaC2A2c6F2590624d2FC6231dBCd05dc5A60f4De7` | [View](https://explorer.testnet.arc.io/address/0xaC2A2c6F2590624d2FC6231dBCd05dc5A60f4De7) |
| GMPartner v1.1 测试实例: GM Protocol test (当前；operator 0x1697...，待注资激活) | `0x15Cd101c1093c2198FbA09031C610e51Fb4F285D` | [View](https://explorer.testnet.arc.io/address/0x15Cd101c1093c2198FbA09031C610e51Fb4F285D) |
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

## Keeper, partner check-in, SBT badges (added 2026-11-04)
- Daily snapshot: `scripts/daily-snapshot.ts` (`--dry-run` to read only). Executes `executeSnapshot(day)` for finished UTC days with queued claims on GMCheckIn v3.1 and every live partner. Only days before today are executed, because a claim can still be queued on today's index and an early snapshot would strand it. Scheduled by `docs/ci/daily-snapshot.yml` (copy it to `.github/workflows/` from the GitHub web UI, because the sandbox token cannot push workflow files) at 00:10 UTC; needs repo secret `SNAPSHOT_PRIVATE_KEY` (dedicated low-balance wallet, never the deployer key). The execute path has not been exercised live yet because no claim has been queued.
- GM page partner check-ins: `src/components/PartnerCheckins.tsx` lists partners with a contract address from `src/data/partners.ts`.
- My GM badges: `src/components/SbtBadges.tsx` reads real tokens via `getUserTokens`, `getTokenInfo`, and the onchain `tokenURI` art.
- Partner application form: question list in `docs/partner-application-form.md`; set `GOOGLE_FORM_URL` in `src/data/partners.ts` once the form exists.
- SECURITY (mainnet blocker, found 2026-11-06): `GMPool.withdrawProtocol` and `withdrawPartner` are `onlyOwner` and send USDC straight to any address without a gARC buyback-burn. This contradicts the whitepaper rule that every USDC exit triggers a burn. Route these through the claim path (or a timelock) before mainnet, and keep public copy worded as a design target until then.
- Brand assets: `public/brand/` holds the horizontal banner (transparent and navy, SVG and PNG), a 16:9 cover (1600x900) for X long posts and `og-image.png` (1200x630) used by the link-preview tags in `index.html`. The SVGs have outlined text, so they do not depend on fonts. They were generated from the logo in `src/components/GMProtocolLogo.tsx`; regenerate if the logo changes.
- Arc House screenshots: `docs/arc-house/` holds real captures of the live site (1280x720 at 2x), taken with a headless browser against the Netlify URL. Wallet-connected shots use a read-only wallet shim that reports the public test wallet address and forwards reads to the RPC, so the data is real but nothing can be signed. Skip the My GM milestone cards in headless shots: the sandbox has no emoji font, so the icons render as empty boxes.
- OPEN QUESTION (contract): `GMCheckIn.claimMilestone` sets `gArcAmount = claimUsdc` with no decimals conversion or price. claimUsdc has 6 decimals and gARC has 18, so a claim would transfer a negligible gARC amount. Confirm intent and add a test before anyone claims on testnet.

## v3.2 部署记录 (2026-11-09, Arc Testnet)
修复: 领奖gARC换算(小数位+LP即时价)、快照USDC全额买入销毁(失败回滚)、合作项目10%回购份额转给GMBuyback、已结束日期才能快照、跨日预留额度、禁止放弃所有权、两步所有权转移。430项测试通过(含Arc测试网fork完整领奖流程)，三轮安全审查最后一轮无新增问题。
- GMBuyback v2 部署 TX: `0x1b00cdc66de5b3a559ba2700197287bdcad78e6c7eaf3389217967a1b1054fd6`
- GMCheckIn v3.2 部署 TX: `0xf26020589d0b92ec8555384d8e76215b4743e46d64238704d87b4f5db782b8f6`
- buyback.setAuthorizedCaller(v3.2): `0x8751fa277eeed70ec832006060f294fb8c0d2bea0b291851e17064f826b1a51e`
- checkin.setSoulBoundContract: `0x25c080b1d17fe21fda70a4e146078f92d2dce18a7befc5f0d3845efc4055f86f` (v3.1 从未设置过SBT，所以之前领奖不会铸徽章)
- pool.setCheckinContract: `0xd5a6fb7fe4579245ae9682986b151610c716155601b7234e3e31f45f5923f257`
- pool.setBuybackContract: `0xb76597c94de741b664589692353a228122eca5ea19cfe7c6d0e0b310632f62c8`
- sbt.setMinter: `0x7d302212cbcb5b93067194a47765cdc33360e3138e27d28b14b2fab72e8b09e9`
- GMPartner v1.1 部署 TX: `0xa5a28e90531b3f39ffc2ff02674282731f7180d1cdc8420aed279302f8d0ba83`
- checkin.setPartnerRegistered: `0xa6abf0ba3a965087e7f9bfbb18ad4a06509955ffb4f0dd01a64aff17d689beaf`
- 部署脚本: scripts/deploy-v32.ts
已知并接受的风险(主网前必须处理): LP即时价格可被操纵(换TWAP)、回购滑点基于当下报价、POOL_RESERVE(10%)无人花费、合作项目领奖直接付USDC无领奖时销毁、合作项目预留额度未领取会一直占用、每笔领奖消耗大量gARC(浅池)、owner仍可调用withdrawProtocol/withdrawPartner/setCheckinContract。
