import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ quiet: true });

const resolveStoragePath = (...segments) =>
  path.resolve(process.cwd(), 'storage', ...segments);

const parseBoolean = (value, defaultValue = false) => {
  if (value == null) {
    return defaultValue;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

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
    musicEnabled: parseBoolean(process.env.GEMINI_MUSIC_ENABLED, false),
    musicModel: process.env.GEMINI_MUSIC_MODEL || 'models/lyria-realtime-exp',
    musicGenerationMs: Number(process.env.GEMINI_MUSIC_GENERATION_MS || 30000),
  },
  livekitTts: {
    apiKey:
      process.env.LIVEKIT_INFERENCE_API_KEY || process.env.LIVEKIT_API_KEY || '',
    apiSecret:
      process.env.LIVEKIT_INFERENCE_API_SECRET || process.env.LIVEKIT_API_SECRET || '',
    baseUrl:
      process.env.LIVEKIT_INFERENCE_URL || 'https://agent-gateway.livekit.cloud/v1',
    model: process.env.LIVEKIT_TTS_MODEL || 'inworld/inworld-tts-1.5-max',
    defaultVoice: process.env.LIVEKIT_TTS_VOICE || 'Ashley',
    language: process.env.LIVEKIT_TTS_LANGUAGE || 'en',
  },
  defaults: {
    characterImageUrl:
      process.env.DEFAULT_CHARACTER_IMAGE_URL ||
      'https://api.dicebear.com/9.x/open-peeps/png?seed=instagame-default&backgroundColor=transparent',
  },
  chroma: {
    host: process.env.CHROMA_HOST || 'localhost',
    port: Number(process.env.CHROMA_PORT || 8000),
    ssl: parseBoolean(process.env.CHROMA_SSL, false),
    tenant: process.env.CHROMA_TENANT || undefined,
    database: process.env.CHROMA_DATABASE || undefined,
    collectionName:
      process.env.CHROMA_TURN_COLLECTION || 'instagame_turn_memory',
  },
  storage: {
    dbRoot: resolveStoragePath('db'),
    generatedRoot: resolveStoragePath('generated'),
    uploadsRoot: resolveStoragePath('uploads'),
    generatedBackgrounds: resolveStoragePath('generated', 'backgrounds'),
    generatedCharacters: resolveStoragePath('generated', 'characters'),
    generatedMusic: resolveStoragePath('generated', 'music'),
    generatedVoice: resolveStoragePath('generated', 'voice'),
    sourceUploads: resolveStoragePath('uploads', 'source'),
  },
};

export const hasGeminiCredentials = () =>
  Boolean(config.gemini.apiKey) &&
  config.gemini.apiKey !== 'your_gemini_api_key_here' &&
  config.gemini.apiKey !== 'change_me';
