import {
  GoogleGenAI,
  MusicGenerationMode,
  Modality,
  Type,
  createPartFromBase64,
} from '@google/genai';
import { config, hasGeminiCredentials } from '../config.js';

let cachedClient;
let cachedMusicClient;
const turnTypes = new Set(['dialogue', 'story_text']);

const getGeminiClient = () => {
  if (!hasGeminiCredentials()) {
    throw new Error(
      'Missing GEMINI_API_KEY. Update .env before calling AI-backed endpoints.',
    );
  }

  if (!cachedClient) {
    cachedClient = new GoogleGenAI({ apiKey: config.gemini.apiKey });
  }

  return cachedClient;
};

const getGeminiMusicClient = () => {
  if (!hasGeminiCredentials()) {
    throw new Error(
      'Missing GEMINI_API_KEY. Update .env before calling AI-backed endpoints.',
    );
  }

  if (!cachedMusicClient) {
    cachedMusicClient = new GoogleGenAI({
      apiKey: config.gemini.apiKey,
      apiVersion: 'v1alpha',
    });
  }

  return cachedMusicClient;
};

const storyResponseSchema = {
  type: Type.OBJECT,
  properties: {
    story_background: {
      type: Type.STRING,
      description: 'The overarching premise and world setup for the story.',
    },
    initial_character: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        appearance: { type: Type.STRING },
        biography: { type: Type.STRING },
        personality: { type: Type.STRING },
      },
      required: ['name', 'appearance', 'biography', 'personality'],
    },
    initial_turn: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING },
        type: {
          type: Type.STRING,
          description: 'Whether the opening turn is dialogue or story_text.',
        },
      },
      required: ['text', 'type'],
    },
    initial_scene: {
      type: Type.OBJECT,
      properties: {
        description: { type: Type.STRING },
      },
      required: ['description'],
    },
  },
  required: [
    'story_background',
    'initial_character',
    'initial_turn',
    'initial_scene',
  ],
};

const nextTurnResponseSchema = {
  type: Type.OBJECT,
  properties: {
    text: {
      type: Type.STRING,
      description: 'The next turn text.',
    },
    type: {
      type: Type.STRING,
      description: 'Whether the turn is dialogue or story_text.',
    },
  },
  required: ['text', 'type'],
};

const parseStructuredTurn = (rawResponseText, contextLabel) => {
  if (!rawResponseText) {
    throw new Error(`${contextLabel} did not return a JSON payload.`);
  }

  const parsed = JSON.parse(rawResponseText);
  const text = typeof parsed?.text === 'string' ? parsed.text.trim() : '';
  const type = typeof parsed?.type === 'string' ? parsed.type.trim() : '';

  if (!text) {
    throw new Error(`${contextLabel} returned an empty turn text.`);
  }

  if (!turnTypes.has(type)) {
    throw new Error(
      `${contextLabel} returned an invalid turn type: ${parsed?.type ?? 'undefined'}.`,
    );
  }

  return {
    text,
    type,
  };
};

export const generateStorySeedFromPhoto = async ({ imageBuffer, mimeType }) => {
  const client = getGeminiClient();
  const base64Image = imageBuffer.toString('base64');

  const prompt = `
You are creating the opening state for a mobile interactive story game.

Analyze the uploaded photo and use it as visual inspiration for the first chapter.
Return JSON only.

Requirements:
- Make the setting cinematic, grounded, and immediately playable.
- Produce exactly one initial character.
- The first turn should be dialogue or narration that naturally opens the story.
- Set initial_turn.type to "dialogue" or "story_text".
- The initial scene description should visually match the story background and be suitable for later image generation.
- Keep each field concise but specific.
  `.trim();

  const response = await client.models.generateContent({
    model: config.gemini.textModel,
    contents: [prompt, createPartFromBase64(base64Image, mimeType)],
    config: {
      responseMimeType: 'application/json',
      responseSchema: storyResponseSchema,
      temperature: 0.9,
    },
  });

  if (!response.text) {
    throw new Error('Gemini text generation did not return a JSON payload.');
  }

  const storySeed = JSON.parse(response.text);

  storySeed.initial_turn = parseStructuredTurn(
    JSON.stringify(storySeed.initial_turn),
    'Gemini story seed generation',
  );

  return storySeed;
};

