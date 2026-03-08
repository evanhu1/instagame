import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import type { ReactNode } from 'react';
import { trpcClient } from '@/api/trpcClient';
import {
  buildStoryTitle,
  getCurrentScene,
  getCurrentTurn,
  getSceneTransitionText,
} from '@/lib/story';
import type {
  Choice,
  GameAction,
  GameState,
  PlayerChoice,
  SavedGame,
} from '@/types/game';

const MUSIC_ENABLED_STORAGE_KEY = 'instagame.musicEnabled';

const initialState: GameState = {
  currentScreen: 'camera',
  currentTab: 'home',
  musicEnabled: false,
  uploadedPhoto: null,
  pendingImageFile: null,
  userPrompt: '',
  storyId: null,
  story: null,
  storyStatus: 'idle',
  choiceHistory: [],
  activeChoiceId: null,
  warnings: [],
  errorMessage: null,
  isTransitioning: false,
  transitionText: null,
  savedGames: [],
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Something went wrong while talking to the backend.';
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, currentScreen: action.payload };

    case 'SET_TAB':
      return { ...state, currentTab: action.payload };

    case 'SET_MUSIC_ENABLED':
      return { ...state, musicEnabled: action.payload };

    case 'SET_UPLOAD':
      return {
        ...state,
        uploadedPhoto: action.payload.previewUrl,
        pendingImageFile: action.payload.file,
        storyId: null,
        story: null,
        storyStatus: 'idle',
        choiceHistory: [],
        activeChoiceId: null,
        warnings: [],
        errorMessage: null,
        isTransitioning: false,
        transitionText: null,
      };

    case 'SET_PROMPT':
      return { ...state, userPrompt: action.payload };

    case 'GENERATE_REQUEST':
      return {
        ...state,
        storyStatus: 'generating',
        storyId: null,
        story: null,
        choiceHistory: [],
        activeChoiceId: null,
        warnings: [],
        errorMessage: null,
        isTransitioning: false,
        transitionText: null,
      };

    case 'GENERATE_SUCCESS':
      return {
        ...state,
        storyId: action.payload.story.id,
        story: action.payload.story,
        storyStatus: 'ready',
        warnings: action.payload.warnings,
        errorMessage: null,
        activeChoiceId: null,
        isTransitioning: false,
        transitionText: null,
      };

    case 'GENERATE_ERROR':
      return {
        ...state,
        storyStatus: 'error',
        errorMessage: action.payload,
        activeChoiceId: null,
      };

    case 'ADVANCE_REQUEST':
      return {
        ...state,
        storyStatus: 'advancing',
        activeChoiceId: action.payload.choiceId,
        errorMessage: null,
      };

    case 'ADVANCE_SUCCESS':
      return {
        ...state,
        storyId: action.payload.story.id,
        story: action.payload.story,
        storyStatus: 'ready',
        choiceHistory: action.payload.choice
          ? [...state.choiceHistory, action.payload.choice]
          : state.choiceHistory,
        activeChoiceId: null,
        errorMessage: null,
        isTransitioning: Boolean(action.payload.transitionText),
        transitionText: action.payload.transitionText,
      };

    case 'ADVANCE_ERROR':
      return {
        ...state,
        storyStatus: 'error',
        activeChoiceId: null,
        errorMessage: action.payload,
      };

    case 'HYDRATE_STORY':
      return {
        ...state,
        storyId: action.payload.story.id,
        story: action.payload.story,
        storyStatus: 'ready',
        choiceHistory: action.payload.choiceHistory ?? state.choiceHistory,
        uploadedPhoto:
          action.payload.uploadedPhoto === undefined
            ? state.uploadedPhoto
            : action.payload.uploadedPhoto,
        warnings: action.payload.warnings ?? state.warnings,
        errorMessage: null,
        activeChoiceId: null,
        isTransitioning: false,
        transitionText: null,
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
        savedGames: [
          action.payload,
          ...state.savedGames.filter((game) => game.id !== action.payload.id),
        ],
      };

    case 'LOAD_GAME': {
      const savedGame = state.savedGames.find((game) => game.id === action.payload);

      if (!savedGame) {
        return state;
      }

      return {
        ...state,
        currentTab: 'home',
        currentScreen: 'story',
        uploadedPhoto: savedGame.thumbnail,
        pendingImageFile: null,
        storyId: savedGame.storyId,
        story: savedGame.snapshot,
        storyStatus: 'ready',
        choiceHistory: savedGame.choiceHistory,
        activeChoiceId: null,
        warnings: [],
        errorMessage: null,
        isTransitioning: false,
        transitionText: null,
      };
    }

    case 'RESET_GAME':
      return {
        ...initialState,
        savedGames: state.savedGames,
      };

    default:
      return state;
  }
}

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  generateStory: () => Promise<void>;
  advanceStory: (choice: Choice) => Promise<void>;
  saveCurrentGame: () => SavedGame | null;
  loadSavedGame: (gameId: string) => Promise<void>;
  resetGameSession: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const stateRef = useRef(state);
  const generationPromiseRef = useRef<Promise<void> | null>(null);
  const advancePromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(MUSIC_ENABLED_STORAGE_KEY);

    if (storedValue === null) {
      return;
    }

    dispatch({
      type: 'SET_MUSIC_ENABLED',
      payload: storedValue !== 'false',
    });
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    window.localStorage.setItem(MUSIC_ENABLED_STORAGE_KEY, String(state.musicEnabled));
  }, [state.musicEnabled]);

  const generateStory = useCallback(async () => {
    if (generationPromiseRef.current) {
      return generationPromiseRef.current;
    }

    const pendingImageFile = stateRef.current.pendingImageFile;

    if (!pendingImageFile) {
      dispatch({
        type: 'GENERATE_ERROR',
        payload: 'Choose a photo before starting the story.',
      });
      return;
    }

    dispatch({ type: 'GENERATE_REQUEST' });

    const request = (async () => {
      try {
        const formData = new FormData();
        formData.append('image', pendingImageFile);

        const result = await trpcClient.story.generate.mutate(formData);

        dispatch({
          type: 'GENERATE_SUCCESS',
          payload: {
            story: result.story,
            warnings: result.warnings,
          },
        });
      } catch (error) {
        dispatch({
          type: 'GENERATE_ERROR',
          payload: getErrorMessage(error),
        });
      } finally {
        generationPromiseRef.current = null;
      }
    })();

    generationPromiseRef.current = request;
    return request;
  }, []);

  const advanceStory = useCallback(async (choice: Choice) => {
    if (advancePromiseRef.current) {
      return advancePromiseRef.current;
    }

    const currentStory = stateRef.current.story;

    if (!currentStory) {
      dispatch({
        type: 'ADVANCE_ERROR',
        payload: 'Start a story before taking a turn.',
      });
      return;
    }

    const previousScene = getCurrentScene(currentStory);
    const previousTurn = getCurrentTurn(currentStory);

    dispatch({
      type: 'ADVANCE_REQUEST',
      payload: {
        choiceId: choice.id,
      },
    });

    const request = (async () => {
      try {
        const result = await trpcClient.story.doTurn.mutate({
          storyId: currentStory.id,
          turnText: choice.text,
        });

        const nextScene = getCurrentScene(result.story);
        const transitionText =
          nextScene?.id !== previousScene?.id
            ? getSceneTransitionText(nextScene)
            : null;

        const choiceHistoryEntry: PlayerChoice = {
          id: choice.id,
          text: choice.text,
          tone: choice.tone,
          icon: choice.icon,
          storyId: currentStory.id,
          sceneId: previousScene?.id ?? null,
          turnNumber: previousTurn?.turn_number ?? currentStory.turns.length,
          createdAt: new Date().toISOString(),
        };

        dispatch({
          type: 'ADVANCE_SUCCESS',
          payload: {
            story: result.story,
            choice: choiceHistoryEntry,
            transitionText,
          },
        });
      } catch (error) {
        dispatch({
          type: 'ADVANCE_ERROR',
          payload: getErrorMessage(error),
        });
      } finally {
        advancePromiseRef.current = null;
      }
    })();

    advancePromiseRef.current = request;
    return request;
  }, []);

  const saveCurrentGame = useCallback(() => {
    const currentState = stateRef.current;
    const story = currentState.story;

    if (!story) {
      return null;
    }

    const savedGame: SavedGame = {
      id: `story-${story.id}`,
      storyId: story.id,
      storyTitle: buildStoryTitle(story, currentState.userPrompt),
      storyBackground: story.story_background,
      thumbnail: currentState.uploadedPhoto,
      lastPlayed: new Date(),
      progress: Math.min(100, 20 + story.turns.length * 12),
      choiceHistory: currentState.choiceHistory,
      snapshot: story,
    };

    dispatch({ type: 'SAVE_GAME', payload: savedGame });
    return savedGame;
  }, []);

  const loadSavedGame = useCallback(async (gameId: string) => {
    const savedGame = stateRef.current.savedGames.find((game) => game.id === gameId);

    if (!savedGame) {
      return;
    }

    try {
      const result = await trpcClient.story.byId.query({
        storyId: savedGame.storyId,
      });

      dispatch({
        type: 'HYDRATE_STORY',
        payload: {
          story: result.story,
          choiceHistory: savedGame.choiceHistory,
          uploadedPhoto: savedGame.thumbnail,
          warnings: [],
        },
      });
      dispatch({ type: 'SET_TAB', payload: 'home' });
      dispatch({ type: 'SET_SCREEN', payload: 'story' });
    } catch {
      dispatch({ type: 'LOAD_GAME', payload: gameId });
    }
  }, []);

  const resetGameSession = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      generateStory,
      advanceStory,
      saveCurrentGame,
      loadSavedGame,
      resetGameSession,
    }),
    [state, generateStory, advanceStory, saveCurrentGame, loadSavedGame, resetGameSession],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }

  return context;
}
