import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, LoaderCircle } from 'lucide-react';
import { resolveAssetUrl } from '@/api/trpcClient';
import { useTypewriter } from '@/hooks/useTypewriter';
import {
  getCharacterColor,
  getSpeakerName,
} from '@/lib/story';
import type {
  Choice,
  LiveStoryCharacter,
  LiveStoryTurn,
  StoryStatus,
} from '@/types/game';

interface StoryTurnPanelProps {
  turnKey: string;
  turn: LiveStoryTurn;
  speakingCharacter: LiveStoryCharacter | null;
  charactersVisible: LiveStoryCharacter[];
  fallbackPortraitUrl: string | null;
  storyStatus: StoryStatus;
  errorMessage: string | null;
  onAdvanceStory: (choice: Choice) => Promise<void>;
}

interface CharacterPortraitProps {
  character: LiveStoryCharacter;
  isSpeaking: boolean;
  fallbackImageUrl?: string | null;
}

function CharacterPortrait({
  character,
  isSpeaking,
  fallbackImageUrl,
}: CharacterPortraitProps) {
  const color = getCharacterColor(character.id);
  const portraitUrl = resolveAssetUrl(character.image_url) || fallbackImageUrl || null;

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
        className="relative flex h-[88px] w-[64px] flex-col items-center justify-end overflow-hidden rounded-xl border pb-2"
        style={{
          background: `linear-gradient(180deg, ${color}20 0%, ${color}08 100%)`,
          boxShadow: isSpeaking ? `0 0 10px ${color}25` : 'none',
          borderColor: isSpeaking ? color : `${color}25`,
        }}
      >
        {portraitUrl ? (
          <img
            src={portraitUrl}
            alt={character.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10" />
        {portraitUrl ? null : (
          <>
            <div
              className="relative mb-1 flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-bold"
              style={{
                backgroundColor: `${color}35`,
                color,
              }}
            >
              {character.name
                .split(' ')
                .map((name) => name[0])
                .join('')}
            </div>
            <span className="relative px-1 text-center text-[8px] leading-tight text-white/75">
              {character.name.split(' ')[0]}
            </span>
          </>
        )}
      </div>

      {isSpeaking ? (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-amber-400"
        >
          <div className="h-1 w-1 rounded-full bg-black" />
        </motion.div>
      ) : null}
    </motion.div>
  );
}

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
        className="relative overflow-hidden rounded-xl border border-white/10 px-4 py-3"
        style={{
          background:
            'linear-gradient(135deg, rgba(212,168,67,0.06) 0%, rgba(255,255,255,0.03) 100%)',
        }}
      >
        <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />

        <div className="flex items-start gap-2.5">
          <BookOpen className="mt-0.5 h-3 w-3 flex-shrink-0 text-amber-400/40" />
          <p className="flex-1 text-[11px] leading-relaxed italic text-white">
            {text}
          </p>
        </div>

        {!isComplete ? (
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
            className="ml-1 inline-block h-3 w-0.5 bg-amber-400/40"
          />
        ) : null}
      </div>
    </motion.div>
  );
}

interface DialogueBubbleProps {
  text: string;
  isComplete: boolean;
  characterColor?: string;
  characterName?: string;
}

