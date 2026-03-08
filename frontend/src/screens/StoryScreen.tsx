import { AnimatePresence } from 'framer-motion';
import { resolveAssetUrl } from '@/api/trpcClient';
import { useGame } from '@/context/GameContext';
import {
  buildStoryTitle,
  getCurrentScene,
  getCurrentSpeaker,
  getCurrentTurn,
  getSceneCharacters,
  getTurnKey,
  trimCopy,
} from '@/lib/story';
import type { Choice } from '@/types/game';
import { SceneTransition } from './story/SceneTransition';
import { StoryBackdrop } from './story/StoryBackdrop';
import { StoryHeader } from './story/StoryHeader';
import { StoryTurnPanel } from './story/StoryTurnPanel';
import { useStoryBackgroundMusic } from './story/useStoryBackgroundMusic';

interface StoryScreenProps {
  onBack?: () => void;
}

export function StoryScreen({ onBack }: StoryScreenProps) {
  const { state, dispatch, advanceStory } = useGame();
  const handleContinueStory = () => {
    const choice: Choice = {
      id: `action-${Date.now()}`,
      text: 'CONTINUE THE STORY, NO USER INPUT',
      tone: 'honest',
      icon: '>',
    };

    return advanceStory(choice);
  };
  const currentStory = state.story;
  const currentScene = getCurrentScene(currentStory);
  const currentTurn = getCurrentTurn(currentStory);
  const speakingCharacter = getCurrentSpeaker(currentStory);
  const charactersVisible = getSceneCharacters(currentStory);
  const backgroundImageUrl =
    resolveAssetUrl(currentScene?.background_image_url) ||
    resolveAssetUrl(currentStory?.source_image_url) ||
    state.uploadedPhoto ||
    null;
  const backgroundMusicUrl = resolveAssetUrl(currentScene?.background_music_url);
  const fallbackPortraitUrl =
    resolveAssetUrl(currentStory?.source_image_url) || state.uploadedPhoto || null;
  const turnKey = getTurnKey(currentTurn);
  const { autoplayBlocked, isMusicAvailable } = useStoryBackgroundMusic({
    backgroundMusicUrl,
    musicEnabled: state.musicEnabled,
  });

  if (!currentStory || !currentTurn) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black px-6 text-center">
        <p className="text-sm text-white/60">
          No live story is loaded. Start from the camera screen.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <StoryBackdrop
        imageUrl={backgroundImageUrl}
      />

      <StoryHeader
        title={buildStoryTitle(currentStory, state.userPrompt)}
        summary={trimCopy(
          currentStory.story_background,
          'A live story is unfolding from your photo.',
          120,
        )}
        musicEnabled={state.musicEnabled}
        isMusicAvailable={isMusicAvailable}
        autoplayBlocked={autoplayBlocked}
        onBack={onBack}
        onToggleMusic={() =>
          dispatch({
            type: 'SET_MUSIC_ENABLED',
            payload: !state.musicEnabled,
          })
        }
      />

      <StoryTurnPanel
        key={turnKey}
        turnKey={turnKey}
        turn={currentTurn}
        speakingCharacter={speakingCharacter}
        charactersVisible={charactersVisible}
        fallbackPortraitUrl={fallbackPortraitUrl}
        storyStatus={state.storyStatus}
        errorMessage={state.errorMessage}
        onAdvanceStory={advanceStory}
        onContinueStory={handleContinueStory}
      />

      <AnimatePresence>
        {state.isTransitioning && state.transitionText ? (
          <SceneTransition
            text={state.transitionText}
            onComplete={() => dispatch({ type: 'END_TRANSITION' })}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
