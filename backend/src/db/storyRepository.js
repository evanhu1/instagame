import { config } from '../config.js';
import { getDb, withTransaction } from './index.js';

const normalizeScene = (scene) => ({
  ...scene,
  character_ids:
    typeof scene.character_ids === 'string'
      ? JSON.parse(scene.character_ids)
      : scene.character_ids,
});

const inferTurnType = (turn) => {
  if (turn?.type === 'dialogue' || turn?.type === 'story_text') {
    return turn.type;
  }

  return turn?.speaker_character_id ? 'dialogue' : 'story_text';
};

const normalizeTurn = (turn) => ({
  ...turn,
  type: inferTurnType(turn),
});

export const createStoryGraph = async ({
  title,
  storyBackground,
  sourceImageUrl,
  initialCharacter,
  initialScene,
  initialTurn,
}) =>
  withTransaction((db) => {
    const storyResult = db
      .prepare(
        `
          INSERT INTO stories (title, story_background, current_turn_id, current_scene_id, source_image_url)
          VALUES (?, ?, NULL, NULL, ?)
        `,
      )
      .run(title, storyBackground, sourceImageUrl ?? null);

    const storyId = Number(storyResult.lastInsertRowid);

    const characterResult = db
      .prepare(
        `
          INSERT INTO characters (story_id, name, appearance, biography, personality, image_url)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        storyId,
        initialCharacter.name,
        initialCharacter.appearance,
        initialCharacter.biography,
        initialCharacter.personality,
        config.defaults.characterImageUrl,
      );

    const characterId = Number(characterResult.lastInsertRowid);

    const sceneResult = db
      .prepare(
        `
          INSERT INTO scenes (story_id, description, character_ids, background_image_url, background_music_url, scene_order)
          VALUES (?, ?, ?, ?, ?, 1)
        `,
      )
      .run(
        storyId,
        initialScene.description,
        JSON.stringify([characterId]),
        initialScene.backgroundImageUrl ?? null,
        initialScene.backgroundMusicUrl ?? null,
      );

    const sceneId = Number(sceneResult.lastInsertRowid);

    const turnResult = db
      .prepare(
        `
          INSERT INTO turns (story_id, scene_id, speaker_character_id, text, type, turn_number, previous_turn_id)
          VALUES (?, ?, ?, ?, ?, 1, NULL)
        `,
      )
      .run(
        storyId,
        sceneId,
        initialTurn.type === 'dialogue' ? characterId : null,
        initialTurn.text,
        initialTurn.type,
      );

    const turnId = Number(turnResult.lastInsertRowid);

    db.prepare(
      `
        UPDATE stories
        SET current_turn_id = ?, current_scene_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
    ).run(turnId, sceneId, storyId);

    return {
      storyId,
      characterId,
      sceneId,
      turnId,
    };
  });

export const getStoryById = async (storyId) => {
  const db = getDb();
  const story = db
    .prepare(`SELECT * FROM stories WHERE id = ?`)
    .get(Number(storyId));

  if (!story) {
    return null;
  }

  const characters = db
    .prepare(`SELECT * FROM characters WHERE story_id = ? ORDER BY id ASC`)
    .all(Number(storyId));
  const scenes = db
    .prepare(
      `SELECT * FROM scenes WHERE story_id = ? ORDER BY scene_order ASC, id ASC`,
    )
    .all(Number(storyId));
  const turns = db
    .prepare(
      `
        SELECT t.*, c.name AS speaker_name
        FROM turns t
        LEFT JOIN characters c ON c.id = t.speaker_character_id
        WHERE t.story_id = ?
        ORDER BY t.turn_number ASC, t.id ASC
      `,
    )
    .all(Number(storyId));

  const normalizedScenes = scenes.map(normalizeScene);
  const normalizedTurns = turns.map(normalizeTurn);

  return {
    ...story,
    current_scene: normalizedScenes.find(
      (scene) => Number(scene.id) === Number(story.current_scene_id),
    ),
    current_turn:
      normalizedTurns.find(
        (turn) => Number(turn.id) === Number(story.current_turn_id),
      ) ?? null,
    characters,
    scenes: normalizedScenes,
    turns: normalizedTurns,
  };
};

export const getSceneById = async (sceneId) => {
  const scene = getDb()
    .prepare(`SELECT * FROM scenes WHERE id = ?`)
    .get(Number(sceneId));
  return scene ? normalizeScene(scene) : null;
};

export const getCharacterById = async (characterId) => {
  return (
    getDb()
      .prepare(`SELECT * FROM characters WHERE id = ?`)
      .get(Number(characterId)) ?? null
  );
};

