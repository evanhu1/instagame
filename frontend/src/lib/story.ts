import type {
  Choice,
  LiveStory,
  LiveStoryCharacter,
  LiveStoryScene,
  LiveStoryTurn,
  Tone,
} from '@/types/game';

const CHARACTER_COLORS = ['#d4a843', '#5b8fb9', '#ff8f57', '#65b891', '#c46dd6'];

const ACTION_ICONS: Record<Tone, string> = {
  aggressive: '⚔️',
  charming: '✨',
  evasive: '👀',
  honest: '💬',
  curious: '🔍',
};
const PLACEHOLDER_STORY_TITLE_RE = /^Story\s+\d+$/i;

function hashValue(value: string) {
  let hash = 0;

  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return hash;
}

export function trimCopy(value: string | null | undefined, fallback: string, maxLength = 180) {
  if (!value) {
    return fallback;
  }

  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

export function getCurrentScene(story: LiveStory | null) {
  if (!story) {
    return null;
  }

  return (
    story.current_scene ||
    story.scenes.find((scene) => scene.id === story.current_scene_id) ||
    story.scenes.at(-1) ||
    null
  );
}

export function getCurrentTurn(story: LiveStory | null) {
  if (!story) {
    return null;
  }

  return (
    story.current_turn ||
    story.turns.find((turn) => turn.id === story.current_turn_id) ||
    story.turns.at(-1) ||
    null
  );
}

export function getCurrentSpeaker(story: LiveStory | null) {
  const turn = getCurrentTurn(story);

  if (!story || !turn?.speaker_character_id) {
    return null;
  }

  return (
    story.characters.find(
      (character) => character.id === turn.speaker_character_id,
    ) || null
  );
}

export function getSceneCharacters(story: LiveStory | null) {
  const scene = getCurrentScene(story);

  if (!story || !scene) {
    return [];
  }

  const sceneCharacters = story.characters.filter((character) =>
    scene.character_ids.includes(character.id),
  );

  return sceneCharacters.length ? sceneCharacters : story.characters;
}

export function getCharacterColor(characterId: string | number) {
  return CHARACTER_COLORS[hashValue(String(characterId)) % CHARACTER_COLORS.length];
}

export function getSpeakerName(
  speaker: LiveStoryCharacter | null,
  turn: LiveStoryTurn | null,
) {
  return speaker?.name || turn?.speaker_name || 'Narrator';
}

export function buildActionChoices(story: LiveStory | null): Choice[] {
  const speaker = getCurrentSpeaker(story);
  const scene = getCurrentScene(story);
  const turn = getCurrentTurn(story);
  const speakerName = getSpeakerName(speaker, turn).split(' ')[0] || 'them';
  const sceneLead = scene?.description
    ?.split(/[,.]/)[0]
    ?.trim()
    ?.replace(/^./, (value) => value.toLowerCase());

  return [
    {
      id: 'curious-probe',
      text: speaker
        ? `Ask ${speakerName} what this means`
        : 'Ask what just changed',
      tone: 'curious',
      icon: ACTION_ICONS.curious,
    },
    {
      id: 'careful-read',
      text: sceneLead ? `Read ${sceneLead}` : 'Read the room carefully',
      tone: 'honest',
      icon: ACTION_ICONS.honest,
    },
    {
      id: 'danger-push',
      text: 'Choose the dangerous option',
      tone: 'aggressive',
      icon: ACTION_ICONS.aggressive,
    },
  ];
}

export function buildStoryTitle(story: LiveStory | null, prompt?: string) {
  const storyTitle = story?.title?.trim();

  if (storyTitle && !PLACEHOLDER_STORY_TITLE_RE.test(storyTitle)) {
    return storyTitle;
  }

  const promptValue = prompt?.trim();

  if (promptValue) {
    const normalized = promptValue
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^./, (value) => value.toUpperCase());

    return normalized.endsWith('story')
      ? normalized
      : `${normalized} story`;
  }

  return 'Your story';
}

export function buildStorySubtitle(story: LiveStory | null) {
  if (!story) {
    return 'A cinematic opening generated from your photo.';
  }

  return trimCopy(
    story.story_background,
    'A cinematic opening generated from your photo.',
    120,
  );
}

export function buildStoryProgress(story: LiveStory | null) {
  if (!story?.turns.length) {
    return 0;
  }

  return Math.min(100, 20 + story.turns.length * 12);
}

export function getTurnKey(turn: LiveStoryTurn | null) {
  return turn ? `${turn.scene_id}-${turn.id}-${turn.turn_number}` : 'empty-turn';
}

export function getSceneTransitionText(scene: LiveStoryScene | null) {
  if (!scene?.description) {
    return null;
  }

  return trimCopy(scene.description, '', 150);
}
