'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { agents as agentsApi } from '@/lib/api'
import { Agent } from '@/types'
import toast from 'react-hot-toast'

const DEPT_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  Leadership:          { bg: '#EEEDFE', border: '#534AB7', text: '#3C3489' },
  Engineering:         { bg: '#E6F1FB', border: '#185FA5', text: '#0C447C' },
  'Marketing & Sales': { bg: '#FAEEDA', border: '#854F0B', text: '#633806' },
  Support:             { bg: '#EAF3DE', border: '#3B6D11', text: '#27500A' },
}

const STATUS_DOT: Record<string, string> = {
  active: 'bg-green-600', busy: 'bg-amber-500',
  idle: 'bg-gray-300', error: 'bg-red-500', paused: 'bg-gray-400',
}

const AGENT_ICONS: Record<string, string> = {
  ceo_agent: '👑', manager_agent: '📋', developer_agent: '⚙️',
  marketing_agent: '📣', support_agent: '🎧',
}

export default function AgentsPage() {
  const [agentList, setAgentList] = useState<Agent[]>([])
  const [selected, setSelected] = useState<Agent | null>(null)
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')
  const [taskInput, setTaskInput] = useState('')
  const [taskResult, setTaskResult] = useState('')
  const [running, setRunning] = useState(false)

  useEffect(() => {
    agentsApi.list().then(r => { setAgentList(r.data.agents); if (r.data.agents[0]) selectAgent(r.data.agents[0]) }).catch(() => {})
  }, [])

  const selectAgent = async (agent: Agent) => {
    setSelected(agent)
    setTaskResult('')
    try {
      const r = await agentsApi.getSkills(agent.slug)
      setSkills(r.data.skills)
    } catch { setSkills(agent.skills || []) }
  }

  const addSkill = async () => {
    if (!newSkill.trim() || !selected) return
    try {
      await agentsApi.addSkill(selected.slug, newSkill)
      setSkills(s => [...s, newSkill])
      setNewSkill('')
      toast.success(`Skill added to ${selected.name}`)
    } catch { toast.error('Failed to add skill') }
  }

  const removeSkill = async (skill: string) => {
    if (!selected) return
    try {
      await agentsApi.removeSkill(selected.slug, skill)
      setSkills(s => s.filter(x => x !== skill))
    } catch { toast.error('Failed to remove skill') }
  }

  const runTask = async () => {
    if (!taskInput.trim() || !selected) return
    setRunning(true)
    try {
      const r = await agentsApi.run(selected.slug, taskInput)
      setTaskResult(r.data.output || 'No output')
    } catch { toast.error('Task failed') } finally { setRunning(false) }
  }

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-48px)] overflow-hidden">

        {/* Agent list */}
        <div className="w-56 border-r border-gray-200 bg-white flex flex-col flex-shrink-0">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">All agents</div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {agentList.map(agent => {
              const style = DEPT_STYLES[agent.department] || DEPT_STYLES.Leadership
              return (
                <button key={agent.slug} onClick={() => selectAgent(agent)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all ${selected?.slug === agent.slug ? 'bg-lv-navy text-white' : 'hover:bg-gray-50 text-gray-700'}`}>
                  <span className="text-base">{AGENT_ICONS[agent.slug] || '🤖'}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-medium truncate ${selected?.slug === agent.slug ? 'text-white' : 'text-gray-800'}`}>{agent.name}</div>
                    <div className={`text-[10px] truncate ${selected?.slug === agent.slug ? 'text-blue-200' : 'text-gray-400'}`}>{agent.department}</div>
                  </div>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[agent.status || 'idle']}`} />
                </button>
              )
            })}
          </div>
        </div>

        {/* Agent detail */}
        {selected ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-5">

              {/* Agent header */}
              <div className="lv-card p-5 shadow-lv flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ background: DEPT_STYLES[selected.department]?.bg || '#f3f4f6', border: `1px solid ${DEPT_STYLES[selected.department]?.border || '#e5e7eb'}` }}>
                  {AGENT_ICONS[selected.slug] || '🤖'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-display text-lg font-bold text-lv-navy">{selected.name}</h2>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: DEPT_STYLES[selected.department]?.bg, color: DEPT_STYLES[selected.department]?.text, border: `1px solid ${DEPT_STYLES[selected.department]?.border}` }}>
                      {selected.department}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${selected.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                      {selected.status || 'idle'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{selected.description}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Tasks completed', value: selected.tasks_completed || 0 },
                  { label: 'Today', value: selected.tasks_today || 0 },
                  { label: 'Success rate', value: `${selected.success_rate || 100}%` },
                  { label: 'Avg response', value: `${selected.avg_response_seconds || 2}s` },
                ].map(s => (
                  <div key={s.label} className="lv-card p-3 text-center shadow-lv">
                    <div className="font-display text-xl font-bold text-lv-navy">{s.value}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Skills editor */}
              <div className="lv-card p-5 shadow-lv">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Skills</div>
                  <div className="text-[10px] text-gray-400">{skills.length} skills · editable</div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4 min-h-[40px]">
                  {skills.map(skill => (
                    <span key={skill} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-gray-600 hover:border-gray-300 group">
                      {skill}
                      <button onClick={() => removeSkill(skill)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity text-xs leading-none">×</button>
                    </span>
                  ))}
                  {skills.length === 0 && <span className="text-sm text-gray-400">No skills yet</span>}
                </div>
                <div className="flex gap-2">
                  <input
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-lv-navy"
                    placeholder="Add a skill e.g. TypeScript, Cold email writing..."
                    value={newSkill}
                    onChange={e => setNewSkill(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addSkill()}
                  />
                  <button onClick={addSkill} className="btn-primary px-4">+ Add</button>
                </div>
              </div>

              {/* Run a task */}
              <div className="lv-card p-5 shadow-lv">
                <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-3">Run a task</div>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lv-navy resize-none mb-3"
                  rows={3}
                  placeholder={`Give ${selected.name} a specific task...`}
                  value={taskInput}
                  onChange={e => setTaskInput(e.target.value)}
                />
                <button onClick={runTask} disabled={running || !taskInput.trim()} className="btn-primary w-full py-2.5 disabled:opacity-50">
                  {running ? '⏳ Running...' : `→ Run on ${selected.name}`}
                </button>
                {taskResult && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Output from {selected.name}</div>
                    {taskResult}
                  </div>
                )}
              </div>

            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-3">◈</div>
              <div className="text-sm">Select an agent to view details</div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
