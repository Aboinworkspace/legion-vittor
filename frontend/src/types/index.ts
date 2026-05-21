// ── Legion Vittor — TypeScript Types ──────────────────────────────────────────

export type AgentStatus = 'idle' | 'active' | 'busy' | 'paused' | 'error'
export type MessageType = 'message' | 'broadcast' | 'handoff' | 'alert' | 'update'
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused'

export interface User {
  id: string
  email: string
  full_name?: string
  company_name?: string
  company_niche?: string
  company_description?: string
  target_market?: string
  primary_language?: string
  brand_name?: string
  brand_tagline?: string
  brand_voice?: string
  brand_tone?: string
  brand_colors?: { primary: string; accent: string; bg: string }
  post_frequency?: string
  setup_complete?: boolean
  autonomous_mode?: boolean
  self_healing?: boolean
  inter_dept_comms?: boolean
  content_approval_gate?: boolean
  escalation_threshold_minutes?: number
  daily_digest?: boolean
  digest_channel?: string
}

export interface Agent {
  id: string
  name: string
  slug: string
  department: string
  description?: string
  status: AgentStatus
  current_task?: string
  tasks_completed?: number
  tasks_today?: number
  success_rate?: number
  avg_response_seconds?: number
  last_active_at?: string
  skills?: string[]
}

export interface AgentMessage {
  id: string
  user_id: string
  from_agent_id?: string
  to_agent_id?: string
  from_agent_name: string
  to_agent_name?: string
  from_department?: string
  to_department?: string
  channel: string
  message_type: MessageType
  content: string
  attachment?: {
    name: string
    type: string
    size?: string
    url?: string
  }
  is_user_message?: boolean
  priority?: 'normal' | 'high' | 'urgent'
  created_at: string
}

export interface Task {
  id: string
  agent_id?: string
  agent_name?: string
  department?: string
  title: string
  description?: string
  status: TaskStatus
  progress: number
  input_data?: Record<string, unknown>
  output_data?: Record<string, unknown>
  error_message?: string
  started_at?: string
  completed_at?: string
  created_at: string
}

export interface Department {
  id: string
  name: string
  slug: string
  color: string
  is_active: boolean
  agent_count?: number
}

export interface Channel {
  id: string
  name: string
  icon?: string
  color?: string
  unread_count?: number
}

export interface AnalyticsSnapshot {
  snapshot_date: string
  revenue: number
  leads_generated: number
  leads_qualified: number
  posts_published: number
  emails_sent: number
  videos_published: number
  instagram_views: number
  youtube_views: number
  facebook_reach: number
  blog_visits: number
  tasks_completed: number
  agent_messages_sent: number
}

export interface WSMessage {
  type: 'connected' | 'agent_message' | 'history' | 'pong' | 'agent_status'
  data: AgentMessage | AgentMessage[] | Record<string, unknown>
}

// DEPT_COLORS mapping — matches backend
export const DEPT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Leadership:       { bg: '#EEEDFE', border: '#534AB7', text: '#3C3489' },
  Engineering:      { bg: '#E6F1FB', border: '#185FA5', text: '#0C447C' },
  'Marketing & Sales': { bg: '#FAEEDA', border: '#854F0B', text: '#633806' },
  Support:          { bg: '#EAF3DE', border: '#3B6D11', text: '#27500A' },
  Analytics:        { bg: '#EAF3DE', border: '#639922', text: '#27500A' },
  'R&D':            { bg: '#EEEDFE', border: '#7F77DD', text: '#3C3489' },
  'Video & Reels':  { bg: '#FBEAF0', border: '#993556', text: '#72243E' },
  'Social Media':   { bg: '#FBEAF0', border: '#D4537E', text: '#72243E' },
  Payments:         { bg: '#E1F5EE', border: '#1D9E75', text: '#085041' },
  Leads:            { bg: '#E1F5EE', border: '#0F6E56', text: '#085041' },
}
