import { z } from 'zod';

export const turnTypeSchema = z.enum(['dialogue', 'story_text']);

export const assetWarningSchema = z.object({
  asset: z.enum(['background_music', 'character_image']),
  message: z.string().min(1),
});

export const characterSchema = z.object({
  id: z.number().int().positive(),
  story_id: z.number().int().positive(),
  name: z.string().min(1),
  appearance: z.string().min(1),
  biography: z.string().min(1),
  personality: z.string().min(1),
  image_url: z.string().min(1).nullable(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
});

export const sceneSchema = z.object({
  id: z.number().int().positive(),
  story_id: z.number().int().positive(),
  description: z.string().min(1),
  character_ids: z.array(z.number().int().positive()),
  background_image_url: z.string().min(1).nullable(),
  background_music_url: z.string().min(1).nullable(),
  scene_order: z.number().int().positive(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
});

export const turnSchema = z.object({
  id: z.number().int().positive(),
  story_id: z.number().int().positive(),
  scene_id: z.number().int().positive(),
  speaker_character_id: z.number().int().positive().nullable(),
  speaker_name: z.string().min(1).nullable().optional(),
  text: z.string().min(1),
  type: turnTypeSchema,
  turn_number: z.number().int().positive(),
  previous_turn_id: z.number().int().positive().nullable(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
});

export const storySchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  story_background: z.string().min(1),
  current_turn_id: z.number().int().positive().nullable(),
  current_scene_id: z.number().int().positive().nullable(),
  source_image_url: z.string().min(1).nullable(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
  current_scene: sceneSchema.nullable(),
  current_turn: turnSchema.nullable(),
  characters: z.array(characterSchema),
  scenes: z.array(sceneSchema),
  turns: z.array(turnSchema),
});

export const generateStoryInputSchema = z.instanceof(FormData);

export const storyByIdInputSchema = z.object({
  storyId: z.number().int().positive(),
});

export const doTurnInputSchema = z.object({
  storyId: z.number().int().positive(),
  turnText: z.string().trim().min(1),
});

export const drawBackgroundInputSchema = z.object({
  sceneId: z.number().int().positive(),
  description: z.string().trim().min(1),
});

export const drawCharacterInputSchema = z.object({
  characterId: z.number().int().positive(),
  description: z.string().trim().min(1),
});

export const storyEnvelopeSchema = z.object({
  story: storySchema,
});

export const generateStoryResultSchema = storyEnvelopeSchema.extend({
  warnings: z.array(assetWarningSchema),
});

export const drawBackgroundResultSchema = z.object({
  sceneId: z.number().int().positive(),
  backgroundImageUrl: z.string().min(1),
});

export const drawCharacterResultSchema = z.object({
  characterId: z.number().int().positive(),
  imageUrl: z.string().min(1),
});
