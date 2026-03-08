import { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Share2, Sparkles, Sword, Eye, MessageCircle, Search, ArrowLeft } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { MOCK_STORY } from '@/data/mockStory';
import type { Tone } from '@/types/game';

const TONE_ICONS: Record<Tone, typeof Sparkles> = {
  aggressive: Sword,
  charming: Sparkles,
  evasive: Eye,
  honest: MessageCircle,
  curious: Search,
};

const TONE_LABELS: Record<Tone, string> = {
  aggressive: 'Confrontational',
  charming: 'Charming',
  evasive: 'Evasive',
  honest: 'Direct',
  curious: 'Inquisitive',
};

function generateChoiceSummary(choiceHistory: ReturnType<typeof useGame>['state']['choiceHistory']) {
  const summaries: { text: string; tone: Tone; icon: typeof Sparkles }[] = [];

  const hasC1a = choiceHistory.some(c => c.choiceId === 'c1a');
  const hasC1b = choiceHistory.some(c => c.choiceId === 'c1b');
  const hasC1c = choiceHistory.some(c => c.choiceId === 'c1c');
  const hasC2a = choiceHistory.some(c => c.choiceId === 'c2a');
  const hasC2b = choiceHistory.some(c => c.choiceId === 'c2b');
  const hasC2c = choiceHistory.some(c => c.choiceId === 'c2c');
  const hasC3a = choiceHistory.some(c => c.choiceId === 'c3a');
  const hasC3b = choiceHistory.some(c => c.choiceId === 'c3b');
  const hasC3c = choiceHistory.some(c => c.choiceId === 'c3c');

  if (hasC1a) {
    summaries.push({ text: 'You played it safe and kept your cover with Maya', tone: 'evasive', icon: TONE_ICONS.evasive });
  } else if (hasC1b) {
    summaries.push({ text: 'You gained valuable intel by questioning Maya directly', tone: 'curious', icon: TONE_ICONS.curious });
  } else if (hasC1c) {
    summaries.push({ text: 'Your aggressive approach put Maya on guard, but revealed her knowledge', tone: 'aggressive', icon: TONE_ICONS.aggressive });
  }

  if (hasC2a) {
    summaries.push({ text: 'You used charm to deflect Chen\'s suspicion', tone: 'charming', icon: TONE_ICONS.charming });
  } else if (hasC2b) {
    summaries.push({ text: 'You confronted Chen directly, making him wary of you', tone: 'aggressive', icon: TONE_ICONS.aggressive });
  } else if (hasC2c) {
    summaries.push({ text: 'Your honest approach with Chen was noted, if not appreciated', tone: 'honest', icon: TONE_ICONS.honest });
  }

  if (hasC3a) {
    summaries.push({ text: 'You correctly identified that Alex has been compromised', tone: 'honest', icon: TONE_ICONS.honest });
  } else if (hasC3b) {
    summaries.push({ text: 'Your suspicion of Maya pushed her to prove her loyalty', tone: 'aggressive', icon: TONE_ICONS.aggressive });
  } else if (hasC3c) {
    summaries.push({ text: 'Your investigative instincts led you to Alex\'s room', tone: 'curious', icon: TONE_ICONS.curious });
  }

  if (summaries.length === 0) {
    summaries.push({ text: 'You navigated the summit carefully, gathering information along the way', tone: 'honest', icon: TONE_ICONS.honest });
  }

  return summaries;
}

export function SummaryScreen() {
  const { state, dispatch } = useGame();

  const choiceSummaries = useMemo(() => {
    return generateChoiceSummary(state.choiceHistory);
  }, [state.choiceHistory]);

  const handleNewStory = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
    dispatch({ type: 'SET_TAB', payload: 'home' });
  }, [dispatch]);

  const handleContinue = useCallback(() => {
    const savedGame = {
      id: Date.now().toString(),
      storyTitle: MOCK_STORY.title,
      thumbnail: state.uploadedPhoto,
      lastPlayed: new Date(),
      currentSceneIndex: state.currentSceneIndex,
      progress: Math.round((state.currentSceneIndex / MOCK_STORY.scenes.length) * 100),
      choiceHistory: state.choiceHistory,
    };
    dispatch({ type: 'SAVE_GAME', payload: savedGame });
    dispatch({ type: 'RESET_GAME' });
    dispatch({ type: 'SET_TAB', payload: 'home' });
  }, [dispatch, state]);

  const handleBack = useCallback(() => {
    dispatch({ type: 'SET_SCREEN', payload: 'camera' });
    dispatch({ type: 'SET_TAB', payload: 'home' });
  }, [dispatch]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%)',
        }}
      />

      {/* Subtle glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[200px] h-[200px] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(212,168,67,0.2) 0%, transparent 70%)',
        }}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-1.5">
        <button
          onClick={handleBack}
          className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </button>
        <button
          onClick={() => {}}
          className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform"
        >
          <Share2 className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col px-4 pt-12 pb-4">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1
            className="text-lg font-serif text-white mb-0.5"
            style={{
              textShadow: '0 0 20px rgba(212,168,67,0.3)',
            }}
          >
            {MOCK_STORY.summary.title}
          </h1>
          <p className="text-white/40 text-[10px]">{MOCK_STORY.title}</p>
        </motion.div>

        {/* Choice summary */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex-1 mt-3 overflow-y-auto"
        >
          <h2 className="text-white/50 text-[10px] uppercase tracking-widest mb-2">
            Your Choices
          </h2>

          <div className="space-y-1.5">
            {choiceSummaries.map((summary, index) => {
              const Icon = summary.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/8"
                >
                  <div
                    className="p-1.5 rounded-md flex-shrink-0"
                    style={{
                      backgroundColor: summary.tone === 'aggressive' ? 'rgba(239,68,68,0.15)' :
                                      summary.tone === 'charming' ? 'rgba(236,72,153,0.15)' :
                                      summary.tone === 'evasive' ? 'rgba(168,85,247,0.15)' :
                                      summary.tone === 'honest' ? 'rgba(34,197,94,0.15)' :
                                      'rgba(59,130,246,0.15)'
                    }}
                  >
                    <Icon className="w-3 h-3 text-white/60" />
                  </div>
                  <div>
                    <p className="text-white text-[11px] leading-relaxed">{summary.text}</p>
                    <span className="text-white/30 text-[9px] mt-0.5 block">
                      {TONE_LABELS[summary.tone]}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Teaser */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-3 text-center"
          >
            <p className="text-white/40 text-[10px] italic">
              {MOCK_STORY.summary.teaser}
            </p>
          </motion.div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="space-y-1.5 mt-3"
        >
          <button
            onClick={handleContinue}
            className="w-full py-3 rounded-xl font-medium text-black text-xs active:scale-[0.98] transition-transform"
            style={{
              backgroundColor: '#d4a843',
              boxShadow: '0 4px 15px rgba(212,168,67,0.25)',
            }}
          >
            Continue to Episode 2
          </button>

          <button
            onClick={handleNewStory}
            className="w-full py-3 rounded-xl font-medium text-white text-xs border border-white/20 bg-transparent active:scale-[0.98] transition-transform"
          >
            New Story
          </button>
        </motion.div>
      </div>
    </div>
  );
}
