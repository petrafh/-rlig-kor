import { useState } from 'react'

interface Props {
  onCreateRoom: (name: string) => void
  onJoinRoom: (name: string) => void
}

export default function Landing({ onCreateRoom, onJoinRoom }: Props) {
  const [name, setName] = useState(() => localStorage.getItem('sangleker-name') ?? '')

  function saveName(value: string) {
    setName(value)
    localStorage.setItem('sangleker-name', value)
  }

  const trimmed = name.trim()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">

        <div className="text-center space-y-1">
          <h1 className="bangers text-6xl sm:text-7xl text-black drop-shadow-[3px_3px_0_#a855f7]">
            Ærlig Kor
          </h1>
          <p className="font-bold text-gray-700 text-lg">
            Sangleker for store og s.. bare store egentlig
          </p>
        </div>

        <div className="bg-white rounded-2xl comic-border p-6 space-y-4">
          <label className="block">
            <span className="font-black text-black text-sm uppercase tracking-wide mb-2 block">
              Kallenavn
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => saveName(e.target.value)}
              placeholder="Hva heter du?"
              maxLength={30}
              className="comic-input w-full rounded-xl px-4 py-3 text-lg text-black placeholder-gray-400"
            />
          </label>

          <div className="grid grid-cols-1 gap-3 pt-1">
            <button
              disabled={!trimmed}
              onClick={() => onCreateRoom(trimmed)}
              className="comic-btn w-full bg-purple-400 text-black py-4 rounded-xl text-xl"
            >
              Lag et rom
            </button>
            <button
              disabled={!trimmed}
              onClick={() => onJoinRoom(trimmed)}
              className="comic-btn w-full bg-yellow-300 text-black py-4 rounded-xl text-xl"
            >
              Join et rom
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
