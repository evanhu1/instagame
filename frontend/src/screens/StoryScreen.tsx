import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, ArrowLeft, BookOpen } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { MOCK_STORY, getCharacterById } from '@/data/mockStory';
import { useTypewriter } from '@/hooks/useTypewriter';
import type { Choice } from '@/types/game';

interface StoryScreenProps {
  onBack?: () => void;
}

// Character Portrait Component
interface CharacterPortraitProps {
  characterId: string;
  isSpeaking: boolean;
}

function CharacterPortrait({ characterId, isSpeaking }: CharacterPortraitProps) {
  const character = getCharacterById(characterId);
  if (!character) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{
        opacity: isSpeaking ? 1 : 0.5,
        x: 0,
        scale: isSpeaking ? 1 : 0.92,
      }}
      transition={{ duration: 0.25 }}
      className="relative"
    >
      <div
        className="w-[64px] h-[88px] rounded-xl flex flex-col items-center justify-end pb-2 relative overflow-hidden"
        style={{
          background: `linear-gradient(180deg, ${character.color}20 0%, ${character.color}08 100%)`,
          boxShadow: isSpeaking ? `0 0 10px ${character.color}25` : 'none',
          border: `1.5px solid ${isSpeaking ? character.color : character.color + '25'}`,
        }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold mb-1"
          style={{
            backgroundColor: `${character.color}30`,
            color: character.color,
          }}
        >
          {character.name.split(' ').map(n => n[0]).join('')}
        </div>
        <span className="text-white/60 text-[8px] text-center px-1 leading-tight">
          {character.name.split(' ')[0]}
        </span>
      </div>

      {isSpeaking && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full flex items-center justify-center"
        >
          <div className="w-1 h-1 bg-black rounded-full" />
        </motion.div>
      )}
    </motion.div>
  );
}

// Narrator card — visually distinct, more engaging
interface NarratorCardProps {
  text: string;
  isComplete: boolean;
}

function NarratorCard({ text, isComplete }: NarratorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full"
    >
      <div
        className="relative px-4 py-3 rounded-xl border border-white/10 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(212,168,67,0.06) 0%, rgba(255,255,255,0.03) 100%)',
        }}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />

        {/* Icon + text */}
        <div className="flex gap-2.5 items-start">
          <BookOpen className="w-3 h-3 text-amber-400/40 flex-shrink-0 mt-0.5" />
          <p className="text-white/65 text-[11px] leading-relaxed italic flex-1">
            {text}
          </p>
        </div>

        {/* Typing cursor */}
        {!isComplete && (
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
            className="inline-block w-0.5 h-3 bg-amber-400/40 ml-1"
          />
        )}
      </div>
    </motion.div>
  );
}

// Dialogue bubble — for character speech
interface DialogueBubbleProps {
  text: string;
  isComplete: boolean;
  characterColor?: string;
  characterName?: string;
}

function DialogueBubble({ text, isComplete, characterColor, characterName }: DialogueBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-[190px]"
    >
      {/* Speaker name */}
      {characterName && (
        <p className="text-[9px] font-medium mb-0.5 ml-1" style={{ color: characterColor || '#fff' }}>
          {characterName}
        </p>
      )}
      <div
        className="relative px-3 py-2 rounded-xl bg-white/90"
        style={{
          borderLeft: characterColor ? `3px solid ${characterColor}` : undefined,
        }}
      >
        <p className="text-black text-[11px] leading-relaxed">
          {text}
        </p>

        {!isComplete && (
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
            className="absolute bottom-2 right-2 w-0.5 h-2.5 bg-black/25"
          />
        )}
      </div>
    </motion.div>
  );
}

// Choice Card
interface ChoiceCardProps {
  choice: Choice;
  index: number;
  onSelect: (choice: Choice) => void;
}

