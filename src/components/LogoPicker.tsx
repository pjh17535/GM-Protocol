import { useState } from 'react'

// ── 变体 A：日出弧形版（当前版本升级）──────────────────────────
function LogoA({ size = 56 }: { size?: number }) {
  const id = 'lgA'
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`${id}bg`} cx="50%" cy="60%" r="60%">
          <stop offset="0%" stopColor="#3E2B63" />
          <stop offset="100%" stopColor="#1B3158" />
        </radialGradient>
        <linearGradient id={`${id}arc`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
        <linearGradient id={`${id}glow`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      {/* 圆形背景 */}
      <circle cx="28" cy="28" r="28" fill={`url(#${id}bg)`} />
      {/* 光晕 */}
      <ellipse cx="28" cy="38" rx="22" ry="8" fill={`url(#${id}glow)`} />
      {/* 日出弧线 */}
      <path d="M10 35 Q28 14 46 35" stroke={`url(#${id}arc)`} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* 地平线 */}
      <line x1="8" y1="38" x2="48" y2="38" stroke="#F59E0B" strokeWidth="1.2" strokeOpacity="0.6"/>
      {/* GM 文字 */}
      <text x="28" y="33" textAnchor="middle" fontSize="13" fontWeight="800" fontFamily="system-ui,sans-serif" fill="white" letterSpacing="-0.5">GM</text>
      {/* 底部三环 */}
      <circle cx="28" cy="45" r="4.5" stroke="#F59E0B" strokeWidth="1" fill="none" strokeOpacity="0.8"/>
      <circle cx="28" cy="45" r="2.8" stroke="#F59E0B" strokeWidth="0.8" fill="none" strokeOpacity="0.5"/>
      <circle cx="28" cy="45" r="1.2" fill="#F59E0B" fillOpacity="0.6"/>
    </svg>
  )
}

// ── 变体 B：极简几何版 ──────────────────────────────────────────
function LogoB({ size = 56 }: { size?: number }) {
  const id = 'lgB'
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}bg`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1B3158" />
          <stop offset="100%" stopColor="#942753" />
        </linearGradient>
        <linearGradient id={`${id}txt`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A7D9FA" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>
      </defs>
      {/* 六边形背景 */}
      <polygon points="28,2 52,15 52,41 28,54 4,41 4,15" fill={`url(#${id}bg)`}/>
      {/* 内框线 */}
      <polygon points="28,7 47,18 47,38 28,49 9,38 9,18" stroke="#A7D9FA" strokeWidth="0.8" fill="none" strokeOpacity="0.3"/>
      {/* GM */}
      <text x="28" y="34" textAnchor="middle" fontSize="16" fontWeight="900" fontFamily="system-ui,sans-serif" fill={`url(#${id}txt)`} letterSpacing="-1">GM</text>
      {/* 顶部点 */}
      <circle cx="28" cy="11" r="2.5" fill="#A7D9FA" fillOpacity="0.8"/>
      {/* 底部短线装饰 */}
      <line x1="20" y1="43" x2="36" y2="43" stroke="#A7D9FA" strokeWidth="1" strokeOpacity="0.5"/>
    </svg>
  )
}

// ── 变体 C：链环徽章版 ──────────────────────────────────────────
function LogoC({ size = 56 }: { size?: number }) {
  const id = 'lgC'
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`${id}bg`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#4A3080" />
          <stop offset="100%" stopColor="#1B3158" />
        </radialGradient>
        <linearGradient id={`${id}ring`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
      </defs>
      {/* 圆形背景 */}
      <circle cx="28" cy="28" r="28" fill={`url(#${id}bg)`}/>
      {/* 外金环 */}
      <circle cx="28" cy="28" r="24" stroke={`url(#${id}ring)`} strokeWidth="2" fill="none"/>
      {/* 内装饰环（缺口） */}
      <path d="M28 10 A18 18 0 1 1 10.5 38" stroke="#A7D9FA" strokeWidth="1.2" fill="none" strokeOpacity="0.4" strokeDasharray="3 2"/>
      {/* GM 主文字 */}
      <text x="28" y="26" textAnchor="middle" fontSize="14" fontWeight="900" fontFamily="system-ui,sans-serif" fill="white" letterSpacing="-0.5">GM</text>
      {/* Protocol 副文字 */}
      <text x="28" y="36" textAnchor="middle" fontSize="5.5" fontWeight="500" fontFamily="system-ui,sans-serif" fill="#A7D9FA" letterSpacing="1.5">PROTOCOL</text>
      {/* 四个角装饰点 */}
      <circle cx="28" cy="5" r="1.5" fill="#F59E0B"/>
      <circle cx="51" cy="28" r="1.5" fill="#F59E0B"/>
      <circle cx="28" cy="51" r="1.5" fill="#F59E0B"/>
      <circle cx="5" cy="28" r="1.5" fill="#F59E0B"/>
    </svg>
  )
}

