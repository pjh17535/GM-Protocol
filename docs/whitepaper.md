# GM Protocol 白皮书 v1.0
# GM Protocol Whitepaper v1.0

> **中文版 | Chinese Version**
> 版本：v1.0 草稿 | 日期：2026年10月 | 状态：公开发布版
>
> **English Version**
> Version: v1.0 Draft | Date: October 2026 | Status: Public Release

---

# 中文版

---

## 前言

我不是在构建一个项目，我是在尝试回答一个问题：

**在区块链世界里，一个人每天说一声 GM，能证明什么？**

GM，是 Good Morning 的缩写，是加密社区最古老的问候语。每天在 X、Discord、Farcaster 上，数以百万计的人发出这两个字母。它是一种归属感的表达，是一种"我还在这里"的宣告。

但这两个字母，从来没有在链上留下任何痕迹。

我开始思考：如果把这个每日仪式搬到链上，会发生什么？

不是简单地记录一个事件，而是让这个行为产生真实的经济意义。让坚持签到的人，得到那些半途而废的人留下的资金作为奖励。让这个过程产生一种链上可查、不可伪造的身份证明。让 gArc 这个代币，成为一个纯粹的通缩载体，以独特的方式记录整个系统的运行轨迹。

这就是 GM Protocol 的起点。

---

## 一、问题的根源

### 1.1 Web3 的信任危机

我们正处在一个奇怪的时刻。

区块链技术承诺了去中心化、透明、无需信任。但在实践中，大多数 Web3 项目都建立在一个根本性的矛盾上：它们声称去中心化，却依赖中心化的激励机制来维持运转。

每一次空投，都是项目方在单向补贴用户。一旦补贴停止，用户离开。项目归零。循环往复。

这不是可持续的。这不是我想要的。

### 1.2 女巫攻击：无处不在的幽灵

更深层的问题是：在链上，我们无法区分一个真实的人和一千个机器人。

每次空投，都有机器人农场收割。每次治理投票，都有鲸鱼操控。每次合作项目接入，带来的都是无效流量。

真实用户的价值被稀释，被掠夺，被忽视。

这不公平。但这是链上世界的现实。

### 1.3 代币经济的结构性陷阱

几乎所有的 Web3 代币，都面临同一个问题：

代币发行是为了激励，激励带来需求，需求支撑价格，价格吸引更多持有者，持有者期待更高价格……直到有人开始抛售，整个循环崩塌。

这是一个庞氏结构。不是恶意的，但是脆弱的。

我不想构建这样的系统。

---

## 二、洞见：断签者补贴坚持者

在思考这些问题的过程中，我发现了一个简单但深刻的经济学洞见：

**连续签到系统，天然是一个"断签者补贴坚持者"的经济模型。**

每一个进入系统的签到费，都会在奖励池里积累。大多数人会在中途断签，他们的资金留在池子里，归零计数重新开始。只有少数真正坚持到里程碑的人，才能提取那笔积累的奖励。

这不需要任何外部补贴。这是一个自循环的经济系统。

坚持本身，就是价值的来源。

这个洞见，就是 GM Protocol 的经济学基础。

---

## 三、GM Protocol 是什么

GM Protocol 是部署在 Arc Network 上的**链上每日签到协议**，同时也是 Arc 生态的**链上身份基础设施层**。

它由两个互相缠绕的系统构成：

**第一个系统：经济激励**

每天支付 0.1 USDC 签到，连续累积。到达里程碑节点（30/90/180/365天），可以 Claim 奖励池中当期释放的 gArc 代币。奖励来自那些没能坚持下去的人留下的资金。

**第二个系统：身份证明**

每一次签到，都是一个链上时间戳。连续签到的记录，随着时间加权，形成一种任何人都无法伪造的身份证明——你确实在这里，持续存在，有真实行动支撑。

这两个系统相互强化。经济激励让人坚持签到，签到积累身份价值，身份价值带来更多特权，特权进一步强化经济激励。

