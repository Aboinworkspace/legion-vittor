'use client'
import { useState, useRef, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { useLVStore } from '@/lib/store'
import { useOfficeWS } from '@/hooks/useOfficeWS'
import { AgentMessage } from '@/types'
import { Send, Pause, Zap, Eye, Hash, AtSign, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const CHANNELS = [
  { id: 'all-departments', name: 'All departments', icon: '🏢' },
  { id: 'leadership', name: 'Leadership', color: '#7F77DD' },
  { id: 'engineering', name: 'Engineering', color: '#378ADD' },
  { id: 'marketing', name: 'Marketing', color: '#BA7517' },
  { id: 'support', name: 'Support', color: '#3B6D11' },
]

const AGENT_ROSTER = [
  { name: 'CEO agent', dept: 'Leadership', color: '#EEEDFE', border: '#534AB7', text: '#3C3489' },
  { name: 'Manager agent', dept: 'Leadership', color: '#EEEDFE', border: '#534AB7', text: '#3C3489' },
  { name: 'Developer agent', dept: 'Engineering', color: '#E6F1FB', border: '#185FA5', text: '#0C447C' },
  { name: 'Marketing agent', dept: 'Marketing', color: '#FAEEDA', border: '#854F0B', text: '#633806' },
  { name: 'Support agent', dept: 'Support', color: '#EAF3DE', border: '#3B6D11', text: '#27500A' },
]

const MSG_TYPE_STYLES: Record<string, string> = {
  broadcast: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  handoff: 'bg-amber-50 text-amber-700 border border-amber-200',
  alert: 'bg-red-50 text-red-600 border border-red-200',
  update: 'bg-blue-50 text-blue-700 border border-blue-200',
  message: 'bg-gray-100 text-gray-500',
}

function AgentBubble({ msg }: { msg: AgentMessage }) {
  const rosterItem = AGENT_ROSTER.find(a => a.name === msg.from_agent_name)
  const isUser = msg.is_user_message

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400">
            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
          </span>
          <span className="text-xs font-medium text-lv-navy">You (owner)</span>
          <div className="w-6 h-6 rounded-md bg-lv-navy flex items-center justify-center text-lv-gold text-[9px] font-bold font-display">LV</div>
        </div>
        <div className="msg-bubble user max-w-[80%]">{msg.content}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold flex-shrink-0"
          style={{ background: rosterItem?.color || '#f0f0f0', border: `1px solid ${rosterItem?.border || '#ccc'}`, color: rosterItem?.text || '#666' }}>
          {msg.from_agent_name?.slice(0, 2).toUpperCase()}
        </div>
        <span className="text-xs font-medium" style={{ color: rosterItem?.text || '#1a1f4e' }}>
          {msg.from_agent_name}
        </span>
        {msg.to_agent_name && (
          <>
            <ArrowRight size={10} className="text-gray-400" />
            <span className="text-xs text-gray-500">{msg.to_agent_name}</span>
          </>
        )}
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ml-1 ${MSG_TYPE_STYLES[msg.message_type] || MSG_TYPE_STYLES.message}`}>
          {msg.message_type}
        </span>
        <span className="text-[10px] text-gray-300 ml-auto">
          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
        </span>
      </div>
      <div className="msg-bubble agent ml-8">{msg.content}
        {msg.attachment && (
          <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-500 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-200">
            📎 {msg.attachment.name}
          </div>
        )}
      </div>
    </div>
  )
}

function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-400 py-1">
      <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-500">
        {name.slice(0, 2).toUpperCase()}
      </div>
      <span>{name} is typing</span>
      <div className="flex gap-0.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  )
}

export default function OfficePage() {
  const { messages, activeChannel, setActiveChannel, user } = useLVStore()
  const { sendMessage } = useOfficeWS()
  const [input, setInput] = useState('')
  const [watchOnly, setWatchOnly] = useState(false)
  const [typing] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || watchOnly) return
    sendMessage(input.trim())
    setInput('')
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const filteredMessages = activeChannel === 'all-departments'
    ? messages
    : messages.filter(m => m.channel === activeChannel || m.from_department?.toLowerCase() === activeChannel)

  return (
    <AppLayout>
      <div className="flex h-full" style={{ height: 'calc(100vh - 0px)' }}>

        {/* Channels sidebar */}
        <div className="w-44 border-r border-gray-200 bg-white flex flex-col flex-shrink-0">
          <div className="px-3 py-3 border-b border-gray-200">
            <div className="text-xs font-medium text-lv-navy">Channels</div>
            <div className="text-[10px] text-gray-400">{CHANNELS.length} active</div>
          </div>
          <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
            <div className="text-[9px] text-gray-400 px-2 py-1 uppercase tracking-wider">Company-wide</div>
            {CHANNELS.map(ch => (
              <button key={ch.id}
                onClick={() => setActiveChannel(ch.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                  activeChannel === ch.id
                    ? 'bg-lv-navy text-white'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-lv-navy'
                }`}>
                {ch.icon ? (
                  <span className="text-sm">{ch.icon}</span>
                ) : (
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ch.color }} />
                )}
                <span className="truncate">{ch.name}</span>
              </button>
            ))}

            <div className="text-[9px] text-gray-400 px-2 py-1 uppercase tracking-wider mt-2">Direct</div>
            {AGENT_ROSTER.slice(0, 3).map(a => (
              <button key={a.name}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-100 hover:text-lv-navy transition-colors">
                <span className="text-sm">👤</span>
                <span className="truncate">{a.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0">
            <span className="text-lg">🏢</span>
            <div className="flex-1">
              <div className="text-sm font-medium text-lv-navy">
                {CHANNELS.find(c => c.id === activeChannel)?.name || 'All departments'}
              </div>
              <div className="text-xs text-gray-400">
                {storeAgents?.length || 5} agents · real-time feed
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWatchOnly(!watchOnly)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  watchOnly
                    ? 'bg-lv-navy text-white border-lv-navy'
                    : 'border-gray-200 text-gray-500 hover:border-lv-navy hover:text-lv-navy'
                }`}>
                <Eye size={12} />
                {watchOnly ? 'Watching' : 'Watch only'}
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <div className="msg-bubble system">
              Office opened · {user?.company_name || 'Legion Vittor'} virtual office · {AGENT_ROSTER.length} agents active
            </div>

            {filteredMessages.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-3xl mb-2">🏢</div>
                <p className="text-sm text-gray-400">No messages yet.</p>
                <p className="text-xs text-gray-300 mt-1">Send a prompt to start the agents working.</p>
              </div>
            ) : (
              filteredMessages.map(msg => (
                <AgentBubble key={msg.id} msg={msg} />
              ))
            )}

            {typing.map(name => <TypingIndicator key={name} name={name} />)}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {!watchOnly && (
            <div className="border-t border-gray-200 bg-white px-4 py-3 flex-shrink-0">
              <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                <Zap size={10} />
                You are the owner — agents prioritise your messages
              </div>
              <div className="flex gap-2 items-end">
                <textarea
                  rows={2}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Message all departments or a specific agent... (Enter to send)"
                  className="flex-1 resize-none text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-lv-navy transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="bg-lv-navy text-white p-2.5 rounded-xl hover:bg-indigo-900 transition-colors disabled:opacity-40 flex-shrink-0">
                  <Send size={15} />
                </button>
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {[
                  { icon: AtSign, label: 'Mention agent' },
                  { icon: Hash, label: 'Switch channel' },
                  { icon: Pause, label: 'Pause agent' },
                  { icon: Zap, label: 'Priority override' },
                ].map(({ icon: Icon, label }) => (
                  <button key={label}
                    className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border border-gray-200 text-gray-400 hover:border-lv-navy hover:text-lv-navy transition-colors">
                    <Icon size={10} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Agent roster */}
        <div className="w-52 border-l border-gray-200 bg-white flex flex-col flex-shrink-0">
          <div className="px-3 py-3 border-b border-gray-200">
            <div className="text-xs font-medium text-lv-navy">Online now</div>
            <div className="text-[10px] text-gray-400">{AGENT_ROSTER.length} agents</div>
          </div>
          <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
            {AGENT_ROSTER.map(a => (
              <div key={a.name}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="w-6 h-6 rounded-md flex items-center justify-center text-[8px] font-bold flex-shrink-0"
                  style={{ background: a.color, border: `1px solid ${a.border}`, color: a.text }}>
                  {a.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-lv-navy truncate">{a.name}</div>
                  <div className="text-[9px] text-gray-400 truncate">{a.dept}</div>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
              </div>
            ))}
          </div>

          {/* Today's stats */}
          <div className="border-t border-gray-200 p-3 space-y-1.5">
            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">Today</div>
            {[
              { label: 'Messages', value: messages.length },
              { label: 'Broadcasts', value: messages.filter(m => m.message_type === 'broadcast').length },
              { label: 'Handoffs', value: messages.filter(m => m.message_type === 'handoff').length },
            ].map(s => (
              <div key={s.label} className="flex justify-between items-center text-xs">
                <span className="text-gray-400">{s.label}</span>
                <span className="font-medium text-lv-navy">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  )
}

// Need to add this for the dashboard
const storeAgents: any[] = []
