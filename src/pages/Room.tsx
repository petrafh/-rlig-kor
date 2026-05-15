import { useState } from 'react'
import { songs } from '../data/songs'

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

interface Props {
  room: RoomState
  participantId: string
  isHost: boolean
  onAddInput: (input: string, totalLines: number) => void
  onDeleteInput: (index: number) => void
  onStartGame: (totalLines: number) => void
  onHome: () => void
}

export default function Room({ room, participantId, isHost, onAddInput, onDeleteInput, onStartGame, onHome }: Props) {
  const [showInputField, setShowInputField] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const song = songs.find((s) => s.id === room.songId)
  const me = room.participants.find((p) => p.id === participantId)
  const totalLines = song?.lines.length ?? 0
  const totalInputs = room.participants.reduce((sum, p) => sum + p.inputs.length, 0)
  const isFull = totalInputs >= totalLines

  function handleAddInput(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed || isFull) return
    onAddInput(trimmed, totalLines)
    setInputValue('')
    setShowInputField(false)
  }

  function copyCode() {
    navigator.clipboard.writeText(room.code)
  }

  if (room.gameStarted && song) {
    const assignedByIndex = new Map<number, string>()
    room.assignedInputs.forEach((a) => {
      if (!assignedByIndex.has(a.lyricIndex)) {
        assignedByIndex.set(a.lyricIndex, a.input)
      }
    })

    return (
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-10 bg-yellow-300 border-b-4 border-black">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={onHome} className="comic-btn bg-white rounded-lg p-2" title="Hjem">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
              </button>
              <button
                onClick={copyCode}
                className="comic-btn bg-white rounded-lg px-3 py-1 font-black font-mono text-lg tracking-widest"
                title="Kopier kode"
              >
                {room.code}
              </button>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              {room.participants.map((p) => (
                <span
                  key={p.id}
                  className={`comic-border-sm text-xs px-2 py-1 rounded-full font-black ${
                    p.id === participantId ? 'bg-purple-400' : 'bg-white'
                  }`}
                >
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
          <div className="mb-5 text-center">
            <h2 className="bangers text-4xl text-black drop-shadow-[2px_2px_0_#a855f7]">{song.title}</h2>
            <p className="font-bold text-gray-600">{song.artist}</p>
          </div>

          <div className="bg-white comic-border rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b-4 border-black bg-purple-300">
                  <th className="text-left font-black text-black text-sm px-4 py-3 w-1/2 uppercase tracking-wide">
                    Hvem synger
                  </th>
                  <th className="text-left font-black text-black text-sm px-4 py-3 w-1/2 uppercase tracking-wide border-l-2 border-black">
                    Sang
                  </th>
                </tr>
              </thead>
              <tbody>
                {song.lines.map((line, idx) => (
                  <tr key={idx} className="border-b-2 border-black last:border-0 even:bg-yellow-50">
                    <td className="px-4 py-3 font-black text-black text-sm">
                      {assignedByIndex.get(idx) ?? ''}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-700 text-sm italic border-l-2 border-black">
                      {line.lyric}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-yellow-300 border-b-4 border-black">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={onHome} className="comic-btn bg-white rounded-lg p-2" title="Hjem">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </button>
          <button
            onClick={copyCode}
            className="comic-btn bg-white rounded-lg px-3 py-1 font-black font-mono text-xl tracking-widest"
            title="Kopier kode"
          >
            {room.code}
          </button>
          <span className="font-bold text-gray-700 text-sm hidden sm:block">← del koden!</span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 space-y-5">
        {song && (
          <div className="bg-purple-300 comic-border rounded-2xl p-4 text-center">
            <p className="font-bold text-gray-700 text-sm uppercase tracking-wide">Sangen</p>
            <h2 className="bangers text-3xl text-black">{song.title} — {song.artist}</h2>
          </div>
        )}

        <div className="bg-white comic-border rounded-2xl p-4 space-y-3">
          <h3 className="font-black text-black text-sm uppercase tracking-wide">
            Deltakere ({room.participants.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {room.participants.map((p) => (
              <div
                key={p.id}
                className={`comic-border-sm rounded-xl px-3 py-2 text-sm font-black ${
                  p.id === participantId ? 'bg-purple-400' : 'bg-yellow-200'
                }`}
              >
                {p.name}
                {p.id === participantId && p.inputs.length > 0 && (
                  <span className="ml-2 text-xs font-bold opacity-70">{p.inputs.length} svar</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {me && me.inputs.length > 0 && (
          <div className="bg-white comic-border rounded-2xl p-4 space-y-2">
            <h3 className="font-black text-black text-sm uppercase tracking-wide">Dine inputs</h3>
            {me.inputs.map((inp, i) => (
              <div key={i} className="flex items-center gap-2 bg-pink-200 comic-border-sm rounded-lg px-3 py-2">
                <span className="flex-1 font-bold text-black text-sm">{inp}</span>
                <button
                  onClick={() => onDeleteInput(i)}
                  className="comic-btn bg-red-400 text-black rounded-lg w-7 h-7 flex items-center justify-center font-black text-base leading-none"
                  title="Slett"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          {isFull ? (
            <div className="bg-green-300 comic-border rounded-xl py-4 text-center font-black text-black">
              Alle plasser fylt — klar til start! 🎉
            </div>
          ) : showInputField ? (
            <form onSubmit={handleAddInput} className="space-y-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Skriv din betingelse..."
                autoFocus
                maxLength={120}
                className="comic-input w-full rounded-xl px-4 py-3 text-black"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="comic-btn flex-1 bg-purple-400 text-black py-3 rounded-xl text-lg"
                >
                  Legg til
                </button>
                <button
                  type="button"
                  onClick={() => { setShowInputField(false); setInputValue('') }}
                  className="comic-btn px-4 bg-white text-black rounded-xl"
                >
                  Avbryt
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowInputField(true)}
              className="comic-btn w-full bg-yellow-300 text-black py-4 rounded-xl text-3xl"
            >
              +
            </button>
          )}

          {isHost && (
            <button
              onClick={() => song && onStartGame(totalLines)}
              className="comic-btn w-full bg-green-400 text-black py-4 rounded-xl text-xl"
            >
              Start spillet!
            </button>
          )}

          {!isHost && (
            <p className="text-center font-bold text-gray-600 text-sm">
              Venter på at verten starter spillet...
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