---

## 四、gArc：一个纯粹的通缩载体

gArc 是 GM Protocol 的原生代币。但它不是一般意义上的"项目代币"。

gArc 的设计哲学只有一句话：**它是一座桥，不是终点。**

### 4.1 代币结构

gArc 总量 100 亿枚，一次性全量铸造，永不增发。

```
100亿 = 2.1亿（永久流通底线）
      + 47.9亿（Claim池）
      + 50亿（初始流动性）
```

50 亿枚作为初始流动性一次性注入 AMM，合约权限随后永久丢弃。从那一刻起，没有任何人能够增发，没有任何人能够干预流动性。

47.9 亿枚是 Claim 池，这是整个 Claim 机制的燃料。每一次里程碑 Claim，都从这个池子里释放等量 gArc 给用户。

2.1 亿枚是永久流通底线，是这个系统运行到尽头时的最终锚点。

### 4.2 通缩机制：每一次 Claim 都是销毁

gArc 唯一增加的方式是 Claim，唯一减少的方式也是 Claim。

这是一个刻意的设计：

当用户 Claim 奖励 R USDC 等价的 gArc 时：

1. 奖励池拿出 `(9/8) × R` USDC（即 1.125R）
2. 其中 R USDC 进入市场，回购等量 gArc，销毁
3. 另外 `(1/8) × R` USDC 来自储备金库，同样进入市场，回购 gArc，销毁
4. 与此同时，Claim 池释放 `R/Pg` 枚 gArc 给用户

用户得到了 gArc，但市场上同时消失了同等数量的 gArc。

**每一次 Claim，都是净中性的流通量变动，伴随着额外 12.5% 的超额销毁。**

没有任何 USDC 能在不触发回购销毁的情况下离开这个系统。

### 4.3 通缩曲线：致敬比特币

gArc 的通缩路径并非线性，而是遵循反向二次曲线：

```
C(t) = 1 - (1 - t/6)²     t ∈ [0, 6]（年）
```

这个曲线的设计参照了比特币的产出时间表——前期销毁快，后期趋于平稳，最终在 2032 年前后，将流通量收敛至 2.1 亿枚的锚点。

2.1 亿这个数字，来自比特币 2032 年已挖出量占总量的 95.24% 这一参数。

---

## 五、可持续性：系统为何永不崩塌

这是白皮书中最重要的部分。

### 5.1 资金的闭合循环

GM Protocol 的资金流动是一个完全闭合的循环：

```
用户签到费 (0.1 USDC)
    ↓ 按比例分配
    ├── 80% → 里程碑奖励池
    ├── 10% → 储备金库（为 Claim 提供 1/8 额外回购）
    ├── 5%  → 协议金库（创始人/团队，锁仓后 Claim）
    └── 5%  → 合作项目预留（Claim 时同步触发销毁）

里程碑 Claim
    ↓
    ├── 奖励池释放 (9/8)R USDC
    ├── R USDC 回购 gArc 销毁
    ├── (1/8)R USDC 额外回购 gArc 销毁
    └── Claim 池释放 R/Pg 枚 gArc 给用户

未达成里程碑用户的签到费
    ↓
    持续补充奖励池的亏空
```

**核心洞见：** 大多数用户会在中途断签。他们的签到费持续流入奖励池，但他们不会触发 Claim。这部分资金就成为坚持者的奖励来源。断签率越高，奖励池越充裕，坚持者的奖励越丰厚。

### 5.2 无需信任的永续性

协议金库（5%）和合作项目预留（5%）同样遵循相同的 Claim 逻辑。创始人团队如需获取收益，同样必须经过里程碑 Claim，同样触发 (9/8) 倍回购销毁。

没有例外。没有特权出口。

**所有 USDC 离开系统的唯一路径，都是通过销毁 gArc 来实现的。** 这是不可绕过的设计。

### 5.3 为何奖励池永不归零