function DialogueBubble({
  text,
  isComplete,
  characterColor,
  characterName,
}: DialogueBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-[190px]"
    >
      {characterName ? (
        <p
          className="mb-1 ml-1 text-[9px] font-medium uppercase tracking-[0.18em]"
          style={{ color: characterColor || 'rgba(255,255,255,0.68)' }}
        >
          {characterName}
        </p>
      ) : null}
      <div
        className="relative overflow-hidden rounded-xl border border-white/10 px-3 py-2 backdrop-blur-md"
        style={{
          borderLeft: characterColor ? `3px solid ${characterColor}` : undefined,
          background:
            'linear-gradient(135deg, rgba(12,14,22,0.76) 0%, rgba(255,255,255,0.04) 100%)',
        }}
      >
        <div
          className="absolute top-0 left-4 right-4 h-[1px]"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${
              characterColor || 'rgba(255,255,255,0.24)'
            } 50%, transparent 100%)`,
          }}
        />
        <p className="text-[11px] leading-relaxed text-white">{text}</p>

        {!isComplete ? (
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
            className="absolute right-2 bottom-2 h-2.5 w-0.5 bg-white/30"
          />
        ) : null}
      </div>
    </motion.div>
  );
}

export function StoryTurnPanel({
  turnKey,
  turn,
  speakingCharacter,
  charactersVisible,
  fallbackPortraitUrl,
  storyStatus,
  errorMessage,
  onAdvanceStory,
}: StoryTurnPanelProps) {
  const [actionInput, setActionInput] = useState('');
  const [submittedActionText, setSubmittedActionText] = useState<string | null>(null);

  const { displayedText, isComplete, skip } = useTypewriter({
    text: turn.text || '',
    speed: 25,
    randomize: true,
    minSpeed: 18,
    maxSpeed: 35,
    enabled: Boolean(turn.text),
  });

  const isNarrator = turn.type === 'story_text' || !speakingCharacter;

  function handleDialogueTap() {
    if (!isComplete) {
      skip();
    }
  }

  function handleActionInputChange(event: ChangeEvent<HTMLInputElement>) {
    setActionInput(event.target.value);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (storyStatus === 'advancing') {
      return;
    }

    const trimmedAction = actionInput.trim();

    if (!trimmedAction) {
      return;
    }

    const choice: Choice = {
      id: `action-${Date.now()}`,
      text: trimmedAction,
      tone: 'honest',
      icon: '>',
    };

    setSubmittedActionText(trimmedAction);
    void onAdvanceStory(choice);
  }

  return (
    <div
      className="absolute inset-0 flex flex-col px-3 pt-24 pb-2"
      onClick={handleDialogueTap}
    >
      <div className="flex flex-1 items-end pb-2">
        {isNarrator ? (
          <div className="w-full">
            <AnimatePresence mode="popLayout">
              <NarratorCard key={turnKey} text={displayedText} isComplete={isComplete} />
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex w-full items-end gap-2">
            {charactersVisible.length ? (
              <div className="flex flex-shrink-0 flex-col gap-1">
                {charactersVisible.map((character) => (
                  <CharacterPortrait
                    key={character.id}
                    character={character}
                    isSpeaking={speakingCharacter?.id === character.id}
                    fallbackImageUrl={fallbackPortraitUrl}
                  />
                ))}
              </div>
            ) : null}

            <div className="flex flex-1 flex-col justify-end">
              <AnimatePresence mode="popLayout">
                <DialogueBubble
                  key={turnKey}
                  text={displayedText}
                  isComplete={isComplete}
                  characterColor={
                    speakingCharacter ? getCharacterColor(speakingCharacter.id) : undefined
                  }
                  characterName={getSpeakerName(speakingCharacter, turn).split(' ')[0]}
                />
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      <div
        className="flex min-h-[132px] flex-col justify-start"
        onClick={(event) => event.stopPropagation()}
      >
        <AnimatePresence>
          {isComplete && storyStatus !== 'advancing' ? (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              onSubmit={handleSubmit}
              className="rounded-xl border border-white/10 bg-black/30 p-2 backdrop-blur-md"
            >
              <label className="block">
                <span className="mb-1.5 block text-[9px] uppercase tracking-[0.22em] text-white/40">
                  Your action
                </span>
                <div className="flex items-center gap-2">
                  <input
                    value={actionInput}
                    onChange={handleActionInputChange}
                    placeholder="What do you do next?"
                    maxLength={160}
                    className="h-10 flex-1 rounded-lg border border-white/10 bg-black/35 px-3 text-[11px] text-white/90 outline-none transition placeholder:text-white/25 focus:border-amber-200/35 focus:bg-black/45"
                  />
                  <button
                    type="submit"
                    disabled={!actionInput.trim()}
                    className="flex h-10 min-w-16 items-center justify-center rounded-lg border border-amber-200/20 bg-amber-200/10 px-3 text-[11px] font-semibold text-amber-100 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/8 disabled:text-white/35"
                  >
                    Send
                  </button>
                </div>
              </label>
            </motion.form>
          ) : null}
        </AnimatePresence>

        {storyStatus === 'advancing' && submittedActionText ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-amber-300/15 bg-black/25 px-3 py-2 text-left backdrop-blur-sm"
          >
            <div className="mt-1.5 flex items-start gap-2">
              <LoaderCircle className="mt-0.5 h-3 w-3 flex-shrink-0 animate-spin text-amber-300" />
              <p className="text-[11px] leading-relaxed text-white/85">
                {submittedActionText}
              </p>
            </div>
          </motion.div>
        ) : null}

        {storyStatus === 'error' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-3 text-center"
          >
            <span className="text-[10px] text-red-200/80">
              {errorMessage || 'The last turn failed. Try another move.'}
            </span>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
