export const schemaStatements = [
  `PRAGMA foreign_keys = ON`,
  `
    CREATE TABLE IF NOT EXISTS stories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      story_background TEXT NOT NULL,
      current_turn_id INTEGER,
      current_scene_id INTEGER,
      source_image_url TEXT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      story_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      appearance TEXT NOT NULL,
      biography TEXT NOT NULL,
      personality TEXT NOT NULL,
      image_url TEXT DEFAULT 'https://api.dicebear.com/9.x/open-peeps/png?seed=instagame-default&backgroundColor=transparent',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_characters_story
        FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS scenes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      story_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      character_ids TEXT NOT NULL,
      background_image_url TEXT NULL,
      background_music_url TEXT NULL,
      scene_order INT NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_scenes_story
        FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS turns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      story_id INTEGER NOT NULL,
      scene_id INTEGER NOT NULL,
      speaker_character_id INTEGER,
      text TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'story_text',
      turn_number INT NOT NULL,
      previous_turn_id INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_turns_story
        FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
      CONSTRAINT fk_turns_scene
        FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE,
      CONSTRAINT fk_turns_speaker
        FOREIGN KEY (speaker_character_id) REFERENCES characters(id) ON DELETE SET NULL,
      CONSTRAINT fk_turns_previous
        FOREIGN KEY (previous_turn_id) REFERENCES turns(id) ON DELETE SET NULL
    )
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_characters_story_id
    ON characters (story_id)
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_scenes_story_id
    ON scenes (story_id)
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_turns_story_id
    ON turns (story_id)
  `,
];
