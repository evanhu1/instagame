import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ quiet: true });

const resolveStoragePath = (...segments) =>
  path.resolve(process.cwd(), 'storage', ...segments);

export const config = {
  port: Number(process.env.PORT || 3000),
  appBaseUrl: (process.env.APP_BASE_URL || 'http://localhost:3000').replace(
    /\/+$/,
    '',
  ),
  sqlite: {
    path: path.resolve(
      process.cwd(),
      process.env.SQLITE_PATH || './storage/db/instagame.sqlite',
    ),
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    textModel: process.env.GEMINI_TEXT_MODEL || 'gemini-3-flash-preview',
    imageModel: process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image',
    imageMaxAttempts: Number(process.env.GEMINI_IMAGE_MAX_ATTEMPTS || 3),
    musicModel: process.env.GEMINI_MUSIC_MODEL || 'models/lyria-realtime-exp',
    musicGenerationMs: Number(process.env.GEMINI_MUSIC_GENERATION_MS || 30000),
  },
  defaults: {
    characterImageUrl:
      process.env.DEFAULT_CHARACTER_IMAGE_URL ||
      'https://api.dicebear.com/9.x/open-peeps/png?seed=instagame-default&backgroundColor=transparent',
  },
  storage: {
    dbRoot: resolveStoragePath('db'),
    generatedRoot: resolveStoragePath('generated'),
    uploadsRoot: resolveStoragePath('uploads'),
    generatedBackgrounds: resolveStoragePath('generated', 'backgrounds'),
    generatedCharacters: resolveStoragePath('generated', 'characters'),
    generatedMusic: resolveStoragePath('generated', 'music'),
    sourceUploads: resolveStoragePath('uploads', 'source'),
  },
};

export const hasGeminiCredentials = () =>
  Boolean(config.gemini.apiKey) &&
  config.gemini.apiKey !== 'your_gemini_api_key_here' &&
  config.gemini.apiKey !== 'change_me';
