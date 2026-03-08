import { config } from '../config.js';
import {
  getCharacterById,
  getSceneById,
  updateCharacterImage,
  updateSceneBackgroundImage,
  updateSceneBackgroundMusic,
} from '../db/storyRepository.js';
import { persistPublicAudio, persistPublicImage } from '../utils/fileStorage.js';
import { HttpError } from '../utils/httpError.js';
import { generateImageFromPrompt, generateMusicFromPrompt } from './geminiService.js';

const createBackgroundPrompt = (description) =>
  [
    'Create a polished cinematic story background for a mobile visual novel.',
    'Do not include UI, speech bubbles, captions, or watermarks.',
    'Background only, no text overlays.',
    `Scene description: ${description}`,
  ].join(' ');

const createCharacterPrompt = (description) =>
  [
    'Create a polished character portrait for a mobile visual novel.',
    'Single character, waist-up or full-body, expressive, clean framing.',
    'No text, no UI, no watermark, no extra characters.',
    `Character description: ${description}`,
  ].join(' ');

const createBackgroundMusicPrompt = (description) =>
  [
    'Create instrumental background music for a mobile visual novel scene.',
    'No vocals, no spoken words, no sound effects, no abrupt ending.',
    'Keep it cinematic, loop-friendly, and suitable for underscoring dialogue.',
    `Scene description: ${description}`,
  ].join(' ');

const generatePersistedBackgroundMusic = async ({ description, filePrefix }) => {
  const generated = await generateMusicFromPrompt({
    prompt: createBackgroundMusicPrompt(description),
  });

  const { publicUrl } = await persistPublicAudio({
    buffer: generated.buffer,
    mimeType: generated.mimeType,
    directoryPath: config.storage.generatedMusic,
    publicSegments: ['generated', 'music'],
    filePrefix,
  });

  return publicUrl;
};

export const drawBackgroundForScene = async ({ sceneId, description }) => {
  const scene = await getSceneById(sceneId);

  if (!scene) {
    throw new HttpError(404, `Scene ${sceneId} was not found.`);
  }

  const generated = await generateImageFromPrompt({
    prompt: createBackgroundPrompt(description),
  });

  const { publicUrl } = await persistPublicImage({
    buffer: Buffer.from(generated.base64Data, 'base64'),
    mimeType: generated.mimeType,
    directoryPath: config.storage.generatedBackgrounds,
    publicSegments: ['generated', 'backgrounds'],
    filePrefix: `scene-${sceneId}`,
  });

  await updateSceneBackgroundImage(sceneId, publicUrl);

  return publicUrl;
};

export const drawCharacterForCharacter = async ({
  characterId,
  description,
}) => {
  const character = await getCharacterById(characterId);

  if (!character) {
    throw new HttpError(404, `Character ${characterId} was not found.`);
  }

  const generated = await generateImageFromPrompt({
    prompt: createCharacterPrompt(description),
  });

  const { publicUrl } = await persistPublicImage({
    buffer: Buffer.from(generated.base64Data, 'base64'),
    mimeType: generated.mimeType,
    directoryPath: config.storage.generatedCharacters,
    publicSegments: ['generated', 'characters'],
    filePrefix: `character-${characterId}`,
  });

  await updateCharacterImage(characterId, publicUrl);

  return publicUrl;
};

export const generateBackgroundMusicForScene = async ({
  sceneId,
  description,
}) => {
  const scene = await getSceneById(sceneId);

  if (!scene) {
    throw new HttpError(404, `Scene ${sceneId} was not found.`);
  }

  const publicUrl = await generatePersistedBackgroundMusic({
    description,
    filePrefix: `scene-${sceneId}`,
  });

  await updateSceneBackgroundMusic(sceneId, publicUrl);

  return publicUrl;
};
