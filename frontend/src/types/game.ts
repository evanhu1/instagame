export type GameScreen = 'camera' | 'loading' | 'story' | 'summary' | 'archive' | 'settings';
export type TabScreen = 'home' | 'archive' | 'settings';
export type StoryStatus = 'idle' | 'generating' | 'ready' | 'advancing' | 'error';

export type Tone = 'aggressive' | 'charming' | 'evasive' | 'honest' | 'curious';

export interface Choice {
  id: string;
  text: string;
  tone: Tone;
  icon: string;
}

export interface DialogueBeat {
  speaker: string | 'narrator' | null;
  text: string | null;
  choices?: Choice[];
  afterChoice?: string;
  enterFrom?: 'left' | 'right';
}

export interface Character {
  id: string;
  name: string;
  role: string;
  personality: string;
  color: string;
  portrait?: string;
}

export interface Scene {
  id: string;
  narration?: string;
  transitionNarration?: string;
  musicMood: string;
  beats: DialogueBeat[];
  background?: string;
}

export interface StorySummary {
  title: string;
  teaser: string;
}

export interface Story {
  title: string;
  genre: string;
  premise: string;
  playerRole: string;
  characters: Character[];
  scenes: Scene[];
  summary: StorySummary;
}

export interface AssetWarning {
  asset: 'background_music' | 'character_image';
  message: string;
}

export interface LiveStoryCharacter {
  id: number;
  story_id: number;
  name: string;
  appearance: string;
  biography: string;
  personality: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface LiveStoryScene {
  id: number;
  story_id: number;
  description: string;
  character_ids: number[];
  background_image_url: string | null;
  background_music_url: string | null;
  scene_order: number;
  created_at: string;
  updated_at: string;
}

export type LiveTurnType = 'dialogue' | 'story_text';

export interface LiveStoryTurn {
  id: number;
  story_id: number;
  scene_id: number;
  speaker_character_id: number | null;
  speaker_name?: string | null;
  text: string;
  type: LiveTurnType;
  turn_number: number;
  previous_turn_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface LiveStory {
  id: number;
  title: string;
  story_background: string;
  current_turn_id: number | null;
  current_scene_id: number | null;
  source_image_url: string | null;
  created_at: string;
  updated_at: string;
  current_scene: LiveStoryScene | null;
  current_turn: LiveStoryTurn | null;
  characters: LiveStoryCharacter[];
  scenes: LiveStoryScene[];
  turns: LiveStoryTurn[];
}

export interface PlayerChoice {
  id: string;
  text: string;
  tone: Tone;
  icon: string;
  storyId: number;
  sceneId: number | null;
  turnNumber: number;
  createdAt: string;
}

export interface SavedGame {
  id: string;
  storyId: number;
  storyTitle: string;
  storyBackground: string;
  thumbnail: string | null;
  lastPlayed: Date;
  progress: number;
  choiceHistory: PlayerChoice[];
  snapshot: LiveStory;
}

export interface GameState {
  currentScreen: GameScreen;
  currentTab: TabScreen;
  musicEnabled: boolean;
  uploadedPhoto: string | null;
  pendingImageFile: File | null;
  userPrompt: string;
  storyId: number | null;
  story: LiveStory | null;
  storyStatus: StoryStatus;
  choiceHistory: PlayerChoice[];
  activeChoiceId: string | null;
  warnings: AssetWarning[];
  errorMessage: string | null;
  isTransitioning: boolean;
  transitionText: string | null;
  savedGames: SavedGame[];
}

export type GameAction =
  | { type: 'SET_SCREEN'; payload: GameScreen }
  | { type: 'SET_TAB'; payload: TabScreen }
  | { type: 'SET_MUSIC_ENABLED'; payload: boolean }
  | { type: 'SET_UPLOAD'; payload: { previewUrl: string | null; file: File | null } }
  | { type: 'SET_PROMPT'; payload: string }
  | { type: 'GENERATE_REQUEST' }
  | { type: 'GENERATE_SUCCESS'; payload: { story: LiveStory; warnings: AssetWarning[] } }
  | { type: 'GENERATE_ERROR'; payload: string }
  | {
      type: 'ADVANCE_REQUEST';
      payload: {
        choiceId: string;
      };
    }
  | {
      type: 'ADVANCE_SUCCESS';
      payload: {
        story: LiveStory;
        choice: PlayerChoice | null;
        transitionText: string | null;
      };
    }
  | { type: 'ADVANCE_ERROR'; payload: string }
  | {
      type: 'HYDRATE_STORY';
      payload: {
        story: LiveStory;
        choiceHistory?: PlayerChoice[];
        uploadedPhoto?: string | null;
        warnings?: AssetWarning[];
      };
    }
  | { type: 'START_TRANSITION'; payload: string }
  | { type: 'END_TRANSITION' }
  | { type: 'SAVE_GAME'; payload: SavedGame }
  | { type: 'LOAD_GAME'; payload: string }
  | { type: 'RESET_GAME' };
