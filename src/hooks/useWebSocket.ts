import { useEffect, useRef, useCallback, useState } from 'react'

type MessageHandler = (msg: Record<string, unknown>) => void

export const SESSION_KEY = 'sangleker-session'

export function useWebSocket(onMessage: MessageHandler) {
  const wsRef = useRef<WebSocket | null>(null)
  const onMessageRef = useRef(onMessage)
  const pendingRef = useRef<object[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => { onMessageRef.current = onMessage }, [onMessage])

  useEffect(() => {
    let stopped = false
    let retryTimer: ReturnType<typeof setTimeout>
    let attempts = 0

    function connect() {
      const wsUrl = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3001'
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      ws.onopen = () => {
        if (stopped) return
        attempts = 0
        setConnected(true)
        setError(false)
        const saved = sessionStorage.getItem(SESSION_KEY)
        if (saved) {
          try {
            ws.send(JSON.stringify({ ...JSON.parse(saved), type: 'RESUME_ROOM' }))
          } catch {
            sessionStorage.removeItem(SESSION_KEY)
          }
        }
        pendingRef.current.splice(0).forEach((msg) => ws.send(JSON.stringify(msg)))
      }
      ws.onclose = () => {
        if (stopped) return
        setConnected(false)
        setError(true)
        retryTimer = setTimeout(connect, Math.min(1000 * 2 ** attempts++, 10000))
      }
      ws.onerror = () => ws.close()
      ws.onmessage = (e) => {
        if (stopped) return
        try {
          onMessageRef.current(JSON.parse(e.data))
        } catch {
          console.warn('Kunne ikke lese servermeldingen')
        }
      }
    }
    connect()
    function handleVisibility() {
      if (document.visibilityState === 'visible' && wsRef.current?.readyState === WebSocket.CLOSED) {
        clearTimeout(retryTimer)
        connect()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      stopped = true
      clearTimeout(retryTimer)
      document.removeEventListener('visibilitychange', handleVisibility)
      wsRef.current?.close()
    }
  }, [])

  const send = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  const waitAndSend = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    } else {
      pendingRef.current.push(msg)
    }
  }, [])

  return { send, waitAndSend, connected, error }
}
