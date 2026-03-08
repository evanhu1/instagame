import {
  createGeneratedTurn,
  createStoryGraph,
  deleteStoryById,
  getStoryById,
  getTurnGenerationContext,
} from '../db/storyRepository.js';
import {
  generateNextTurn,
  generateStorySeedFromPhoto,
} from './geminiService.js';
import {
  drawBackgroundForScene,
  drawCharacterForCharacter,
  generateBackgroundMusicForScene,
} from './mediaGenerationService.js';
import {
  findRelevantPreviousTurn,
  formatTurnAsRelevantContext,
  upsertStoryTurns,
} from './turnMemoryService.js';
import { persistSourceUpload } from '../utils/fileStorage.js';
import { HttpError } from '../utils/httpError.js';

const buildAssetWarning = (asset, error) => ({
  asset,
  message: error?.message || `Failed to generate ${asset}.`,
});

export const generateStoryFromUpload = async ({ buffer, mimeType }) => {
  let storyId;

  try {
    const { publicUrl: sourceImageUrl } = await persistSourceUpload({
      buffer,
      mimeType,
    });

    const storySeed = await generateStorySeedFromPhoto({
      imageBuffer: buffer,
      mimeType,
    });

    const created = await createStoryGraph({
      title: storySeed.title,
      storyBackground: storySeed.story_background,
      sourceImageUrl,
      initialCharacter: storySeed.initial_character,
      initialScene: {
        description: storySeed.initial_scene.description,
        backgroundImageUrl: sourceImageUrl,
        backgroundMusicUrl: null,
      },
      initialTurn: storySeed.initial_turn,
    });

    storyId = created.storyId;

    const assetResults = await Promise.allSettled([
      generateBackgroundMusicForScene({
        sceneId: created.sceneId,
        description: storySeed.initial_scene.description,
      }),
      drawCharacterForCharacter({
        characterId: created.characterId,
        description: [
          `Name: ${storySeed.initial_character.name}.`,
          `Appearance: ${storySeed.initial_character.appearance}.`,
          `Personality: ${storySeed.initial_character.personality}.`,
          `Biography: ${storySeed.initial_character.biography}.`,
        ].join(' '),
      }),
    ]);

    const warnings = assetResults
      .map((result, index) => {
        if (result.status === 'fulfilled') {
          return null;
        }

        if (index === 0) {
          return buildAssetWarning('background_music', result.reason);
        }

        return buildAssetWarning('character_image', result.reason);
      })
      .filter(Boolean);

    const story = await getStoryById(created.storyId);

    return {
      story,
      warnings,
    };
  } catch (error) {
    if (storyId) {
      await deleteStoryById(storyId).catch(() => {});
    }

    throw error;
  }
};

export const getStoryOrThrow = async (storyId) => {
  const story = await getStoryById(storyId);

  if (!story) {
    throw new HttpError(404, `Story ${storyId} was not found.`);
  }

  return story;
};

export const advanceStoryTurn = async ({ storyId, turnText }) => {
  const context = await getTurnGenerationContext(storyId);

  if (!context) {
    throw new HttpError(404, `Story ${storyId} was not found.`);
  }

  if (!context.currentScene) {
    throw new HttpError(409, `Story ${storyId} has no active scene.`);
  }

  if (!context.currentTurn) {
    throw new HttpError(409, `Story ${storyId} has no active turn.`);
  }

  if (!context.currentCharacter) {
    throw new HttpError(
      409,
      `Story ${storyId} has no current character in the active scene.`,
    );
  }

  await upsertStoryTurns(context.previousTurns);

  const relevantTurn = await findRelevantPreviousTurn({
    storyId,
    queryText: turnText,
    excludeTurnId: context.currentTurn.id,
  });

  const generatedTurn = await generateNextTurn({
    storyBackground: context.story.story_background,
    currentSceneDescription: context.currentScene.description,
    currentCharacter: {
      id: context.currentCharacter.id,
      name: context.currentCharacter.name,
      appearance: context.currentCharacter.appearance,
      biography: context.currentCharacter.biography,
      personality: context.currentCharacter.personality,
    },
    previousTurns: context.previousTurns.map((turn) => ({
      turn_number: turn.turn_number,
      type: turn.type,
      speaker_name: turn.speaker_name ?? null,
      text: turn.text,
    })),
    selectedTextChoice: turnText,
    relevantContext: formatTurnAsRelevantContext(relevantTurn),
  });

  const createdTurn = await createGeneratedTurn({
    storyId,
    sceneId: context.currentScene.id,
    previousTurnId: context.currentTurn.id,
    text: generatedTurn.text,
    type: generatedTurn.type,
    speakerCharacterId:
      generatedTurn.type === 'dialogue' ? context.currentCharacter.id : null,
  });

  await upsertStoryTurns([createdTurn]);

  return getStoryOrThrow(storyId);
};

export const generateSceneBackground = async ({ sceneId, description }) => {
  return drawBackgroundForScene({
    sceneId,
    description,
  });
};

export const generateCharacterPortrait = async ({ characterId, description }) => {
  return drawCharacterForCharacter({
    characterId,
    description,
  });
};
