import { useEffect, useRef, useCallback, useState } from 'react'

type MessageHandler = (msg: Record<string, unknown>) => void

export function useWebSocket(onMessage: MessageHandler) {
  const wsRef = useRef<WebSocket | null>(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3001'
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => { setConnected(true); setError(false) }
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setError(true)

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        onMessageRef.current(data)
      } catch {}
    }

    return () => {
      ws.close()
    }
  }, [])

  const send = useCallback((msg: object) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  const waitAndSend = useCallback((msg: object) => {
    const ws = wsRef.current
    if (!ws) return
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg))
    } else {
      ws.addEventListener('open', () => ws.send(JSON.stringify(msg)), { once: true })
    }
  }, [])

  return { send, waitAndSend, connected, error }
}