export const generateNextTurn = async ({
  storyBackground,
  currentSceneDescription,
  currentCharacter,
  previousTurns,
  selectedTextChoice,
}) => {
  const client = getGeminiClient();
  const prompt = `
You are writing the next turn for a mobile interactive story.
Return JSON only with the shape {"text": string, "type": "dialogue" | "story_text"}.

Requirements:
- Continue immediately from the selected text choice.
- You may either write narration or dialogue from the current character only.
- Do not invent a new speaker.
- If type is "dialogue", write only the spoken words without a character name label.
- If type is "story_text", write narration only and do not include quoted dialogue.
- Keep the turn concise and playable, around 1 to 3 sentences.

Story background:
${storyBackground}

Current scene description:
${currentSceneDescription}

Current character:
${JSON.stringify(currentCharacter, null, 2)}

Previous turns in chronological order:
${JSON.stringify(previousTurns, null, 2)}

Selected text choice:
${selectedTextChoice}
  `.trim();

  const response = await client.models.generateContent({
    model: config.gemini.textModel,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: nextTurnResponseSchema,
      temperature: 0.9,
    },
  });

  return parseStructuredTurn(response.text, 'Gemini next turn generation');
};

const extractInlineImage = (response) => {
  const parts = response?.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((part) => part.inlineData?.data);

  if (!imagePart?.inlineData?.data || !imagePart.inlineData.mimeType) {
    throw new Error('Gemini image generation did not return image bytes.');
  }

  return {
    base64Data: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType,
  };
};

const isRetryableImageError = (error) => {
  if (!error) {
    return false;
  }

  if (error.status === 429) {
    return true;
  }

  if (typeof error.status === 'number' && error.status >= 500) {
    return true;
  }

  return ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'].includes(
    error.code,
  );
};

export const generateImageFromPrompt = async ({ prompt }) => {
  const client = getGeminiClient();
  let lastError;

  for (let attempt = 1; attempt <= config.gemini.imageMaxAttempts; attempt += 1) {
    try {
      const response = await client.models.generateContent({
        model: config.gemini.imageModel,
        contents: prompt,
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      return extractInlineImage(response);
    } catch (error) {
      lastError = error;

      if (
        attempt >= config.gemini.imageMaxAttempts ||
        !isRetryableImageError(error)
      ) {
        throw error;
      }

      const retryDelayMs = 1000;

      console.warn(
        `Gemini image generation attempt ${attempt} failed with status ${error.status ?? 'unknown'}. Retrying in ${retryDelayMs}ms.`,
      );

      await wait(retryDelayMs);
    }
  }

  throw lastError;
};

const wait = (durationMs) =>
  new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });

const pcmToWav = ({
  pcmBuffer,
  sampleRate = 48000,
  channelCount = 2,
  bitsPerSample = 16,
}) => {
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = channelCount * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const wavHeader = Buffer.alloc(44);

  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
  wavHeader.write('WAVE', 8);
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16);
  wavHeader.writeUInt16LE(1, 20);
  wavHeader.writeUInt16LE(channelCount, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(byteRate, 28);
  wavHeader.writeUInt16LE(blockAlign, 32);
  wavHeader.writeUInt16LE(bitsPerSample, 34);
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(pcmBuffer.length, 40);

  return Buffer.concat([wavHeader, pcmBuffer]);
};

const extractMimeParameter = (mimeType, parameterName) => {
  const match = mimeType.match(
    new RegExp(`(?:^|;)\\s*${parameterName}=([0-9]+)`, 'i'),
  );

  return match ? Number(match[1]) : undefined;
};

