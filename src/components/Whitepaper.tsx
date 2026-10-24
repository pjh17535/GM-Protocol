import { useState } from 'react'

type Lang = 'zh' | 'en'

function Section({ children }: { children: React.ReactNode }) {
  return <div className="mb-10">{children}</div>
}

function H1({ children }: { children: React.ReactNode }) {
  return <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{children}</h1>
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold text-blue-400 mt-10 mb-4 border-b border-gray-800 pb-2">{children}</h2>
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-gray-200 mt-6 mb-2">{children}</h3>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-300 text-sm leading-relaxed mb-3">{children}</p>
}

function Quote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="border-l-4 border-blue-500 pl-4 py-1 my-4 text-blue-200 text-sm italic bg-blue-950/30 rounded-r-lg">
      {children}
    </blockquote>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-green-300 text-xs font-mono overflow-x-auto my-3 leading-relaxed">
      {children}
    </pre>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto my-4">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-800">
            {headers.map((h, i) => (
              <th key={i} className="border border-gray-700 px-3 py-2 text-left text-gray-300 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-850'}>
              {row.map((cell, j) => (
                <td key={j} className="border border-gray-700 px-3 py-2 text-gray-300">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function InfoBox({ color, children }: { color: 'blue' | 'yellow' | 'green' | 'gray'; children: React.ReactNode }) {
  const styles = {
    blue:   'bg-blue-950 border-blue-700 text-blue-200',
    yellow: 'bg-yellow-950 border-yellow-700 text-yellow-200',
    green:  'bg-green-950 border-green-700 text-green-200',
    gray:   'bg-gray-800 border-gray-600 text-gray-300',
  }
  return (
    <div className={`border rounded-lg p-4 my-4 text-sm ${styles[color]}`}>
      {children}
    </div>
  )
}

function ZH() {
  return (
    <div>
      {/* 封面 */}
      <div className="text-center mb-12 pt-4">
        <div className="text-5xl font-black text-white mb-3 tracking-widest">GM</div>
        <div className="text-2xl font-bold text-blue-400 mb-1">GM Protocol 白皮书</div>
        <div className="text-gray-400 text-sm">v1.0 | 2026年10月 | 公开发布版</div>
        <div className="mt-4 text-gray-500 text-xs">作者：GM Protocol 创始人</div>
      </div>

      {/* 前言 */}
      <Section>
        <H2>前言</H2>
        <P>我不是在构建一个项目，我是在尝试回答一个问题：</P>
        <Quote><strong>在区块链世界里，一个人每天说一声 GM，能证明什么？</strong></Quote>
        <P>GM，是 Good Morning 的缩写，是加密社区最古老的问候语。每天在 X、Discord、Farcaster 上，数以百万计的人发出这两个字母。它是一种归属感的表达，是一种"我还在这里"的宣告。</P>
        <P>但这两个字母，从来没有在链上留下任何痕迹。</P>
        <P>我开始思考：如果把这个每日仪式搬到链上，会发生什么？不是简单地记录一个事件，而是让这个行为产生真实的经济意义。让坚持签到的人，得到那些半途而废的人留下的资金作为奖励。让这个过程产生一种链上可查、不可伪造的身份证明。让 gArc 这个代币，成为一个纯粹的通缩载体，以独特的方式记录整个系统的运行轨迹。</P>
        <P>这就是 GM Protocol 的起点。</P>
      </Section>

      {/* 一、问题的根源 */}
      <Section>
        <H2>一、问题的根源</H2>
        <H3>1.1 Web3 的信任危机</H3>
        <P>我们正处在一个奇怪的时刻。区块链技术承诺了去中心化、透明、无需信任。但在实践中，大多数 Web3 项目都建立在一个根本性的矛盾上：它们声称去中心化，却依赖中心化的激励机制来维持运转。</P>
        <P>每一次空投，都是项目方在单向补贴用户。一旦补贴停止，用户离开，项目归零，循环往复。这不是可持续的。</P>
        <H3>1.2 真实性危机</H3>
        <P>更深层的问题是：链上世界难以区分真实参与和机械重复。真实用户的价值被稀释，被掠夺，被忽视。如何让长期坚持的真实人获得应有的回报，是这个系统设计的出发点之一。</P>
        <H3>1.3 代币经济的结构性陷阱</H3>
        <P>几乎所有的 Web3 代币都面临同一个问题：代币发行是为了激励，激励带来需求，需求支撑价格，价格吸引更多持有者……直到有人开始抛售，整个循环崩塌。这是一个庞氏结构——不是恶意的，但是脆弱的。</P>
      </Section>

      {/* 二、洞见 */}
      <Section>
        <H2>二、洞见：断签者补贴坚持者</H2>
        <P>在思考这些问题的过程中，我发现了一个简单但深刻的经济学洞见：</P>
        <InfoBox color="blue">
          <strong>连续签到系统，天然是一个"断签者补贴坚持者"的经济模型。</strong>
          <br /><br />
          每一个进入系统的签到费，都会在奖励池里积累。大多数人会在中途断签，他们的资金留在池子里，归零计数重新开始。只有少数真正坚持到里程碑的人，才能提取那笔积累的奖励。
          <br /><br />
          这不需要任何外部补贴。坚持本身，就是价值的来源。
        </InfoBox>
        <P>这个洞见，就是 GM Protocol 的经济学基础。</P>
      </Section>

      {/* 三、GM Protocol 是什么 */}
      <Section>
        <H2>三、GM Protocol 是什么</H2>
        <P>GM Protocol 是部署在 Arc Network 上的<strong>链上每日签到协议</strong>，同时也是 Arc 生态的<strong>链上身份基础设施层</strong>。</P>
        <P>它由两个互相缠绕的系统构成：</P>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
          <InfoBox color="blue">
            <div className="font-bold mb-2">经济激励系统</div>
            每天支付 0.1 USDC 签到，连续累积。到达里程碑节点（30/90/180/365天），可以 Claim 奖励池中当期释放的 gArc 代币。奖励来自那些没能坚持下去的人留下的资金。
          </InfoBox>
          <InfoBox color="green">
            <div className="font-bold mb-2">身份证明系统</div>
            每一次签到，都是一个链上时间戳。连续签到的记录，随着时间加权，形成一种任何人都无法伪造的身份证明——你确实在这里，持续存在，有真实行动支撑。
          </InfoBox>
        </div>
        <P>这两个系统相互强化：经济激励让人坚持签到，签到积累身份价值，身份价值带来更多特权，特权进一步强化经济激励。</P>
      </Section>

      {/* 四、gArc */}
      <Section>
        <H2>四、gArc：一个纯粹的通缩载体</H2>
        <Quote>它是一座桥，不是终点。</Quote>
        <H3>4.1 代币结构</H3>
        <P>gArc 总量 100 亿枚，一次性全量铸造，永不增发。</P>
        <Code>{`100亿 = 2.1亿（永久流通底线）
      + 47.9亿（Claim池）
      + 50亿（初始流动性）

50亿枚一次性注入 AMM，权限随后永久丢弃。
从那一刻起，没有任何人能够增发，没有任何人能够干预流动性。`}</Code>
        <H3>4.2 通缩机制：每一次 Claim 都是销毁</H3>
        <P>当用户 Claim 奖励 R USDC 等价的 gArc 时：</P>
        <Code>{`① 奖励池扣除 = (9/8) × R USDC
② 主回购      = R USDC → AMM 买入 gArc → 销毁
③ 额外回购    = (1/8) × R USDC → 储备金库 → AMM 买入 gArc → 销毁
④ 用户获得    = R / Pg 枚 gArc（来自 Claim 池，1:1 等量释放）

净效果：用户获得 gArc，市场同时消失等量 gArc，额外多销毁 12.5%。`}</Code>
        <InfoBox color="yellow">
          <strong>没有任何 USDC 能在不触发回购销毁的情况下离开这个系统。</strong>
          这是不可绕过的设计。
        </InfoBox>
        <H3>4.3 通缩曲线：致敬比特币</H3>
        <P>gArc 的通缩路径遵循反向二次曲线，参照比特币的产出时间表，在 2032 年前后将流通量收敛至 2.1 亿枚锚点。</P>
        <Code>{`C(t) = 1 - (1 - t/6)²     t ∈ [0, 6]（年）

示例：t=1（第一年末）
C(1) = 1 - (5/6)² ≈ 30.56%
年销毁量 = 47.9亿 × 30.56% ≈ 14.64亿枚`}</Code>
      </Section>

      {/* 五、可持续性 */}
      <Section>
        <H2>五、可持续性：系统为何永不崩塌</H2>
        <H3>5.1 资金的闭合循环</H3>
        <Code>{`用户签到费 (0.1 USDC)
    ├── 80% → 里程碑奖励池
    ├── 10% → 储备金库（每次 Claim 提供 1/8 额外回购）
    ├── 5%  → 协议金库（创始人/团队，锁仓后 Claim）
    └── 5%  → 合作项目预留（Claim 时同步触发销毁）

里程碑 Claim → 奖励池扣除 (9/8)R → 回购销毁 gArc → Claim 池释放 gArc 给用户

未达里程碑的签到费 → 持续补充奖励池的亏空（真正的动力源）`}</Code>
        <H3>5.2 极端情况验证</H3>
        <P>即使当日所有用户全部 Claim：奖励池扣除 (9/8) × 80% = 90% 的总池，剩余 10% 恰好对应协议金库与合作预留的 10%。</P>
        <InfoBox color="green">
          <strong>只要还有人签到，系统就不会停止。奖励池永不归零。</strong>
        </InfoBox>
        <H3>5.3 无特权出口</H3>
        <P>协议金库（5%）和合作项目预留（5%）同样遵循相同的 Claim 逻辑。创始人团队如需获取收益，同样必须经过里程碑 Claim，同样触发 (9/8) 倍回购销毁。没有例外，没有后门。</P>
      </Section>

      {/* 六、链上身份 */}
      <Section>
        <H2>六、链上身份：GM 签到的第二层价值</H2>
        <P>每一枚通过里程碑 Claim 铸造的 SBT（灵魂绑定代币），都是一份链上时间证明。它记录：你到过这里，你坚持了多久，这是第几次。</P>
        <P>SBT 不可转让，不可伪造，不可购买。它只能通过真实的连续签到行为获得。</P>
        <P>这使得 GM Protocol 成为 Arc 生态的链上信誉基础设施：第三方合约可查询某地址的最高里程碑等级，作为用户筛选依据；DAO 治理投票权与当前连续签到天数实时绑定。</P>
      </Section>

      {/* 七、身份验证 */}
      <Section>
        <H2>七、身份验证：与参与深度自然匹配</H2>
        <P>GM Protocol 认为，真正坚持的用户不应当为参与设置任何额外的摩擦。因此，签到本身完全开放，任何地址都可以从第一天开始。</P>
        <P>随着里程碑深度的推进，系统会在 Claim 环节引入与之匹配的真实性验证。验证方式基于已广泛使用的链上/链下身份基础设施，对真实用户而言几乎没有额外成本。</P>
        <P>为了保证 GM Protocol 长期的真实可持续性，我们采取严格的身份验证策略。具体的验证层级与技术实现将在协议正式上线时通过合约代码完整公开。</P>
        <Quote>真实的坚持，不惧任何验证。</Quote>
      </Section>

      {/* 八、合作生态 */}
      <Section>
        <H2>八、合作生态：以教育为目的的连接</H2>
        <P>合作项目可接入 GM Protocol，为用户提供附加任务。我们的立场清晰：</P>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
          <InfoBox color="green">
            <div className="font-bold mb-2 text-green-300">接受的任务</div>
            视频观看、文章阅读、知识问答（1题/次）、链上交互验证——真正筛选出理解项目的用户。
          </InfoBox>
          <InfoBox color="gray">
            <div className="font-bold mb-2 text-red-400">拒绝的任务</div>
            转发、关注、邀请、加群——这些只能带来无效流量。我们不做这样的事。
          </InfoBox>
        </div>
        <P>完成任意合作项目的 GM 签到，等同于完成当日主 GM 签到，连续天数共享。每次合作 Claim 同样触发 (9/8) 倍回购销毁，每个合作项目都为 gArc 的通缩做出贡献。</P>
      </Section>

      {/* 九、DAO 治理 */}
      <Section>
        <H2>九、DAO 治理：防操控的去中心化</H2>
        <H3>9.1 投票权重</H3>
        <Code>{`投票权 = gArc 持有量 × 连续签到系数 S

S 系数：
  0 天（未签到）：0.1x
  1-29 天：      0.5x
  30-89 天：     1.0x（铜牌）
  90-179 天：    2.0x（黄金）
  180-364 天：   3.5x（铂金）
  365 天+：      6.0x（传奇）

攻击验证：
  攻击者持有 25 亿 gArc（第1天）→ 投票权 = 25亿 × 0.5x = 12.5亿
  传奇用户持有 100万 gArc（365天）→ 投票权 = 100万 × 6x = 600万
  攻击者比传奇用户少 2083x 的单位投票效率`}</Code>
        <H3>9.2 治理演进</H3>
        <Table
          headers={['阶段', '状态', '描述']}
          rows={[
            ['Phase 0-1', '测试网', '创始人多签，决策透明公示'],
            ['Phase 2', '生态建设', '引入社区投票，创始人保留紧急否决权'],
            ['Phase 3', '主网上线后', '完全 DAO 治理，创始人仅作普通持有者'],
            ['Phase 4', '长期', '创始人否决权通过时间锁逐年放弃'],
          ]}
        />
      </Section>

      {/* 十、一些话 */}
      <Section>
        <H2>十、一些话</H2>
        <P>这个项目是我一个人构建的。</P>
        <P>不是因为我不想要团队，而是因为我相信，一个足够清晰的想法，可以由一个人从零到一地实现。Hayden Adams 一个人写出了 Uniswap v1，Andre Cronje 一个人在几周内写出了 Yearn Finance 的核心合约。单人完成复杂协议是有先例的。</P>
        <P>但更重要的是，我想让这个项目的诞生本身，就是对它所主张的理念的证明：</P>
        <Quote><strong>真正有价值的事情，需要真正的坚持。</strong></Quote>
        <P>我没有受益于任何预挖、私募或内部分配。创始人的每一枚 gArc，都来自和普通用户完全相同的 Claim 路径。如果我不每天 GM，我一样什么都得不到。</P>
        <InfoBox color="blue">
          <strong>创始人和用户共享同一套规则。这是这个项目最重要的设计原则。</strong>
        </InfoBox>
      </Section>

      {/* 十一、路线图 */}
      <Section>
        <H2>十一、路线图</H2>
        <Table
          headers={['阶段', '时间', '里程碑']}
          rows={[
            ['Phase 0', '2026 Q4', '合约开发与测试，Arc 测试网部署'],
            ['Phase 1', '2027 Q1', '主网上线，TGE，初始流动性注入'],
            ['Phase 2', '2027 Q2-Q3', '合作项目接入，身份验证层集成'],
            ['Phase 3', '2027 Q4', 'DAO 治理上线，创始人逐步放权'],
            ['Phase 4', '2028+', '生态扩展，Arc 身份基础设施对外开放'],
          ]}
        />
      </Section>

      {/* 结语 */}
      <Section>
        <H2>结语</H2>
        <P>GM Protocol 不是一个关于 USDC 的项目，也不是一个关于代币价格的项目。</P>
        <P>它是一个关于<strong>坚持</strong>的项目。</P>
        <P>在这个世界里，每一天说出 GM 并付诸行动，都会在链上留下无法篡改的印记。坚持的时间越长，积累的价值越大，获得的认可越多。</P>
        <P>而那些中途离开的人，他们也没有失去什么。他们的离开，成就了那些留下来的人。</P>
        <P>这才是真正公平的系统：每个人的选择，都在产生对应的后果，并且完全透明。</P>
        <div className="text-center mt-10 text-3xl font-black text-blue-400 tracking-widest">GM。</div>
      </Section>
    </div>
  )
}

function EN() {
  return (
    <div>
      {/* Cover */}
      <div className="text-center mb-12 pt-4">
        <div className="text-5xl font-black text-white mb-3 tracking-widest">GM</div>
        <div className="text-2xl font-bold text-blue-400 mb-1">GM Protocol Whitepaper</div>
        <div className="text-gray-400 text-sm">v1.0 | October 2026 | Public Release</div>
        <div className="mt-4 text-gray-500 text-xs">Author: GM Protocol Founder</div>
      </div>

      {/* Preface */}
      <Section>
        <H2>Preface</H2>
        <P>I am not building a project. I am trying to answer a question:</P>
        <Quote><strong>In the blockchain world, what can a daily GM prove?</strong></Quote>
        <P>GM — short for Good Morning — is the oldest greeting in crypto culture. Every day, millions of people across X, Discord, and Farcaster send these two letters. It is an expression of belonging, a declaration of "I am still here."</P>
        <P>But these two letters have never left a trace onchain.</P>
        <P>I started to think: what if we brought this daily ritual onchain? Not simply recording an event, but making this behavior carry real economic weight. Rewarding those who persist with the funds left behind by those who quit. Making the process generate an onchain, unforgeable identity credential. And letting gArc serve as a pure deflationary vessel, recording the system's trajectory in a unique way.</P>
        <P>This is where GM Protocol begins.</P>
      </Section>

      {/* I. The Root of the Problem */}
      <Section>
        <H2>I. The Root of the Problem</H2>
        <H3>1.1 Web3's Trust Crisis</H3>
        <P>We are in a strange moment. Blockchain technology promised decentralization, transparency, and trustlessness. Yet in practice, most Web3 projects are built on a fundamental contradiction: they claim decentralization while relying on centralized incentive mechanisms to sustain themselves.</P>
        <P>Every airdrop is a project team subsidizing users in one direction. Once the subsidy stops, users leave, the project goes to zero. The cycle repeats. This is not sustainable.</P>
        <H3>1.2 The Authenticity Crisis</H3>
        <P>The deeper problem: onchain, it is difficult to distinguish genuine participation from mechanical repetition. The value of real users gets diluted and ignored. How to ensure that those who truly persist receive what they have earned — this is one of the core design questions GM Protocol was built to answer.</P>
        <H3>1.3 The Structural Trap of Tokenomics</H3>
        <P>Almost every Web3 token faces the same problem: tokens are issued to incentivize, incentives generate demand, demand supports price, price attracts more holders... until someone starts selling and the entire cycle collapses. A Ponzi structure — not malicious, but fragile.</P>
      </Section>

      {/* II. The Insight */}
      <Section>
        <H2>II. The Insight: Dropouts Fund Persisters</H2>
        <InfoBox color="blue">
          <strong>A consecutive check-in system is, by nature, an economic model where those who quit fund those who persist.</strong>
          <br /><br />
          Every check-in fee accumulates in the reward pool. Most people quit midway, leaving their funds in the pool. Only those who genuinely persist to a milestone can claim the accumulated reward.
          <br /><br />
          No external subsidy required. Persistence itself is the source of value.
        </InfoBox>
        <P>This insight is the economic foundation of GM Protocol.</P>
      </Section>

      {/* III. What GM Protocol Is */}
      <Section>
        <H2>III. What GM Protocol Is</H2>
        <P>GM Protocol is an <strong>onchain daily check-in protocol</strong> deployed on Arc Network, and simultaneously an <strong>onchain identity infrastructure layer</strong> for the Arc ecosystem.</P>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
          <InfoBox color="blue">
            <div className="font-bold mb-2">Economic Incentive System</div>
            Pay 0.1 USDC daily to check in, accumulate consecutively. Upon reaching milestones (30/90/180/365 days), claim gArc from the reward pool. Rewards come from the funds left behind by those who quit.
          </InfoBox>
          <InfoBox color="green">
            <div className="font-bold mb-2">Identity Proof System</div>
            Each check-in is an onchain timestamp. The record of consecutive check-ins, weighted by time, forms an identity credential that no one can forge — you were genuinely here, continuously present.
          </InfoBox>
        </div>
        <P>These two systems reinforce each other: incentives drive persistence; persistence accumulates identity value; identity value brings more privileges; privileges further strengthen incentives.</P>
      </Section>

      {/* IV. gArc */}
      <Section>
        <H2>IV. gArc: A Pure Deflationary Vessel</H2>
        <Quote>It is a bridge, not a destination.</Quote>
        <H3>4.1 Token Structure</H3>
        <Code>{`Total Supply: 10,000,000,000 gArc (minted once, never increased)

= 210,000,000   (Permanent Circulation Floor)
+ 4,790,000,000 (Claim Pool — the bridge fuel)
+ 5,000,000,000 (Initial Liquidity — injected into AMM, authority abandoned forever)`}</Code>
        <H3>4.2 The Deflationary Mechanism: Every Claim Is a Burn</H3>
        <Code>{`When user claims reward R USDC equivalent in gArc:

① Reward pool withdraws  = (9/8) × R USDC
② Primary buyback        = R USDC → buys gArc from AMM → burns
③ Additional buyback     = (1/8) × R USDC → from reserve → buys gArc → burns
④ User receives          = R / Pg gArc tokens (from Claim Pool, 1:1 release)

Net effect: user gains gArc; equal amount disappears from market; +12.5% excess burn.`}</Code>
        <InfoBox color="yellow">
          <strong>No USDC can leave this system without triggering a buyback-and-burn. This is a bypass-proof design.</strong>
        </InfoBox>
        <H3>4.3 The Deflationary Curve: A Tribute to Bitcoin</H3>
        <Code>{`C(t) = 1 - (1 - t/6)²     t ∈ [0, 6] years

Example: t=1 (end of Year 1)
C(1) = 1 - (5/6)² ≈ 30.56%
Year 1 burn = 4.79B × 30.56% ≈ 1.464B tokens

Target anchor: ~210M circulation by 2032
(mirrors Bitcoin's 95.24% issuance ratio by 2032)`}</Code>
      </Section>

      {/* V. Sustainability */}
      <Section>
        <H2>V. Sustainability: Why the System Never Collapses</H2>
        <H3>5.1 The Closed Capital Loop</H3>
        <Code>{`Check-in fee (0.1 USDC)
    ├── 80% → Milestone Reward Pool
    ├── 10% → Reserve Treasury (provides 1/8 extra buyback per Claim)
    ├── 5%  → Protocol Treasury (founder/team, locked then claimed)
    └── 5%  → Partner Reserve (same burn mechanic on Claim)

Milestone Claim → pool releases (9/8)R → buys back gArc → burns
                                       → Claim Pool releases gArc to user

Check-in fees from non-claimers → continuously replenish pool deficit
(The real engine: dropout fees fund persister rewards)`}</Code>
        <H3>5.2 Mathematical Verification</H3>
        <P>In the extreme case where all users claim on the same day: pool withdrawal = (9/8) × 80% = 90% of total. Remaining 10% exactly equals Protocol Treasury (5%) + Partner Reserve (5%).</P>
        <InfoBox color="green">
          <strong>As long as anyone checks in, the system does not stop. The reward pool never reaches zero.</strong>
        </InfoBox>
        <H3>5.3 No Privileged Exits</H3>
        <P>The Protocol Treasury (5%) and Partner Reserve (5%) follow identical Claim logic. For the founding team to receive any value, they must go through the same milestone Claim process, triggering the same (9/8)x buyback-and-burn. No exceptions. No backdoors.</P>
      </Section>

      {/* VI. Onchain Identity */}
      <Section>
        <H2>VI. Onchain Identity: The Second Layer of Value</H2>
        <P>Every SBT (Soulbound Token) minted through a milestone Claim is an onchain proof of time. It records: you were here; how long you persisted; how many times you made it.</P>
        <P>SBTs cannot be transferred, forged, or purchased. They can only be earned through genuine consecutive check-in behavior.</P>
        <P>This makes GM Protocol the <strong>onchain reputation infrastructure</strong> for the Arc ecosystem: third-party contracts can query an address's highest milestone tier as a filtering criterion; DAO governance voting weight is bound in real time to current consecutive check-in days.</P>
      </Section>

      {/* VII. Identity Verification */}
      <Section>
        <H2>VII. Identity Verification: Aligned With Depth of Participation</H2>
        <P>GM Protocol believes that users who genuinely persist should face no unnecessary friction. Check-in is fully open — any address can begin from day one.</P>
        <P>As milestone depth increases, the system introduces authenticity verification at the Claim stage — matched naturally to the depth of participation. Verification methods are built on widely-adopted onchain and offchain identity infrastructure, carrying near-zero additional cost for genuine users.</P>
        <P>To ensure the long-term authentic sustainability of GM Protocol, we employ a rigorous identity verification strategy. The specific verification tiers and technical implementation will be fully disclosed through the contract code at the time of official launch.</P>
        <Quote>Genuine persistence has nothing to fear from any verification.</Quote>
      </Section>

      {/* VIII. Partner Ecosystem */}
      <Section>
        <H2>VIII. The Partner Ecosystem: Education-First Connections</H2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
          <InfoBox color="green">
            <div className="font-bold mb-2 text-green-300">Accepted Tasks</div>
            Video viewing, article reading, knowledge quizzes (1 question per session), onchain interaction verification — genuinely filtering users who understand the project.
          </InfoBox>
          <InfoBox color="gray">
            <div className="font-bold mb-2 text-red-400">Rejected Tasks</div>
            Retweets, follows, referrals, group joins — these only bring hollow traffic. We do not do that.
          </InfoBox>
        </div>
        <P>Completing any partner project's GM check-in is equivalent to completing the main GM check-in for the day. Consecutive day streaks are shared. Every partner Claim triggers the same (9/8)x buyback-and-burn — every partner project contributes to gArc's deflation.</P>
      </Section>

      {/* IX. DAO Governance */}
      <Section>
        <H2>IX. DAO Governance: Manipulation-Resistant Decentralization</H2>
        <H3>9.1 Voting Weight Design</H3>
        <Code>{`Voting Power = gArc Holdings × Consecutive Check-in Coefficient S

S values:
  0 days (not checking in): 0.1x
  1–29 days:                0.5x
  30–89 days:               1.0x (Bronze)
  90–179 days:              2.0x (Gold)
  180–364 days:             3.5x (Platinum)
  365+ days:                6.0x (Legend)

Attack simulation:
  Attacker holds 2.5B gArc (Day 1) → Voting Power = 2.5B × 0.5x = 1.25B
  Legend user holds 1M gArc (365d) → Voting Power = 1M × 6x = 6M
  Attacker has 2083x less voting efficiency per unit held than a Legend user`}</Code>
        <H3>9.2 Governance Evolution</H3>
        <Table
          headers={['Phase', 'Timeline', 'Description']}
          rows={[
            ['Phase 0–1', 'Testnet', 'Founder multisig; all decisions publicly disclosed'],
            ['Phase 2', 'Ecosystem Growth', 'Community voting introduced; founder retains emergency veto'],
            ['Phase 3', 'Post-Mainnet', 'Full DAO governance; founder participates as ordinary holder'],
            ['Phase 4', 'Long-term', 'Founder veto relinquished via time-lock, one right per year'],
          ]}
        />
      </Section>

      {/* X. A Personal Note */}
      <Section>
        <H2>X. A Personal Note</H2>
        <P>This project is built by one person.</P>
        <P>Not because I do not want a team, but because I believe a sufficiently clear idea can be realized from zero to one by a single person. Hayden Adams built Uniswap v1 alone. Andre Cronje wrote the core contracts of Yearn Finance in a matter of weeks, solo. Single-person protocol launches have precedent.</P>
        <P>But more importantly, I want the birth of this project to itself be proof of what it advocates:</P>
        <Quote><strong>Things of genuine value require genuine persistence.</strong></Quote>
        <P>I have not benefited from any pre-mine, private sale, or insider allocation. Every gArc the founding team earns comes through the exact same Claim path as any ordinary user. If I do not GM every day, I get nothing.</P>
        <InfoBox color="blue">
          <strong>The founder and users share the same rules. This is the most important design principle of this project.</strong>
        </InfoBox>
      </Section>

      {/* XI. Roadmap */}
      <Section>
        <H2>XI. Roadmap</H2>
        <Table
          headers={['Phase', 'Timeline', 'Milestone']}
          rows={[
            ['Phase 0', '2026 Q4', 'Contract development and testing, Arc Testnet deployment'],
            ['Phase 1', '2027 Q1', 'Mainnet launch, TGE, initial liquidity injection'],
            ['Phase 2', '2027 Q2–Q3', 'Partner project integration, identity verification layer'],
            ['Phase 3', '2027 Q4', 'DAO governance live, founder begins handover'],
            ['Phase 4', '2028+', 'Ecosystem expansion, identity infrastructure open to Arc ecosystem'],
          ]}
        />
      </Section>

      {/* Closing */}
      <Section>
        <H2>Closing</H2>
        <P>GM Protocol is not a project about USDC. It is not a project about token prices.</P>
        <P>It is a project about <strong>persistence</strong>.</P>
        <P>In this world, saying GM every day and acting on it leaves an immutable mark onchain. The longer you persist, the greater the value you accumulate, the more recognition you earn.</P>
        <P>And those who leave midway have not lost anything. Their departure becomes the foundation upon which those who remain are rewarded.</P>
        <P>This is a truly fair system: every person's choice produces its corresponding consequence, completely transparently.</P>
        <div className="text-center mt-10 text-3xl font-black text-blue-400 tracking-widest">GM.</div>
      </Section>
    </div>
  )
}

export default function Whitepaper() {
  const [lang, setLang] = useState<Lang>('zh')

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Language Switcher */}
      <div className="sticky top-12 z-40 bg-gray-950/95 border-b border-gray-800 flex items-center gap-3 px-6 py-2">
        <span className="text-gray-500 text-xs">Language:</span>
        <button
          onClick={() => setLang('zh')}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${lang === 'zh' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
        >
          中文
        </button>
        <button
          onClick={() => setLang('en')}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${lang === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
        >
          English
        </button>
        <span className="ml-auto text-gray-600 text-xs">GM Protocol Whitepaper v1.0</span>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {lang === 'zh' ? <ZH /> : <EN />}

        {/* Footer */}
        <div className="border-t border-gray-800 pt-6 mt-10 text-center text-gray-600 text-xs">
          <p>GM Protocol Whitepaper v1.0 | October 2026</p>
          <p className="mt-1">All parameters subject to adjustment based on testnet data.</p>
          <p className="mt-1">The next version will be updated following mainnet launch.</p>
        </div>
      </div>
    </div>
  )
}
