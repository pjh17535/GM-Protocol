import { useState, useMemo } from 'react'

// ── 模型参数 ──────────────────────────────────────────────────────────────
const INITIAL_USERS = 450
const CHECKIN_FEE = 0.1
const POOL_RATE = 0.80      // 奖励池分配比例
const RESERVE_RATE = 0.10   // 储备金库比例

// C1/C2/C3 用户分布
const C1_RATIO = 0.10  // 坚持型，全程
const C2_RATIO = 0.25  // 目标驱动型，签到60%天数
const C3_RATIO = 0.65  // 随机流失型

const C1 = Math.round(INITIAL_USERS * C1_RATIO) // 45
const C2 = Math.round(INITIAL_USERS * C2_RATIO) // 112
const C3 = Math.round(INITIAL_USERS * C3_RATIO) // 293

// 里程碑配置（去掉白银）
const MILESTONES = [
  { day: 30,  label: '铜牌',  releaseRate: 0.015, color: '#CD7F32' },
  { day: 90,  label: '黄金',  releaseRate: 0.10,  color: '#FFD700' },
  { day: 180, label: '铂金',  releaseRate: 0.15,  color: '#E5E4E2' },
  { day: 365, label: '传奇',  releaseRate: 0.18,  color: '#9B59B6' },
]

// C3 留存率（按时间节点）
function c3Retention(day: number): number {
  if (day <= 30)  return Math.max(0, 1 - (day / 30) * 0.70)
  if (day <= 90)  return Math.max(0, 0.30 - ((day - 30) / 60) * 0.15)
  if (day <= 180) return Math.max(0, 0.15 - ((day - 90) / 90) * 0.12)
  return Math.max(0, 0.03 - ((day - 180) / 185) * 0.03)
}

// 每日签到人数
function dailySignins(day: number): number {
  const c1Active = C1
  const c2Active = C2 * 0.6
  const c3Active = C3 * c3Retention(day)
  return c1Active + c2Active + c3Active
}

// 生成每日数据点（支持多年，里程碑按周期重复触发）
function generateDailyData(totalDays = 1825) {
  const data: Array<{
    day: number
    poolBalance: number
    reserveBalance: number
    totalBurned: number
    milestone?: string
    claimAmount?: number
    burnAmount?: number
  }> = []

  let cumulativePool = 0
  let reserveBalance = 0
  let totalBurned = 0
  let totalClaimed = 0

  for (let day = 1; day <= totalDays; day++) {
    const signins = dailySignins(day)
    const dailyRevenue = signins * CHECKIN_FEE
    cumulativePool += dailyRevenue * POOL_RATE
    reserveBalance += dailyRevenue * RESERVE_RATE

    let claimAmount = 0
    let burnAmount = 0
    let milestoneName: string | undefined

    // 每天只触发最高优先级里程碑（传奇 > 铂金 > 黄金 > 铜牌）
    const triggered = [...MILESTONES].reverse().find(m => day % m.day === 0)
    if (triggered) {
      const cycle = Math.floor(day / triggered.day)
      claimAmount = cumulativePool * triggered.releaseRate
      totalClaimed += claimAmount
      cumulativePool -= claimAmount
      burnAmount = claimAmount / 8
      reserveBalance = Math.max(0, reserveBalance - burnAmount)
      totalBurned += burnAmount
      milestoneName = `${triggered.label}·第${cycle}轮`
    }

    data.push({
      day,
      poolBalance: Math.max(0, cumulativePool),
      reserveBalance: Math.max(0, reserveBalance),
      totalBurned,
      milestone: milestoneName,
      claimAmount: claimAmount > 0 ? claimAmount : undefined,
      burnAmount: burnAmount > 0 ? burnAmount : undefined,
    })
  }

  // 消除未使用变量警告
  void totalClaimed

  return data
}

// ── SVG 折线图组件 ────────────────────────────────────────────────────────
interface LineChartProps {
  data: number[]
  color: string
  label: string
  milestonePoints: { index: number; label: string; color: string }[]
  width: number
  height: number
  formatter?: (v: number) => string
}

