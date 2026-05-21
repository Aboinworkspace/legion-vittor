'use client'
import { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { useLVStore } from '@/lib/store'
import toast from 'react-hot-toast'

const SETTINGS = [
  { key: 'autonomous_mode',     label: 'Autonomous mode',           sub: 'All agents run without human input', default: true },
  { key: 'self_healing',        label: 'Self-healing',              sub: 'Auto-restart failed agents and reroute tasks', default: true },
  { key: 'inter_dept_comms',    label: 'Inter-department comms',    sub: 'Allow agents to message other departments', default: true },
  { key: 'rnd_auto_skills',     label: 'R&D auto-skill updates',    sub: 'R&D can suggest new skills to agents', default: true },
  { key: 'content_approval',    label: 'Content approval gate',     sub: 'Pause before publishing — require your approval', default: false },
  { key: 'daily_digest',        label: 'Daily digest',              sub: 'Receive a morning summary of all activity', default: true },
]

export default function SettingsPage() {
  const { user } = useLVStore()
  const [toggles, setToggles] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SETTINGS.map(s => [s.key, s.default]))
  )
  const [digestChannel, setDigestChannel] = useState('email')
  const [threshold, setThreshold] = useState('30')

  const toggle = (key: string) => {
    setToggles(t => ({ ...t, [key]: !t[key] }))
    toast.success('Setting updated')
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-lv-navy">Settings</h1>
          <p className="text-sm text-gray-400 mt-0.5">Configure how your virtual office operates</p>
        </div>

        {/* Profile */}
        <div className="lv-card p-5 shadow-lv mb-5">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Account</div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-lv-navy rounded-xl flex items-center justify-center font-display font-bold text-lv-gold text-lg">
              {user?.full_name?.[0] || 'L'}
            </div>
            <div>
              <div className="font-medium text-gray-800">{user?.full_name || 'Owner'}</div>
              <div className="text-sm text-gray-400">{user?.email}</div>
              <div className="text-xs text-gray-400 mt-0.5">{user?.company_name}</div>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="lv-card shadow-lv mb-5">
          <div className="px-5 py-3 border-b border-gray-100">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">General</div>
          </div>
          <div className="divide-y divide-gray-50">
            {SETTINGS.map(s => (
              <div key={s.key} className="flex items-center justify-between px-5 py-4">
                <div>
                  <div className="text-sm font-medium text-gray-800">{s.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
                </div>
                <button
                  onClick={() => toggle(s.key)}
                  className={`w-10 h-5 rounded-full relative transition-colors flex-shrink-0 ${toggles[s.key] ? 'bg-lv-navy' : 'bg-gray-200'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${toggles[s.key] ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Config selects */}
        <div className="lv-card shadow-lv mb-5">
          <div className="px-5 py-3 border-b border-gray-100">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Configuration</div>
          </div>
          <div className="divide-y divide-gray-50">
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <div className="text-sm font-medium text-gray-800">Escalation threshold</div>
                <div className="text-xs text-gray-400 mt-0.5">Notify you when a task is stuck longer than this</div>
              </div>
              <select value={threshold} onChange={e => setThreshold(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white outline-none focus:border-lv-navy">
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="60">60 min</option>
              </select>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <div className="text-sm font-medium text-gray-800">Digest channel</div>
                <div className="text-xs text-gray-400 mt-0.5">Where to send your daily company summary</div>
              </div>
              <select value={digestChannel} onChange={e => setDigestChannel(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white outline-none focus:border-lv-navy">
                <option value="email">Email</option>
                <option value="telegram">Telegram</option>
                <option value="slack">Slack</option>
              </select>
            </div>
          </div>
        </div>

        {/* Credentials placeholder */}
        <div className="lv-card p-5 shadow-lv">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">API Credentials</div>
          <p className="text-sm text-gray-400 mb-3">Update your API keys here. Changes take effect immediately.</p>
          <button className="btn-primary py-2 px-5" onClick={() => toast.success('Coming in full build')}>
            Manage credentials →
          </button>
        </div>

      </div>
    </AppLayout>
  )
}
