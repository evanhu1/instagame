# Overworld

The world is the largest open-world game ever made. Overworld is a generative game engine that turns the world around you into a playable adventure. Turn a any photo you take of the world around you into a playable adventure. Characters. Storyline. Choices. Visuals. Music. All generated. All unique to where you are.

Demo: https://streamable.com/rl8hnm

## AI Services

| Service                        | Role                                            | Default model                 |
| ------------------------------ | ----------------------------------------------- | ----------------------------- |
| **Gemini LLM**                 | Story and turn text generation                  | `gemini-3-flash-preview`      |
| **Nano Banana** (Gemini image) | Background and character portrait generation    | `gemini-2.5-flash-image`      |
| **Lyria** (Gemini Live Music)  | Background music generation                     | `models/lyria-realtime-exp`   |
| **ChromaDB**                   | Vector store for semantic turn memory retrieval | —                             |
| **LiveKit / Inworld TTS**      | Dialogue voice synthesis                        | `inworld/inworld-tts-1.5-max` |
