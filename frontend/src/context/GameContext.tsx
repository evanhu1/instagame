import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { GameState, GameAction } from '@/types/game';
import { MOCK_STORY } from '@/data/mockStory';

const initialState: GameState = {
  currentScreen: 'camera',
  currentTab: 'home',
  uploadedPhoto: null,
  userPrompt: '',
  currentSceneIndex: 0,
  currentBeatIndex: 0,
  choiceHistory: [],
  charactersOnScreen: new Set(),
  isTransitioning: false,
  transitionText: null,
  savedGames: [],
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, currentScreen: action.payload };

    case 'SET_TAB':
      return { ...state, currentTab: action.payload };

    case 'SET_PHOTO':
      return { ...state, uploadedPhoto: action.payload };

    case 'SET_PROMPT':
      return { ...state, userPrompt: action.payload };

    case 'ADVANCE_BEAT': {
      const currentScene = MOCK_STORY.scenes[state.currentSceneIndex];
      const nextBeatIndex = state.currentBeatIndex + 1;

      // Check if we've reached the end of the current scene
      if (nextBeatIndex >= currentScene.beats.length) {
        const nextSceneIndex = state.currentSceneIndex + 1;
        
        // Check if we've completed all scenes
        if (nextSceneIndex >= MOCK_STORY.scenes.length) {
          return {
            ...state,
            currentScreen: 'summary',
          };
        }

        // Start transition to next scene
        const nextScene = MOCK_STORY.scenes[nextSceneIndex];
        return {
          ...state,
          isTransitioning: true,
          transitionText: nextScene.transitionNarration || null,
          currentSceneIndex: nextSceneIndex,
          currentBeatIndex: 0,
          charactersOnScreen: new Set(),
        };
      }

      return {
        ...state,
        currentBeatIndex: nextBeatIndex,
      };
    }

    case 'SET_BEAT':
      return {
        ...state,
        currentSceneIndex: action.payload.sceneIndex,
        currentBeatIndex: action.payload.beatIndex,
      };

    case 'MAKE_CHOICE': {
      const choice = action.payload;
      const currentScene = MOCK_STORY.scenes[state.currentSceneIndex];
      
      // Find the next beat that matches this choice
      let nextBeatIndex = state.currentBeatIndex + 1;
      
      // Skip beats that have afterChoice conditions that don't match
      while (nextBeatIndex < currentScene.beats.length) {
        const nextBeat = currentScene.beats[nextBeatIndex];
        if (nextBeat.afterChoice && nextBeat.afterChoice !== choice.id) {
          nextBeatIndex++;
        } else {
          break;
        }
      }

      return {
        ...state,
        choiceHistory: [
          ...state.choiceHistory,
          {
            choiceId: choice.id,
            text: choice.text,
            tone: choice.tone,
            sceneId: currentScene.id,
            beatIndex: state.currentBeatIndex,
          },
        ],
        currentBeatIndex: nextBeatIndex,
      };
    }

    case 'ADD_CHARACTER':
      return {
        ...state,
        charactersOnScreen: new Set([...state.charactersOnScreen, action.payload]),
      };

    case 'START_TRANSITION':
      return {
        ...state,
        isTransitioning: true,
        transitionText: action.payload,
      };

    case 'END_TRANSITION':
      return {
        ...state,
        isTransitioning: false,
        transitionText: null,
      };

    case 'SAVE_GAME':
      return {
        ...state,
        savedGames: [action.payload, ...state.savedGames.filter(g => g.id !== action.payload.id)],
      };

    case 'LOAD_GAME': {
      const savedGame = state.savedGames.find(g => g.id === action.payload);
      if (!savedGame) return state;
      return {
        ...state,
        currentSceneIndex: savedGame.currentSceneIndex,
        currentBeatIndex: 0,
        choiceHistory: savedGame.choiceHistory,
        charactersOnScreen: new Set(),
        currentScreen: 'story',
      };
    }

    case 'RESET_GAME':
      return {
        ...initialState,
        savedGames: state.savedGames, // Keep saved games
      };

    default:
      return state;
  }
}

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