// ── 变体 D：极光渐变版 ──────────────────────────────────────────
function LogoD({ size = 56 }: { size?: number }) {
  const id = 'lgD'
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}bg`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="50%" stopColor="#1E1B4B" />
          <stop offset="100%" stopColor="#1B3158" />
        </linearGradient>
        <linearGradient id={`${id}aurora1`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3E2B63" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#942753" stopOpacity="0.6"/>
        </linearGradient>
        <linearGradient id={`${id}aurora2`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1B3158" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="#A7D9FA" stopOpacity="0.4"/>
        </linearGradient>
        <linearGradient id={`${id}gm`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF"/>
          <stop offset="100%" stopColor="#A7D9FA"/>
        </linearGradient>
        <clipPath id={`${id}clip`}>
          <circle cx="28" cy="28" r="27"/>
        </clipPath>
      </defs>
      {/* 背景圆 */}
      <circle cx="28" cy="28" r="28" fill={`url(#${id}bg)`}/>
      {/* 极光层1 */}
      <ellipse cx="18" cy="40" rx="22" ry="14" fill={`url(#${id}aurora1)`} clipPath={`url(#${id}clip)`}/>
      {/* 极光层2 */}
      <ellipse cx="38" cy="20" rx="20" ry="12" fill={`url(#${id}aurora2)`} clipPath={`url(#${id}clip)`}/>
      {/* 外边框 */}
      <circle cx="28" cy="28" r="26" stroke="white" strokeWidth="0.6" fill="none" strokeOpacity="0.15"/>
      {/* G 字母 */}
      <text x="17" y="34" textAnchor="middle" fontSize="20" fontWeight="900" fontFamily="system-ui,sans-serif" fill={`url(#${id}gm)`}>G</text>
      {/* M 字母 */}
      <text x="39" y="34" textAnchor="middle" fontSize="20" fontWeight="900" fontFamily="system-ui,sans-serif" fill={`url(#${id}gm)`}>M</text>
      {/* 中间分隔线（通缩象征） */}
      <line x1="27" y1="16" x2="29" y2="42" stroke="#F59E0B" strokeWidth="1.5" strokeOpacity="0.7"/>
      {/* 底部小字 */}
      <text x="28" y="49" textAnchor="middle" fontSize="4.5" fontWeight="500" fontFamily="system-ui,sans-serif" fill="#A7D9FA" letterSpacing="2" fillOpacity="0.7">PROTOCOL</text>
    </svg>
  )
}

// ── 选择器页面 ──────────────────────────────────────────────────
const variants = [
  {
    id: 'A',
    name: '日出弧形版',
    desc: '弧形日出线致敬 Arc 的 A 字标，金橙渐变象征黎明，底部三环代表通缩螺旋',
    Logo: LogoA,
  },
  {
    id: 'B',
    name: '极简六边形版',
    desc: '六边形徽章感，Arc 深蓝到酒红渐变，冰蓝 GM 文字体现链上精密感',
    Logo: LogoB,
  },
  {
    id: 'C',
    name: '链环徽章版',
    desc: '金色外环象征价值守护，虚线内环代表链上透明，四点装饰强化徽章仪式感',
    Logo: LogoC,
  },
  {
    id: 'D',
    name: '极光渐变版',
    desc: 'Arc 三色叠加极光效果，G 和 M 分离由金线贯穿，象征断签者与坚持者的博弈',
    Logo: LogoD,
  },
]

