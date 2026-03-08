# Instagame Backend

Node + Express API server for generating and storing interactive story state. Uses several AI services for text, image, music, and voice generation.

## AI Services

| Service | Role | Default model |
|---|---|---|
| **Gemini LLM** | Story and turn text generation | `gemini-3-flash-preview` |
| **Nano Banana** (Gemini image) | Background and character portrait generation | `gemini-2.5-flash-image` |
| **Lyria** (Gemini Live Music) | Background music generation | `models/lyria-realtime-exp` |
| **ChromaDB** | Vector store for semantic turn memory retrieval | — |
| **LiveKit / Inworld TTS** | Dialogue voice synthesis | `inworld/inworld-tts-1.5-max` |

## Setup

1. Update `.env` with your API keys (see `.env.example`).
2. Install dependencies with `npm install`.
3. Start a Chroma server with `chroma run` or point the backend at an existing instance.
4. Start the server with `npm run dev` or `npm start`.

## Environment Variables

### Core

- `PORT` — default `3000`
- `APP_BASE_URL` — default `http://localhost:3000`
- `SQLITE_PATH` — default `./storage/db/instagame.sqlite`

### Gemini

- `GEMINI_API_KEY` — required for all AI-backed endpoints
- `GEMINI_TEXT_MODEL` — default `gemini-3-flash-preview`
- `GEMINI_IMAGE_MODEL` — default `gemini-2.5-flash-image` (Nano Banana)
- `GEMINI_IMAGE_MAX_ATTEMPTS` — default `3`
- `GEMINI_MUSIC_ENABLED` — default `false`
- `GEMINI_MUSIC_MODEL` — default `models/lyria-realtime-exp`
- `GEMINI_MUSIC_GENERATION_MS` — duration of generated music clip in ms, default `30000`

### LiveKit TTS

- `LIVEKIT_API_KEY` / `LIVEKIT_INFERENCE_API_KEY` — LiveKit credentials
- `LIVEKIT_API_SECRET` / `LIVEKIT_INFERENCE_API_SECRET`
- `LIVEKIT_INFERENCE_URL` — default `https://agent-gateway.livekit.cloud/v1`
- `LIVEKIT_TTS_MODEL` — default `inworld/inworld-tts-1.5-max`
- `LIVEKIT_TTS_VOICE` — default voice when character has no assigned voice, default `Ashley`
- `LIVEKIT_TTS_LANGUAGE` — default `en`

### ChromaDB

- `CHROMA_HOST` — default `localhost`
- `CHROMA_PORT` — default `8000`
- `CHROMA_SSL` — default `false`
- `CHROMA_TENANT`
- `CHROMA_DATABASE`
- `CHROMA_TURN_COLLECTION` — default `instagame_turn_memory`

## API

The backend exposes a tRPC router at `/trpc` and a few REST endpoints.

### tRPC Procedures

- `story.generate` — mutation — `FormData` with `image` → `{ story, warnings }`
- `story.byId` — query — `{ storyId: number }` → `{ story }`
- `story.doTurn` — mutation — `{ storyId, turnText }` → `{ story }`
- `story.drawBackground` — mutation — `{ sceneId, description }` → `{ sceneId, backgroundImageUrl }`
- `story.drawCharacter` — mutation — `{ characterId, description }` → `{ characterId, imageUrl }`

### REST Endpoints

- `POST /stories/generate` — multipart upload, same as `story.generate` above
- `POST /voice/dialogue` — body `{ text, speakerName?, characterId? }` → `{ audioUrl, voice, cached }`
- `GET /health`
- Static assets under `/generated` and `/uploads`

## Defaults

- New characters use a transparent-background placeholder avatar until a generated portrait is available.
- New stories use the uploaded source image as the initial `background_image_url`.
- Each character is assigned a deterministic voice (Ashley, Diego, Edward, or Olivia) based on their `characterId`.
- Synthesized voice lines are cached to disk by content hash to avoid duplicate TTS calls.