const extractFirstMimeParameter = (mimeType, parameterNames) => {
  for (const parameterName of parameterNames) {
    const value = extractMimeParameter(mimeType, parameterName);

    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
};

const swap16BitByteOrder = (buffer) => {
  if (buffer.length % 2 !== 0) {
    throw new Error(
      'Gemini music generation returned an odd number of bytes for 16-bit PCM audio.',
    );
  }

  const swapped = Buffer.from(buffer);

  for (let offset = 0; offset < swapped.length; offset += 2) {
    const firstByte = swapped[offset];
    swapped[offset] = swapped[offset + 1];
    swapped[offset + 1] = firstByte;
  }

  return swapped;
};

const normalizeAudioOutput = ({ chunks, mimeType }) => {
  const pcmBuffer = Buffer.concat(chunks);
  const normalizedMimeType = mimeType.split(';', 1)[0].trim().toLowerCase();

  if (
    normalizedMimeType === 'audio/pcm' ||
    normalizedMimeType === 'audio/l16'
  ) {
    const normalizedPcmBuffer =
      normalizedMimeType === 'audio/l16'
        ? swap16BitByteOrder(pcmBuffer)
        : pcmBuffer;

    return {
      buffer: pcmToWav({
        pcmBuffer: normalizedPcmBuffer,
        sampleRate: extractMimeParameter(mimeType, 'rate') ?? 48000,
        channelCount:
          extractFirstMimeParameter(mimeType, ['channels', 'channel-count']) ??
          2,
      }),
      mimeType: 'audio/wav',
    };
  }

  return {
    buffer: pcmBuffer,
    mimeType: normalizedMimeType,
  };
};

export const generateMusicFromPrompt = async ({ prompt }) => {
  const client = getGeminiMusicClient();
  const audioChunks = [];
  let audioMimeType;
  let isSetupComplete = false;
  let streamError = null;
  let setupCompleteResolve;
  let setupCompleteReject;

  const setupCompletePromise = new Promise((resolve, reject) => {
    setupCompleteResolve = resolve;
    setupCompleteReject = reject;
  });

  const failStream = (error) => {
    if (streamError) {
      return;
    }

    streamError = error;

    if (!isSetupComplete) {
      setupCompleteReject(error);
    }
  };

  const session = await client.live.music.connect({
    model: config.gemini.musicModel,
    callbacks: {
      onmessage: (message) => {
        if (message.setupComplete) {
          isSetupComplete = true;
          setupCompleteResolve();
          return;
        }

        if (message.filteredPrompt?.filteredReason) {
          failStream(
            new Error(
              `Music prompt was filtered: ${message.filteredPrompt.filteredReason}.`,
            ),
          );
          return;
        }

        const chunk = message.audioChunk;

        if (!chunk?.data || !chunk.mimeType) {
          return;
        }

        if (audioMimeType && audioMimeType !== chunk.mimeType) {
          failStream(
            new Error(
              `Music generation returned inconsistent mime types: ${audioMimeType} and ${chunk.mimeType}.`,
            ),
          );
          return;
        }

        audioMimeType = chunk.mimeType;
        audioChunks.push(Buffer.from(chunk.data, 'base64'));
      },
      onerror: (event) => {
        failStream(
          event.error instanceof Error
            ? event.error
            : new Error('Live music generation failed.'),
        );
      },
      onclose: () => {
        if (!isSetupComplete && !streamError) {
          failStream(new Error('Live music connection closed before setup completed.'));
        }
      },
    },
  });

  try {
    await setupCompletePromise;

    await session.setWeightedPrompts({
      weightedPrompts: [{ text: prompt, weight: 1 }],
    });
    await session.setMusicGenerationConfig({
      musicGenerationConfig: {
        musicGenerationMode: MusicGenerationMode.QUALITY,
      },
    });

    session.play();
    await wait(config.gemini.musicGenerationMs);
    session.stop();
    await wait(300);

    if (streamError) {
      throw streamError;
    }

    if (!audioChunks.length || !audioMimeType) {
      throw new Error('Gemini music generation did not return audio bytes.');
    }

    return normalizeAudioOutput({ chunks: audioChunks, mimeType: audioMimeType });
  } finally {
    session.close();
  }
};
