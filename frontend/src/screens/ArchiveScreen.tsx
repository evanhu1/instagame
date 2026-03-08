import { motion } from 'framer-motion';
import { Clock, Play, Trash2, BookOpen } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import type { SavedGame } from '@/types/game';

// Mock saved games for demo
const MOCK_SAVED_GAMES: SavedGame[] = [
  {
    id: '1',
    storyTitle: 'Shadows at the Summit',
    thumbnail: null,
    lastPlayed: new Date(Date.now() - 86400000),
    currentSceneIndex: 1,
    progress: 35,
    choiceHistory: [],
  },
  {
    id: '2',
    storyTitle: 'The Midnight Library',
    thumbnail: null,
    lastPlayed: new Date(Date.now() - 604800000),
    currentSceneIndex: 2,
    progress: 60,
    choiceHistory: [],
  },
];

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
  const { state, dispatch } = useGame();

  const savedGames = state.savedGames.length > 0 ? state.savedGames : MOCK_SAVED_GAMES;

  const handleLoadGame = (gameId: string) => {
    dispatch({ type: 'LOAD_GAME', payload: gameId });
  };

  const handleDeleteGame = (gameId: string) => {
    console.log('Delete game:', gameId);
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%)',
        }}
      />

      {/* Header */}
      <div className="relative z-10 pt-6 pb-3 px-4">
        <h1 className="text-white text-base font-bold">Gaming Memory</h1>
        <p className="text-white/40 text-[11px] mt-0.5">Continue your stories</p>
      </div>

      {/* Saved games list */}
      <div className="relative z-10 px-4 pb-20 overflow-y-auto h-[calc(100%-70px)]">
        {savedGames.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-52 text-center">
            <BookOpen className="w-10 h-10 text-white/15 mb-3" />
            <p className="text-white/40 text-xs">No saved games yet</p>
            <p className="text-white/25 text-[10px] mt-0.5">Start a new story to begin</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedGames.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="bg-white/5 border border-white/8 rounded-xl overflow-hidden"
              >
                {/* Thumbnail */}
                <div className="h-16 bg-gradient-to-br from-gray-800 to-gray-900 relative">
                  {game.thumbnail ? (
                    <img
                      src={game.thumbnail}
                      alt={game.storyTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-white/15 text-2xl font-bold">
                        {game.storyTitle.charAt(0)}
                      </span>
                    </div>
                  )}

                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
                    <div
                      className="h-full bg-amber-400"
                      style={{ width: `${game.progress}%` }}
                    />
                  </div>
                </div>

                {/* Game info */}
                <div className="p-3">
                  <h3 className="text-white text-xs font-medium">{game.storyTitle}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5 text-white/35 text-[10px]">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{formatLastPlayed(game.lastPlayed)}</span>
                    <span className="mx-0.5">·</span>
                    <span>{game.progress}%</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5 mt-2">
                    <button
                      onClick={() => handleLoadGame(game.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-amber-400 text-black py-2 rounded-lg text-[11px] font-medium active:scale-95 transition-transform"
                    >
                      <Play className="w-3 h-3" />
                      Continue
                    </button>
                    <button
                      onClick={() => handleDeleteGame(game.id)}
                      className="p-2 rounded-lg bg-white/8 text-white/50 active:scale-95 transition-transform"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* New Story button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'camera' })}
          className="w-full mt-4 py-3 rounded-xl border border-dashed border-white/20 text-white/50 text-[11px] active:scale-95 transition-transform"
        >
          + Start New Story
        </motion.button>
      </div>
    </div>
  );
}
