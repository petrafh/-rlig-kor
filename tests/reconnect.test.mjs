import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import WebSocket from 'ws'

test('host and guest resume with inputs, game state and private credentials', { timeout: 15000 }, async () => {
  const server = spawn(process.execPath, ['--import', 'tsx', 'server.ts'], {
    env: { ...process.env, PORT: '3017' }, stdio: ['ignore', 'pipe', 'inherit'],
  })
  const clients = []
  try {
    await Promise.race([once(server.stdout, 'data'), once(server, 'exit').then(() => { throw new Error('Server exited') })])
    async function connect() {
      const ws = new WebSocket('ws://localhost:3017')
      clients.push(ws)
      await once(ws, 'open')
      return ws
    }
    async function request(ws, msg, type) {
      const response = new Promise((resolve) => {
        function handle(raw) {
          const data = JSON.parse(raw)
          if (data.type === type) { ws.off('message', handle); resolve(data) }
        }
        ws.on('message', handle)
      })
      ws.send(JSON.stringify(msg))
      return response
    }
    const host = await connect()
    const created = await request(host, { type: 'CREATE_ROOM', name: 'Vert', songId: 'ja-vi-elsker' }, 'CREATED')
    const guest = await connect()
    const joined = await request(guest, { type: 'JOIN_ROOM', name: 'Spiller', code: created.code }, 'JOINED')
    assert.ok(created.resumeToken)
    assert.ok(joined.participants.every((p) => !('resumeToken' in p)))
    await request(guest, { type: 'ADD_INPUT', input: 'Mitt svar', totalLines: 4 }, 'ROOM_STATE')
    guest.close()
    await once(guest, 'close')
    host.close()
    await once(host, 'close')
    const restoredHost = await connect()
    const resumed = await request(restoredHost, { type: 'RESUME_ROOM', code: created.code, resumeToken: created.resumeToken }, 'RESUMED')
    assert.equal(resumed.participantId, created.participantId)
    assert.equal(resumed.isHost, true)
    assert.equal(resumed.participants.length, 2)
    assert.deepEqual(resumed.participants.find((p) => p.id === joined.participantId).inputs, ['Mitt svar'])
    await request(restoredHost, { type: 'START_GAME', totalLines: 4 }, 'ROOM_STATE')
    const restoredGuest = await connect()
    const guestState = await request(restoredGuest, { type: 'RESUME_ROOM', code: created.code, resumeToken: joined.resumeToken }, 'RESUMED')
    assert.equal(guestState.participantId, joined.participantId)
    assert.equal(guestState.isHost, false)
    assert.equal(guestState.gameStarted, true)
    assert.equal(guestState.assignedInputs.length, 4)
    const invalid = await connect()
    await request(invalid, { type: 'RESUME_ROOM', code: created.code, resumeToken: 'wrong' }, 'SESSION_EXPIRED')
    await request(restoredHost, { type: 'CLOSE_ROOM' }, 'ROOM_CLOSED')
    await request(restoredGuest, { type: 'RESUME_ROOM', code: created.code, resumeToken: joined.resumeToken }, 'SESSION_EXPIRED')
  } finally {
    clients.forEach((ws) => ws.terminate())
    server.kill()
    await once(server, 'exit')
  }
})
