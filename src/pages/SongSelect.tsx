import { songs } from '../data/songs'

interface Props {
  onSelect: (songId: string) => void
  onBack: () => void
}

const colors = ['bg-pink-300', 'bg-blue-300', 'bg-green-300', 'bg-orange-300', 'bg-purple-300', 'bg-red-300']

export default function SongSelect({ onSelect, onBack }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-5">

        <div className="text-center">
          <h2 className="bangers text-5xl text-black drop-shadow-[3px_3px_0_#f59e0b]">
            Velg en sang
          </h2>
        </div>

        <div className="space-y-3">
          {songs.map((song, i) => (
            <button
              key={song.id}
              onClick={() => onSelect(song.id)}
              className={`comic-btn w-full ${colors[i % colors.length]} rounded-xl p-4 text-left`}
            >
              <div className="font-black text-black text-xl">{song.title}</div>
              <div className="font-bold text-gray-700 text-sm">{song.artist}</div>
            </button>
          ))}
        </div>

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
