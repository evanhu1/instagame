import fs from 'node:fs/promises';
import { createApp } from './app.js';
import { config } from './config.js';
import { initializeDatabase } from './db/index.js';
import { initializeTurnMemory } from './services/turnMemoryService.js';

const ensureStorageDirectories = async () => {
  await Promise.all([
    fs.mkdir(config.storage.dbRoot, { recursive: true }),
    fs.mkdir(config.storage.generatedBackgrounds, { recursive: true }),
    fs.mkdir(config.storage.generatedCharacters, { recursive: true }),
    fs.mkdir(config.storage.generatedMusic, { recursive: true }),
    fs.mkdir(config.storage.sourceUploads, { recursive: true }),
  ]);
};

const startServer = async () => {
  await ensureStorageDirectories();
  await initializeDatabase();
  await initializeTurnMemory();

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`Instagame backend listening on port ${config.port}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server');
  console.error(error);
  process.exit(1);
});
