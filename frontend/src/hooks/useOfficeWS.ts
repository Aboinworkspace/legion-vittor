'use client'
import { useEffect, useRef, useCallback } from 'react'
import { useLVStore } from '@/lib/store'
import { createOfficeWS } from '@/lib/api'
import { WSMessage, AgentMessage } from '@/types'

export function useOfficeWS() {
  const ws = useRef<WebSocket | null>(null)
  const { user, addMessage, setMessages, updateAgentStatus } = useLVStore()

  const connect = useCallback(() => {
    if (!user?.id || ws.current?.readyState === WebSocket.OPEN) return

    ws.current = createOfficeWS(user.id)

    ws.current.onopen = () => {
      console.log('[LV] Connected to live office')
    }

    ws.current.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data)

        if (msg.type === 'agent_message') {
          addMessage(msg.data as AgentMessage)
        } else if (msg.type === 'history') {
          setMessages(msg.data as AgentMessage[])
        } else if (msg.type === 'agent_status') {
          const d = msg.data as { slug: string; status: string; task?: string }
          updateAgentStatus(d.slug, d.status, d.task)
        }
      } catch (e) {
        console.error('[LV] WS parse error', e)
      }
    }

    ws.current.onclose = () => {
      console.log('[LV] Disconnected — reconnecting in 3s')
      setTimeout(connect, 3000)
    }

    ws.current.onerror = (e) => {
      console.error('[LV] WS error', e)
    }
  }, [user?.id, addMessage, setMessages, updateAgentStatus])

  useEffect(() => {
    connect()
    return () => {
      ws.current?.close()
    }
  }, [connect])

  const sendMessage = useCallback((content: string, targetAgent?: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'user_message',
        content,
        target_agent: targetAgent,
        channel: 'all-departments',
      }))
    }
  }, [])

  const ping = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'ping' }))
    }
  }, [])

  return { sendMessage, ping, connected: ws.current?.readyState === WebSocket.OPEN }
}
