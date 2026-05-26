'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useLVStore } from '@/lib/store'
import { AgentMessage } from '@/types'
import { createClient, RealtimeChannel } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton supabase client for realtime
let supabaseClient: ReturnType<typeof createClient> | null = null
function getSupabase() {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    })
  }
  return supabaseClient
}

export function useOfficeRealtime() {
  const { user, addMessage, setMessages, token } = useLVStore()
  const [connected, setConnected] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Load initial message history via HTTP
  useEffect(() => {
    if (!user?.id || !token) return

    const fetchMessages = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
        const res = await fetch(`${apiUrl}/api/messages/?channel=all-departments&limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          if (data.messages && Array.isArray(data.messages)) {
            setMessages(data.messages as AgentMessage[])
          }
        }
      } catch (e) {
        console.error('[LV] Failed to load history', e)
      }
    }

    fetchMessages()
  }, [user?.id, token, setMessages])

  // Subscribe to Supabase Realtime for new messages
  useEffect(() => {
    if (!user?.id) return

    const supabase = getSupabase()

    const channel = supabase
      .channel(`office-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_messages',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const newMsg = payload.new as AgentMessage
          console.log('[LV] New message via realtime:', newMsg.from_agent_name)
          addMessage(newMsg)
        }
      )
      .subscribe((status: string) => {
        console.log('[LV] Realtime status:', status)
        setConnected(status === 'SUBSCRIBED')
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [user?.id, addMessage])

  // Send a message via HTTP (orchestrator triggers agents)
  const sendMessage = useCallback(
    async (content: string, targetAgent?: string) => {
      if (!content.trim() || !user?.id || !token) return

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''

        // First, save user message immediately so it shows up
        const userMsgRes = await fetch(`${apiUrl}/api/messages/user-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content,
            target_agent: targetAgent,
            channel: 'all-departments',
          }),
        }).catch(() => null)

        // Route to specific agent or full pipeline
        if (targetAgent) {
          const slug = targetAgent.toLowerCase().replace(/[\s@]/g, '_').replace(/_agent$/, '_agent')
          // Normalise slug: "@Developer agent" → "developer_agent"
          const normalisedSlug = targetAgent
            .toLowerCase()
            .replace('@', '')
            .trim()
            .replace(/\s+/g, '_')
          await fetch(`${apiUrl}/api/agents/${normalisedSlug}/run`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ task: content }),
          })
        } else {
          // Send through orchestrator → CEO → Manager → all agents
          await fetch(`${apiUrl}/api/agents/orchestrate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ prompt: content }),
          })
        }
      } catch (e) {
        console.error('[LV] Failed to send message', e)
      }
    },
    [user?.id, token]
  )

  return { sendMessage, connected }
}
