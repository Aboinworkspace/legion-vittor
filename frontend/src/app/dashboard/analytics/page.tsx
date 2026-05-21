'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { analytics } from '@/lib/api'
import { useLVStore } from '@/lib/store'

const PLATFORM_STATS = [
  { name: 'Instagram', icon: '📷', color: '#D4537E', views: '—', engage: '—', posts: '—' },
  { name: 'YouTube',   icon: '▶️', color: '#D85A30', views: '—', engage: '—', posts: '—' },
  { name: 'Facebook',  icon: '🌐', color: '#378ADD', views: '—', engage: '—', posts: '—' },
  { name: 'Blog',      icon: '✍️', color: '#0F6E56', views: '—', engage: '—', posts: '—' },
]

export default function AnalyticsPage() {
  const { messages } = useLVStore()
  const [agentStats, setAgentStats] = useState<any[]>([])
  const [overview, setOverview] = useState<any>({})

  useEffect(() => {
    analytics.agentStats().then(r => setAgentStats(r.data.agents || [])).catch(() => {})
    analytics.overview().then(r => setOverview(r.data)).catch(() => {})
  }, [])

  const today = overview.today || {}

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-lv-navy">Analytics</h1>
          <p className="text-sm text-gray-400 mt-0.5">Company performance overview</p>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Agent messages today', value: today.messages_sent || messages.length, change: 'all channels' },
            { label: 'Tasks completed today', value: today.tasks_completed || 0, change: 'by agents' },
            { label: 'Active agents',  value: agentStats.filter(a => a.status === 'active').length, change: 'right now' },
            { label: 'Success rate',   value: agentStats.length > 0 ? `${Math.round(agentStats.reduce((sum, a) => sum + (a.success_rate || 100), 0) / agentStats.length)}%` : '100%', change: 'avg all agents' },
          ].map(s => (
            <div key={s.label} className="lv-card p-4 shadow-lv">
              <div className="text-xs text-gray-400 mb-1">{s.label}</div>
              <div className="font-display text-2xl font-bold text-lv-navy">{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.change}</div>
            </div>
          ))}
        </div>

        {/* Agent performance table */}
        <div className="lv-card shadow-lv mb-6">
          <div className="px-5 py-3 border-b border-gray-100">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Agent performance</div>
          </div>
          {agentStats.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">
              Run tasks to start seeing agent performance data.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              <div className="grid grid-cols-5 px-5 py-2 text-[10px] text-gray-400 uppercase tracking-wide">
                <div className="col-span-2">Agent</div>
                <div>Total tasks</div>
                <div>Today</div>
                <div>Success</div>
              </div>
              {agentStats.map(agent => (
                <div key={agent.slug} className="grid grid-cols-5 px-5 py-3 items-center">
                  <div className="col-span-2">
                    <div className="text-sm font-medium text-gray-800">{agent.name}</div>
                    <div className="text-xs text-gray-400 capitalize">{agent.status}</div>
                  </div>
                  <div className="text-sm font-medium text-gray-700">{agent.tasks_completed || 0}</div>
                  <div className="text-sm text-gray-600">{agent.tasks_today || 0}</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-1.5 bg-green-600 rounded-full" style={{ width: `${agent.success_rate || 100}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{agent.success_rate || 100}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Social platform grid */}
        <div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Social platforms</div>
          <div className="grid grid-cols-4 gap-4">
            {PLATFORM_STATS.map(p => (
              <div key={p.name} className="lv-card p-4 shadow-lv" style={{ borderLeft: `3px solid ${p.color}`, borderRadius: '0 12px 12px 0' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">{p.icon}</span>
                  <div className="text-sm font-medium text-gray-700">{p.name}</div>
                </div>
                <div className="space-y-1.5">
                  {[['Views', p.views], ['Engagement', p.engage], ['Posts', p.posts]].map(([l, v]) => (
                    <div key={l as string} className="flex justify-between text-xs">
                      <span className="text-gray-400">{l}</span>
                      <span className="font-medium text-gray-700">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-[10px] text-gray-300">Connect via Settings to see data</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
