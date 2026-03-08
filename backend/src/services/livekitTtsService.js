import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { inference, initializeLogger, loggerOptions, tts } from '@livekit/agents';
import { combineAudioFrames } from '@livekit/rtc-node';
import { config } from '../config.js';
import { HttpError } from '../utils/httpError.js';

const SUPPORTED_VOICES = [
  'Ashley',
  'Diego',
  'Edward',
  'Olivia',
];

const ensureLiveKitLogger = () => {
  if (!loggerOptions()) {
    initializeLogger({
      pretty: false,
      level: 'warn',
    });
  }
};

const assertTtsConfigured = () => {
  if (!config.livekitTts.apiKey || !config.livekitTts.apiSecret) {
    throw new HttpError(
      503,
      'Voice synthesis is not configured. Set LIVEKIT_API_KEY and LIVEKIT_API_SECRET to enable LiveKit TTS.',
    );
  }
};

const hashValue = (value) => {
  let hash = 0;

  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return hash;
};

const getVoiceForCharacter = ({ characterId, speakerName }) => {
  const seed = String(characterId ?? speakerName ?? config.livekitTts.defaultVoice);
  return SUPPORTED_VOICES[hashValue(seed) % SUPPORTED_VOICES.length];
};

const normalizeText = (value) => value.replace(/\s+/g, ' ').trim();

const createCacheKey = ({ text, speakerName, characterId, voice }) =>
  createHash('sha1')
    .update(
      JSON.stringify({
        text,
        speakerName,
        characterId,
        voice,
        model: config.livekitTts.model,
        language: config.livekitTts.language,
      }),
    )
    .digest('hex');

const encodeWavBuffer = (audioFrame) => {
  const pcmBuffer = Buffer.from(
    audioFrame.data.buffer,
    audioFrame.data.byteOffset,
    audioFrame.data.byteLength,
  );
  const header = Buffer.alloc(44);
  const byteRate = audioFrame.sampleRate * audioFrame.channels * 2;
  const blockAlign = audioFrame.channels * 2;
  const dataSize = pcmBuffer.byteLength;

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(audioFrame.channels, 22);
  header.writeUInt32LE(audioFrame.sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
};

const collectAudioFrame = async (stream) => {
  const frames = [];

  for await (const event of stream) {
    if (event === tts.SynthesizeStream.END_OF_STREAM) {
      continue;
    }

    frames.push(event.frame);
  }

  if (!frames.length) {
    throw new HttpError(502, 'LiveKit TTS returned no audio frames.');
  }

  return combineAudioFrames(frames);
};

export const synthesizeDialogueLine = async ({
  text,
  speakerName = null,
  characterId = null,
}) => {
  ensureLiveKitLogger();
  assertTtsConfigured();

  const normalizedText = normalizeText(text || '');

  if (!normalizedText) {
    throw new HttpError(400, 'Dialogue text is required.');
  }

  const voice = getVoiceForCharacter({ characterId, speakerName });
  const cacheKey = createCacheKey({
    text: normalizedText,
    speakerName,
    characterId,
    voice,
  });
  const fileName = `${cacheKey}.wav`;
  const absolutePath = path.join(config.storage.generatedVoice, fileName);
  const publicUrl = `/generated/voice/${fileName}`;

  try {
    await fs.access(absolutePath);

    return {
      audioUrl: publicUrl,
      cached: true,
      voice,
    };
  } catch {
    // Cache miss, synthesize below.
  }

  await fs.mkdir(config.storage.generatedVoice, { recursive: true });

  const ttsClient = new inference.TTS({
    apiKey: config.livekitTts.apiKey,
    apiSecret: config.livekitTts.apiSecret,
    baseURL: config.livekitTts.baseUrl,
    model: config.livekitTts.model,
    voice,
    language: config.livekitTts.language,
  });

  try {
    const stream = ttsClient.stream();
    stream.pushText(normalizedText);
    stream.endInput();

    const audioFrame = await collectAudioFrame(stream);
    const wavBuffer = encodeWavBuffer(audioFrame);

    await fs.writeFile(absolutePath, wavBuffer);
  } finally {
    await ttsClient.close();
  }

  return {
    audioUrl: publicUrl,
    cached: false,
    voice,
  };
};
