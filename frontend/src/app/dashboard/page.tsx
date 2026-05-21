'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { agents as agentsApi, analytics, tasks as tasksApi } from '@/lib/api'
import { useLVStore } from '@/lib/store'
import { Agent, Task } from '@/types'
import { useOfficeWS } from '@/hooks/useOfficeWS'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-600', busy: 'bg-amber-500',
  idle: 'bg-gray-300', error: 'bg-red-500', paused: 'bg-gray-400',
}

const DEPT_COLORS: Record<string, string> = {
  Leadership: '#7F77DD', Engineering: '#378ADD',
  'Marketing & Sales': '#BA7517', Support: '#3B6D11', Analytics: '#3B6D11',
}

export default function DashboardPage() {
  const { user, messages } = useLVStore()
  const { sendMessage } = useOfficeWS()
  const [agentList, setAgentList] = useState<Agent[]>([])
  const [stats, setStats] = useState({ messages: 0, tasks: 0 })
  const [prompt, setPrompt] = useState('')
  const [running, setRunning] = useState(false)

  useEffect(() => {
    agentsApi.list().then(r => setAgentList(r.data.agents)).catch(() => {})
    analytics.overview().then(r => {
      setStats({ messages: r.data.today?.messages_sent || 0, tasks: r.data.today?.tasks_completed || 0 })
    }).catch(() => {})
  }, [])

  const handleRun = async () => {
    if (!prompt.trim()) return
    setRunning(true)
    sendMessage(prompt)
    setPrompt('')
    setTimeout(() => setRunning(false), 3000)
  }

  const recentMessages = messages.slice(-5).reverse()

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-lv-navy">
            Good morning{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''} —
            <span className="text-green-700 text-lg ml-2 font-body font-normal">your office is running</span>
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            &nbsp;·&nbsp; {user?.company_name || 'Legion Vittor'}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Agents active',     value: agentList.filter(a => a.status === 'active' || a.status === 'busy').length || '—', sub: 'right now' },
            { label: 'Messages today',    value: stats.messages || messages.length, sub: 'inter-dept' },
            { label: 'Tasks completed',   value: stats.tasks, sub: 'today' },
            { label: 'Departments',       value: 5, sub: 'all live' },
          ].map(s => (
            <div key={s.label} className="lv-card p-4 shadow-lv">
              <div className="text-xs text-gray-400 mb-1">{s.label}</div>
              <div className="font-display text-2xl font-bold text-lv-navy">{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-5">

          {/* Command bar */}
          <div className="col-span-2 space-y-5">
            <div className="lv-card p-5 shadow-lv">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Give your company a task</div>
              <div className="flex gap-3">
                <input
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lv-navy"
                  placeholder='e.g. "Write an Instagram post about our AI office" or "Build a login API"'
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRun()}
                />
                <button
                  onClick={handleRun}
                  disabled={running || !prompt.trim()}
                  className="btn-primary px-5 disabled:opacity-50"
                >
                  {running ? '...' : '→ Run'}
                </button>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                {['Write a blog post about AI', 'Build a REST API endpoint', 'Create an Instagram campaign'].map(eg => (
                  <button key={eg} onClick={() => setPrompt(eg)} className="text-[10px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200">
                    {eg}
                  </button>
                ))}
              </div>
            </div>

            {/* Live agent activity */}
            <div className="lv-card shadow-lv">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Agents working now</div>
                <button onClick={() => window.location.href='/dashboard/agents'} className="text-xs text-gray-400 hover:text-lv-navy">See all →</button>
              </div>
              {agentList.length === 0 ? (
                <div className="p-5 text-center text-sm text-gray-400">Loading agents...</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {agentList.map(agent => (
                    <div key={agent.slug} className="px-5 py-3 flex items-center gap-3">
                      <div className={`status-dot ${agent.status}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">{agent.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium"
                            style={{ background: DEPT_COLORS[agent.department] || '#888' }}>
                            {agent.department}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 truncate mt-0.5">
                          {agent.current_task || (agent.status === 'idle' ? 'Waiting for tasks' : 'Working...')}
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-400 capitalize flex-shrink-0">{agent.status}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent messages */}
          <div className="lv-card shadow-lv flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Live office feed</div>
              <button onClick={() => window.location.href='/dashboard/live-office'} className="text-xs text-gray-400 hover:text-lv-navy">Open →</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {recentMessages.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400">
                  <div className="text-2xl mb-2">💬</div>
                  Agent messages will appear here
                </div>
              ) : recentMessages.map(msg => (
                <div key={msg.id} className="text-xs">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-medium text-gray-700">{msg.from_agent_name}</span>
                    {msg.to_agent_name && <><span className="text-gray-300">→</span><span className="text-gray-500">{msg.to_agent_name}</span></>}
                    <span className="ml-auto text-gray-300 text-[10px]">
                      {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-gray-600 leading-relaxed line-clamp-2 bg-gray-50 rounded-lg px-2.5 py-2 border border-gray-100">
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
