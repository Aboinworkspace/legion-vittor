import { create } from 'zustand'
import { User, Agent, AgentMessage, Task } from '@/types'

interface LVStore {
  // Auth
  user: User | null
  token: string | null
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  logout: () => void

  // Agents
  agents: Agent[]
  setAgents: (agents: Agent[]) => void
  updateAgentStatus: (slug: string, status: string, task?: string) => void

  // Live office messages
  messages: AgentMessage[]
  activeChannel: string
  addMessage: (msg: AgentMessage) => void
  setMessages: (msgs: AgentMessage[]) => void
  setActiveChannel: (channel: string) => void

  // Tasks
  tasks: Task[]
  setTasks: (tasks: Task[]) => void

  // UI
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const useLVStore = create<LVStore>((set, get) => ({
  // Auth
  user: null,
  token: null,
  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('lv_token', token)
      else localStorage.removeItem('lv_token')
    }
    set({ token })
  },
  logout: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('lv_token')
    set({ user: null, token: null, messages: [], agents: [] })
  },

  // Agents
  agents: [],
  setAgents: (agents) => set({ agents }),
  updateAgentStatus: (slug, status, task) => set((state) => ({
    agents: state.agents.map(a =>
      a.slug === slug ? { ...a, status: status as Agent['status'], current_task: task } : a
    )
  })),

  // Messages
  messages: [],
  activeChannel: 'all-departments',
  addMessage: (msg) => set((state) => ({
    messages: [...state.messages.slice(-99), msg]  // Keep last 100
  })),
  setMessages: (msgs) => set({ messages: msgs }),
  setActiveChannel: (channel) => set({ activeChannel: channel }),

  // Tasks
  tasks: [],
  setTasks: (tasks) => set({ tasks }),

  // UI
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