function ChoiceCard({ choice, index, onSelect }: ChoiceCardProps) {
  const [isSelected, setIsSelected] = useState(false);

  const handleClick = () => {
    if (isSelected) return;
    setIsSelected(true);
    // Minimal delay — just enough to show selection feedback
    setTimeout(() => onSelect(choice), 120);
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{
        opacity: isSelected ? 0.3 : 1,
        y: 0,
        scale: isSelected ? 0.97 : 1,
      }}
      transition={{
        duration: 0.15,
        delay: index * 0.04,
      }}
      onClick={handleClick}
      className={`
        w-full text-left px-3 py-2 rounded-lg
        bg-white/8 backdrop-blur-sm
        border border-white/15
        active:scale-[0.98] transition-all
        ${isSelected ? 'border-amber-400/50 bg-amber-400/10' : ''}
      `}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs">{choice.icon}</span>
        <span className="text-white text-[11px] leading-snug">{choice.text}</span>
      </div>
    </motion.button>
  );
}

// Scene Transition Overlay
interface SceneTransitionProps {
  text: string | null;
  onComplete: () => void;
}

function SceneTransition({ text, onComplete }: SceneTransitionProps) {
  const { displayedText, isComplete } = useTypewriter({
    text: text || '',
    speed: 35,
    enabled: !!text,
  });

  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(onComplete, 1500);
      return () => clearTimeout(timer);
    }
  }, [isComplete, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-50 bg-black flex items-center justify-center px-6"
    >
      <div className="text-center">
        <div className="w-4 h-[1px] bg-amber-400/30 mx-auto mb-3" />
        <p className="text-white/60 text-[11px] italic leading-relaxed max-w-[220px]">
          {displayedText}
        </p>
        <div className="w-4 h-[1px] bg-amber-400/30 mx-auto mt-3" />
      </div>
    </motion.div>
  );
}

