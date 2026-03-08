# Instagame Backend

Node + Express API server for generating and storing the opening state of an
Instagame story using Gemini and a local SQLite database.

## Setup

1. Update `.env` with your Gemini API key if needed.
2. Install dependencies with `npm install`.
3. Start the server with `npm run dev` or `npm start`.

## API

The backend now exposes a tRPC router at `/trpc` instead of the earlier
REST-only story endpoints.

### Procedures

- `story.generate`
  - mutation
  - input: `FormData` with `image`
  - returns: `{ story, warnings }`
  - uses the uploaded image as the initial scene background
- `story.byId`
  - query
  - input: `{ storyId: number }`
  - returns: `{ story }`
- `story.doTurn`
  - mutation
  - input: `{ storyId: number, turnText: string }`
  - returns: `{ story }`
- `story.drawBackground`
  - mutation
  - input: `{ sceneId: number, description: string }`
  - returns: `{ sceneId, backgroundImageUrl }`
- `story.drawCharacter`
  - mutation
  - input: `{ characterId: number, description: string }`
  - returns: `{ characterId, imageUrl }`

### Other routes

- `GET /health`
- static assets under `/generated` and `/uploads`

## Defaults

- New characters start with a transparent-background placeholder avatar until a generated portrait is available.
- New stories use the uploaded source image as the initial `background_image_url`.