即使在极端情况下——所有活跃用户同一天全部触发最高里程碑 Claim——奖励池扣除 `(9/8) × 80%` = 90% 的总池，剩余 10% 恰好对应协议金库和合作预留的 10%。

系统的最低余额，始终是当日新增签到费的流入量。

只要还有人签到，系统就不会停止。

---

## 六、链上身份：GM 签到的第二层价值

每一枚通过里程碑 Claim 铸造的 SBT（灵魂绑定代币），都是一份链上时间证明。

它记录：你到过这里。你坚持了多久。这是第几次。

SBT 不可转让，不可伪造，不可购买。它只能通过真实的连续签到行为获得。

这使得 GM Protocol 成为 Arc 生态的**链上信誉基础设施**：

- 项目方可以查询某地址的最高里程碑等级，作为用户筛选依据
- DAO 治理投票权与当前连续签到天数实时绑定（而非历史最高值）
- 合作项目可设置 SBT 门槛，确保参与者是真实的长期 Arc 用户

---

## 七、身份验证：层层递进的女巫防御

真实身份的验证不应该是负担，它应该与用户的参与深度自然匹配。

| 层级 | 触发时机 | 验证要求 |
|------|---------|---------|
| 第零层 | 首次签到 | Human Passport 后台扫描（无感知） |
| 第一层 | 铜牌 Claim | Gitcoin Passport Stamps ≥ 20 |
| 第二层 | 黄金/铂金 Claim | Stamps ≥ 20 + ZKPassport，或 Stamps ≥ 35 |
| 第三层 | 传奇 Claim | 第二层 + 双交易所 KYC |

第零层：门槛为零。任何人都可以加入，女巫账号的资金同样会进入奖励池，反而对系统有利。

第三层：需要真实护照 + 双交易所实名认证。在这个层级批量制造女巫账号，成本极高，且行为在链上完全透明可查。

---

## 八、合作生态：以教育为目的的连接

GM Protocol 不是一个孤立的系统，它是 Arc 生态的连接器。

合作项目可以接入 GM Protocol，为用户提供附加任务。但我们对合作任务有明确的立场：

**我们只接受以教育为目的的任务。** 视频观看、文章阅读、知识问答、链上交互验证——这些能够真正筛选出理解项目的用户。

**我们明确拒绝一切社交传播任务。** 转发、关注、邀请——这些只能带来无效流量。我们不做这样的事。

合作项目拥有独立的奖励池。每次用户 Claim 时，同样触发 (9/8) 倍回购销毁。合作项目的每一分 USDC，都为 gArc 的通缩做出贡献。

完成任意合作项目的 GM 签到，等同于完成当日主 GM 签到，连续天数共享。这是 GM Protocol 生态整合的核心设计。

---

## 九、DAO 治理：防操控的去中心化

GM Protocol 的治理目标是：**任何单一力量都无法操控系统，包括创始人。**

### 9.1 投票权重设计

投票权 = gArc 持有量 × 连续签到系数

```
连续签到系数 S：
  0 天（未签到）：0.1x
  1-29 天：      0.5x
  30-89 天：     1.0x
  90-179 天：    2.0x
  180-364 天：   3.5x
  365 天+：      6.0x
```

买入大量 gArc 但不签到，投票权只有 0.1 倍。攻击者在第一天的投票权，比同等持仓但连续签到一年的用户低 60 倍。

### 9.2 关键投票的 SBT 门槛

资金分配相关的提案，投票资格必须持有黄金及以上 SBT。黄金 SBT 需要连续签到 90 天。

攻击者无法在买入代币后立即发起资金类提案。

### 9.3 三层防御

1. SBT 资格门槛 + 实时连续签到衰减
2. gArc 投票权 × 连续签到系数（无锁仓，签到本身即皮肤）
3. 所有资金类提案 72 小时时间锁，社区有时间反应

### 9.4 治理演进

协议不急于完全去中心化。治理权会随着社区的成熟逐步移交：

