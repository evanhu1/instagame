import { ChromaClient, IncludeEnum } from 'chromadb';
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed';
import { config } from '../config.js';

let turnsCollectionPromise;
const embeddingFunction = new DefaultEmbeddingFunction();

const buildChromaClientArgs = () => {
  const args = {
    host: config.chroma.host,
    port: config.chroma.port,
    ssl: config.chroma.ssl,
  };

  if (config.chroma.tenant) {
    args.tenant = config.chroma.tenant;
  }

  if (config.chroma.database) {
    args.database = config.chroma.database;
  }

  return args;
};

const buildTurnMemoryId = (turn) =>
  `story-${Number(turn.story_id)}-turn-${Number(turn.id)}`;

const buildTurnDocument = (turn) => {
  const turnHeader = `turn ${Number(turn.turn_number)} (${turn.type})`;
  const speakerLabel =
    turn.type === 'dialogue' && turn.speaker_name
      ? `${turn.speaker_name}: `
      : '';

  return `${turnHeader}\n${speakerLabel}${turn.text}`;
};

const buildTurnMetadata = (turn) => ({
  story_id: Number(turn.story_id),
  scene_id: Number(turn.scene_id),
  turn_id: Number(turn.id),
  turn_number: Number(turn.turn_number),
  type: turn.type,
  text: turn.text,
  speaker_character_id: turn.speaker_character_id ?? null,
  speaker_name: turn.speaker_name ?? null,
});

const getTurnsCollection = async () => {
  if (!turnsCollectionPromise) {
    throw new Error('Turn memory has not been initialized yet.');
  }

  return turnsCollectionPromise;
};

export const initializeTurnMemory = async () => {
  const client = new ChromaClient(buildChromaClientArgs());
  await client.heartbeat();

  turnsCollectionPromise = client.getOrCreateCollection({
    name: config.chroma.collectionName,
    embeddingFunction,
    metadata: {
      app: 'instagame',
      kind: 'story_turn_memory',
    },
  });

  await turnsCollectionPromise;
};

export const upsertStoryTurns = async (turns) => {
  if (!Array.isArray(turns) || turns.length === 0) {
    return;
  }

  const collection = await getTurnsCollection();

  await collection.upsert({
    ids: turns.map(buildTurnMemoryId),
    documents: turns.map(buildTurnDocument),
    metadatas: turns.map(buildTurnMetadata),
  });
};

export const findRelevantPreviousTurn = async ({
  storyId,
  queryText,
  excludeTurnId,
}) => {
  const collection = await getTurnsCollection();
  const result = await collection.query({
    queryTexts: [queryText],
    nResults: 1,
    where: {
      $and: [
        { story_id: Number(storyId) },
        { turn_id: { $ne: Number(excludeTurnId) } },
      ],
    },
    include: [
      IncludeEnum.documents,
      IncludeEnum.metadatas,
      IncludeEnum.distances,
    ],
  });

  const match = result.rows()?.[0]?.[0];

  if (!match?.metadata || !match.document) {
    return null;
  }

  return {
    id: Number(match.metadata.turn_id),
    sceneId: Number(match.metadata.scene_id),
    storyId: Number(match.metadata.story_id),
    turnNumber: Number(match.metadata.turn_number),
    type: String(match.metadata.type),
    speakerName:
      typeof match.metadata.speaker_name === 'string'
        ? match.metadata.speaker_name
        : null,
    text:
      typeof match.metadata.text === 'string'
        ? match.metadata.text
        : String(match.document),
    distance:
      typeof match.distance === 'number' ? Number(match.distance) : null,
  };
};

export const formatTurnAsRelevantContext = (turn) => {
  if (!turn) {
    return null;
  }

  const speakerPrefix =
    turn.type === 'dialogue' && turn.speakerName ? `${turn.speakerName}: ` : '';

  return `turn ${turn.turnNumber} (${turn.type}) ${speakerPrefix}${turn.text}`;
};