export const getTurnGenerationContext = async (storyId) => {
  const db = getDb();
  const numericStoryId = Number(storyId);
  const story = db
    .prepare(`SELECT * FROM stories WHERE id = ?`)
    .get(numericStoryId);

  if (!story) {
    return null;
  }

  const rawCurrentScene = story.current_scene_id
    ? db
        .prepare(`SELECT * FROM scenes WHERE id = ? AND story_id = ?`)
        .get(Number(story.current_scene_id), numericStoryId)
    : null;
  const currentScene = rawCurrentScene ? normalizeScene(rawCurrentScene) : null;
  const turnWithSpeakerStatement = db.prepare(`
    SELECT t.*, c.name AS speaker_name
    FROM turns t
    LEFT JOIN characters c ON c.id = t.speaker_character_id
    WHERE t.id = ? AND t.story_id = ?
  `);

  const previousTurnsReversed = [];
  let nextTurnId = story.current_turn_id ? Number(story.current_turn_id) : null;

  while (nextTurnId) {
    const turn = turnWithSpeakerStatement.get(nextTurnId, numericStoryId);

    if (!turn) {
      break;
    }

    previousTurnsReversed.push(normalizeTurn(turn));
    nextTurnId = turn.previous_turn_id ? Number(turn.previous_turn_id) : null;
  }

  const previousTurns = previousTurnsReversed.reverse();
  const currentTurn = previousTurns.at(-1) ?? null;
  const sceneCharacterIds = currentScene?.character_ids ?? [];
  const currentCharacterId =
    sceneCharacterIds.find(
      (characterId) => Number(characterId) === Number(currentTurn?.speaker_character_id),
    ) ??
    sceneCharacterIds[0] ??
    null;
  const currentCharacter = currentCharacterId
    ? db
        .prepare(`SELECT * FROM characters WHERE id = ? AND story_id = ?`)
        .get(Number(currentCharacterId), numericStoryId)
    : null;

  return {
    story,
    currentScene,
    currentTurn,
    currentCharacter,
    previousTurns,
  };
};

export const createGeneratedTurn = async ({
  storyId,
  sceneId,
  previousTurnId,
  text,
  type,
  speakerCharacterId,
}) =>
  withTransaction((db) => {
    const numericStoryId = Number(storyId);
    const previousTurn = db
      .prepare(`SELECT turn_number FROM turns WHERE id = ? AND story_id = ?`)
      .get(Number(previousTurnId), numericStoryId);

    if (!previousTurn) {
      throw new Error(`Turn ${previousTurnId} was not found for story ${storyId}.`);
    }

    if (type === 'dialogue' && !speakerCharacterId) {
      throw new Error('Dialogue turns require a speakerCharacterId.');
    }

    const turnResult = db
      .prepare(
        `
          INSERT INTO turns (story_id, scene_id, speaker_character_id, text, type, turn_number, previous_turn_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        numericStoryId,
        Number(sceneId),
        type === 'dialogue' ? Number(speakerCharacterId) : null,
        text,
        type,
        Number(previousTurn.turn_number) + 1,
        Number(previousTurnId),
      );

    const turnId = Number(turnResult.lastInsertRowid);

    db.prepare(
      `
        UPDATE stories
        SET current_turn_id = ?, current_scene_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
    ).run(turnId, Number(sceneId), numericStoryId);

    const createdTurn = db
      .prepare(
        `
          SELECT t.*, c.name AS speaker_name
          FROM turns t
          LEFT JOIN characters c ON c.id = t.speaker_character_id
          WHERE t.id = ?
        `,
      )
      .get(turnId);

    return normalizeTurn(createdTurn);
  });

export const updateSceneBackgroundImage = async (sceneId, backgroundImageUrl) => {
  getDb()
    .prepare(
      `UPDATE scenes SET background_image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    )
    .run(backgroundImageUrl, Number(sceneId));
};

export const updateSceneBackgroundMusic = async (sceneId, backgroundMusicUrl) => {
  getDb()
    .prepare(
      `UPDATE scenes SET background_music_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    )
    .run(backgroundMusicUrl, Number(sceneId));
};

export const updateCharacterImage = async (characterId, imageUrl) => {
  getDb()
    .prepare(
      `UPDATE characters SET image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    )
    .run(imageUrl, Number(characterId));
};

export const deleteStoryById = async (storyId) => {
  getDb()
    .prepare(`DELETE FROM stories WHERE id = ?`)
    .run(Number(storyId));
};
