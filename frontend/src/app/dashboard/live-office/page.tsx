'use client'
import { useState, useRef, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { useLVStore } from '@/lib/store'
import { useOfficeRealtime } from '@/hooks/useOfficeRealtime'
import { AgentMessage } from '@/types'

const CHANNELS = [
  { id: 'all-departments', name: 'All departments',    icon: '🏢' },
  { id: 'leadership',      name: 'Leadership',          icon: '👑' },
  { id: 'engineering',     name: 'Engineering',         icon: '⚙️' },
  { id: 'marketing',       name: 'Marketing & Sales',   icon: '📣' },
  { id: 'support',         name: 'Support',             icon: '🎧' },
]

const MSG_TYPE_COLORS: Record<string, string> = {
  message:   'bg-blue-50 text-blue-700 border-blue-200',
  broadcast: 'bg-purple-50 text-purple-700 border-purple-200',
  handoff:   'bg-amber-50 text-amber-700 border-amber-200',
  alert:     'bg-red-50 text-red-700 border-red-200',
  update:    'bg-green-50 text-green-700 border-green-200',
}

const DEPT_BG: Record<string, string> = {
  Leadership: '#EEEDFE', Engineering: '#E6F1FB',
  'Marketing & Sales': '#FAEEDA', Support: '#EAF3DE',
}
const DEPT_BORDER: Record<string, string> = {
  Leadership: '#534AB7', Engineering: '#185FA5',
  'Marketing & Sales': '#854F0B', Support: '#3B6D11',
}
const DEPT_TEXT: Record<string, string> = {
  Leadership: '#3C3489', Engineering: '#0C447C',
  'Marketing & Sales': '#633806', Support: '#27500A',
}

const AGENTS = [
  { name: 'CEO agent',       slug: 'ceo_agent',       dept: 'Leadership',         status: 'idle',   task: 'Monitoring' },
  { name: 'Manager agent',   slug: 'manager_agent',   dept: 'Leadership',         status: 'active', task: 'Coordinating' },
  { name: 'Developer agent', slug: 'developer_agent', dept: 'Engineering',        status: 'idle',   task: 'Waiting' },
  { name: 'Marketing agent', slug: 'marketing_agent', dept: 'Marketing & Sales',  status: 'idle',   task: 'Waiting' },
  { name: 'Support agent',   slug: 'support_agent',   dept: 'Support',            status: 'idle',   task: 'Monitoring' },
]

function MessageBubble({ msg }: { msg: AgentMessage }) {
  const isUser = msg.is_user_message
  if (msg.from_agent_name === 'system') {
    return (
      <div className="text-center py-1">
        <span className="text-[10px] text-gray-400 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">{msg.content}</span>
      </div>
    )
  }
  return (
    <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
      <div className="flex items-center gap-2 px-1">
        {!isUser && (
          <>
            <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px]"
              style={{ background: DEPT_BG[msg.from_department || ''] || '#f3f4f6', border: `1px solid ${DEPT_BORDER[msg.from_department || ''] || '#e5e7eb'}` }}>
              {msg.from_agent_name[0]}
            </div>
            <span className="text-xs font-medium" style={{ color: DEPT_TEXT[msg.from_department || ''] || '#374151' }}>
              {msg.from_agent_name}
            </span>
            {msg.to_agent_name && (
              <><span className="text-gray-300 text-xs">→</span>
              <span className="text-xs text-gray-500">{msg.to_agent_name}</span></>
            )}
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${MSG_TYPE_COLORS[msg.message_type] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
              {msg.message_type}
            </span>
          </>
        )}
        {isUser && <span className="text-xs font-medium text-lv-navy">You (owner)</span>}
        <span className="text-[10px] text-gray-300 ml-auto">
          {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className={`msg-bubble ${isUser ? 'user' : 'agent'}`}>
        <p className="whitespace-pre-wrap">{msg.content}</p>
      </div>
    </div>
  )
}

export default function LiveOfficePage() {
  const { messages, activeChannel, setActiveChannel } = useLVStore()
  const { sendMessage, connected } = useOfficeRealtime()
  const [input, setInput] = useState('')
  const [targetAgent, setTargetAgent] = useState<string | undefined>()
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || sending) return
    const content = input
    const target = targetAgent
    setInput('')
    setSending(true)
    try {
      await sendMessage(content, target)
    } finally {
      setTimeout(() => setSending(false), 1500)
    }
  }

  const channelMessages = messages.filter(
    m => activeChannel === 'all-departments' || m.channel === activeChannel || m.from_department?.toLowerCase() === activeChannel
  )

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-48px)] overflow-hidden">

        <div className="w-44 border-r border-gray-200 bg-white flex flex-col flex-shrink-0">
          <div className="px-3 py-3 border-b border-gray-100">
            <div className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Channels</div>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            <div className="px-2 py-1">
              <div className="text-[9px] text-gray-400 uppercase tracking-wide px-2 py-1">Company</div>
              {CHANNELS.map(ch => (
                <button key={ch.id} onClick={() => setActiveChannel(ch.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors text-left mb-0.5 ${
                    activeChannel === ch.id ? 'bg-lv-navy text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}>
                  <span className="text-sm">{ch.icon}</span>
                  <span className="truncate">{ch.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-200 bg-white flex-shrink-0">
            <span className="text-xl">{CHANNELS.find(c => c.id === activeChannel)?.icon || '💬'}</span>
            <div>
              <div className="text-sm font-medium text-gray-800">{CHANNELS.find(c => c.id === activeChannel)?.name || activeChannel}</div>
              <div className="text-xs text-gray-400">All 5 agents · {connected ? 'Live ⚡' : 'Connecting...'}</div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${connected ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-600 pulse-dot' : 'bg-amber-500'}`} />
                {connected ? 'Live realtime' : 'Connecting'}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-lv-bg">
            {channelMessages.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <div className="text-4xl mb-3">💬</div>
                <div className="text-sm font-medium mb-1">Your virtual office is running</div>
                <div className="text-xs">Type a message below to talk to your agents</div>
                <div className="mt-4 text-xs text-gray-300">Agent responses take 15-30 seconds (LLM thinking time)</div>
              </div>
            )}
            {channelMessages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-xs text-gray-400 px-2">
                <div className="flex gap-1">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
                <span>Agents are working...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-200 bg-white p-4 flex-shrink-0">
            <div className="text-[10px] text-gray-400 mb-2 flex items-center gap-1.5">
              <span>👑</span> You are the owner — agents prioritise your messages
              {targetAgent && (
                <span className="ml-2 bg-lv-navy text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                  @{targetAgent}
                  <button onClick={() => setTargetAgent(undefined)} className="ml-1 opacity-70 hover:opacity-100">×</button>
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <input
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lv-navy"
                placeholder={targetAgent ? `Message ${targetAgent}...` : 'Type a task or message...'}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !sending && handleSend()}
                disabled={sending}
              />
              <button onClick={handleSend} disabled={!input.trim() || sending} className="btn-primary px-4 disabled:opacity-50">
                {sending ? '...' : 'Send'}
              </button>
            </div>
            <div className="flex gap-2 mt-2.5 flex-wrap">
              {AGENTS.map(a => (
                <button key={a.slug} onClick={() => setTargetAgent(a.slug)}
                  className={`text-[10px] px-2 py-1 rounded-full border ${targetAgent === a.slug ? 'bg-lv-navy text-white border-lv-navy' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border-gray-200'}`}>
                  @{a.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="w-52 border-l border-gray-200 bg-white flex flex-col flex-shrink-0">
          <div className="px-3 py-3 border-b border-gray-100">
            <div className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Online — 5</div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {AGENTS.map(a => (
              <button key={a.slug} onClick={() => setTargetAgent(a.slug)}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 text-left transition-colors">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0"
                  style={{ background: DEPT_BG[a.dept] || '#f3f4f6', border: `1px solid ${DEPT_BORDER[a.dept] || '#e5e7eb'}` }}>
                  {a.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-700 truncate">{a.name}</div>
                  <div className="text-[10px] text-gray-400 truncate">{a.task}</div>
                </div>
                <div className={`status-dot flex-shrink-0 ${a.status}`} />
              </button>
            ))}
          </div>
          <div className="border-t border-gray-100 p-3">
            <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Today</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                <span>💬</span><span className="flex-1">Messages</span>
                <span className="font-medium text-gray-700">{messages.length}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                <span>📡</span><span className="flex-1">Broadcasts</span>
                <span className="font-medium text-gray-700">{messages.filter(m => m.message_type === 'broadcast').length}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                <span>🔄</span><span className="flex-1">Handoffs</span>
                <span className="font-medium text-gray-700">{messages.filter(m => m.message_type === 'handoff').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
