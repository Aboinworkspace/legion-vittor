'use client'
import AppLayout from '@/components/layout/AppLayout'

const PLATFORM_STATS = [
  { name: 'Instagram', emoji: '📷', views: '42K', likes: '3.8K', engage: '6.2%', color: '#D4537E' },
  { name: 'YouTube', emoji: '▶️', views: '18K', subs: '420', ctr: '7.1%', color: '#D85A30' },
  { name: 'Facebook', emoji: '🌐', reach: '9.4K', clicks: '880', engage: '4.1%', color: '#378ADD' },
  { name: 'Blog', emoji: '✏️', visits: '6.2K', avgTime: '3:20', articles: '12', color: '#0F6E56' },
]

const LEADS = [
  { name: 'Arjun Mehta', company: 'TechVentures Hyd', score: 87, stage: 'Qualified', value: '₹45K' },
  { name: 'Priya Sharma', company: 'StartupStudio', score: 74, stage: 'Outreach', value: '₹28K' },
  { name: 'Ravi Kiran', company: 'CloudSaaS India', score: 61, stage: 'New', value: '₹62K' },
]

const WEEKLY = [
  { day: 'Mon', val: 38 },
  { day: 'Tue', val: 41 },
  { day: 'Wed', val: 38 },
  { day: 'Thu', val: 55 },
  { day: 'Fri', val: 62 },
  { day: 'Sat', val: 48 },
  { day: 'Sun', val: 8 },
]

const maxVal = Math.max(...WEEKLY.map(w => w.val))

export default function AnalyticsPage() {
  return (
    <AppLayout>
      <div className="p-6 max-w-5xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-display text-xl font-bold text-lv-navy">Analytics</h1>
            <p className="text-sm text-gray-400 mt-0.5">All departments · this week</p>
          </div>
          <button className="text-xs bg-lv-navy text-white px-4 py-2 rounded-lg hover:bg-indigo-900 transition-colors">
            Export report
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { l: 'Total revenue', v: '₹2,84,000', s: '↑ +18% vs last month', color: 'text-green-600' },
            { l: 'Leads generated', v: '312', s: '47 qualified', color: 'text-amber-600' },
            { l: 'Content published', v: '56', s: 'Posts, reels, blogs', color: 'text-blue-600' },
            { l: 'Total reach', v: '1.2M', s: '↑ +34%', color: 'text-indigo-600' },
          ].map(s => (
            <div key={s.l} className="bg-white rounded-xl border border-gray-200 p-4 shadow-lv">
              <div className="text-xs text-gray-400 mb-1">{s.l}</div>
              <div className="font-display text-2xl font-bold text-lv-navy">{s.v}</div>
              <div className={`text-xs mt-1 ${s.color}`}>{s.s}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-5 mb-5">
          {/* Bar chart */}
          <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-4 shadow-lv">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-lv-navy">Revenue this week</div>
              <div className="text-xs text-gray-400">₹ daily</div>
            </div>
            <div className="flex items-end gap-2 h-24">
              {WEEKLY.map((w, i) => (
                <div key={w.day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[9px] text-gray-400">{w.val}K</div>
                  <div className="w-full rounded-t-md transition-all" style={{
                    height: `${(w.val / maxVal) * 80}px`,
                    background: i === 4 ? '#1a1f4e' : '#B5D4F4',
                  }} />
                  <div className="text-[9px] text-gray-400">{w.day}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Agent performance */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-lv">
            <div className="text-sm font-medium text-lv-navy mb-3">Agent performance</div>
            <div className="space-y-2">
              {[
                { name: 'Developer', tasks: 148, rate: 99 },
                { name: 'Marketing', tasks: 92, rate: 97 },
                { name: 'Support', tasks: 56, rate: 100 },
                { name: 'Manager', tasks: 88, rate: 98 },
                { name: 'CEO', tasks: 24, rate: 100 },
              ].map(a => (
                <div key={a.name}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-gray-600">{a.name}</span>
                    <span className="text-gray-400">{a.tasks} tasks · {a.rate}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-lv-navy rounded-full" style={{ width: `${a.rate}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Platform stats */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          {PLATFORM_STATS.map(p => (
            <div key={p.name} className="bg-white rounded-xl border border-gray-200 p-4 shadow-lv">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{p.emoji}</span>
                <span className="text-sm font-medium text-lv-navy">{p.name}</span>
              </div>
              {Object.entries(p).filter(([k]) => !['name', 'emoji', 'color'].includes(k)).map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400 capitalize">{k}</span>
                  <span className="font-medium text-lv-navy">{v}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Leads table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-lv overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="text-sm font-medium text-lv-navy">Top leads this week</div>
            <div className="text-xs text-gray-400">312 total →</div>
          </div>
          <div className="divide-y divide-gray-100">
            {LEADS.map(l => (
              <div key={l.name} className="flex items-center px-4 py-3 gap-4">
                <div className="flex-1">
                  <div className="text-sm font-medium text-lv-navy">{l.name}</div>
                  <div className="text-xs text-gray-400">{l.company}</div>
                </div>
                <div className="w-24">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Score</span>
                    <span className="text-lv-navy font-medium">{l.score}/100</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-600 rounded-full" style={{ width: `${l.score}%` }} />
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                  l.stage === 'Qualified' ? 'bg-green-50 text-green-700 border-green-200' :
                  l.stage === 'Outreach' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-blue-50 text-blue-700 border-blue-200'
                }`}>{l.stage}</span>
                <span className="text-sm font-medium text-lv-navy w-16 text-right">{l.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
