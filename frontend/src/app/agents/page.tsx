'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { agents as agentsApi } from '@/lib/api'
import { Agent } from '@/types'
import toast from 'react-hot-toast'
import { Plus, X, Play, Loader2 } from 'lucide-react'

const DEPT_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Leadership:          { bg: '#EEEDFE', text: '#3C3489', border: '#534AB7' },
  Engineering:         { bg: '#E6F1FB', text: '#0C447C', border: '#185FA5' },
  'Marketing & Sales': { bg: '#FAEEDA', text: '#633806', border: '#854F0B' },
  Support:             { bg: '#EAF3DE', text: '#27500A', border: '#3B6D11' },
  Analytics:           { bg: '#EAF3DE', text: '#27500A', border: '#3B6D11' },
}

function AgentCard({ agent, onRun }: { agent: Agent & { skills: string[] }, onRun: (agent: Agent) => void }) {
  const [skills, setSkills] = useState<string[]>(agent.skills || [])
  const [newSkill, setNewSkill] = useState('')
  const [expanded, setExpanded] = useState(false)
  const style = DEPT_STYLES[agent.department] || { bg: '#f5f5f5', text: '#333', border: '#ccc' }

  const addSkill = async () => {
    if (!newSkill.trim()) return
    try {
      await agentsApi.addSkill(agent.slug, newSkill.trim())
      setSkills(s => [...s, newSkill.trim()])
      setNewSkill('')
      toast.success(`Skill added to ${agent.name}`)
    } catch { toast.error('Failed to add skill') }
  }

  const removeSkill = async (skill: string) => {
    try {
      await agentsApi.removeSkill(agent.slug, skill)
      setSkills(s => s.filter(x => x !== skill))
    } catch { toast.error('Failed to remove skill') }
  }

  const statusColor = agent.status === 'active' ? '#3B6D11' : agent.status === 'busy' ? '#BA7517' : '#aaa'

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lv overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: statusColor }} />
            <div>
              <div className="text-sm font-medium text-lv-navy">{agent.name}</div>
              <div className="text-xs text-gray-400 mt-0.5">{agent.description}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <span className="text-[10px] px-1.5 py-0.5 rounded-full border font-medium"
              style={{ background: style.bg, color: style.text, borderColor: style.border }}>
              {agent.department}
            </span>
            <button
              onClick={e => { e.stopPropagation(); onRun(agent) }}
              className="p-1.5 rounded-lg bg-lv-navy text-white hover:bg-indigo-900 transition-colors">
              <Play size={11} />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-4 mt-2.5">
          {[
            { l: 'Tasks done', v: agent.tasks_completed || 0 },
            { l: 'Today', v: agent.tasks_today || 0 },
            { l: 'Success', v: `${agent.success_rate || 100}%` },
          ].map(s => (
            <div key={s.l}>
              <div className="text-xs font-medium text-lv-navy">{s.v}</div>
              <div className="text-[10px] text-gray-400">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills */}
      {expanded && (
        <div className="p-4">
          <div className="text-xs font-medium text-gray-500 mb-2">Skills</div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {skills.map(skill => (
              <span key={skill}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 group">
                {skill}
                <button onClick={() => removeSkill(skill)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5">
                  <X size={9} className="text-gray-400 hover:text-red-500" />
                </button>
              </span>
            ))}
            <button
              onClick={() => document.getElementById(`skill-input-${agent.slug}`)?.focus()}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-dashed border-gray-300 text-gray-400 hover:border-lv-navy hover:text-lv-navy transition-colors">
              <Plus size={9} /> Add skill
            </button>
          </div>
          <div className="flex gap-2">
            <input
              id={`skill-input-${agent.slug}`}
              value={newSkill}
              onChange={e => setNewSkill(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSkill()}
              placeholder="Type a skill e.g. Docker, TypeScript…"
              className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-lv-navy"
            />
            <button onClick={addSkill}
              className="text-xs bg-lv-navy text-white px-3 py-1.5 rounded-lg hover:bg-indigo-900 transition-colors">
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function RunTaskModal({ agent, onClose }: { agent: Agent | null; onClose: () => void }) {
  const [task, setTask] = useState('')
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  if (!agent) return null

  const run = async () => {
    if (!task.trim()) return
    setLoading(true)
    setResult('')
    try {
      const res = await agentsApi.run(agent.slug, task)
      setResult(res.data.output || 'Task completed.')
      toast.success(`${agent.name} completed the task`)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Task failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-2xl shadow-lv-lg w-full max-w-lg border border-gray-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <div className="font-medium text-lv-navy">{agent.name}</div>
            <div className="text-xs text-gray-400">{agent.department}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Give this agent a task</label>
            <textarea
              rows={3}
              value={task}
              onChange={e => setTask(e.target.value)}
              placeholder={`e.g. ${agent.slug === 'developer_agent' ? 'Write a Python function to parse JSON files' :
                agent.slug === 'marketing_agent' ? 'Write an Instagram post about AI automation' :
                'Summarise the key tasks for this week'}`}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-lv-navy resize-none"
            />
          </div>
          {result && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 max-h-60 overflow-y-auto">
              <div className="text-xs font-medium text-gray-500 mb-2">Output:</div>
              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">{result}</pre>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-5 pb-5">
          <button onClick={onClose} className="text-sm text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
            Cancel
          </button>
          <button onClick={run} disabled={loading || !task.trim()}
            className="text-sm bg-lv-navy text-white px-5 py-2 rounded-xl hover:bg-indigo-900 transition-colors disabled:opacity-50 flex items-center gap-2">
            {loading ? <><Loader2 size={13} className="animate-spin" /> Running…</> : '▶ Run task'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AgentsPage() {
  const [agentList, setAgentList] = useState<(Agent & { skills: string[] })[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    agentsApi.list().then(res => {
      setAgentList(res.data.agents || [])
    }).catch(() => {
      // Demo data
      setAgentList([
        { id: '1', name: 'CEO agent', slug: 'ceo_agent', department: 'Leadership', status: 'idle', description: 'Sets strategic vision and company goals', skills: ['Strategic vision', 'Goal setting', 'Roadmap'], tasks_completed: 24, tasks_today: 3, success_rate: 100 },
        { id: '2', name: 'Manager agent', slug: 'manager_agent', department: 'Leadership', status: 'idle', description: 'Orchestrates all departments and delegates tasks', skills: ['Delegation', 'Coordination', 'Reporting'], tasks_completed: 88, tasks_today: 12, success_rate: 98 },
        { id: '3', name: 'Developer agent', slug: 'developer_agent', department: 'Engineering', status: 'active', description: 'Writes and ships production-ready code', current_task: 'Writing auth API endpoint', skills: ['Python', 'JavaScript', 'FastAPI', 'React'], tasks_completed: 148, tasks_today: 12, success_rate: 99 },
        { id: '4', name: 'Marketing agent', slug: 'marketing_agent', department: 'Marketing & Sales', status: 'busy', description: 'Creates campaigns, copy, and content strategy', current_task: 'Writing reel script', skills: ['Copywriting', 'Instagram', 'SEO', 'Email'], tasks_completed: 92, tasks_today: 8, success_rate: 97 },
        { id: '5', name: 'Support agent', slug: 'support_agent', department: 'Support', status: 'idle', description: 'Handles customer queries and documentation', skills: ['FAQ handling', 'README', 'Bug detection'], tasks_completed: 56, tasks_today: 4, success_rate: 100 },
      ] as any)
    }).finally(() => setLoading(false))
  }, [])

  const depts = ['All', ...Array.from(new Set(agentList.map(a => a.department)))]
  const filtered = filter === 'All' ? agentList : agentList.filter(a => a.department === filter)

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-display text-xl font-bold text-lv-navy">Agents</h1>
            <p className="text-sm text-gray-400 mt-0.5">{agentList.length} agents · click to expand skills</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {depts.map(d => (
              <button key={d} onClick={() => setFilter(d)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  filter === d ? 'bg-lv-navy text-white border-lv-navy' : 'border-gray-200 text-gray-500 hover:border-lv-navy'
                }`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 h-32 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map(agent => (
              <AgentCard key={agent.id} agent={agent} onRun={setSelectedAgent} />
            ))}
          </div>
        )}
      </div>

      {selectedAgent && (
        <RunTaskModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
      )}
    </AppLayout>
  )
}
