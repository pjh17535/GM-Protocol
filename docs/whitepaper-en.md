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