// Main Story Screen
export function StoryScreen({ onBack }: StoryScreenProps) {
  const { state, dispatch } = useGame();
  const [showChoices, setShowChoices] = useState(false);
  const [dialogueComplete, setDialogueComplete] = useState(false);
  const prevBeatRef = useRef<string>('');

  const currentScene = MOCK_STORY.scenes[state.currentSceneIndex];
  const currentBeat = currentScene?.beats[state.currentBeatIndex];

  const speakingCharacter = useMemo(() => {
    if (!currentBeat?.speaker || currentBeat.speaker === 'narrator') return null;
    return getCharacterById(currentBeat.speaker);
  }, [currentBeat]);

  const { displayedText, isComplete, skip } = useTypewriter({
    text: currentBeat?.text || '',
    speed: 25,
    randomize: true,
    minSpeed: 18,
    maxSpeed: 35,
    enabled: !!currentBeat?.text && currentBeat.speaker !== null,
  });

  // Check if story is done
  const isEnd = !currentBeat || state.currentBeatIndex >= currentScene.beats.length;

  useEffect(() => {
    if (isEnd) {
      dispatch({ type: 'SET_SCREEN', payload: 'summary' });
    }
  }, [isEnd, dispatch]);

  // Handle dialogue completion — show choices immediately
  useEffect(() => {
    if (isComplete) {
      if (currentBeat?.text) {
        setDialogueComplete(true);
      }
      // Show choices whether or not there was text (choice-only beats have text: null)
      if (currentBeat?.choices) {
        setShowChoices(true);
      }
    }
  }, [isComplete, currentBeat]);

  // Reset state when beat changes
  const beatKey = `${state.currentSceneIndex}-${state.currentBeatIndex}`;
  useEffect(() => {
    if (prevBeatRef.current === beatKey) return;
    prevBeatRef.current = beatKey;

    setDialogueComplete(false);
    setShowChoices(false);

    if (currentBeat?.enterFrom && currentBeat.speaker && currentBeat.speaker !== 'narrator') {
      dispatch({ type: 'ADD_CHARACTER', payload: currentBeat.speaker });
    }

    // Choice-only beats (no text, no speaker) — show choices right away
    if (!currentBeat?.text && currentBeat?.choices) {
      setShowChoices(true);
    }
  }, [beatKey, currentBeat, dispatch]);

  const handleDialogueTap = useCallback(() => {
    if (!isComplete) {
      skip();
    } else if (!currentBeat?.choices) {
      dispatch({ type: 'ADVANCE_BEAT' });
    }
  }, [isComplete, skip, currentBeat, dispatch]);

  const handleChoiceSelect = useCallback((choice: Choice) => {
    dispatch({ type: 'MAKE_CHOICE', payload: choice });
    setShowChoices(false);
  }, [dispatch]);

  const handleTransitionComplete = useCallback(() => {
    dispatch({ type: 'END_TRANSITION' });
  }, [dispatch]);

  if (isEnd) return null;

  const isNarrator = currentBeat?.speaker === 'narrator';
  const hasChoices = !!currentBeat?.choices && currentBeat.choices.length > 0;
  const charactersVisible = Array.from(state.charactersOnScreen);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.04, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute inset-[-5%]"
        >
          {state.uploadedPhoto ? (
            <img
              src={state.uploadedPhoto}
              alt=""
              className="w-full h-full object-cover"
              style={{ filter: 'brightness(0.3) saturate(0.7) blur(2px)' }}
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: state.currentSceneIndex === 0
                  ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
                  : state.currentSceneIndex === 1
                  ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #2d1b4e 100%)'
                  : 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
              }}
            />
          )}
        </motion.div>
      </div>

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3 py-1.5">
        <button
          onClick={onBack}
          className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-white/60" />
        </button>

        <motion.div
          animate={{
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="p-1.5 rounded-full bg-black/40 backdrop-blur-sm"
        >
          <Music className="w-2.5 h-2.5 text-white/50" />
        </motion.div>
      </div>

      {/* Tappable content area */}
      <div
        className="absolute inset-0 flex flex-col pt-9 pb-2 px-3"
        onClick={handleDialogueTap}
      >
        {/* Dialogue area — fills available space, content at bottom */}
        <div className="flex-1 flex items-end pb-2">
          {isNarrator ? (
            /* Narrator — full width card */
            <div className="w-full">
              <AnimatePresence mode="popLayout">
                <NarratorCard
                  key={beatKey}
                  text={displayedText}
                  isComplete={isComplete}
                />
              </AnimatePresence>
            </div>
          ) : (
            /* Character dialogue — portrait left, bubble right */
            <div className="w-full flex items-end gap-2">
              {/* Portraits column */}
              {charactersVisible.length > 0 && (
                <div className="flex flex-col gap-1 flex-shrink-0">
                  {charactersVisible.map((charId) => (
                    <CharacterPortrait
                      key={charId}
                      characterId={charId}
                      isSpeaking={speakingCharacter?.id === charId}
                    />
                  ))}
                </div>
              )}

              {/* Dialogue bubble */}
              <div className="flex-1 flex flex-col justify-end">
                <AnimatePresence mode="popLayout">
                  {currentBeat?.text && (
                    <DialogueBubble
                      key={beatKey}
                      text={displayedText}
                      isComplete={isComplete}
                      characterColor={speakingCharacter?.color}
                      characterName={speakingCharacter?.name.split(' ')[0]}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* Bottom area — Choices or tap hint */}
        <div className="min-h-[110px] flex flex-col justify-start" onClick={(e) => e.stopPropagation()}>
          <AnimatePresence>
            {showChoices && hasChoices && currentBeat?.choices && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-1.5"
              >
                {currentBeat.choices.map((choice, index) => (
                  <ChoiceCard
                    key={choice.id}
                    choice={choice}
                    index={index}
                    onSelect={handleChoiceSelect}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {dialogueComplete && !hasChoices && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-center py-2"
              onClick={handleDialogueTap}
            >
              <span className="text-white/30 text-[9px] tracking-wider">Tap to continue</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Scene transition overlay */}
      <AnimatePresence>
        {state.isTransitioning && state.transitionText && (
          <SceneTransition
            text={state.transitionText}
            onComplete={handleTransitionComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
