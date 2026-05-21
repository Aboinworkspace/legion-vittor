'use client'
import { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import toast from 'react-hot-toast'

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)}
      className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${on ? 'bg-lv-navy' : 'bg-gray-200'}`}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? 'right-0.5' : 'left-0.5'}`} />
    </button>
  )
}

function SettingRow({ title, sub, control }: { title: string; sub: string; control: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-gray-100 last:border-b-0">
      <div className="flex-1 pr-6">
        <div className="text-sm font-medium text-lv-navy">{title}</div>
        <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
      </div>
      {control}
    </div>
  )
}

export default function SettingsPage() {
  const [s, setS] = useState({
    autonomous_mode: true,
    self_healing: true,
    inter_dept_comms: true,
    rnd_skill_updates: true,
    content_approval_gate: false,
    daily_digest: true,
    escalation_minutes: '30',
    digest_channel: 'Telegram',
  })

  const toggle = (key: string) => setS(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))

  const save = () => toast.success('Settings saved')

  return (
    <AppLayout>
      <div className="p-6 max-w-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-display text-xl font-bold text-lv-navy">Settings</h1>
            <p className="text-sm text-gray-400 mt-0.5">Configure your virtual office behaviour</p>
          </div>
          <button onClick={save} className="btn-primary">Save changes</button>
        </div>

        {/* Tabs */}
        {['General', 'Credentials', 'Notifications', 'Brand'].map((tab, i) => (
          <span key={tab} className={`inline-block text-xs px-3 py-1.5 mr-1 mb-4 rounded-lg border cursor-pointer transition-colors ${
            i === 0 ? 'bg-lv-navy text-white border-lv-navy' : 'border-gray-200 text-gray-500 hover:border-lv-navy'
          }`}>{tab}</span>
        ))}

        <div className="bg-white rounded-xl border border-gray-200 shadow-lv px-5">
          <SettingRow title="Autonomous mode" sub="All agents run without any human input required"
            control={<Toggle on={s.autonomous_mode} onChange={() => toggle('autonomous_mode')} />} />
          <SettingRow title="Self-healing" sub="Auto-restart failed agents and reroute broken tasks"
            control={<Toggle on={s.self_healing} onChange={() => toggle('self_healing')} />} />
          <SettingRow title="Inter-department communication" sub="Allow agents to send messages to other departments"
            control={<Toggle on={s.inter_dept_comms} onChange={() => toggle('inter_dept_comms')} />} />
          <SettingRow title="R&D auto-skill updates" sub="R&D agent can suggest new skills to agents automatically"
            control={<Toggle on={s.rnd_skill_updates} onChange={() => toggle('rnd_skill_updates')} />} />
          <SettingRow title="Content approval gate" sub="Pause before publishing — require your approval first"
            control={<Toggle on={s.content_approval_gate} onChange={() => toggle('content_approval_gate')} />} />
          <SettingRow title="Human escalation threshold" sub="Notify you when a task is stuck for too long"
            control={
              <select className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-lv-navy"
                value={s.escalation_minutes} onChange={e => setS(p => ({ ...p, escalation_minutes: e.target.value }))}>
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="60">60 min</option>
              </select>
            } />
          <SettingRow title="Daily digest" sub="Receive a summary of all agent activity every morning"
            control={<Toggle on={s.daily_digest} onChange={() => toggle('daily_digest')} />} />
          <SettingRow title="Digest channel" sub="Where to receive your daily company summary"
            control={
              <select className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-lv-navy"
                value={s.digest_channel} onChange={e => setS(p => ({ ...p, digest_channel: e.target.value }))}>
                <option>Telegram</option>
                <option>Email</option>
                <option>Slack</option>
              </select>
            } />
        </div>

        {/* Danger zone */}
        <div className="mt-6 bg-red-50 rounded-xl border border-red-200 px-5 py-4">
          <div className="text-sm font-medium text-red-700 mb-1">Danger zone</div>
          <div className="text-xs text-red-500 mb-3">These actions cannot be undone.</div>
          <button className="text-xs text-red-600 border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
            Reset all agents to defaults
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
