import { useState } from 'react'
import GMPoolChart from './components/GMPoolChart'
import EconomicsCharts from './components/EconomicsCharts'
import ProjectPlan from './components/ProjectPlan'
import ProjectPlanEN from './components/ProjectPlanEN'
import Whitepaper from './components/Whitepaper'
import GMProtocolLogo from './components/GMProtocolLogo'
import SBTPreview from './components/SBTPreview'
import GMCheckInPage from './components/GMCheckInPage'

type View = 'checkin' | 'whitepaper' | 'plan' | 'planEN' | 'pool' | 'economics' | 'sbt'

export default function App() {
  const [view, setView] = useState<View>('checkin')
  const tabs: { id: View; label: string }[] = [
    { id: 'checkin',    label: '☀️ GM 签到' },
    { id: 'whitepaper', label: '📜 白皮书' },
    { id: 'plan',       label: '📄 项目计划书' },
    { id: 'planEN',     label: '🇺🇸 Investor Brief' },
    { id: 'pool',       label: '📈 GM 底池曲线' },
    { id: 'economics',  label: '📊 经济学图表' },
    { id: 'sbt',        label: '🏅 SBT 徽章' },
  ]
  return (
    <div>
      {/* Navigation bar with Logo */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-950 border-b border-gray-800">
        <div className="flex items-center gap-3 px-4 py-2">
          {/* Logo lockup */}
          <GMProtocolLogo size={36} variant="full" className="shrink-0 mr-2" />
          {/* Divider */}
          <div className="w-px h-6 bg-gray-700 shrink-0" />
          {/* Tab navigation */}
          <div className="flex flex-wrap gap-2">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setView(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  view === t.id
                    ? t.id === 'checkin'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Content — offset for taller nav */}
      <div className="pt-14">
        {view === 'checkin'    && <GMCheckInPage />}
        {view === 'whitepaper' && <Whitepaper />}
        {view === 'plan'       && <ProjectPlan />}
        {view === 'planEN'     && <ProjectPlanEN />}
        {view === 'pool'       && <GMPoolChart />}
        {view === 'economics'  && <EconomicsCharts />}
        {view === 'sbt'        && <SBTPreview />}
      </div>
    </div>
  )
}
