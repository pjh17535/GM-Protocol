import { useState } from "react";

// ─── 铜牌 Bronze ───────────────────────────────────────────────────────────
const BronzeSBT = ({ size = 280 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bg-b" cx="50%" cy="55%" r="65%">
        <stop offset="0%" stopColor="#3E2B63" />
        <stop offset="100%" stopColor="#1B3158" />
      </radialGradient>
      <linearGradient id="tier-b" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#CD7F32" />
        <stop offset="100%" stopColor="#A0522D" />
      </linearGradient>
      <linearGradient id="arc-b" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#CD7F32" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
      <filter id="glow-b">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    {/* 外框 */}
    <rect width="280" height="280" rx="24" fill="url(#bg-b)" />
    {/* 顶部彩色条 */}
    <rect width="280" height="6" rx="3" fill="url(#tier-b)" />
    {/* 底部彩色条 */}
    <rect y="274" width="280" height="6" rx="3" fill="url(#tier-b)" />
    {/* Arc 弧线日出 */}
    <path d="M40 155 Q140 60 240 155" stroke="url(#arc-b)" strokeWidth="3" fill="none" strokeLinecap="round" filter="url(#glow-b)" />
    {/* 地平线 */}
    <line x1="30" y1="168" x2="250" y2="168" stroke="#CD7F32" strokeWidth="1.5" strokeOpacity="0.5" />
    {/* 太阳圆 */}
    <circle cx="140" cy="108" r="18" fill="#CD7F32" fillOpacity="0.15" stroke="#CD7F32" strokeWidth="1.5" strokeOpacity="0.6" />
    <circle cx="140" cy="108" r="10" fill="#CD7F32" fillOpacity="0.3" />
    {/* GM Logo 核心 */}
    <circle cx="140" cy="140" r="38" fill="#1B3158" fillOpacity="0.6" stroke="#CD7F32" strokeWidth="2" strokeOpacity="0.8" />
    <text x="140" y="150" textAnchor="middle" fontSize="32" fontWeight="800" fontFamily="system-ui,sans-serif" fill="white" letterSpacing="-1">GM</text>
    {/* 通缩三环 */}
    <circle cx="140" cy="210" r="16" stroke="#CD7F32" strokeWidth="1.5" fill="none" strokeOpacity="0.8" />
    <circle cx="140" cy="210" r="9" stroke="#CD7F32" strokeWidth="1.2" fill="none" strokeOpacity="0.5" />
    <circle cx="140" cy="210" r="3.5" fill="#CD7F32" fillOpacity="0.7" />
    {/* 里程碑名称 */}
    <text x="140" y="245" textAnchor="middle" fontSize="18" fontWeight="700" fontFamily="system-ui,sans-serif" fill="#CD7F32" letterSpacing="3">BRONZE</text>
    <text x="140" y="264" textAnchor="middle" fontSize="11" fontFamily="system-ui,sans-serif" fill="#CD7F32" fillOpacity="0.7" letterSpacing="1">30 DAYS · GM PROTOCOL</text>
    {/* Arc Network 标识 */}
    <text x="140" y="28" textAnchor="middle" fontSize="10" fontFamily="system-ui,sans-serif" fill="white" fillOpacity="0.5" letterSpacing="2">BUILT ON ARC</text>
    {/* 左右装饰线 */}
    <line x1="20" y1="140" x2="85" y2="140" stroke="#CD7F32" strokeWidth="1" strokeOpacity="0.3" />
    <line x1="195" y1="140" x2="260" y2="140" stroke="#CD7F32" strokeWidth="1" strokeOpacity="0.3" />
  </svg>
);

// ─── 黄金 Gold ─────────────────────────────────────────────────────────────
const GoldSBT = ({ size = 280 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bg-g" cx="50%" cy="55%" r="65%">
        <stop offset="0%" stopColor="#3E2B63" />
        <stop offset="100%" stopColor="#1B3158" />
      </radialGradient>
      <linearGradient id="tier-g" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#EF4444" />
      </linearGradient>
      <filter id="glow-g">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    <rect width="280" height="280" rx="24" fill="url(#bg-g)" />
    <rect width="280" height="6" rx="3" fill="url(#tier-g)" />
    <rect y="274" width="280" height="6" rx="3" fill="url(#tier-g)" />
    {/* 双弧线 */}
    <path d="M40 155 Q140 60 240 155" stroke="url(#tier-g)" strokeWidth="3" fill="none" strokeLinecap="round" filter="url(#glow-g)" />
    <path d="M55 165 Q140 80 225 165" stroke="#F59E0B" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeOpacity="0.4" />
    <line x1="30" y1="168" x2="250" y2="168" stroke="#F59E0B" strokeWidth="1.5" strokeOpacity="0.5" />
    <circle cx="140" cy="108" r="20" fill="#F59E0B" fillOpacity="0.2" stroke="#F59E0B" strokeWidth="2" strokeOpacity="0.7" filter="url(#glow-g)" />
    <circle cx="140" cy="108" r="11" fill="#F59E0B" fillOpacity="0.4" />
    <circle cx="140" cy="140" r="38" fill="#1B3158" fillOpacity="0.6" stroke="#F59E0B" strokeWidth="2.5" strokeOpacity="0.9" />
    <text x="140" y="150" textAnchor="middle" fontSize="32" fontWeight="800" fontFamily="system-ui,sans-serif" fill="white" letterSpacing="-1">GM</text>
    <circle cx="140" cy="210" r="16" stroke="#F59E0B" strokeWidth="1.5" fill="none" strokeOpacity="0.9" filter="url(#glow-g)" />
    <circle cx="140" cy="210" r="9" stroke="#F59E0B" strokeWidth="1.2" fill="none" strokeOpacity="0.6" />
    <circle cx="140" cy="210" r="3.5" fill="#F59E0B" />
    <text x="140" y="245" textAnchor="middle" fontSize="18" fontWeight="700" fontFamily="system-ui,sans-serif" fill="#F59E0B" letterSpacing="3">GOLD</text>
    <text x="140" y="264" textAnchor="middle" fontSize="11" fontFamily="system-ui,sans-serif" fill="#F59E0B" fillOpacity="0.7" letterSpacing="1">90 DAYS · GM PROTOCOL</text>
    <text x="140" y="28" textAnchor="middle" fontSize="10" fontFamily="system-ui,sans-serif" fill="white" fillOpacity="0.5" letterSpacing="2">BUILT ON ARC</text>
    <line x1="20" y1="140" x2="85" y2="140" stroke="#F59E0B" strokeWidth="1" strokeOpacity="0.4" />
    <line x1="195" y1="140" x2="260" y2="140" stroke="#F59E0B" strokeWidth="1" strokeOpacity="0.4" />
  </svg>
);

// ─── 铂金 Platinum ─────────────────────────────────────────────────────────
const PlatinumSBT = ({ size = 280 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bg-p" cx="50%" cy="55%" r="65%">
        <stop offset="0%" stopColor="#2D1F4E" />
        <stop offset="100%" stopColor="#0F2040" />
      </radialGradient>
      <linearGradient id="tier-p" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#E2E8F0" />
        <stop offset="50%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#CBD5E1" />
      </linearGradient>
      <filter id="glow-p">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    <rect width="280" height="280" rx="24" fill="url(#bg-p)" />
    <rect width="280" height="6" rx="3" fill="url(#tier-p)" />
    <rect y="274" width="280" height="6" rx="3" fill="url(#tier-p)" />
    {/* 三重弧线 */}
    <path d="M40 155 Q140 60 240 155" stroke="url(#tier-p)" strokeWidth="3" fill="none" strokeLinecap="round" filter="url(#glow-p)" />
    <path d="M55 165 Q140 80 225 165" stroke="#94A3B8" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeOpacity="0.5" />
    <path d="M70 172 Q140 95 210 172" stroke="#CBD5E1" strokeWidth="1" fill="none" strokeLinecap="round" strokeOpacity="0.3" />
    <line x1="30" y1="168" x2="250" y2="168" stroke="#94A3B8" strokeWidth="1.5" strokeOpacity="0.4" />
    <circle cx="140" cy="108" r="22" fill="#94A3B8" fillOpacity="0.15" stroke="#E2E8F0" strokeWidth="2" strokeOpacity="0.6" filter="url(#glow-p)" />
    <circle cx="140" cy="108" r="12" fill="#94A3B8" fillOpacity="0.3" />
    <circle cx="140" cy="140" r="38" fill="#0F2040" fillOpacity="0.7" stroke="url(#tier-p)" strokeWidth="2.5" />
    <text x="140" y="150" textAnchor="middle" fontSize="32" fontWeight="800" fontFamily="system-ui,sans-serif" fill="white" letterSpacing="-1">GM</text>
    <circle cx="140" cy="210" r="16" stroke="#E2E8F0" strokeWidth="1.5" fill="none" strokeOpacity="0.8" filter="url(#glow-p)" />
    <circle cx="140" cy="210" r="9" stroke="#94A3B8" strokeWidth="1.2" fill="none" strokeOpacity="0.6" />
    <circle cx="140" cy="210" r="3.5" fill="#E2E8F0" fillOpacity="0.9" />
    <text x="140" y="245" textAnchor="middle" fontSize="17" fontWeight="700" fontFamily="system-ui,sans-serif" fill="#E2E8F0" letterSpacing="3">PLATINUM</text>
    <text x="140" y="264" textAnchor="middle" fontSize="11" fontFamily="system-ui,sans-serif" fill="#94A3B8" fillOpacity="0.8" letterSpacing="1">180 DAYS · GM PROTOCOL</text>
    <text x="140" y="28" textAnchor="middle" fontSize="10" fontFamily="system-ui,sans-serif" fill="white" fillOpacity="0.5" letterSpacing="2">BUILT ON ARC</text>
    <line x1="20" y1="140" x2="85" y2="140" stroke="#94A3B8" strokeWidth="1" strokeOpacity="0.3" />
    <line x1="195" y1="140" x2="260" y2="140" stroke="#94A3B8" strokeWidth="1" strokeOpacity="0.3" />
  </svg>
);

// ─── 传奇 Legend ───────────────────────────────────────────────────────────
const LegendSBT = ({ size = 280 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bg-l" cx="50%" cy="55%" r="65%">
        <stop offset="0%" stopColor="#4C1D95" />
        <stop offset="60%" stopColor="#1E1B4B" />
        <stop offset="100%" stopColor="#0F172A" />
      </radialGradient>
      <linearGradient id="tier-l" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#A855F7" />
        <stop offset="50%" stopColor="#EC4899" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
      <filter id="glow-l">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    <rect width="280" height="280" rx="24" fill="url(#bg-l)" />
    <rect width="280" height="6" rx="3" fill="url(#tier-l)" />
    <rect y="274" width="280" height="6" rx="3" fill="url(#tier-l)" />
    {/* 星点装饰 */}
    {[
      [30,50],[60,30],[250,45],[220,25],[15,200],[265,180],[45,240],[240,250]
    ].map(([cx,cy],i) => (
      <circle key={i} cx={cx} cy={cy} r="1.5" fill="white" fillOpacity="0.4" />
    ))}
    {/* 四重弧线 */}
    <path d="M40 155 Q140 60 240 155" stroke="url(#tier-l)" strokeWidth="3.5" fill="none" strokeLinecap="round" filter="url(#glow-l)" />
    <path d="M55 165 Q140 80 225 165" stroke="#A855F7" strokeWidth="2" fill="none" strokeLinecap="round" strokeOpacity="0.6" />
    <path d="M70 172 Q140 95 210 172" stroke="#EC4899" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeOpacity="0.4" />
    <path d="M85 178 Q140 108 195 178" stroke="#F59E0B" strokeWidth="1" fill="none" strokeLinecap="round" strokeOpacity="0.3" />
    <line x1="30" y1="168" x2="250" y2="168" stroke="#A855F7" strokeWidth="1.5" strokeOpacity="0.4" />
    {/* 太阳 — 更强烈 */}
    <circle cx="140" cy="108" r="24" fill="#A855F7" fillOpacity="0.2" stroke="url(#tier-l)" strokeWidth="2" filter="url(#glow-l)" />
    <circle cx="140" cy="108" r="13" fill="#A855F7" fillOpacity="0.4" />
    {/* GM 核心圆 */}
    <circle cx="140" cy="140" r="40" fill="#0F172A" fillOpacity="0.8" stroke="url(#tier-l)" strokeWidth="3" filter="url(#glow-l)" />
    <text x="140" y="150" textAnchor="middle" fontSize="32" fontWeight="800" fontFamily="system-ui,sans-serif" fill="white" letterSpacing="-1">GM</text>
    {/* 三环 */}
    <circle cx="140" cy="210" r="16" stroke="url(#tier-l)" strokeWidth="2" fill="none" filter="url(#glow-l)" />
    <circle cx="140" cy="210" r="9" stroke="#A855F7" strokeWidth="1.5" fill="none" strokeOpacity="0.7" />
    <circle cx="140" cy="210" r="3.5" fill="#A855F7" />
    <text x="140" y="245" textAnchor="middle" fontSize="17" fontWeight="700" fontFamily="system-ui,sans-serif" fill="#A855F7" letterSpacing="3">LEGEND</text>
    <text x="140" y="264" textAnchor="middle" fontSize="11" fontFamily="system-ui,sans-serif" fill="#A855F7" fillOpacity="0.7" letterSpacing="1">365 DAYS · GM PROTOCOL</text>
    <text x="140" y="28" textAnchor="middle" fontSize="10" fontFamily="system-ui,sans-serif" fill="white" fillOpacity="0.6" letterSpacing="2">BUILT ON ARC</text>
    <line x1="20" y1="140" x2="85" y2="140" stroke="url(#tier-l)" strokeWidth="1" strokeOpacity="0.5" />
    <line x1="195" y1="140" x2="260" y2="140" stroke="url(#tier-l)" strokeWidth="1" strokeOpacity="0.5" />
  </svg>
);

// ─── 合作项目通用模板 ────────────────────────────────────────────────────────
const PartnerSBT = ({ size = 280 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bg-pt" cx="50%" cy="55%" r="65%">
        <stop offset="0%" stopColor="#1E3A5F" />
        <stop offset="100%" stopColor="#0D1F35" />
      </radialGradient>
      <linearGradient id="tier-pt" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#0EA5E9" />
      </linearGradient>
    </defs>
    <rect width="280" height="280" rx="24" fill="url(#bg-pt)" />
    <rect width="280" height="6" rx="3" fill="url(#tier-pt)" />
    <rect y="274" width="280" height="6" rx="3" fill="url(#tier-pt)" />
    {/* Arc 弧线 */}
    <path d="M40 145 Q140 55 240 145" stroke="url(#tier-pt)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeOpacity="0.7" />
    <line x1="30" y1="158" x2="250" y2="158" stroke="#38BDF8" strokeWidth="1" strokeOpacity="0.3" />
    {/* 合作方 Logo 留白区域 */}
    <rect x="95" y="55" width="90" height="70" rx="12" fill="#0D1F35" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="4 3" strokeOpacity="0.5" />
    <text x="140" y="86" textAnchor="middle" fontSize="9" fontFamily="system-ui,sans-serif" fill="#38BDF8" fillOpacity="0.5" letterSpacing="1">PARTNER</text>
    <text x="140" y="100" textAnchor="middle" fontSize="9" fontFamily="system-ui,sans-serif" fill="#38BDF8" fillOpacity="0.5" letterSpacing="1">LOGO HERE</text>
    {/* GM Protocol 标识 */}
    <circle cx="140" cy="168" r="32" fill="#0D1F35" fillOpacity="0.8" stroke="#38BDF8" strokeWidth="1.5" strokeOpacity="0.6" />
    <text x="140" y="178" textAnchor="middle" fontSize="26" fontWeight="800" fontFamily="system-ui,sans-serif" fill="white" letterSpacing="-1">GM</text>
    {/* 通缩三环 */}
    <circle cx="140" cy="222" r="13" stroke="#38BDF8" strokeWidth="1.2" fill="none" strokeOpacity="0.7" />
    <circle cx="140" cy="222" r="7" stroke="#38BDF8" strokeWidth="1" fill="none" strokeOpacity="0.4" />
    <circle cx="140" cy="222" r="2.5" fill="#38BDF8" fillOpacity="0.7" />
    {/* 里程碑名称留白 */}
    <rect x="60" y="240" width="160" height="22" rx="4" fill="#38BDF8" fillOpacity="0.08" stroke="#38BDF8" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.3" />
    <text x="140" y="255" textAnchor="middle" fontSize="10" fontFamily="system-ui,sans-serif" fill="#38BDF8" fillOpacity="0.4" letterSpacing="2">MILESTONE NAME</text>
    <text x="140" y="28" textAnchor="middle" fontSize="10" fontFamily="system-ui,sans-serif" fill="white" fillOpacity="0.5" letterSpacing="2">BUILT ON ARC</text>
    <line x1="20" y1="168" x2="90" y2="168" stroke="#38BDF8" strokeWidth="1" strokeOpacity="0.2" />
    <line x1="190" y1="168" x2="260" y2="168" stroke="#38BDF8" strokeWidth="1" strokeOpacity="0.2" />
  </svg>
);

// ─── 主页面 ─────────────────────────────────────────────────────────────────
const badges = [
  { name: "Bronze", days: "30天", component: BronzeSBT, color: "#CD7F32", desc: "首个里程碑，连续签到30天的证明" },
  { name: "Gold", days: "90天", component: GoldSBT, color: "#F59E0B", desc: "坚持者的荣耀，连续签到90天" },
  { name: "Platinum", days: "180天", component: PlatinumSBT, color: "#E2E8F0", desc: "半年的承诺，链上身份的深度证明" },
  { name: "Legend", days: "365天", component: LegendSBT, color: "#A855F7", desc: "传奇级别，整整一年的链上坚持" },
  { name: "Partner", days: "自定义", component: PartnerSBT, color: "#38BDF8", desc: "合作项目通用模板，留白处填入合作方Logo和里程名称" },
];

export default function SBTPreview() {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">GM Protocol SBT 徽章设计</h1>
          <p className="text-gray-400">链上灵魂绑定代币，永久记录你的签到里程碑</p>
          <p className="text-sm text-gray-500 mt-1">基于 Arc Network 色系 · 链上 SVG 全程去中心化</p>
        </div>

        {/* 徽章展示网格 */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {badges.map((badge, i) => {
            const Comp = badge.component;
            return (
              <div
                key={i}
                onClick={() => setSelected(i === selected ? null : i)}
                className={`cursor-pointer rounded-2xl p-4 transition-all border-2 ${
                  selected === i
                    ? "border-blue-400 bg-gray-800"
                    : "border-gray-700 bg-gray-900 hover:border-gray-500"
                }`}
              >
                <div className="flex justify-center mb-3">
                  <Comp size={200} />
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg" style={{ color: badge.color }}>
                    {badge.name}
                  </div>
                  <div className="text-gray-400 text-sm">{badge.days}</div>
                  <div className="text-gray-500 text-xs mt-1">{badge.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 选中预览 */}
        {selected !== null && (
          <div className="rounded-2xl bg-gray-900 border border-gray-700 p-8">
            <h2 className="text-xl font-bold mb-6 text-center">
              大图预览 — <span style={{ color: badges[selected].color }}>{badges[selected].name}</span>
            </h2>
            <div className="flex flex-col lg:flex-row gap-8 items-center">
              <div className="flex justify-center">
                {(() => { const Comp = badges[selected].component; return <Comp size={320} />; })()}
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <div className="text-gray-400 text-sm mb-1">徽章名称</div>
                  <div className="font-bold text-xl" style={{ color: badges[selected].color }}>
                    {badges[selected].name}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-1">里程要求</div>
                  <div className="text-white">{badges[selected].days}连续签到</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-1">设计元素</div>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>· Arc Network 深蓝紫渐变背景</li>
                    <li>· 弧形日出线（致敬 Arc A 字标）</li>
                    <li>· gArc 通缩螺旋三环</li>
                    <li>· GM 核心标识</li>
                    <li>· 里程碑专属色彩系统</li>
                    {selected === 4 && <li>· 合作方 Logo 留白区域</li>}
                    {selected === 4 && <li>· 里程碑名称留白区域</li>}
                  </ul>
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-1">说明</div>
                  <div className="text-gray-300 text-sm">{badges[selected].desc}</div>
                </div>
                <div className="pt-2">
                  <div className="text-xs text-gray-500">
                    ✓ 全链上 SVG，无需 IPFS · ✓ 永久存在 · ✓ tokenURI 返回 base64 编码
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 审核确认区 */}
        <div className="mt-8 rounded-xl bg-blue-950 border border-blue-800 p-6 text-center">
          <p className="text-blue-300 font-medium mb-2">请审核以上5个模板设计</p>
          <p className="text-gray-400 text-sm">确认后我将把 SVG 代码写入 GMSoulBound 合约的 tokenURI 函数，永久上链</p>
        </div>
      </div>
    </div>
  );
}
