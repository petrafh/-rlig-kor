import express from 'express'
import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { randomBytes } from 'crypto'

const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server })

interface Participant {
  id: string
  name: string
  inputs: string[]
}

interface Room {
  code: string
  songId: string
  hostId: string
  participants: Participant[]
  assignedInputs: { input: string; lyricIndex: number; participantId: string }[]
  gameStarted: boolean
}

const rooms = new Map<string, Room>()
const clientRooms = new Map<WebSocket, { roomCode: string; participantId: string }>()

function generateCode(): string {
  return randomBytes(3).toString('hex').toUpperCase()
}

function broadcast(roomCode: string, message: object, exclude?: WebSocket) {
  const data = JSON.stringify(message)
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      const info = clientRooms.get(client)
      if (info && info.roomCode === roomCode && client !== exclude) {
        client.send(data)
      }
    }
  })
}

function broadcastAll(roomCode: string, message: object) {
  const data = JSON.stringify(message)
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      const info = clientRooms.get(client)
      if (info && info.roomCode === roomCode) {
        client.send(data)
      }
    }
  })
}

function roomState(room: Room) {
  return {
    type: 'ROOM_STATE',
    room: {
      code: room.code,
      songId: room.songId,
      participants: room.participants,
      assignedInputs: room.assignedInputs,
      gameStarted: room.gameStarted,
    },
  }
}

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    let msg: { type: string; [key: string]: unknown }
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      return
    }

    if (msg.type === 'CREATE_ROOM') {
      const code = generateCode()
      const participantId = randomBytes(8).toString('hex')
      const room: Room = {
        code,
        songId: msg.songId as string,
        hostId: participantId,
        participants: [{ id: participantId, name: msg.name as string, inputs: [] }],
        assignedInputs: [],
        gameStarted: false,
      }
      rooms.set(code, room)
      clientRooms.set(ws, { roomCode: code, participantId })
      ws.send(JSON.stringify({ type: 'CREATED', participantId, ...roomState(room).room, code }))
      return
    }

    if (msg.type === 'JOIN_ROOM') {
      const code = (msg.code as string).toUpperCase()
      const room = rooms.get(code)
      if (!room) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'Rommet finnes ikke' }))
        return
      }
      const participantId = randomBytes(8).toString('hex')
      const participant: Participant = { id: participantId, name: msg.name as string, inputs: [] }
      room.participants.push(participant)
      clientRooms.set(ws, { roomCode: code, participantId })
      ws.send(JSON.stringify({ type: 'JOINED', participantId, ...roomState(room).room, code }))
      broadcast(code, roomState(room), ws)
      return
    }

    const info = clientRooms.get(ws)
    if (!info) return
    const { roomCode, participantId } = info
    const room = rooms.get(roomCode)
    if (!room) return

    if (msg.type === 'ADD_INPUT') {
      const participant = room.participants.find((p) => p.id === participantId)
      if (!participant) return
      const input = (msg.input as string).trim()
      if (!input) return
      const totalInputs = room.participants.reduce((sum, p) => sum + p.inputs.length, 0)
      if (totalInputs >= (msg.totalLines as number)) return
      participant.inputs.push(input)
      broadcastAll(roomCode, roomState(room))
      return
    }

    if (msg.type === 'DELETE_INPUT') {
      const participant = room.participants.find((p) => p.id === participantId)
      if (!participant) return
      const index = msg.index as number
      if (index < 0 || index >= participant.inputs.length) return
      participant.inputs.splice(index, 1)
      broadcastAll(roomCode, roomState(room))
      return
    }

    if (msg.type === 'START_GAME') {
      if (room.hostId !== participantId) return
      const totalLines = msg.totalLines as number
      const allInputs: { input: string; participantId: string }[] = []
      room.participants.forEach((p) => {
        p.inputs.forEach((inp) => {
          allInputs.push({ input: inp, participantId: p.id })
        })
      })
      // Fyll gjenværende plasser med "Alle"
      while (allInputs.length < totalLines) {
        allInputs.push({ input: 'Alle', participantId: 'system' })
      }
      const indices = Array.from({ length: totalLines }, (_, i) => i)
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[indices[i], indices[j]] = [indices[j], indices[i]]
      }
      room.assignedInputs = allInputs.map((item, i) => ({
        ...item,
        lyricIndex: indices[i],
      }))
      room.gameStarted = true
      broadcastAll(roomCode, roomState(room))
      return
    }
  })

  ws.on('close', () => {
    const info = clientRooms.get(ws)
    if (info) {
      const { roomCode, participantId } = info
      const room = rooms.get(roomCode)
      if (room) {
        room.participants = room.participants.filter((p) => p.id !== participantId)
        if (room.participants.length === 0) {
          rooms.delete(roomCode)
        } else {
          broadcastAll(roomCode, roomState(room))
        }
      }
      clientRooms.delete(ws)
    }
  })
})

const PORT = 3001
server.listen(PORT, () => {
  console.log(`Sangleker server kjører på port ${PORT}`)
})