- **Phase 0-1（测试网）**：创始人多签，决策透明公示
- **Phase 2（生态建设）**：引入社区投票，创始人保留紧急否决权
- **Phase 3（主网上线后）**：完全 DAO 治理，创始人仅作普通持有者
- **Phase 4（长期）**：创始人否决权通过时间锁逐年放弃

---

## 十、一些话

这个项目是我一个人构建的。

这不是因为我不想要团队，而是因为我相信，一个足够清晰的想法，可以由一个人从零到一地实现。Hayden Adams 一个人写出了 Uniswap v1，Andre Cronje 一个人在几周内写出了 Yearn Finance 的核心合约。单人完成复杂协议是有先例的。

但更重要的是，我想让这个项目的诞生本身，就是对它所主张的理念的证明：

**真正有价值的事情，需要真正的坚持。**

我没有受益于任何预挖、私募或内部分配。创始人的每一枚 gArc，都来自和普通用户完全相同的 Claim 路径。如果我不每天 GM，我一样什么都得不到。

这是我觉得最重要的事：**创始人和用户共享同一套规则。**

---

## 十一、路线图

| 阶段 | 时间 | 里程碑 |
|------|------|------|
| Phase 0 | 2026 Q4 | 合约开发与测试，Arc 测试网部署 |
| Phase 1 | 2027 Q1 | 主网上线，TGE，初始流动性注入 |
| Phase 2 | 2027 Q2-Q3 | 合作项目接入，身份验证层集成 |
| Phase 3 | 2027 Q4 | DAO 治理上线，创始人逐步放权 |
| Phase 4 | 2028+ | 生态扩展，Arc 身份基础设施对外开放 |

---

## 结语

GM Protocol 不是一个关于 USDC 的项目，也不是一个关于代币价格的项目。

它是一个关于**坚持**的项目。

在这个世界里，每一天说出 GM 并付诸行动，都会在链上留下无法篡改的印记。坚持的时间越长，积累的价值越大，获得的认可越多。

而那些中途离开的人，他们也没有失去什么。他们的离开，成就了那些留下来的人。

这才是真正公平的系统：每个人的选择，都在产生对应的后果，并且完全透明。

**GM。**

---

---

# English Version

---

## Preface

I am not building a project. I am trying to answer a question:

**In the blockchain world, what can a daily GM prove?**

GM — short for Good Morning — is the oldest greeting in crypto culture. Every day, millions of people across X, Discord, and Farcaster send these two letters. It is an expression of belonging, a declaration of "I am still here."

But these two letters have never left a trace onchain.

I started to think: what if we brought this daily ritual onchain?

Not simply recording an event, but making this behavior carry real economic weight. Rewarding those who persist with the funds left behind by those who quit. Making the process generate an onchain, unforgeable identity credential. And letting gArc — the protocol's token — serve as a pure deflationary vessel, recording the system's trajectory in a unique way.

This is where GM Protocol begins.

---

## I. The Root of the Problem

### 1.1 Web3's Trust Crisis

We are in a strange moment.

Blockchain technology promised decentralization, transparency, trustlessness. Yet in practice, most Web3 projects are built on a fundamental contradiction: they claim decentralization while relying on centralized incentive mechanisms to sustain themselves.

Every airdrop is a project team subsidizing users in one direction. Once the subsidy stops, users leave. The project goes to zero. The cycle repeats.

This is not sustainable. This is not what I want.

### 1.2 Sybil Attacks: The Omnipresent Ghost

The deeper problem: onchain, we cannot distinguish a real person from a thousand bots.

Every airdrop gets harvested by bot farms. Every governance vote gets manipulated by whales. Every partner project integration brings in hollow traffic.

The value of real users is diluted, extracted, and ignored.

This is not fair. But this is the reality of the onchain world.

### 1.3 The Structural Trap of Tokenomics

Almost every Web3 token faces the same problem:

Tokens are issued to incentivize. Incentives generate demand. Demand supports price. Price attracts more holders. Holders expect higher prices... until someone starts selling, and the entire cycle collapses.

