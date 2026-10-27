import { useState } from 'react'
import {
  PoolAllocationChart,
  ReleaseRateChart,
  DeflationCurveChart,
  ClaimFlowChart,
  QuarterlyInjectionChart,
  VotingPowerChart,
  ROIComparisonChart,
  RewardHeatmapChart,
} from './EconomicsCharts'

// ── 工具组件 ─────────────────────────────────────────────────────────────────
function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-xl font-bold text-white border-b border-gray-700 pb-2 mb-4">{title}</h2>
      {children}
    </section>
  )
}
function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-base font-semibold text-blue-300 mb-3">{title}</h3>
      {children}
    </div>
  )
}
function Sub2({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h4 className="text-sm font-semibold text-gray-300 mb-2">{title}</h4>
      {children}
    </div>
  )
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-300 text-sm leading-relaxed mb-2">{children}</p>
}
function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-gray-800 rounded-lg p-3 text-xs text-green-300 overflow-x-auto mb-3 whitespace-pre-wrap">
      {children}
    </pre>
  )
}
function Table({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-800">
            {headers.map((h, i) => (
              <th key={i} className="text-left text-gray-300 font-medium px-3 py-2 border border-gray-700">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-850'}>
              {row.map((cell, j) => (
                <td key={j} className="text-gray-300 px-3 py-2 border border-gray-700">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
function ChartBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="my-4 border border-blue-900 rounded-xl overflow-hidden">
      <div className="bg-blue-950 px-4 py-1.5 text-xs text-blue-300 font-medium">📊 {label}</div>
      {children}
    </div>
  )
}
function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${color}`}>{children}</span>
  )
}

// ── 目录 ─────────────────────────────────────────────────────────────────────
const TOC = [
  { id: 's1',  label: '1. 项目概述' },
  { id: 's2',  label: '2. 核心问题与解决方案' },
  { id: 's3',  label: '3. 产品设计' },
  { id: 's4',  label: '4. 经济学模型' },
  { id: 's5',  label: '5. gArc 代币经济学' },
  { id: 's6',  label: '6. 技术架构' },
  { id: 's65', label: '6.5 DAO 治理规则' },
  { id: 's7',  label: '7. 安全设计' },
  { id: 's8',  label: '8. 路线图' },
  { id: 's9',  label: '9. 团队与资金' },
  { id: 's10', label: '10. 风险分析' },
  { id: 's11', label: '11. 附录' },
]

// ── 主页面 ────────────────────────────────────────────────────────────────────
export default function ProjectPlan() {
  const [tocOpen, setTocOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* 顶部标题栏 */}
      <div className="sticky top-0 z-30 bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div>
          <span className="font-bold text-white text-sm">GM Protocol</span>
          <span className="ml-2 text-gray-400 text-xs">项目计划书 v0.6</span>
          <span className="ml-2 text-xs px-1.5 py-0.5 bg-yellow-900 text-yellow-300 rounded">内部草稿</span>
        </div>
        <button onClick={() => setTocOpen(!tocOpen)}
          className="text-xs text-gray-300 bg-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-700">
          目录 {tocOpen ? '▲' : '▼'}
        </button>
      </div>

      {/* 浮动目录 */}
      {tocOpen && (
        <div className="sticky top-12 z-20 bg-gray-900 border-b border-gray-700 px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {TOC.map(t => (
              <a key={t.id} href={`#${t.id}`} onClick={() => setTocOpen(false)}
                className="text-xs text-blue-400 hover:text-blue-300 bg-gray-800 px-2 py-1 rounded">
                {t.label}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        {/* 封面 */}
        <div className="text-center py-8 border border-gray-700 rounded-2xl bg-gray-900">
          <div className="text-4xl mb-3">🌅</div>
          <h1 className="text-3xl font-bold text-white mb-2">GM Protocol</h1>
          <p className="text-gray-400 text-sm mb-4">基于 Arc Network 的链上每日签到身份系统与可持续代币经济协议</p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Badge color="bg-blue-900 text-blue-300">v0.6 草稿</Badge>
            <Badge color="bg-gray-800 text-gray-300">2026年10月</Badge>
            <Badge color="bg-yellow-900 text-yellow-300">内部讨论版</Badge>
            <Badge color="bg-green-900 text-green-300">Arc Testnet</Badge>
          </div>
        </div>

        {/* 1. 项目概述 */}
        <Section id="s1" title="1. 项目概述">
          <Sub title="1.1 项目定位">
            <P>GM Protocol 是部署在 Arc Network 上的链上每日签到身份系统，同时也是 Arc 生态的链上信誉基础设施层。</P>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                <div className="text-blue-400 font-semibold text-sm mb-1">表层价值</div>
                <p className="text-gray-300 text-xs">每日 GM 签到的参与激励系统，用户通过连续签到积累里程碑，获得 gArc 代币奖励</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                <div className="text-purple-400 font-semibold text-sm mb-1">底层价值</div>
                <p className="text-gray-300 text-xs">基于时间加权的链上身份证明系统，连续签到记录 + 多层身份验证 = Arc 生态的真实用户身份凭证</p>
              </div>
            </div>
          </Sub>
          <Sub title="1.2 核心差异化">
            <Table
              headers={['维度', '同类项目', 'GM Protocol']}
              rows={[
                ['经济模型', '纯补贴，无自循环', 'GM 池自然流入，永续可持续'],
                ['激励来源', '项目方单向投入', '断签用户补贴坚持用户'],
                ['身份价值', '无', '时间加权链上身份凭证'],
                ['防女巫机制', '弱或无', '多层递进式验证'],
                ['代币经济', '纯通胀', '铸造100亿立即销毁2.1亿，有效97.9亿，通缩至底线2.1亿'],
                ['透明度', '部分链上', '最大限度链上实现（约 85-90%）'],
              ]}
            />
          </Sub>
          <Sub title="1.3 核心理念">
            <div className="bg-blue-950 border border-blue-800 rounded-xl p-4 text-blue-200 text-sm italic">
              "通过坚持签到证明你是真实存在的 Arc 用户，通过时间积累建立链上信誉，通过经济激励让坚持变得有价值。"
            </div>
          </Sub>
        </Section>

        {/* 2. 核心问题与解决方案 */}
        <Section id="s2" title="2. 核心问题与解决方案">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {[
              { title: '问题一：链上身份识别', desc: 'Arc 生态缺乏原生真实用户识别机制。空投、治理、合作项目无法有效区分真实用户和女巫地址。' },
              { title: '问题二：用户留存激励', desc: '大多数 Web3 激励系统依赖一次性空投，用户获得奖励后即离开，缺乏长期参与的经济激励。' },
              { title: '问题三：可持续代币经济', desc: '绝大多数项目代币依赖持续外部资金补贴，一旦资金耗尽系统崩溃，无法自循环。' },
            ].map((p, i) => (
              <div key={i} className="bg-red-950 border border-red-800 rounded-xl p-4">
                <div className="text-red-300 font-semibold text-xs mb-2">{p.title}</div>
                <p className="text-red-200 text-xs">{p.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-green-950 border border-green-800 rounded-xl p-4">
            <div className="text-green-300 font-semibold text-sm mb-2">核心洞察</div>
            <P>连续签到系统的经济本质是"断签用户的资金补贴坚持用户"。这是一个天然自循环的经济模型，不需要持续外部资金注入即可永续运行。</P>
          </div>
        </Section>

        {/* 3. 产品设计 */}
        <Section id="s3" title="3. 产品设计">
          <Sub title="3.1 基础签到机制">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
              {[
                { label: '签到费用', value: '0.1 USDC', sub: '可治理调整' },
                { label: '刷新时间', value: 'UTC 00:00', sub: '每日固定刷新' },
                { label: '有效窗口', value: '24小时', sub: '00:00 — 23:59' },
                { label: '链上程度', value: '100%', sub: '永久可查' },
              ].map((item, i) => (
                <div key={i} className="bg-gray-900 rounded-xl p-3 text-center border border-gray-700">
                  <div className="text-gray-400 text-xs mb-1">{item.label}</div>
                  <div className="text-white font-bold text-sm">{item.value}</div>
                  <div className="text-gray-500 text-xs">{item.sub}</div>
                </div>
              ))}
            </div>
          </Sub>

          <Sub title="3.2 里程碑体系">
            <Table
              headers={['里程碑', '连续天数 D', '徽章等级', '奖励池释放比例 r']}
              rows={[
                ['铜牌', '30 天', 'Bronze SBT', '1.5%（0.015）'],
                ['黄金', '90 天', 'Gold SBT', '10%（0.10）'],
                ['铂金', '180 天', 'Platinum SBT', '15%（0.15）'],
                ['传奇', '365 天', 'Legend SBT', '18%（0.18）'],
              ]}
            />
            <P>每个里程碑可重复触发，同一天达成者按人数均分当期释放比例。每日 UTC 00:00 快照，次日开放 Claim。</P>
          </Sub>

          <Sub title="3.3 SBT 徽章（灵魂绑定代币）">
            <P>每个里程碑铸造对应等级 SBT，不可转让。SBT 记录达成时间、连续天数、第几轮达成，同时作为 DAO 治理的资格凭证，以及对外提供的链上身份查询接口。</P>
          </Sub>

          <Sub title="3.5 身份验证分层体系">
            <Table
              headers={['层级', '触发时机', '验证要求', '女巫攻击成本']}
              rows={[
                ['第零层', '首次签到', 'Human Passport Models API 后台扫描', '接近零（欢迎贡献资金池）'],
                ['第一层', '铜牌 Claim', 'Gitcoin Passport Stamps ≥ 20 分', '低~中（需养多平台账号）'],
                ['第二层', '黄金/铂金 Claim', 'Stamps ≥ 20 + ZKPassport（或 Stamps ≥ 35）', '高（需真实护照）'],
                ['第三层', '传奇 Claim', '第二层 + 双交易所 KYC', '极高（双重真实 KYC）'],
              ]}
            />
          </Sub>
        </Section>

        {/* 4. 经济学模型 */}
        <Section id="s4" title="4. 经济学模型">
          <Sub title="4.1 GM 资金池分配">
            <P>每次签到 f = 0.1 USDC 按以下比例分配：</P>
            <Table
              headers={['用途', '比例', '说明']}
              rows={[
                ['里程碑奖励池', '80%', '用于里程碑 Claim 奖励'],
                ['储备金库', '10%', '伴随每次 Claim 按 (9/8) 倍额外回购 gArc 销毁'],
                ['协议金库', '5%', '创始人/团队分配渠道，锁仓后 Claim'],
                ['合作项目预留', '5%', '合作方接入奖励渠道，Claim 时同步触发回购销毁'],
              ]}
            />
            <div className="bg-yellow-950 border border-yellow-800 rounded-lg p-3 text-yellow-200 text-xs mb-3">
              核心验证：奖励池（80%）+ 储备金库（10%）= 90% = (9/8) × 80%，完全自洽。
            </div>
            <ChartBlock label="GM 资金池分配比例">
              <PoolAllocationChart />
            </ChartBlock>
          </Sub>

          <Sub title="4.2 回购销毁机制（核心）">
            <P>每次里程碑 Claim 发生时，同步触发储备金库回购销毁。所有 USDC 出口都必须经过 (9/8) 回购销毁才能兑现，没有例外。</P>
            <Code>{`设单人应得奖励为 R（USDC），则：
① 奖励池扣除 = (9/8) × R = 1.125R
② 主回购      = R USDC → AMM 买入 gArc → 销毁
③ 额外回购    = (1/8) × R USDC → 来自储备金库 → AMM 买入 gArc → 销毁
④ 用户获得    = R / Pg 枚 gArc（来自 Claim 池，1:1 等量释放）
⑤ 单人总销毁  = (9/8) × R / Pg 枚 gArc`}</Code>
            <ChartBlock label="C.3 单次 Claim 资金流向">
              <ClaimFlowChart />
            </ChartBlock>
          </Sub>

          <Sub title="4.3 可持续性验证（基准场景）">
            {/* 模型假设说明 */}
            <div className="bg-blue-950 border border-blue-800 rounded-lg p-3 mb-3 space-y-1">
              <div className="text-blue-300 text-xs font-semibold mb-1">📋 模型假设（冷启动基准参数）</div>
              <div className="text-blue-200 text-xs space-y-0.5">
                <div>· Arc Network DAU = 44,944（2026年实测数据）</div>
                <div>· 真实用户率 = 10%（排除机器人后约 4,500 人）</div>
                <div>· 签到渗透率 = 10%（约 450 人参与，冷启动保守估计）</div>
                <div>· 用户分层：C1 坚持型 10%（45人）/ C2 目标型 25%（112人）/ C3 流失型 65%（293人）</div>
                <div>· C3 断签率参照行业数据：30天约 63-78%，180天约 91-98%</div>
                <div>· 零外部资金注入，系统自然流入</div>
              </div>
            </div>
            <P>基于以上假设，5 年奖励池预测：</P>
            <Table
              headers={['年份', '奖励池余额', '储备金库余额', '累计销毁USDC']}
              rows={[
                ['第1年', '2,284 USDC', '286 USDC', '251 USDC'],
                ['第3年', '3,056 USDC', '382 USDC', '974 USDC'],
                ['第5年', '3,246 USDC', '406 USDC', '1,769 USDC'],
              ]}
            />
            <P>奖励池在第3年后趋于稳态（约 3,200 USDC），永不归零。</P>
            {/* 敏感性说明 */}
            <div className="bg-yellow-950 border border-yellow-800 rounded-lg p-3 text-yellow-200 text-xs space-y-1">
              <div className="font-semibold mb-1">⚡ 重要：参数敏感性说明</div>
              <div>以上预测基于冷启动保守估计（450人参与）。实际数据对奖励池影响是线性的：</div>
              <div className="mt-1 space-y-0.5 font-mono">
                <div>参与人数 × 2（900人）→ 奖励池稳态约 6,500 USDC，约 2×</div>
                <div>参与人数 × 5（2,250人）→ 奖励池稳态约 16,200 USDC，约 5×</div>
                <div>参与人数 × 10（4,500人）→ 奖励池稳态约 32,400 USDC，约 10×</div>
              </div>
              <div className="mt-1">一旦项目热度超预期，稳态奖励池与当前预估的偏差可达数倍至数十倍。所有冷启动数字仅为最低基准，不代表实际运行结果。</div>
            </div>
          </Sub>

          <Sub title="4.4 里程碑收益分析">
            {/* 冷启动数据说明 */}
            <div className="bg-orange-950 border border-orange-800 rounded-lg p-3 text-orange-200 text-xs mb-3 space-y-1">
              <div className="font-semibold">⚠️ 冷启动数据说明</div>
              <div>以下数字基于以下三个预估值计算，实际结果与预估偏差可能极大：</div>
              <div className="mt-1 space-y-0.5">
                <div>· <span className="font-semibold">P = 3,246 USDC</span>：冷启动保守稳态（450人参与，零外部注入，第5年收敛值）</div>
                <div>· <span className="font-semibold">N = 79/54/48/46 人</span>：各里程碑预估达成人数（基于 C1/C2/C3 断签率模型）</div>
                <div>· <span className="font-semibold">f = 0.1 USDC</span>：当前签到费（DAO 可调整）</div>
              </div>
              <div className="mt-1 border-t border-orange-800 pt-1">
                以下为纯 USDC 层面收益，不含 gArc 持有增值。真实激励 = USDC 奖励 + gArc 价格增值（通缩机制驱动）。
              </div>
            </div>
            <Table
              headers={['里程碑', 'r', 'N（预估）', 'R（预估）', '签到成本 D×f', '纯USDC收益率']}
              rows={[
                ['铜牌 30天', '1.5%', '79人 ⚠️', '0.09 USDC ⚠️', '3 USDC', '-97% ⚠️'],
                ['黄金 90天', '10%', '54人 ⚠️', '6.01 USDC ⚠️', '9 USDC', '-33% ⚠️'],
                ['铂金 180天', '15%', '48人 ⚠️', '10.14 USDC ⚠️', '18 USDC', '-44% ⚠️'],
                ['传奇 365天', '18%', '46人 ⚠️', '12.70 USDC ⚠️', '36.5 USDC', '-65% ⚠️'],
              ]}
            />
            {/* 实际偏差说明 */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-300 text-xs mb-3 space-y-1">
              <div className="text-white font-semibold mb-1">实际运行中数据如何变化</div>
              <div>R 的公式是 <span className="text-green-300 font-mono">R = P × r / N</span>，P 和 N 都是动态变量：</div>
              <div className="mt-1 space-y-0.5">
                <div>· P 越大（更多用户参与/热启动注入），R 越大，收益率越高</div>
                <div>· N 越小（同期达成里程碑的人越少），R 越大，每人分得越多</div>
                <div>· 极端情况：P = 32,400 USDC，N = 10 人达成黄金 → R = 324 USDC，是签到成本的 36 倍</div>
                <div>· 冷启动负收益不是风险，是<span className="text-yellow-300">设计意图</span>——铜牌门槛低、人多、释放少，意在筛选真实用户而非套利者</div>
              </div>
            </div>
            <P>热启动正向收益门槛公式：P_min = D × f × N / r。注入奖励池 ≥ 16,000 USDC，四个里程碑首轮均可实现正向 USDC 收益。</P>
            <ChartBlock label="D. 里程碑收益率对照（冷启动 vs 热启动，均为预估值）">
              <ROIComparisonChart />
            </ChartBlock>
          </Sub>
        </Section>

        {/* 5. gArc 代币经济学 */}
        <Section id="s5" title="5. gArc 代币经济学">
          <Sub title="5.1 基本参数">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
              {[
                { label: '铸造总量', value: '100 亿枚' },
                { label: '初期销毁', value: '2.1 亿枚' },
                { label: '有效流通上限', value: '97.9 亿枚' },
                { label: '通缩目标', value: '底线 2.1 亿枚' },
                { label: '目标时间', value: '2032年' },
                { label: '参照锚点', value: 'BTC 95.24%' },
              ].map((item, i) => (
                <div key={i} className="bg-gray-900 rounded-xl p-3 border border-gray-700 text-center">
                  <div className="text-gray-400 text-xs mb-1">{item.label}</div>
                  <div className="text-white font-bold text-sm">{item.value}</div>
                </div>
              ))}
            </div>
          </Sub>

          <Sub title="5.2 代币分配">
            <Code>{`铸造总量：100亿
立即销毁：-2.1亿（部署第一天，链上不可逆）
─────────────────
有效流通：97.9亿 = 47.9亿（Claim池）
                + 50亿（初始流动性）

终态：Claim池耗尽后，LP 剩余 = 50亿 - 47.9亿 = 2.1亿（永久底线）
其中：L = 2.1亿 + 47.9亿 × (10/9) = 50亿（方程自然解）`}</Code>
            <Table
              headers={['用途', '铸造比例', '数量（亿）', '说明']}
              rows={[
                ['初始流动性', '50%', '50', 'TGE 一次性注入 AMM，测试网暂保留权限'],
                ['Claim 池（桥梁）', '47.9%', '47.9', '所有渠道 gArc 的来源，纯桥梁'],
                ['初期立即销毁', '2.1%', '2.1', '部署第一天链上销毁，保证经济学自洽'],
              ]}
            />
          </Sub>

          <Sub title="5.4 通缩曲线">
            <P>采用反向二次曲线，前端重载，后期放缓，与 BTC 减半的经济叙事结构一致：</P>
            <Code>{`累计销毁比例：C(t) = 1 - (1 - t/6)²     t ∈ [0, 6]
年销毁率：    d(t) = (13 - 2t) / 36          t = 1, 2, ..., 6`}</Code>
            <ChartBlock label="C.6 gArc 通缩曲线（反向二次函数，对比 BTC）">
              <DeflationCurveChart />
            </ChartBlock>
          </Sub>

          <Sub title="5.5 初始资金分配">
            <Code>{`G = F × 74.5%（注入 GM 池，按季分批）
L = F × 25.5%（注入初始流动性）

示例（F=10,000 USDC）：
G = 7,450 USDC  L = 2,550 USDC`}</Code>
          </Sub>

          <Sub title="5.6 分批注入机制（DAO 治理）">
            <Code>{`Q(q) = G × (49 - 2q) / 576     q = 1, 2, ..., 24

示例（G=7,450 USDC）：
Q(1)  = 607.8 USDC  Q(12) = 323.2 USDC  Q(24) = 12.9 USDC`}</Code>
            <ChartBlock label="C.8 季度注入量（24季度，G=7,450 USDC）">
              <QuarterlyInjectionChart />
            </ChartBlock>
          </Sub>
        </Section>

        {/* 6. 技术架构 */}
        <Section id="s6" title="6. 技术架构">
          <Sub title="6.1 合约体系">
            <Table
              headers={['合约', '功能', '链上程度']}
              rows={[
                ['GMToken (gArc)', 'ERC-20，固定总量，只能 burn', '100%'],
                ['GMCheckIn', '签到逻辑，UTC每日刷新，费用收取，资金池分配', '100%'],
                ['GMMilestone', '里程碑记录，SBT 铸造，Claim 计算', '100%'],
                ['GMRewardPool', '里程碑奖励池管理，快照，分发', '100%'],
                ['GMReserve', '储备金库，回购触发，销毁执行', '100%'],
                ['GMClaimBridge', 'Claim 池管理，gArc 释放桥梁', '100%'],
                ['GMPartner', '合作项目注册，独立奖励池，里程碑，验证接口', '100%'],
                ['GMIdentity', '身份验证集成（Passport/ZKPassport）', '验证链上，证明生成链下'],
                ['GMGovernance', 'DAO 投票，季度注入提案，投票权重计算', '100%'],
              ]}
            />
          </Sub>
          <Sub title="6.4 前端架构">
            <P>技术栈：React + TypeScript + Vite + wagmi + ConnectKit，部署在 Arc Testnet（测试）→ Arc Mainnet（正式）。</P>
            <Table
              headers={['优先级', '页面', '核心功能']}
              rows={[
                ['P0', 'GM 签到主页', '连接钱包，一键签到，里程碑进度条，合作任务入口'],
                ['P0', '协议数据仪表盘', '奖励池状态，通缩进度，里程碑分布，回购记录'],
                ['P1', '个人档案页', 'SBT 陈列柜，签到热力图，身份层级，历史时间线'],
                ['P2', '合作项目页', '当日任务卡片，独立奖励池余额，贡献主池数据'],
                ['P2', '经济学模型展示页', '通缩曲线，资金桑基图，5年预测，BTC对照'],
              ]}
            />
          </Sub>
        </Section>

        {/* 6.5 DAO 治理 */}
        <Section id="s65" title="6.5 DAO 治理规则">
          <Sub title="6.5.2 投票权重模型">
            <Code>{`V = H × S

H = 地址持有的 gArc 数量（枚）
S = 连续签到系数（见下表）`}</Code>
            <Table
              headers={['当前连续签到天数', '系数 S']}
              rows={[
                ['0天（未签到）', '0.1x'],
                ['1-29天', '0.5x'],
                ['30-89天（铜牌级）', '1x'],
                ['90-179天（黄金级）', '2x'],
                ['180-364天（铂金级）', '3.5x'],
                ['365天+（传奇级）', '6x'],
              ]}
            />
            <P>断签后系数立即衰减，无法囤积历史投票权。</P>
            <ChartBlock label="C.9 DAO 投票权 V = H × S（连续签到系数的放大效果）">
              <VotingPowerChart />
            </ChartBlock>
          </Sub>

          <Sub title="6.5.3 50% 攻击三层防御">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { layer: '第一层', title: 'SBT + 实时连续签到加权', desc: '高级 SBT 需连续签到 90-365 天，断签后投票权立即衰减至低值。女巫行为链上关联检测，任何人可提交证明，DAO 确认后降权至 0.1x。' },
                { layer: '第二层', title: '连续签到系数（替代锁仓）', desc: '买入即用仅 0.5x；需连续签到 365 天才能达到 6x 满额。真实用户自然积累，攻击者时间成本极高。无需锁仓，不劝退参与者。' },
                { layer: '第三层', title: '时间锁', desc: '普通提案 24h，资金类 72h，核心参数 7天。时间锁期间社区可触发创始人多签紧急暂停，给社区足够反应时间。' },
              ].map((item, i) => (
                <div key={i} className="bg-gray-900 rounded-xl p-4 border border-blue-900">
                  <Badge color="bg-blue-900 text-blue-300">{item.layer}</Badge>
                  <div className="text-white font-semibold text-sm mt-2 mb-1">{item.title}</div>
                  <p className="text-gray-400 text-xs">{item.desc}</p>
                </div>
              ))}
            </div>
          </Sub>

          <Sub title="6.5.4 提案机制">
            <Table
              headers={['项目', '规则']}
              rows={[
                ['发起资格', '持有铜牌及以上 SBT（当前连续签到中）'],
                ['提案质押', '100 gArc（通过退还，不通过销毁）'],
                ['通过门槛', '普通 50%+1；重大参数 67%；核心合约 75%'],
                ['最低参与率', '总投票权 5%（低于此延期重投）'],
              ]}
            />
          </Sub>
        </Section>

        {/* 7. 安全设计 */}
        <Section id="s7" title="7. 安全设计">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { title: '女巫防御', items: ['多层递进式验证（见 3.5）', '真人零成本/低成本', '女巫高成本或不可能'] },
              { title: 'MEV 防御', items: ['三层触发架构（见 4.2）', '回购时间不可预测', '回购金额随机 10-30%', '0.5% 滑点保护', '30 分钟冷却期'] },
              { title: '合约安全', items: ['无升级代理（完全不可更改）', '所有资金操作有时间锁', '关键参数变更需 DAO 投票', '开源社区审计 + 正式专业审计', '无管理员私钥持有资金'] },
              { title: '经济安全', items: ['奖励池百分比制，永不归零', '储备金库余额始终大于支出', '签到费本身即系统收入', 'gArc 价格下跌时回购反而加强'] },
            ].map((item, i) => (
              <div key={i} className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                <div className="text-green-400 font-semibold text-sm mb-2">{item.title}</div>
                <ul className="space-y-1">
                  {item.items.map((it, j) => (
                    <li key={j} className="text-gray-300 text-xs flex items-start gap-1">
                      <span className="text-green-500 mt-0.5">·</span>{it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        {/* 8. 路线图 */}
        <Section id="s8" title="8. 路线图">
          {[
            { phase: 'Phase 0', time: '2026 Q4（当前）', title: '设计与测试', done: ['经济学模型设计完成', 'GM 池参数确定', 'gArc 代币经济学确定', 'DAO 治理规则确定', '技术架构规划完成'], todo: ['合约开发（GMCheckIn + GMToken + GMRewardPool）', 'Arc Testnet 部署', '基础前端上线'] },
            { phase: 'Phase 1', time: '2027 Q1', title: '测试网完整版', done: [], todo: ['全合约体系部署', '身份验证集成（Human Passport）', '数据透明度前端完成', '社区内测（目标 100 真实测试用户）'] },
            { phase: 'Phase 2', time: '2027 Q2', title: '生态建设', done: [], todo: ['第一批合作项目接入（目标 3-5 个）', 'ZKPassport 集成', 'DAO 治理合约上线', 'Arc 官方接洽', '初始融资完成'] },
            { phase: 'Phase 3', time: '2027 Q3', title: '主网上线', done: [], todo: ['TGE（Token Generation Event）', '流动性注入（F × 25.5%，权限丢弃）', 'GM 池首季度注入（G × 8.16%）', '主网正式运营'] },
          ].map((item, i) => (
            <div key={i} className="flex gap-4 mb-6">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">{i + 1}</div>
                {i < 3 && <div className="w-0.5 flex-1 bg-gray-700 mt-2" />}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-blue-400 font-bold text-sm">{item.phase}</span>
                  <span className="text-gray-400 text-xs">{item.time}</span>
                  <Badge color={i === 0 ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-400'}>{item.title}</Badge>
                </div>
                <ul className="space-y-1">
                  {item.done.map((d, j) => (
                    <li key={j} className="text-gray-400 text-xs flex items-start gap-1">
                      <span className="text-green-500">✓</span>{d}
                    </li>
                  ))}
                  {item.todo.map((d, j) => (
                    <li key={j} className="text-gray-500 text-xs flex items-start gap-1">
                      <span className="text-gray-600">○</span>{d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </Section>

        {/* 9. 团队与资金 */}
        <Section id="s9" title="9. 团队与资金">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
              <div className="text-white font-semibold text-sm mb-2">最坏场景（零外部融资）</div>
              <P>技术成本接近零（时间成本为主），个人注入少量初始流动性启动，系统经济学自循环，无需持续外部注入。</P>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
              <div className="text-white font-semibold text-sm mb-2">理想场景（获得融资）</div>
              <P>目标：初始流动性（F × 25.5%）+ GM 池启动资金（F × 74.5%）。热启动奖励池注入 ≥ 16,000 USDC，四档里程碑首轮均可实现正向 USDC 收益。</P>
            </div>
          </div>
        </Section>

        {/* 10. 风险分析 */}
        <Section id="s10" title="10. 风险分析">
          <Sub title="技术风险">
            <Table
              headers={['风险', '等级', '缓解措施']}
              rows={[
                ['合约漏洞', '高', '开源审计，社区审查，无升级代理降低攻击面'],
                ['MEV 攻击', '中', '三层回购架构，0.5% 滑点保护'],
                ['Arc 上无可用 DEX', '中', '自建简单 AMM 或等待生态成熟'],
                ['Chainlink 在 Arc 不可用', '低', '项目方 Bot 保底，用户触发备用'],
              ]}
            />
          </Sub>
          <Sub title="经济风险">
            <Table
              headers={['风险', '等级', '缓解措施']}
              rows={[
                ['用户参与度不足', '中', '经济学设计单人可持续，零用户也不崩溃'],
                ['gArc 价格持续下跌', '中', 'USDC 锚定回购反而加速通缩，形成价格支撑'],
                ['女巫大规模攻击', '中', '多层验证递增成本，铜牌阶段欢迎女巫（贡献资金池）'],
                ['奖励吸引力不足', '低', '冷启动收益为负是设计意图，热启动和gArc增值是真实激励'],
              ]}
            />
          </Sub>
        </Section>

        {/* 11. 附录 */}
        <Section id="s11" title="11. 附录">
          <Sub title="A. 核心参数汇总">
            <Table
              headers={['参数', '数值']}
              rows={[
                ['签到费', '0.1 USDC（可治理调整）'],
                ['签到刷新时间', '每日 UTC 00:00'],
                ['GM 池分配', '80% 奖励池 / 10% 储备 / 5% 协议 / 5% 合作'],
                ['回购销毁公式', '奖励池扣除 = (9/8)×R，总销毁 = (9/8)×R/Pg'],
                ['gArc 铸造总量', '100 亿枚（一次性全量铸造，永不增发）'],
                ['初期销毁', '2.1 亿枚（部署第一天链上销毁，TX 可查）'],
                ['有效流通上限', '97.9 亿枚（50亿LP + 47.9亿Claim池）'],
                ['通缩曲线', 'C(t)=1-(1-t/6)²，d(t)=(13-2t)/36'],
                ['通缩目标', '2032年流通量约 2.11 亿枚'],
                ['初始资金分配', 'G=F×74.5% / L=F×25.5%'],
                ['季度注入公式', 'Q(q) = G × (49-2q) / 576'],
                ['热启动收益阈值', '奖励池 ≥ 16,000 USDC'],
                ['DAO 投票权公式', 'V = H × S（连续签到系数）'],
              ]}
            />
          </Sub>

          <Sub title="B. 变量符号统一定义">
            <Table
              headers={['符号', '含义', '单位']}
              rows={[
                ['f', '单次签到费用', 'USDC'],
                ['U', '当日签到总人数', '人'],
                ['P', '奖励池当前余额', 'USDC'],
                ['r', '里程碑释放比例（小数形式）', '—'],
                ['N', '当日达成该里程碑人数', '人'],
                ['R', '单人应得奖励', 'USDC'],
                ['D', '里程碑所需连续天数', '天'],
                ['Pg', 'gArc 当前市场价格', 'USDC/枚'],
                ['F', '总融资金额', 'USDC'],
                ['G', '融资中注入 GM 池部分', 'USDC'],
                ['L', '融资中注入流动性部分', 'USDC'],
                ['t', '年份序号（从1开始，共6年）', '年'],
                ['q', '季度序号（从1开始，共24季）', '季度'],
                ['C(t)', '第t年末累计销毁比例', '—'],
                ['d(t)', '第t年年销毁率', '—'],
                ['Q(q)', '第q季度 GM 池注入量', 'USDC'],
                ['V', '地址投票权重', '票'],
                ['S', '连续签到系数', '倍数'],
              ]}
            />
          </Sub>

          <Sub title="C. 完整公式体系（含图表）">
            <Sub2 title="C.2 里程碑单人奖励公式">
              <Code>{`R = P × r / N

示例（P=3,246 USDC，黄金 r=10%，N=54人）：
R = 3,246 × 0.10 / 54 = 6.01 USDC`}</Code>
              <ChartBlock label="C.2 单人奖励 R = P × r / N（热力图）">
                <RewardHeatmapChart />
              </ChartBlock>
            </Sub2>

            <Sub2 title="C.3 完整 Claim 销毁公式（核心）">
              <Code>{`① 奖励池扣除总量  = (9/8) × R = 1.125R
② 主回购金额      = R          （从 AMM 买入 gArc 并销毁）
③ 额外回购金额    = (1/8) × R  （来自储备金库，同步回购销毁）
④ 用户获得 gArc   = R / Pg     （来自 Claim 池，等量释放）
⑤ 总销毁 gArc     = (9/8) × R / Pg

示例（R=6.01 USDC，Pg=0.00002 USDC/枚）：
奖励池扣除  = 1.125 × 6.01 = 6.76 USDC
主回购销毁  = 6.01 / 0.00002 = 300,500 枚 gArc
额外回购销毁= (6.01/8) / 0.00002 = 37,563 枚 gArc
用户获得    = 300,500 枚 gArc（来自 Claim 池）
单人总销毁  = 338,063 枚 gArc`}</Code>
            </Sub2>

            <Sub2 title="C.5 里程碑释放比例曲线（反向三次函数趋势）">
              <Code>{`锚点离散值：
  x=30,  r=1.5%  （铜牌）
  x=90,  r=10%   （黄金，斜率最大）
  x=180, r=15%   （铂金）
  x=365, r=18%   （传奇）`}</Code>
              <ChartBlock label="C.5 里程碑释放比例曲线">
                <ReleaseRateChart />
              </ChartBlock>
            </Sub2>

            <Sub2 title="C.6 通缩累计曲线（反向二次函数）">
              <Code>{`C(t) = 1 - (1 - t/6)²     t ∈ [0, 6]
d(t) = (13 - 2t) / 36       t = 1, 2, ..., 6

示例（t=1，第一年）：
C(1) = 1 - (5/6)² = 11/36 ≈ 30.56%
d(1) = (13-2) / 36 = 11/36 ≈ 30.56%
年销毁量 = 47.9亿 × 30.56% ≈ 14.64亿枚`}</Code>
            </Sub2>

            <Sub2 title="C.8 季度注入量公式">
              <Code>{`Q(q) = G × (49 - 2q) / 576     q = 1, 2, ..., 24

示例（G=7,450 USDC）：
Q(1)  = 7,450 × 47/576 = 607.8 USDC  （第1季度，最大）
Q(12) = 7,450 × 25/576 = 323.2 USDC  （第3年Q4）
Q(24) = 7,450 × 1/576  = 12.9 USDC   （第6年Q4，最小）`}</Code>
            </Sub2>

            <Sub2 title="C.9 DAO 投票权公式">
              <Code>{`V = H × S

示例（持有 100万 gArc，连续签到 91 天，S=2x）：
V = 1,000,000 × 2 = 2,000,000 票

对比攻击者（持有 25亿 gArc，第 1 天，S=0.5x）：
V = 2,500,000,000 × 0.5 = 1,250,000,000 票
（需持续签到 365 天才能满额，期间完全透明可追踪）`}</Code>
            </Sub2>
          </Sub>

          <Sub title="D. 里程碑收益率对照（冷启动稳态）">
            <div className="bg-blue-950 border border-blue-800 rounded-lg p-3 text-blue-200 text-xs mb-3 space-y-1">
              <div className="font-semibold text-blue-300">📋 预估参数基准（冷启动）</div>
              <div>· P = 3,246 USDC（450人参与，零外部注入，第5年稳态）</div>
              <div>· N = 按 C1/C2/C3 断签率模型推算各里程碑达成人数</div>
              <div>· 以下收益率与 P、N 强相关，实际运行中偏差可能极大</div>
            </div>
            <Table
              headers={['里程碑', '纯USDC收益率（冷启动预估）', '正向收益所需 P_min', '说明']}
              rows={[
                ['铜牌', '-97% ⚠️ 预估', '≥ 15,800 USDC', '铜牌N最大，奖励最分散，设计意图'],
                ['黄金', '-33% ⚠️ 预估', '≥ 4,860 USDC', 'P>4,860时即转正，热启动首个突破点'],
                ['铂金', '-44% ⚠️ 预估', '≥ 5,760 USDC', '天数成本高，需P适中'],
                ['传奇', '-65% ⚠️ 预估', '≥ 9,328 USDC', '365天成本高，gArc增值是主要激励'],
              ]}
            />
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-300 text-xs space-y-1">
              <div className="text-white font-semibold">热启动注入对收益率的影响</div>
              <div>公式：P_min = D × f × N / r，P 每增加 1 USDC，单人奖励 R 增加 r/N USDC</div>
              <div className="mt-1 space-y-0.5 font-mono text-green-300">
                <div>P = 4,860 USDC → 黄金收益率 = 0%（盈亏平衡）</div>
                <div>P = 9,720 USDC → 黄金收益率 = +100%（2倍回报）</div>
                <div>P = 16,200 USDC → 黄金收益率 ≈ +233%</div>
              </div>
              <div className="mt-1 text-yellow-200">冷启动负收益是设计意图而非系统缺陷，目的是筛选真实信仰者而非套利者。</div>
            </div>
          </Sub>
        </Section>

        {/* 页脚 */}
        <div className="border-t border-gray-800 pt-6 text-center text-gray-500 text-xs">
          <p>GM Protocol — 项目计划书 v0.6 | 内部草稿 | 2026年10月</p>
          <p className="mt-1">所有参数可根据测试网实际数据调整。下一版本：白皮书正式版。</p>
        </div>
      </div>
    </div>
  )
}
