import { motion } from 'framer-motion';
import { Clock, Play, Trash2, BookOpen } from 'lucide-react';
import { useGame } from '@/context/GameContext';

function formatLastPlayed(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export function ArchiveScreen() {
  const { state, dispatch, loadSavedGame } = useGame();
  const savedGames = state.savedGames;

  const handleDeleteGame = (gameId: string) => {
    console.log('Delete game not implemented yet:', gameId);
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%)',
        }}
      />

      <div className="relative z-10 px-4 pt-6 pb-3">
        <h1 className="text-base font-bold text-white">Gaming Memory</h1>
        <p className="mt-0.5 text-[11px] text-white/40">Continue your saved stories</p>
      </div>

      <div className="relative z-10 h-[calc(100%-70px)] overflow-y-auto px-4 pb-20">
        {!savedGames.length ? (
          <div className="flex h-52 flex-col items-center justify-center text-center">
            <BookOpen className="mb-3 h-10 w-10 text-white/15" />
            <p className="text-xs text-white/40">No saved games yet</p>
            <p className="mt-0.5 text-[10px] text-white/25">
              Open the summary screen and save a live story to archive it
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedGames.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="overflow-hidden rounded-xl border border-white/8 bg-white/5"
              >
                <div className="relative h-16 bg-gradient-to-br from-gray-800 to-gray-900">
                  {game.thumbnail ? (
                    <img
                      src={game.thumbnail}
                      alt={game.storyTitle}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-2xl font-bold text-white/15">
                        {game.storyTitle.charAt(0)}
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
                    <div
                      className="h-full bg-amber-400"
                      style={{ width: `${game.progress}%` }}
                    />
                  </div>
                </div>

                <div className="p-3">
                  <h3 className="text-xs font-medium text-white">{game.storyTitle}</h3>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-white/35">
                    <Clock className="h-2.5 w-2.5" />
                    <span>{formatLastPlayed(game.lastPlayed)}</span>
                    <span className="mx-0.5">·</span>
                    <span>{game.progress}%</span>
                  </div>

                  <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-white/45">
                    {game.storyBackground}
                  </p>

                  <div className="mt-2 flex gap-1.5">
                    <button
                      onClick={() => void loadSavedGame(game.id)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-400 py-2 text-[11px] font-medium text-black active:scale-95 transition-transform"
                    >
                      <Play className="h-3 w-3" />
                      Continue
                    </button>
                    <button
                      onClick={() => handleDeleteGame(game.id)}
                      className="rounded-lg bg-white/8 p-2 text-white/50 active:scale-95 transition-transform"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'camera' })}
          className="mt-4 w-full rounded-xl border border-dashed border-white/20 py-3 text-[11px] text-white/50 active:scale-95 transition-transform"
        >
          + Start New Story
        </motion.button>
      </div>
    </div>
  );
}
