import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('lv_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth
export const auth = {
  signUp: (email: string, password: string, full_name: string) =>
    api.post('/api/auth/signup', { email, password, full_name }),

  signIn: (email: string, password: string) =>
    api.post('/api/auth/signin', { email, password }),

  setup: (data: Record<string, string>) =>
    api.post('/api/auth/setup', data),

  me: () => api.get('/api/auth/me'),
}

// Agents
export const agents = {
  list: () => api.get('/api/agents/'),

  run: (slug: string, task: string, context?: string) =>
    api.post(`/api/agents/${slug}/run`, { task, context }),

  getSkills: (slug: string) =>
    api.get(`/api/agents/${slug}/skills`),

  addSkill: (slug: string, skill: string) =>
    api.post(`/api/agents/${slug}/skills`, { skill }),

  removeSkill: (slug: string, skill: string) =>
    api.delete(`/api/agents/${slug}/skills/${encodeURIComponent(skill)}`),

  orchestrate: (prompt: string) =>
    api.post('/api/agents/orchestrate', { prompt }),

  runMarketingPipeline: (topic: string) =>
    api.post('/api/agents/pipeline/marketing', { topic }),

  runDevPipeline: (topic: string) =>
    api.post('/api/agents/pipeline/dev', { topic }),
}

// Messages
export const messages = {
  list: (channel = 'all-departments', limit = 50) =>
    api.get('/api/messages/', { params: { channel, limit } }),

  channels: () => api.get('/api/messages/channels'),
}

// Tasks
export const tasks = {
  list: (status?: string) => api.get('/api/tasks/', { params: { status } }),
  active: () => api.get('/api/tasks/active'),
}

// Analytics
export const analytics = {
  overview: () => api.get('/api/analytics/overview'),
  agentStats: () => api.get('/api/analytics/agents'),
}

// WebSocket helper
export const createOfficeWS = (userId: string, channel = 'all-departments') => {
  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
  const token = typeof window !== 'undefined' ? localStorage.getItem('lv_token') : ''
  return new WebSocket(`${WS_URL}/ws/office/${userId}?token=${token}&channel=${channel}`)
}
