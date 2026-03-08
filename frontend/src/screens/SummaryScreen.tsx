import { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Archive,
  ArrowLeft,
  Eye,
  MessageCircle,
  Search,
  Share2,
  Sparkles,
  Sword,
} from 'lucide-react';
import { useGame } from '@/context/GameContext';
import {
  buildStoryProgress,
  buildStorySubtitle,
  buildStoryTitle,
  getCurrentTurn,
  trimCopy,
} from '@/lib/story';
import type { Tone } from '@/types/game';

const TONE_ICONS: Record<Tone, typeof Sparkles> = {
  aggressive: Sword,
  charming: Sparkles,
  evasive: Eye,
  honest: MessageCircle,
  curious: Search,
};

const TONE_LABELS: Record<Tone, string> = {
  aggressive: 'Bold move',
  charming: 'Soft touch',
  evasive: 'Guarded move',
  honest: 'Direct move',
  curious: 'Investigative move',
};

function generateChoiceSummary(choiceHistory: ReturnType<typeof useGame>['state']['choiceHistory']) {
  if (!choiceHistory.length) {
    return [
      {
        text: 'The story is open, but you have not made a move yet.',
        tone: 'honest' as const,
      },
    ];
  }

  return [...choiceHistory]
    .slice(-4)
    .reverse()
    .map((choice) => ({
      text: choice.text,
      tone: choice.tone,
    }));
}

export function SummaryScreen() {
  const { state, dispatch, saveCurrentGame, resetGameSession } = useGame();
  const currentTurn = getCurrentTurn(state.story);

  const choiceSummaries = useMemo(() => {
    return generateChoiceSummary(state.choiceHistory);
  }, [state.choiceHistory]);

  const handleResume = useCallback(() => {
    if (state.story) {
      dispatch({ type: 'SET_SCREEN', payload: 'story' });
      return;
    }

    dispatch({ type: 'SET_SCREEN', payload: 'camera' });
  }, [dispatch, state.story]);

  const handleSaveAndExit = useCallback(() => {
    saveCurrentGame();
    resetGameSession();
    dispatch({ type: 'SET_TAB', payload: 'home' });
  }, [dispatch, resetGameSession, saveCurrentGame]);

  const handleNewStory = useCallback(() => {
    resetGameSession();
    dispatch({ type: 'SET_TAB', payload: 'home' });
  }, [dispatch, resetGameSession]);

  const handleBack = useCallback(() => {
    dispatch({ type: 'SET_SCREEN', payload: state.story ? 'story' : 'camera' });
  }, [dispatch, state.story]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%)',
        }}
      />

      <div
        className="absolute top-1/4 left-1/2 h-[200px] w-[200px] -translate-x-1/2 rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(212,168,67,0.2) 0%, transparent 70%)',
        }}
      />

      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-1.5">
        <button
          onClick={handleBack}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm active:scale-95 transition-transform"
        >
          <ArrowLeft className="h-4 w-4 text-white/60" />
        </button>
        <button
          onClick={() => {}}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm active:scale-95 transition-transform"
        >
          <Share2 className="h-4 w-4 text-white/60" />
        </button>
      </div>

      <div className="relative z-10 flex h-full flex-col px-4 pt-12 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1
            className="mb-0.5 text-lg font-serif text-white"
            style={{
              textShadow: '0 0 20px rgba(212,168,67,0.3)',
            }}
          >
            {buildStoryTitle(state.story, state.userPrompt)}
          </h1>
          <p className="text-[10px] text-white/40">
            {state.story
              ? `${state.story.turns.length} turns played · ${buildStoryProgress(state.story)}% intensity`
              : 'No live story loaded'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-3 rounded-xl border border-white/8 bg-white/5 p-3"
        >
          <p className="text-[10px] uppercase tracking-widest text-white/50">Story pulse</p>
          <p className="mt-2 text-[11px] leading-relaxed text-white/80">
            {buildStorySubtitle(state.story)}
          </p>
          <p className="mt-2 text-[10px] italic text-white/45">
            {trimCopy(
              currentTurn?.text,
              'Resume whenever you want to see what happens next.',
              120,
            )}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-3 flex-1 overflow-y-auto"
        >
          <h2 className="mb-2 text-[10px] uppercase tracking-widest text-white/50">
            Recent Moves
          </h2>

          <div className="space-y-1.5">
            {choiceSummaries.map((summary, index) => {
              const Icon = TONE_ICONS[summary.tone];
              return (
                <motion.div
                  key={`${summary.text}-${index}`}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.35 + index * 0.08 }}
                  className="flex items-start gap-2.5 rounded-lg border border-white/8 bg-white/5 p-2.5"
                >
                  <div
                    className="flex-shrink-0 rounded-md p-1.5"
                    style={{
                      backgroundColor:
                        summary.tone === 'aggressive'
                          ? 'rgba(239,68,68,0.15)'
                          : summary.tone === 'charming'
                            ? 'rgba(236,72,153,0.15)'
                            : summary.tone === 'evasive'
                              ? 'rgba(168,85,247,0.15)'
                              : summary.tone === 'honest'
                                ? 'rgba(34,197,94,0.15)'
                                : 'rgba(59,130,246,0.15)',
                    }}
                  >
                    <Icon className="h-3 w-3 text-white/60" />
                  </div>
                  <div>
                    <p className="text-[11px] leading-relaxed text-white">{summary.text}</p>
                    <span className="mt-0.5 block text-[9px] text-white/30">
                      {TONE_LABELS[summary.tone]}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-3 text-center"
          >
            <p className="text-[10px] italic text-white/40">
              {state.story
                ? 'The backend keeps the story open-ended, so you can continue generating turns.'
                : 'Start a story from the camera tab to see a recap here.'}
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-3 space-y-1.5"
        >
          <button
            onClick={handleResume}
            className="w-full rounded-xl py-3 text-xs font-medium text-black active:scale-[0.98] transition-transform"
            style={{
              backgroundColor: '#d4a843',
              boxShadow: '0 4px 15px rgba(212,168,67,0.25)',
            }}
          >
            Resume Story
          </button>

          <button
            onClick={handleSaveAndExit}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 py-3 text-xs font-medium text-white active:scale-[0.98] transition-transform"
          >
            <Archive className="h-3.5 w-3.5" />
            Save To Archive
          </button>

          <button
            onClick={handleNewStory}
            className="w-full rounded-xl border border-white/20 bg-transparent py-3 text-xs font-medium text-white active:scale-[0.98] transition-transform"
          >
            New Story
          </button>
        </motion.div>
      </div>
    </div>
  );
}