export { LogoA, LogoB, LogoC, LogoD }

export default function LogoPicker() {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2">GM Protocol LOGO 选择</h1>
        <p className="text-gray-400 text-sm mb-8">四个设计变体，均基于 Arc Network 色系（#1B3158 / #3E2B63 / #942753 / #A7D9FA）。选择你满意的版本后告诉我，我将正式嵌入所有页面。</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {variants.map(v => (
            <button
              key={v.id}
              onClick={() => setSelected(v.id)}
              className={`text-left rounded-2xl border-2 p-6 transition-all ${
                selected === v.id
                  ? 'border-yellow-400 bg-gray-800'
                  : 'border-gray-700 bg-gray-900 hover:border-gray-500'
              }`}
            >
              {/* 尺寸展示 */}
              <div className="flex items-end gap-4 mb-4">
                <v.Logo size={80} />
                <v.Logo size={48} />
                <v.Logo size={32} />
                <v.Logo size={20} />
              </div>
              {/* 名称 */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold bg-gray-700 text-gray-300 px-2 py-0.5 rounded">变体 {v.id}</span>
                <span className="font-semibold text-white">{v.name}</span>
                {selected === v.id && <span className="ml-auto text-yellow-400 text-sm font-bold">✓ 已选中</span>}
              </div>
              {/* 说明 */}
              <p className="text-gray-400 text-xs leading-relaxed">{v.desc}</p>
              {/* 导航栏预览 */}
              <div className="mt-4 bg-gray-950 rounded-lg px-3 py-2 flex items-center gap-2 border border-gray-800">
                <v.Logo size={24} />
                <span className="text-sm font-bold text-yellow-400">GM Protocol</span>
                <span className="text-xs text-gray-500 ml-1">Built on Arc</span>
              </div>
            </button>
          ))}
        </div>

        {/* 深色/浅色背景对比 */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
          <h2 className="text-sm font-semibold text-gray-400 mb-4">所有变体 — 不同背景效果对比</h2>
          <div className="grid grid-cols-4 gap-4 mb-4">
            {variants.map(v => (
              <div key={v.id} className="flex flex-col items-center gap-2">
                <div className="bg-gray-950 rounded-xl p-3"><v.Logo size={48} /></div>
                <span className="text-xs text-gray-500">{v.id} — 深色</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-4">
            {variants.map(v => (
              <div key={v.id} className="flex flex-col items-center gap-2">
                <div className="bg-white rounded-xl p-3"><v.Logo size={48} /></div>
                <span className="text-xs text-gray-500">{v.id} — 浅色</span>
              </div>
            ))}
          </div>
        </div>

        {/* 下载区 */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-1">下载 Logo A — 日出弧形版（正式版）</h2>
          <p className="text-gray-500 text-xs mb-4">SVG 矢量格式，可无限缩放不失真，适用于 PPT、Word、印刷品、社交媒体头像等所有场合。</p>
          <div className="flex flex-wrap gap-3">
            <a
              href="/gm-protocol-logo.svg"
              download="gm-protocol-logo.svg"
              className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold text-sm px-4 py-2 rounded-lg transition-colors"
            >
              ↓ 下载 SVG（矢量，推荐）
            </a>
            <a
              href="/gm-protocol-logo.svg"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm px-4 py-2 rounded-lg transition-colors"
            >
              ↗ 在浏览器中打开 SVG
            </a>
          </div>
          <p className="text-gray-600 text-xs mt-3">需要 PNG？在浏览器打开 SVG 后，右键 → 另存为图片，或用 Inkscape（免费）导出任意分辨率 PNG。</p>
        </div>

        {selected && (
          <div className="bg-yellow-400/10 border border-yellow-400/40 rounded-xl p-4 text-yellow-300 text-sm">
            你选择了 <strong>变体 {selected}</strong>。Logo A 已作为正式版嵌入导航栏。
          </div>
        )}
        {!selected && (
          <div className="text-gray-500 text-sm text-center">点击任意变体查看效果对比</div>
        )}
      </div>
    </div>
  )
}
