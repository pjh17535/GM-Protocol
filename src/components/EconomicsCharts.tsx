import { useState, useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell as PieCell,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell, ComposedChart,
} from 'recharts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TooltipFn = (v: any, name: any) => [string, string]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fmtV = (v: any): string => (v == null ? '' : String(v as string | number))
const fmt2 = (v: number) => v.toFixed(2)
const fmtK = (v: number) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)

const COLORS = {
  copper:  '#CD7F32',
  gold:    '#FFD700',
  plat:    '#A8B8C8',
  legend:  '#C084FC',
  blue:    '#3B82F6',
  sky:     '#38BDF8',
  green:   '#10B981',
  red:     '#EF4444',
  orange:  '#F97316',
  purple:  '#8B5CF6',
  gray:    '#6B7280',
  btc:     '#F59E0B',
  dark:    '#1F2937',
}

const cardBase = 'bg-gray-800 rounded-xl p-4 border border-gray-700'
const ttStyle = { backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 10 }

// ─────────────────────────────────────────────────────────────────────────────
// C.5  里程碑释放比例曲线
// 图表类型：面积图（连续曲线） + 4个里程碑数据卡片
// ─────────────────────────────────────────────────────────────────────────────
export function ReleaseRateChart() {
  const anchors = [
    { day: 30,  r: 1.5,  label: '铜牌', color: COLORS.copper },
    { day: 90,  r: 10,   label: '黄金', color: COLORS.gold },
    { day: 180, r: 15,   label: '铂金', color: COLORS.plat },
    { day: 365, r: 18,   label: '传奇', color: COLORS.legend },
  ]
  const curve = useMemo(() => {
    const pts = []
    for (let x = 0; x <= 365; x += 3) {
      const t = x / 365
      const r = 18 * (3 * t * t - 2 * t * t * t)   // 三次 Hermite S 曲线
      pts.push({ day: x, r: +Math.max(0, r).toFixed(3) })
    }
    return pts
  }, [])

  return (
    <div className="space-y-4">
      <div className={cardBase}>
        <h3 className="text-white font-semibold text-base mb-0.5">C.5 里程碑释放比例曲线</h3>
        <p className="text-gray-400 text-xs mb-3">
          公式：r(D) = 18% × (3t² - 2t³)，t = D/365，四个里程碑为锚点
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={curve} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
            <defs>
              <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={COLORS.blue} stopOpacity={0.4} />
                <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis dataKey="day" stroke="#4B5563" tick={{ fontSize: 10 }}
              label={{ value: '连续签到天数 D', position: 'insideBottom', offset: -8, fill: '#6B7280', fontSize: 11 }} />
            <YAxis stroke="#4B5563" tick={{ fontSize: 10 }} unit="%" domain={[0, 20]} />
            <Tooltip formatter={((v: unknown) => [`${fmtV(v)}%`, '释放比例']) as TooltipFn}
              labelFormatter={(l: unknown) => `第 ${String(l)} 天`}
              contentStyle={ttStyle} labelStyle={{ color: '#F9FAFB' }} itemStyle={{ color: '#60A5FA' }} />
            <Area type="monotone" dataKey="r" fill="url(#rGrad)" stroke={COLORS.blue} strokeWidth={2.5} dot={false} />
            {anchors.map(a => (
              <ReferenceLine key={a.label} x={a.day} stroke={a.color} strokeWidth={1.5} strokeDasharray="4 3"
                label={{ value: `${a.label} ${a.r}%`, position: 'top', fill: a.color, fontSize: 10, fontWeight: 600 }} />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {/* 四个里程碑卡片 */}
      <div className="grid grid-cols-4 gap-3">
        {anchors.map(a => (
          <div key={a.label} className="bg-gray-800 rounded-xl p-3 border border-gray-700 text-center">
            <div className="text-xs font-bold mb-1" style={{ color: a.color }}>{a.label}</div>
            <div className="text-white font-bold text-xl">{a.r}%</div>
            <div className="text-gray-400 text-xs mt-0.5">释放比例</div>
            <div className="text-gray-500 text-xs mt-1">第 {a.day} 天</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// C.6  gArc 通缩曲线
// 图表类型：折线图（双曲线对比BTC） + 年度销毁精确数据表格
// ─────────────────────────────────────────────────────────────────────────────
export function DeflationCurveChart() {
  const curve = useMemo(() => {
    const rows = []
    for (let t = 0; t <= 6; t += 0.25) {
      const ct  = 1 - Math.pow(1 - t / 6, 2)
      const btc = t === 0 ? 0 : Math.min(0.9524, 1 - Math.pow(1 - Math.min(t / 23, 1), 1.6))
      rows.push({ year: +t.toFixed(2), ct: +(ct * 100).toFixed(2), btc: +(btc * 100).toFixed(2) })
    }
    return rows
  }, [])

  const yearTable = [1,2,3,4,5,6].map(t => {
    const ct    = 1 - Math.pow(1 - t / 6, 2)
    const ctPrev = t === 1 ? 0 : 1 - Math.pow(1 - (t-1) / 6, 2)
    const dt = ct - ctPrev
    return {
      year:    `第${t}年`,
      ctPct:   +(ct * 100).toFixed(2),
      dtPct:   +(dt * 100).toFixed(2),
      dtAmt:   +(dt * 47.9).toFixed(3),
      remain:  +((1 - ct) * 47.9 + 2.1).toFixed(3),
    }
  })

  return (
    <div className="space-y-4">
      <div className={cardBase}>
        <h3 className="text-white font-semibold text-base mb-0.5">C.6 gArc 通缩曲线（反向二次函数）</h3>
        <p className="text-gray-400 text-xs mb-3">
          公式：C(t) = 1 − (1 − t/6)²，铸造100亿立即销毁2.1亿，有效97.9亿，Claim池47.9亿耗尽后LP剩余2.1亿
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={curve} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis dataKey="year" stroke="#4B5563" tick={{ fontSize: 10 }}
              label={{ value: '年份 t', position: 'insideBottom', offset: -8, fill: '#6B7280', fontSize: 11 }} />
            <YAxis stroke="#4B5563" tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
            <Tooltip formatter={((v: unknown, n: unknown) => [`${fmtV(v)}%`, String(n)]) as TooltipFn}
              contentStyle={ttStyle} labelStyle={{ color: '#F9FAFB' }} />
            <Legend wrapperStyle={{ color: '#D1D5DB', fontSize: 12 }} />
            <Line type="monotone" dataKey="ct"  name="gArc 累计销毁 C(t)" stroke={COLORS.blue}  strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="btc" name="BTC 累计供应（参照）" stroke={COLORS.btc} strokeWidth={2} dot={false} strokeDasharray="6 3" />
            <ReferenceLine y={100 * (47.9/50)} stroke={COLORS.gray} strokeDasharray="3 3"
              label={{ value: '目标95.8%', position: 'right', fill: '#9CA3AF', fontSize: 10 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* 精确数据表格 */}
      <div className={cardBase}>
        <p className="text-gray-400 text-xs mb-3">年销毁率 d(t) = C(t) − C(t−1) 及对应销毁量（Claim池总量 47.9 亿枚）</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-700">
                {['年份','累计销毁C(t)','年销毁率d(t)','年销毁量(亿枚)','剩余流通(亿枚)'].map(h => (
                  <th key={h} className="text-gray-400 text-left py-2 px-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {yearTable.map((r, i) => (
                <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                  <td className="py-2 px-2 text-white font-medium">{r.year}</td>
                  <td className="py-2 px-2 text-blue-400">{r.ctPct}%</td>
                  <td className="py-2 px-2 text-purple-400">{r.dtPct}%</td>
                  <td className="py-2 px-2 text-red-400">{r.dtAmt}</td>
                  <td className="py-2 px-2 text-green-400">{r.remain}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-gray-500 text-xs mt-2">第6年末剩余流通 ≈ 2.105 亿枚（永久流通底线 2.1 亿枚）</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// C.3  单次 Claim 资金流向
// 图表类型：饼图（比例关系） + 流向说明卡片 + 四里程碑数据卡
// ─────────────────────────────────────────────────────────────────────────────
export function ClaimFlowChart() {
  const [sel, setSel] = useState(0)
  const milestones = [
    { label: '铜牌', r: 0.015, N: 79,  D: 30,  color: COLORS.copper },
    { label: '黄金', r: 0.10,  N: 54,  D: 90,  color: COLORS.gold },
    { label: '铂金', r: 0.15,  N: 48,  D: 180, color: COLORS.plat },
    { label: '传奇', r: 0.18,  N: 46,  D: 365, color: COLORS.legend },
  ]
  const P = 3246
  const m = milestones[sel]
  const R     = P * m.r / m.N
  const extra = R / 8
  const total = R + extra   // = (9/8)R

  const pieData = [
    { name: '用户获得 gArc 等值', value: +(R / total * 100).toFixed(1), color: COLORS.green },
    { name: '额外回购销毁', value: +(extra / total * 100).toFixed(1), color: COLORS.red },
  ]

  const cost = m.D * 0.1
  const roi  = ((R - cost) / cost * 100)

  return (
    <div className="space-y-4">
      {/* 选择器 */}
      <div className="flex gap-2">
        {milestones.map((mm, i) => (
          <button key={i} onClick={() => setSel(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              sel === i ? 'border-blue-500 bg-blue-600/20 text-white' : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500'
            }`}>
            {mm.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 饼图 */}
        <div className={cardBase}>
          <h3 className="text-white font-semibold text-base mb-0.5">
            {m.label}奖励 — 奖励池扣除分配
          </h3>
          <p className="text-gray-400 text-xs mb-2">
            奖励池扣除 (9/8)R = {fmt2(total)} USDC
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                dataKey="value" paddingAngle={3}
                label={({ name, value }) => `${value}%`}
                labelLine={false}>
                {pieData.map((entry, i) => <PieCell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={((v: unknown) => [`${fmtV(v)}%`, '占比']) as TooltipFn}
                contentStyle={ttStyle} />
              <Legend wrapperStyle={{ color: '#D1D5DB', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* 流向说明 + 数据 */}
        <div className={`${cardBase} flex flex-col justify-between`}>
          <div>
            <h3 className="text-white font-semibold text-base mb-3">公式说明（P = 3,246 USDC）</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center py-1.5 border-b border-gray-700">
                <span className="text-gray-400">里程碑达成人数 N</span>
                <span className="text-white font-mono">{m.N} 人</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-700">
                <span className="text-gray-400">单人应得 R = P×r/N</span>
                <span className="text-green-400 font-mono font-bold">{fmt2(R)} USDC</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-700">
                <span className="text-gray-400">主回购销毁 R</span>
                <span className="text-red-400 font-mono">{fmt2(R)} USDC</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-700">
                <span className="text-gray-400">额外销毁 (1/8)R</span>
                <span className="text-red-400 font-mono">{fmt2(extra)} USDC</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-700">
                <span className="text-gray-400">奖励池合计扣除</span>
                <span className="text-orange-400 font-mono font-bold">{fmt2(total)} USDC</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-700">
                <span className="text-gray-400">签到总成本 D×f</span>
                <span className="text-gray-300 font-mono">{fmt2(cost)} USDC</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-gray-400">纯USDC收益率</span>
                <span className={`font-mono font-bold text-base ${roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {roi.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          <p className="text-gray-500 text-xs mt-3">注：冷启动阶段（P=3,246 USDC）收益为负，热启动后收益转正</p>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// C.8  季度注入量
// 图表类型：面积折线图（递减趋势更清晰） + 年度汇总表格
// ─────────────────────────────────────────────────────────────────────────────
export function QuarterlyInjectionChart() {
  const G = 7450
  const data = useMemo(() => Array.from({ length: 24 }, (_, i) => {
    const q = i + 1
    const year = Math.ceil(q / 4)
    const amount = +(G * (49 - 2 * q) / 576).toFixed(2)
    const cumPct = Array.from({ length: q }, (__, j) => G * (49 - 2*(j+1)) / 576)
      .reduce((a, b) => a + b, 0) / G * 100
    return { q: `Q${q}`, year, amount, cumPct: +cumPct.toFixed(1) }
  }), [])

  const yearSummary = [1,2,3,4,5,6].map(y => {
    const qs = data.filter(d => d.year === y)
    return { year: `第${y}年`, total: +qs.reduce((a, b) => a + b.amount, 0).toFixed(2), count: qs.length }
  })

  return (
    <div className="space-y-4">
      <div className={cardBase}>
        <h3 className="text-white font-semibold text-base mb-0.5">C.8 季度注入量（24季度递减）</h3>
        <p className="text-gray-400 text-xs mb-3">
          公式：Q(q) = G × (49 − 2q) / 576，G = 7,450 USDC（示例融资 F = 10,000 USDC）
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
            <defs>
              <linearGradient id="qGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={COLORS.purple} stopOpacity={0.5} />
                <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis dataKey="q" stroke="#4B5563" tick={{ fontSize: 9 }} interval={3}
              label={{ value: '季度 q', position: 'insideBottom', offset: -8, fill: '#6B7280', fontSize: 11 }} />
            <YAxis stroke="#4B5563" tick={{ fontSize: 10 }} unit=" U" />
            <Tooltip contentStyle={ttStyle} labelStyle={{ color: '#F9FAFB' }}
              formatter={((v: unknown, n: unknown) => [`${fmtV(v)} USDC`, String(n)]) as TooltipFn} />
            <Area type="monotone" dataKey="amount" name="注入量" fill="url(#qGrad)" stroke={COLORS.purple} strokeWidth={2} dot={{ r: 2, fill: COLORS.purple }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {/* 年度汇总表格 */}
      <div className={cardBase}>
        <p className="text-gray-400 text-xs mb-3">年度汇总（G = 7,450 USDC）</p>
        <div className="grid grid-cols-6 gap-2">
          {yearSummary.map((y, i) => (
            <div key={i} className="bg-gray-900 rounded-lg p-3 text-center">
              <div className="text-gray-400 text-xs mb-1">{y.year}</div>
              <div className="text-purple-400 font-bold text-sm">{y.total}</div>
              <div className="text-gray-500 text-xs">USDC</div>
            </div>
          ))}
        </div>
        <p className="text-gray-500 text-xs mt-2">合计 = G = 7,450 USDC，24季度分配完毕</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// C.9  DAO 投票权
// 图表类型：折线图（5条S曲线） + 极端对比卡片
// ─────────────────────────────────────────────────────────────────────────────
export function VotingPowerChart() {
  const sLevels = [
    { label: '未签到 (0.1×)', s: 0.1,  color: COLORS.gray,   days: '0天' },
    { label: '铜牌 (1×)',     s: 1,    color: COLORS.copper,  days: '30天' },
    { label: '黄金 (2×)',     s: 2,    color: COLORS.gold,    days: '90天' },
    { label: '铂金 (3.5×)',   s: 3.5,  color: COLORS.plat,    days: '180天' },
    { label: '传奇 (6×)',     s: 6,    color: COLORS.legend,  days: '365天' },
  ]
  const holdings = [10000, 50000, 100000, 500000, 1000000, 5000000, 10000000]

  const chartData = holdings.map(h => {
    const row: Record<string, number | string> = { h: fmtK(h) }
    sLevels.forEach(sl => { row[sl.label] = h * sl.s })
    return row
  })

  // 极端对比：传奇 100k vs 未签到 10M
  const cmp = [
    { desc: '传奇用户持有 10万 gArc', votes: 100000 * 6, color: COLORS.legend },
    { desc: '未签到持有 1000万 gArc', votes: 10000000 * 0.1, color: COLORS.gray },
  ]

  return (
    <div className="space-y-4">
      <div className={cardBase}>
        <h3 className="text-white font-semibold text-base mb-0.5">C.9 DAO 投票权 V = H × S</h3>
        <p className="text-gray-400 text-xs mb-3">
          S（连续签到系数）：0.1× ~ 6×。传奇用户投票权是同等持仓未签到者的 60 倍
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis dataKey="h" stroke="#4B5563" tick={{ fontSize: 10 }}
              label={{ value: 'gArc 持有量 H', position: 'insideBottom', offset: -8, fill: '#6B7280', fontSize: 11 }} />
            <YAxis stroke="#4B5563" tick={{ fontSize: 10 }} tickFormatter={fmtK}
              label={{ value: '投票权 V', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 11 }} />
            <Tooltip contentStyle={ttStyle} labelStyle={{ color: '#F9FAFB' }}
              labelFormatter={(v: unknown) => `持有 ${String(v)} gArc`}
              formatter={((v: unknown, n: unknown) => [Number(v ?? 0).toLocaleString(), String(n)]) as TooltipFn} />
            <Legend wrapperStyle={{ color: '#D1D5DB', fontSize: 11 }} />
            {sLevels.map(sl => (
              <Line key={sl.label} type="monotone" dataKey={sl.label}
                stroke={sl.color} strokeWidth={sl.s >= 6 ? 3 : sl.s >= 2 ? 2 : 1.5}
                dot={false} strokeDasharray={sl.s < 0.5 ? '5 3' : undefined} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* 极端对比卡 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {cmp.map((c, i) => (
          <div key={i} className={`${cardBase} flex items-center gap-4`}>
            <div className="w-1.5 h-12 rounded-full" style={{ background: c.color }} />
            <div>
              <div className="text-gray-400 text-xs">{c.desc}</div>
              <div className="text-white font-bold text-xl mt-0.5">{c.votes.toLocaleString()} 票</div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-gray-500 text-xs px-1">
        结论：传奇用户（10万gArc）= 600,000票；未签到大户（1000万gArc）= 1,000,000票。
        真正的治理权需要时间积累，而非单纯资本。
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// D.  里程碑收益率对照
// 图表类型：分组柱状图（正负清晰） + 正向门槛精确表格
// ─────────────────────────────────────────────────────────────────────────────
export function ROIComparisonChart() {
  const milestones = [
    { label: '铜牌',  r: 0.015, N: 79,  D: 30,  color: COLORS.copper },
    { label: '黄金',  r: 0.10,  N: 54,  D: 90,  color: COLORS.gold },
    { label: '铂金',  r: 0.15,  N: 48,  D: 180, color: COLORS.plat },
    { label: '传奇',  r: 0.18,  N: 46,  D: 365, color: COLORS.legend },
  ]

  const pCold = 3246
  const pHot  = 16000

  const data = milestones.map(m => {
    const cost    = m.D * 0.1
    const rCold   = pCold * m.r / m.N
    const rHot    = pHot  * m.r / m.N
    const roiCold = ((rCold - cost) / cost * 100)
    const roiHot  = ((rHot  - cost) / cost * 100)
    // 正向门槛：P_min = N × cost / r
    const pMin    = m.N * cost / m.r
    return {
      label:    m.label,
      '冷启动': +roiCold.toFixed(1),
      '热启动': +roiHot.toFixed(1),
      pMin:     +pMin.toFixed(0),
      rCold:    +rCold.toFixed(3),
      rHot:     +rHot.toFixed(3),
      cost:     +cost.toFixed(1),
      color:    m.color,
    }
  })

  return (
    <div className="space-y-4">
      <div className={cardBase}>
        <h3 className="text-white font-semibold text-base mb-0.5">D. 里程碑 USDC 收益率对照</h3>
        <p className="text-gray-400 text-xs mb-3">
          冷启动 P = 3,246 USDC vs 热启动 P = 16,000 USDC，零轴以下为负收益
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 10, right: 20, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis dataKey="label" stroke="#4B5563" tick={{ fontSize: 12 }} />
            <YAxis stroke="#4B5563" tick={{ fontSize: 10 }} unit="%" />
            <Tooltip contentStyle={ttStyle} labelStyle={{ color: '#F9FAFB' }}
              formatter={((v: unknown, n: unknown) => [`${fmtV(v)}%`, String(n)]) as TooltipFn} />
            <Legend wrapperStyle={{ color: '#D1D5DB', fontSize: 12 }} />
            <ReferenceLine y={0} stroke="#4B5563" strokeWidth={2} />
            <Bar dataKey="冷启动" fill={COLORS.red}   radius={[4,4,0,0]} opacity={0.85} />
            <Bar dataKey="热启动" fill={COLORS.green} radius={[4,4,0,0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* 精确数据表格 */}
      <div className={cardBase}>
        <p className="text-gray-400 text-xs mb-3">
          正向门槛 P_min = N × D × f / r（奖励池需达此值，当期单人才获正收益）
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-700">
                {['里程碑','签到成本','冷启动单人R','热启动单人R','冷启动收益率','热启动收益率','正向门槛 P_min'].map(h => (
                  <th key={h} className="text-gray-400 text-left py-2 px-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                  <td className="py-2 px-2 font-bold" style={{ color: d.color }}>{d.label}</td>
                  <td className="py-2 px-2 text-gray-300">{d.cost} USDC</td>
                  <td className="py-2 px-2 text-red-400">{d.rCold} USDC</td>
                  <td className="py-2 px-2 text-green-400">{d.rHot} USDC</td>
                  <td className={`py-2 px-2 font-semibold ${d['冷启动'] >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {d['冷启动']}%
                  </td>
                  <td className={`py-2 px-2 font-semibold ${d['热启动'] >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {d['热启动']}%
                  </td>
                  <td className="py-2 px-2 text-yellow-400 font-bold">{d.pMin.toLocaleString()} USDC</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// C.2  单人奖励热力图
// 图表类型：交互式表格热力图（P × N 矩阵，颜色 = 奖励高低）
// ─────────────────────────────────────────────────────────────────────────────
export function RewardHeatmapChart() {
  const [selM, setSelM] = useState(1)
  const milestones = [
    { label: '铜牌', r: 0.015, color: COLORS.copper },
    { label: '黄金', r: 0.10,  color: COLORS.gold },
    { label: '铂金', r: 0.15,  color: COLORS.plat },
    { label: '传奇', r: 0.18,  color: COLORS.legend },
  ]
  const m = milestones[selM]
  const pValues = [500, 1000, 2000, 3246, 5000, 8000, 16000]
  const nValues = [5, 10, 20, 30, 54, 100, 200]

  const cells = useMemo(() =>
    pValues.flatMap(p => nValues.map(n => ({ p, n, R: +(p * m.r / n).toFixed(3) })))
  , [m.r])    // eslint-disable-line react-hooks/exhaustive-deps

  const maxR = Math.max(...cells.map(c => c.R))

  return (
    <div className={cardBase}>
      <h3 className="text-white font-semibold text-base mb-0.5">C.2 单人奖励 R = P × r / N</h3>
      <p className="text-gray-400 text-xs mb-3">
        奖励池余额 P 与达成人数 N 共同决定单人奖励（颜色越深奖励越高）
      </p>
      <div className="flex gap-2 mb-4">
        {milestones.map((mm, i) => (
          <button key={i} onClick={() => setSelM(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              selM === i
                ? 'text-white border-transparent'
                : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-500'
            }`}
            style={selM === i ? { background: mm.color + '33', borderColor: mm.color } : {}}>
            {mm.label} (r={mm.r*100}%)
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="text-xs w-full border-collapse">
          <thead>
            <tr>
              <th className="text-gray-500 p-1.5 text-left font-medium border-b border-gray-700">P \ N</th>
              {nValues.map(n => (
                <th key={n} className="text-gray-400 p-1.5 text-center font-medium border-b border-gray-700">
                  {n}人
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pValues.map(p => (
              <tr key={p}>
                <td className="text-gray-300 p-1.5 font-mono font-medium border-b border-gray-800/50">
                  {p.toLocaleString()} U
                </td>
                {nValues.map(n => {
                  const R = +(p * m.r / n).toFixed(3)
                  const intensity = R / maxR
                  return (
                    <td key={n} className="p-1.5 text-center rounded-sm transition-colors"
                      style={{
                        backgroundColor: `rgba(59,130,246,${0.08 + intensity * 0.82})`,
                        color: intensity > 0.55 ? '#fff' : intensity > 0.25 ? '#93C5FD' : '#475569',
                        fontWeight: intensity > 0.55 ? 600 : 400,
                      }}>
                      {R}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-gray-500 text-xs mt-2">单位：USDC / 人。标注行 P=3,246 为当前稳态奖励池估算值。</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GM 池分配比例饼图（bonus：直观展示 80/10/5/5）
// ─────────────────────────────────────────────────────────────────────────────
export function PoolAllocationChart() {
  const data = [
    { name: '奖励池（用户里程碑）', value: 80, color: COLORS.blue },
    { name: '储备金库（回购销毁）', value: 10, color: COLORS.red },
    { name: '协议金库（团队锁仓）', value: 5,  color: COLORS.orange },
    { name: '合作项目预留',         value: 5,  color: COLORS.purple },
  ]

  const RADIAN = Math.PI / 180
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, value, name } = props as {
      cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; value: number; name: string
    }
    const radius = innerRadius + (outerRadius - innerRadius) * 1.35
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return (
      <text x={x} y={y} fill="#D1D5DB" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11}>
        {`${name} ${value}%`}
      </text>
    )
  }

  return (
    <div className={cardBase}>
      <h3 className="text-white font-semibold text-base mb-0.5">GM 池每日签到费分配比例</h3>
      <p className="text-gray-400 text-xs mb-3">
        每笔 f=0.1 USDC 签到费按 80/10/5/5 自动分配入各子池
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={95}
            dataKey="value" labelLine={true}
            label={renderLabel}>
            {data.map((entry, i) => <PieCell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip formatter={((v: unknown) => [`${fmtV(v)}%`, '占比']) as TooltipFn}
            contentStyle={ttStyle} />
        </PieChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-4 gap-2 mt-2">
        {data.map((d, i) => (
          <div key={i} className="bg-gray-900 rounded-lg p-2 text-center">
            <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ background: d.color }} />
            <div className="text-white font-bold text-lg">{d.value}%</div>
            <div className="text-gray-500 text-xs leading-tight">{d.name}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 主页面
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'allocation', label: 'GM池分配' },
  { id: 'release',    label: 'C.5 释放比例' },
  { id: 'deflation',  label: 'C.6 通缩曲线' },
  { id: 'claim',      label: 'C.3 Claim流向' },
  { id: 'quarterly',  label: 'C.8 季度注入' },
  { id: 'voting',     label: 'C.9 投票权' },
  { id: 'roi',        label: 'D. 收益率' },
  { id: 'heatmap',    label: 'C.2 奖励热力图' },
]

export default function EconomicsCharts() {
  const [tab, setTab] = useState('allocation')

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-white">GM Protocol — 经济学可视化</h1>
          <p className="text-gray-400 text-sm mt-1">
            对应项目计划书附录 C 完整公式体系，每图附示例数据与精确数字
          </p>
        </div>

        {/* Tab 导航 */}
        <div className="flex flex-wrap gap-2">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                tab === t.id
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* 内容区 */}
        {tab === 'allocation' && <PoolAllocationChart />}
        {tab === 'release'    && <ReleaseRateChart />}
        {tab === 'deflation'  && <DeflationCurveChart />}
        {tab === 'claim'      && <ClaimFlowChart />}
        {tab === 'quarterly'  && <QuarterlyInjectionChart />}
        {tab === 'voting'     && <VotingPowerChart />}
        {tab === 'roi'        && <ROIComparisonChart />}
        {tab === 'heatmap'    && <RewardHeatmapChart />}

        {/* 参数说明 */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-xs text-gray-500 space-y-1">
          <p>示例参数：f = 0.1 USDC，U = 450 人/日，P_稳态 = 3,246 USDC，P_热启动 = 16,000 USDC</p>
          <p>gArc 总量：100 亿枚（Claim 池 47.9 亿 + 流动性 50 亿 + 永久底线 2.1 亿）</p>
          <p>融资示例：F = 10,000 USDC → G = 7,450 USDC（GM池）+ L = 2,550 USDC（流动性）</p>
        </div>
      </div>
    </div>
  )
}