This is a Ponzi structure. Not malicious, but fragile.

I do not want to build such a system.

---

## II. The Insight: Dropouts Fund Persisters

In thinking through these problems, I discovered a simple but profound economic insight:

**A consecutive check-in system is, by nature, an economic model where those who quit fund those who persist.**

Every check-in fee that enters the system accumulates in the reward pool. Most people will quit midway, leaving their funds in the pool while their streak resets to zero. Only those who genuinely persist to a milestone can claim the accumulated reward.

No external subsidy required. This is a self-sustaining economic system.

Persistence itself is the source of value.

This insight is the economic foundation of GM Protocol.

---

## III. What GM Protocol Is

GM Protocol is an **onchain daily check-in protocol** deployed on Arc Network, and simultaneously an **onchain identity infrastructure layer** for the Arc ecosystem.

It is composed of two intertwined systems:

**The first system: Economic Incentives**

Pay 0.1 USDC daily to check in, accumulate consecutively. Upon reaching milestone checkpoints (30/90/180/365 days), claim gArc tokens released from the reward pool in the current period. Rewards come from the funds left behind by those who could not persist.

**The second system: Identity Proof**

Each check-in is an onchain timestamp. The record of consecutive check-ins, weighted by time, forms an identity credential that no one can forge — you were genuinely here, continuously present, with real actions to back it up.

These two systems reinforce each other. Economic incentives encourage persistence; persistence accumulates identity value; identity value brings more privileges; privileges further strengthen economic incentives.

---

## IV. gArc: A Pure Deflationary Vessel

gArc is GM Protocol's native token. But it is not a "project token" in the conventional sense.

The design philosophy of gArc is captured in one sentence: **It is a bridge, not a destination.**

### 4.1 Token Structure

gArc has a total supply of 10 billion tokens, minted all at once, never to be increased.

```
10,000,000,000 = 210,000,000  (Permanent Circulation Floor)
              + 4,790,000,000 (Claim Pool)
              + 5,000,000,000 (Initial Liquidity)
```

5 billion tokens are injected as initial liquidity into an AMM in one transaction. The contract authority is then permanently abandoned. From that moment, no one can mint more, and no one can interfere with liquidity.

4.79 billion tokens constitute the Claim Pool — the fuel for the entire Claim mechanism. Every milestone Claim releases an equivalent amount of gArc to the user from this pool.

210 million tokens are the Permanent Circulation Floor — the final anchor point when the system reaches its end state.

### 4.2 The Deflationary Mechanism: Every Claim Is a Burn

The only way gArc enters circulation is through Claims. The only way it leaves circulation is also through Claims.

This is a deliberate design.

When a user claims a reward of R USDC equivalent in gArc:

1. The reward pool withdraws `(9/8) × R` USDC (i.e., 1.125R)
2. R USDC enters the market, buys back an equivalent amount of gArc, burns it
3. An additional `(1/8) × R` USDC from the reserve treasury also enters the market, buys and burns gArc
4. Simultaneously, the Claim pool releases `R/Pg` gArc tokens to the user

The user receives gArc, but an equivalent amount of gArc simultaneously disappears from the market.

**Every Claim is a net-neutral circulation change, accompanied by an additional 12.5% excess burn.**

No USDC can leave this system without triggering a buyback-and-burn. This is an unavoidable design.

### 4.3 The Deflationary Curve: A Tribute to Bitcoin

gArc's deflationary path is not linear. It follows a reverse quadratic curve:

```
C(t) = 1 - (1 - t/6)²     t ∈ [0, 6] (years)
```

This curve is designed with reference to Bitcoin's issuance schedule — fast burn in the early years, gradually stabilizing, converging toward the 210 million anchor by approximately 2032.

The number 210 million derives from the Bitcoin parameter: 95.24% of BTC already mined by 2032, applied as the target ratio for gArc's final circulation state.

---

## V. Sustainability: Why the System Never Collapses

