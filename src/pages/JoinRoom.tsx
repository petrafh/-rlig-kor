import { useState } from 'react'

interface Props {
  name: string
  onJoin: (code: string) => void
  onBack: () => void
  error?: string
}

export default function JoinRoom({ name, onJoin, onBack, error }: Props) {
  const [code, setCode] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length >= 4) onJoin(trimmed)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-5">

        <div className="text-center">
          <h2 className="bangers text-5xl text-black drop-shadow-[3px_3px_0_#f59e0b]">
            Join et rom
          </h2>
          <p className="font-bold text-gray-600 mt-1">Hei, {name}!</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl comic-border p-6 space-y-4">
          <label className="block">
            <span className="font-black text-black text-sm uppercase tracking-wide mb-2 block">
              Romkode
            </span>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="F.eks. A3F9C2"
              maxLength={8}
              autoFocus
              className="comic-input w-full rounded-xl px-4 py-3 text-2xl font-black tracking-widest text-center uppercase text-black"
            />
          </label>

          {error && (
            <div className="bg-red-300 comic-border-sm rounded-lg px-3 py-2 text-black font-bold text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={code.trim().length < 4}
            className="comic-btn w-full bg-purple-400 text-black py-4 rounded-xl text-xl"
          >
            Bli med!
          </button>
        </form>

        <button
          onClick={onBack}
          className="comic-btn w-full bg-white text-black py-3 rounded-xl text-base"
        >
          ← Tilbake
        </button>

      </div>
    </div>
  )
}