function LineChart({ data, color, label, milestonePoints, width, height, formatter }: LineChartProps) {
  const [hovered, setHovered] = useState<{ x: number; y: number; value: number; day: number } | null>(null)

  const min = 0
  const max = Math.max(...data) * 1.1 || 1
  const padL = 64, padR = 20, padT = 16, padB = 32
  const w = width - padL - padR
  const h = height - padT - padB

  const toX = (i: number) => padL + (i / (data.length - 1)) * w
  const toY = (v: number) => padT + h - ((v - min) / (max - min)) * h

  const path = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(' ')
  const area = `${path} L ${toX(data.length - 1).toFixed(1)} ${(padT + h).toFixed(1)} L ${padL} ${(padT + h).toFixed(1)} Z`

  const fmt = formatter ?? ((v: number) => v.toFixed(2))

  // Y轴刻度
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
    y: padT + h - t * h,
    label: fmt(min + t * (max - min)),
  }))

  // X轴刻度（每60天）
  const xTicks = [0, 365, 730, 1095, 1460, 1824].map((d, i) => ({
    x: toX(Math.min(d, data.length - 1)),
    label: i === 0 ? '0' : `第${i}年`,
  }))

  return (
    <div className="relative">
      <svg
        width={width}
        height={height}
        className="overflow-visible"
        onMouseMove={e => {
          const rect = e.currentTarget.getBoundingClientRect()
          const mx = e.clientX - rect.left - padL
          const idx = Math.max(0, Math.min(data.length - 1, Math.round((mx / w) * (data.length - 1))))
          setHovered({ x: toX(idx), y: toY(data[idx]), value: data[idx], day: idx + 1 })
        }}
        onMouseLeave={() => setHovered(null)}
      >
        {/* 网格线 */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={padL} x2={padL + w} y1={t.y} y2={t.y} stroke="#1e293b" strokeWidth={1} />
            <text x={padL - 8} y={t.y + 4} textAnchor="end" fontSize={10} fill="#64748b" fontFamily="JetBrains Mono, monospace">
              {t.label}
            </text>
          </g>
        ))}

        {/* X轴刻度 */}
        {xTicks.map((t, i) => (
          <text key={i} x={t.x} y={padT + h + 20} textAnchor="middle" fontSize={10} fill="#64748b" fontFamily="DM Sans, sans-serif">
            {t.label}
          </text>
        ))}

        {/* 面积填充 */}
        <defs>
          <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#grad-${label})`} />

        {/* 折线 */}
        <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* 里程碑垂直线 */}
        {milestonePoints.map((mp, i) => {
          const x = toX(mp.index)
          return (
            <g key={i}>
              <line x1={x} x2={x} y1={padT} y2={padT + h} stroke={mp.color} strokeWidth={1} strokeDasharray="4 3" opacity={0.7} />
              <circle cx={x} cy={toY(data[mp.index])} r={4} fill={mp.color} stroke="#0f172a" strokeWidth={1.5} />
              <text x={x} y={padT - 4} textAnchor="middle" fontSize={9} fill={mp.color} fontFamily="DM Sans, sans-serif" fontWeight={600}>
                {mp.label}
              </text>
            </g>
          )
        })}

        {/* Hover 指示器 */}
        {hovered && (
          <g>
            <line x1={hovered.x} x2={hovered.x} y1={padT} y2={padT + h} stroke="#475569" strokeWidth={1} strokeDasharray="2 2" />
            <circle cx={hovered.x} cy={hovered.y} r={5} fill={color} stroke="#0f172a" strokeWidth={2} />
          </g>
        )}
      </svg>

      {/* Tooltip */}
      {hovered && (
        <div
          className="absolute pointer-events-none bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs shadow-xl z-10"
          style={{
            left: Math.min(hovered.x + 12, width - 120),
            top: Math.max(hovered.y - 40, 8),
          }}
        >
          <div className="text-slate-400 mb-1">第 {hovered.day} 天</div>
          <div className="font-mono font-bold" style={{ color }}>{fmt(hovered.value)} USDC</div>
        </div>
      )}
    </div>
  )
}