This is the most important section of this whitepaper.

### 5.1 The Closed Capital Loop

GM Protocol's capital flows form a completely closed loop:

```
User check-in fee (0.1 USDC)
    ↓ distributed by proportion
    ├── 80% → Milestone Reward Pool
    ├── 10% → Reserve Treasury (provides 1/8 extra buyback per Claim)
    ├── 5%  → Protocol Treasury (founder/team, locked then claimed)
    └── 5%  → Partner Reserve (claim triggers same burn mechanic)

Milestone Claim
    ↓
    ├── Reward pool releases (9/8)R USDC
    ├── R USDC buys back and burns gArc
    ├── (1/8)R USDC additionally buys back and burns gArc
    └── Claim pool releases R/Pg gArc to user

Check-in fees from users who don't reach milestones
    ↓
    Continuously replenish the pool deficit from Claims
```

**Core insight:** The majority of users will quit midway. Their check-in fees flow into the reward pool continuously, but they never trigger a Claim. These funds become the source of rewards for persisters. The higher the dropout rate, the more abundant the reward pool, and the richer the rewards for those who remain.

### 5.2 Trustless Perpetuity

The Protocol Treasury (5%) and Partner Reserve (5%) follow identical Claim logic. For the founding team to receive any value, they must go through the same milestone Claim process, triggering the same (9/8)x buyback-and-burn.

No exceptions. No privileged exits.

**The only path for USDC to leave the system is through burning gArc.** This is a bypass-proof design.

### 5.3 Why the Reward Pool Never Reaches Zero

Even in an extreme scenario — all active users triggering their highest milestone Claim on the same day — the pool withdrawal equals `(9/8) × 80%` = 90% of the total pool. The remaining 10% corresponds precisely to the Protocol Treasury and Partner Reserve's 10%.

The minimum balance of the system is always equal to the inflow of new check-in fees for that day.

As long as anyone checks in, the system will not stop.

---

## VI. Onchain Identity: The Second Layer of Value

Every SBT (Soulbound Token) minted through a milestone Claim is an onchain proof of time.

It records: you were here. How long you persisted. How many times you have made it.

SBTs cannot be transferred, cannot be forged, cannot be purchased. They can only be earned through genuine consecutive check-in behavior.

This makes GM Protocol the **onchain reputation infrastructure** for the Arc ecosystem:

- Projects can query an address's highest milestone tier as a user filter
- DAO governance voting weight is bound in real time to current consecutive check-in days (not historical peak)
- Partner projects can set SBT thresholds to ensure participants are genuine long-term Arc users

---

## VII. Identity Verification: Progressive Sybil Defense

Real identity verification should not be a burden. It should naturally match the depth of a user's participation.

| Layer | Trigger | Verification Requirement |
|-------|---------|--------------------------|
| Layer 0 | First check-in | Human Passport background scan (silent) |
| Layer 1 | Bronze Claim | Gitcoin Passport Stamps ≥ 20 |
| Layer 2 | Gold/Platinum Claim | Stamps ≥ 20 + ZKPassport, or Stamps ≥ 35 |
| Layer 3 | Legend Claim | Layer 2 + Dual Exchange KYC |

Layer 0: Zero barrier. Anyone can join. Sybil accounts' funds equally enter the reward pool, which actually benefits the system.

Layer 3: Requires a real passport plus KYC from two exchanges. Mass-producing sybil accounts at this level carries extreme cost, and all behavior is fully transparent onchain.

---

## VIII. The Partner Ecosystem: Education-First Connections

GM Protocol is not an isolated system. It is a connector for the Arc ecosystem.

Partner projects can integrate with GM Protocol to provide users with additional tasks. But we hold a clear position on partner tasks:

**We only accept education-purpose tasks.** Video viewing, article reading, knowledge quizzes, onchain interaction verification — these genuinely filter for users who understand the project.

**We explicitly reject all social propagation tasks.** Retweets, follows, referrals — these only bring hollow traffic. We do not do that.

