// Game State Types
export type GameScreen = 'camera' | 'loading' | 'story' | 'summary' | 'archive' | 'settings';
export type TabScreen = 'home' | 'archive' | 'settings';

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

export interface PlayerChoice {
  choiceId: string;
  text: string;
  tone: Tone;
  sceneId: string;
  beatIndex: number;
}

// Saved game for archive
export interface SavedGame {
  id: string;
  storyTitle: string;
  thumbnail: string | null;
  lastPlayed: Date;
  currentSceneIndex: number;
  progress: number; // 0-100
  choiceHistory: PlayerChoice[];
}

export interface GameState {
  currentScreen: GameScreen;
  currentTab: TabScreen;
  uploadedPhoto: string | null;
  userPrompt: string;
  currentSceneIndex: number;
  currentBeatIndex: number;
  choiceHistory: PlayerChoice[];
  charactersOnScreen: Set<string>;
  isTransitioning: boolean;
  transitionText: string | null;
  savedGames: SavedGame[];
}

// Game Actions
export type GameAction =
  | { type: 'SET_SCREEN'; payload: GameScreen }
  | { type: 'SET_TAB'; payload: TabScreen }
  | { type: 'SET_PHOTO'; payload: string }
  | { type: 'SET_PROMPT'; payload: string }
  | { type: 'ADVANCE_BEAT' }
  | { type: 'SET_BEAT'; payload: { sceneIndex: number; beatIndex: number } }
  | { type: 'MAKE_CHOICE'; payload: Choice }
  | { type: 'ADD_CHARACTER'; payload: string }
  | { type: 'START_TRANSITION'; payload: string }
  | { type: 'END_TRANSITION' }
  | { type: 'SAVE_GAME'; payload: SavedGame }
  | { type: 'LOAD_GAME'; payload: string }
  | { type: 'RESET_GAME' };