// ── 主组件 ────────────────────────────────────────────────────────────────
export default function GMPoolChart() {
  const [activeTab, setActiveTab] = useState<'pool' | 'reserve' | 'burn' | 'all'>('all')

  const TOTAL_DAYS = 1825
  const rawData = useMemo(() => generateDailyData(TOTAL_DAYS), [])

  const poolData = rawData.map(d => d.poolBalance)
  const reserveData = rawData.map(d => d.reserveBalance)
  const burnData = rawData.map(d => d.totalBurned)

  // 里程碑标记点：每个里程碑每年第一次触发（最多显示5个）
  const milestonePoints = MILESTONES.flatMap(m => {
    const points = []
    for (let cycle = 1; cycle <= Math.floor(TOTAL_DAYS / m.day); cycle++) {
      const day = m.day * cycle
      if (day <= TOTAL_DAYS) points.push({ index: day - 1, label: cycle === 1 ? m.label : '', color: m.color })
    }
    return points.slice(0, 6)
  })

  const lastDay = rawData[TOTAL_DAYS - 1]
  const year1 = rawData[364]
  const year3 = rawData[1094]
  const fmtUsdc = (v: number) => `${v.toFixed(2)}`

  const CHART_W = 700
  const CHART_H = 260

  const tabs = [
    { key: 'all' as const, label: '综合视图' },
    { key: 'pool' as const, label: '奖励池' },
    { key: 'reserve' as const, label: '储备金库' },
    { key: 'burn' as const, label: '累计销毁' },
  ]

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 p-4 md:p-8" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {/* 标题 */}
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>
            GM 底池经济学模型
          </h1>
          <p className="text-slate-400 text-sm">
            10% 渗透率 · 450人起始 · 0.1 USDC/天 · 奖励池80% · 储备金库10% · <span className="text-amber-400 font-medium">5年周期</span>
          </p>
        </div>

        {/* 关键数据卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: '第1年奖励池', value: `${year1.poolBalance.toFixed(0)} USDC`, color: '#3b82f6' },
            { label: '第3年奖励池', value: `${year3.poolBalance.toFixed(0)} USDC`, color: '#60a5fa' },
            { label: '第5年奖励池', value: `${lastDay.poolBalance.toFixed(0)} USDC`, color: '#93c5fd' },
            { label: '5年累计销毁', value: `${lastDay.totalBurned.toFixed(1)} USDC`, color: '#f59e0b' },
          ].map((card, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-500 mb-2 uppercase tracking-wider">{card.label}</div>
              <div className="text-xl font-bold font-mono tabular-nums" style={{ color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* 里程碑事件表 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">里程碑 Claim 事件</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
                  <th className="text-left pb-3 pr-4">里程碑</th>
                  <th className="text-right pb-3 pr-4">天数</th>
                  <th className="text-right pb-3 pr-4">释放比例</th>
                  <th className="text-right pb-3 pr-4">总Claim USDC</th>
                  <th className="text-right pb-3 pr-4">触发销毁 USDC</th>
                  <th className="text-right pb-3">单人奖励</th>
                </tr>
              </thead>
              <tbody>
                {MILESTONES.map((m, i) => {
                  const d = rawData[m.day - 1]
                  const c2ClaimRatio = m.day === 30 ? 0.30 : m.day === 90 ? 0.08 : m.day === 180 ? 0.03 : 0.01
                  const claimers = C1 + Math.round(C2 * c2ClaimRatio)
                  const totalClaim = d.claimAmount ?? 0
                  const burn = d.burnAmount ?? 0
                  const perPerson = claimers > 0 ? totalClaim / claimers : 0
                  const cost = m.day * CHECKIN_FEE
                  const roi = ((perPerson - cost) / cost * 100)
                  return (
                    <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                          <span className="font-medium">{m.label}</span>
                        </span>
                      </td>
                      <td className="text-right py-3 pr-4 tabular-nums text-slate-300">{m.day}天</td>
                      <td className="text-right py-3 pr-4 tabular-nums text-slate-300">{(m.releaseRate * 100).toFixed(1)}%</td>
                      <td className="text-right py-3 pr-4 tabular-nums font-mono text-blue-400">{totalClaim.toFixed(2)}</td>
                      <td className="text-right py-3 pr-4 tabular-nums font-mono text-amber-400">{burn.toFixed(3)}</td>
                      <td className="text-right py-3 tabular-nums">
                        <span className="font-mono text-emerald-400">{perPerson.toFixed(3)}</span>
                        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${roi >= 0 ? 'bg-emerald-900/50 text-emerald-400' : 'bg-rose-900/50 text-rose-400'}`}>
                          {roi >= 0 ? '+' : ''}{roi.toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 图表区域 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          {/* Tab 切换 */}
          <div className="flex gap-1 mb-6 bg-slate-950 rounded-lg p-1 w-fit">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-slate-700 text-slate-100 shadow'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            {activeTab === 'all' && (
              <div className="space-y-8">
                {[
                  { data: poolData, color: '#3b82f6', label: '奖励池余额', unit: 'USDC' },
                  { data: reserveData, color: '#10b981', label: '储备金库余额', unit: 'USDC' },
                  { data: burnData, color: '#f59e0b', label: '累计回购销毁', unit: 'USDC' },
                ].map((chart, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: chart.color }} />
                      <span className="text-sm font-medium text-slate-300">{chart.label}</span>
                      <span className="text-xs text-slate-600">({chart.unit})</span>
                    </div>
                    <LineChart
                      data={chart.data}
                      color={chart.color}
                      label={chart.label}
                      milestonePoints={milestonePoints}
                      width={CHART_W}
                      height={CHART_H}
                      formatter={fmtUsdc}
                    />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'pool' && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm font-medium text-slate-300">奖励池余额 (USDC)</span>
                </div>
                <LineChart data={poolData} color="#3b82f6" label="pool" milestonePoints={milestonePoints} width={CHART_W} height={320} formatter={fmtUsdc} />
                <p className="text-xs text-slate-500 mt-3">每次里程碑Claim时奖励池出现下降，但持续的签到注入使其长期增长。</p>
              </div>
            )}

            {activeTab === 'reserve' && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium text-slate-300">储备金库余额 (USDC)</span>
                </div>
                <LineChart data={reserveData} color="#10b981" label="reserve" milestonePoints={milestonePoints} width={CHART_W} height={320} formatter={fmtUsdc} />
                <p className="text-xs text-slate-500 mt-3">储备金库注入速度快于回购支出，余额持续健康增长。</p>
              </div>
            )}

            {activeTab === 'burn' && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-sm font-medium text-slate-300">累计回购销毁 (USDC)</span>
                </div>
                <LineChart data={burnData} color="#f59e0b" label="burn" milestonePoints={milestonePoints} width={CHART_W} height={320} formatter={fmtUsdc} />
                <p className="text-xs text-slate-500 mt-3">每次里程碑触发阶梯式跳升，传奇里程碑产生最大单次销毁。</p>
              </div>
            )}
          </div>

          {/* 图例说明 */}
          <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-slate-800">
            {MILESTONES.map(m => (
              <div key={m.label} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                <span>{m.label} ({m.day}天)</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="inline-block w-6 border-t border-dashed border-slate-600" />
              <span>里程碑节点</span>
            </div>
          </div>
        </div>

        {/* 参数说明 */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-slate-500">
          {[
            ['起始用户', '450人（10%渗透率）'],
            ['C1坚持型', `${C1}人（10%）`],
            ['C2目标驱动型', `${C2}人（25%）`],
            ['C3随机流失型', `${C3}人（65%）`],
            ['签到费', '0.1 USDC/天'],
            ['奖励池:储备金库', '8:1 回购销毁比'],
          ].map(([k, v], i) => (
            <div key={i} className="flex justify-between bg-slate-900/50 rounded-lg px-3 py-2">
              <span>{k}</span>
              <span className="text-slate-300 font-mono">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