Partner projects have independent reward pools. Every user Claim triggers the same (9/8)x buyback-and-burn. Every USDC from every partner project contributes to gArc's deflation.

Completing any partner project's GM check-in is equivalent to completing the main GM check-in for the day. Consecutive day streaks are shared. This is the core design of GM Protocol's ecosystem integration.

---

## IX. DAO Governance: Manipulation-Resistant Decentralization

The governance goal of GM Protocol is simple: **no single force can manipulate the system, including the founder.**

### 9.1 Voting Weight Design

Voting Power = gArc Holdings × Consecutive Check-in Coefficient

```
Consecutive Check-in Coefficient S:
  0 days (not checking in): 0.1x
  1–29 days:                0.5x
  30–89 days:               1.0x
  90–179 days:              2.0x
  180–364 days:             3.5x
  365+ days:                6.0x
```

Buying large amounts of gArc without checking in yields only 0.1x voting power. An attacker on day one has 60x less voting power than a user with equal holdings but one year of consecutive check-ins.

### 9.2 SBT Threshold for Critical Votes

Proposals related to fund allocation require Gold SBT or above for voting eligibility. Gold SBT requires 90 consecutive days of check-ins.

An attacker cannot immediately propose fund-related changes after buying tokens.

### 9.3 Three-Layer Defense

1. SBT eligibility threshold + real-time consecutive check-in decay
2. gArc voting weight × check-in coefficient (no lockup required; check-in behavior itself is the skin in the game)
3. 72-hour timelock on all fund-related proposals, giving the community time to respond

### 9.4 Governance Evolution

The protocol does not rush toward full decentralization. Governance authority will be handed over incrementally as the community matures:

- **Phase 0–1 (Testnet):** Founder multisig; decisions publicly disclosed
- **Phase 2 (Ecosystem Growth):** Community voting introduced; founder retains emergency veto
- **Phase 3 (After Mainnet):** Full DAO governance; founder participates as an ordinary holder
- **Phase 4 (Long-term):** Founder veto relinquished progressively via time-lock, one right per year

---

## X. A Personal Note

This project is built by one person.

Not because I don't want a team, but because I believe a sufficiently clear idea can be realized from zero to one by a single person. Hayden Adams built Uniswap v1 alone. Andre Cronje wrote the core contracts of Yearn Finance in a matter of weeks, solo. Single-person protocol launches have precedent.

But more importantly, I want the birth of this project to itself be proof of what it advocates:

**Things of genuine value require genuine persistence.**

I have not benefited from any pre-mine, private sale, or insider allocation. Every gArc the founding team earns comes through the exact same Claim path as any ordinary user. If I do not GM every day, I get nothing.

This is what I consider most important: **the founder and users share the same rules.**

---

## XI. Roadmap

| Phase | Timeline | Milestone |
|-------|----------|-----------|
| Phase 0 | 2026 Q4 | Contract development, Arc Testnet deployment |
| Phase 1 | 2027 Q1 | Mainnet launch, TGE, initial liquidity injection |
| Phase 2 | 2027 Q2–Q3 | Partner project integration, identity verification layer |
| Phase 3 | 2027 Q4 | DAO governance live, founder begins handover |
| Phase 4 | 2028+ | Ecosystem expansion, identity infrastructure open to Arc ecosystem |

---

## Closing

GM Protocol is not a project about USDC. It is not a project about token prices.

It is a project about **persistence**.

In this world, saying GM every day and acting on it leaves an immutable mark onchain. The longer you persist, the greater the value you accumulate, the more recognition you earn.

And those who leave midway have not lost anything. Their departure becomes the foundation upon which those who remain are rewarded.

This is a truly fair system: every person's choice produces its corresponding consequence, completely transparently.

**GM.**

---

*GM Protocol Whitepaper v1.0 | October 2026*
*All parameters are subject to adjustment based on testnet data.*
*The next version will be updated following mainnet launch.*
