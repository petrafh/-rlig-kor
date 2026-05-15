import { useState, useCallback } from 'react'
import Landing from './pages/Landing'
import SongSelect from './pages/SongSelect'
import JoinRoom from './pages/JoinRoom'
import Room from './pages/Room'
import { useWebSocket } from './hooks/useWebSocket'

type Screen = 'landing' | 'song-select' | 'join-room' | 'room'

interface Participant {
  id: string
  name: string
  inputs: string[]
}

interface AssignedInput {
  input: string
  lyricIndex: number
  participantId: string
}

interface RoomState {
  code: string
  songId: string
  participants: Participant[]
  assignedInputs: AssignedInput[]
  gameStarted: boolean
}

interface AppState {
  screen: Screen
  name: string
  participantId: string | null
  isHost: boolean
  room: RoomState | null
  joinError: string | undefined
}

export default function App() {
  const [state, setState] = useState<AppState>({
    screen: 'landing',
    name: localStorage.getItem('sangleker-name') ?? '',
    participantId: null,
    isHost: false,
    room: null,
    joinError: undefined,
  })

  const handleMessage = useCallback((msg: Record<string, unknown>) => {
    if (msg.type === 'CREATED') {
      setState((prev) => ({
        ...prev,
        screen: 'room',
        participantId: msg.participantId as string,
        isHost: true,
        room: {
          code: msg.code as string,
          songId: msg.songId as string,
          participants: msg.participants as Participant[],
          assignedInputs: (msg.assignedInputs as AssignedInput[]) ?? [],
          gameStarted: (msg.gameStarted as boolean) ?? false,
        },
      }))
    } else if (msg.type === 'JOINED') {
      setState((prev) => ({
        ...prev,
        screen: 'room',
        participantId: msg.participantId as string,
        isHost: false,
        joinError: undefined,
        room: {
          code: msg.code as string,
          songId: msg.songId as string,
          participants: msg.participants as Participant[],
          assignedInputs: (msg.assignedInputs as AssignedInput[]) ?? [],
          gameStarted: (msg.gameStarted as boolean) ?? false,
        },
      }))
    } else if (msg.type === 'ROOM_STATE') {
      const r = msg.room as RoomState
      setState((prev) => ({
        ...prev,
        room: r,
      }))
    } else if (msg.type === 'ERROR') {
      setState((prev) => ({
        ...prev,
        joinError: msg.message as string,
      }))
    }
  }, [])

  const { waitAndSend, send, error: wsError } = useWebSocket(handleMessage)

  function handleCreateRoom(name: string) {
    setState((prev) => ({ ...prev, name, screen: 'song-select' }))
  }

  function handleJoinRoom(name: string) {
    setState((prev) => ({ ...prev, name, screen: 'join-room' }))
  }

  function handleSongSelect(songId: string) {
    waitAndSend({ type: 'CREATE_ROOM', name: state.name, songId })
  }

  function handleJoinSubmit(code: string) {
    waitAndSend({ type: 'JOIN_ROOM', name: state.name, code })
  }

  function handleAddInput(input: string, totalLines: number) {
    send({ type: 'ADD_INPUT', input, totalLines })
  }

  function handleDeleteInput(index: number) {
    send({ type: 'DELETE_INPUT', index })
  }

  function handleStartGame(totalLines: number) {
    send({ type: 'START_GAME', totalLines })
  }

  if (wsError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="bg-red-300 comic-border rounded-2xl p-6 max-w-sm w-full text-center space-y-3">
          <p className="bangers text-3xl text-black">Ingen servertilkobling</p>
          <p className="font-bold text-black text-sm">Serveren er ikke tilgjengelig. Start serveren lokalt eller sett opp VITE_WS_URL.</p>
          <button onClick={() => window.location.reload()} className="comic-btn bg-yellow-300 text-black px-4 py-2 rounded-xl w-full">
            Prøv igjen
          </button>
        </div>
      </div>
    )
  }

  if (state.screen === 'landing') {
    return <Landing onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />
  }

  if (state.screen === 'song-select') {
    return (
      <SongSelect
        onSelect={handleSongSelect}
        onBack={() => setState((prev) => ({ ...prev, screen: 'landing' }))}
      />
    )
  }

  if (state.screen === 'join-room') {
    return (
      <JoinRoom
        name={state.name}
        onJoin={handleJoinSubmit}
        onBack={() => setState((prev) => ({ ...prev, screen: 'landing', joinError: undefined }))}
        error={state.joinError}
      />
    )
  }

  if (state.screen === 'room' && state.room && state.participantId) {
    return (
      <Room
        room={state.room}
        participantId={state.participantId}
        isHost={state.isHost}
        onAddInput={handleAddInput}
        onDeleteInput={handleDeleteInput}
        onStartGame={handleStartGame}
        onHome={() => setState((prev) => ({ ...prev, screen: 'landing', room: null, participantId: null }))}
      />
    )
  }

  return null
}
