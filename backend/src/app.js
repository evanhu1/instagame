import cors from 'cors';
import express from 'express';
import multer from 'multer';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { config } from './config.js';
import { synthesizeDialogueLine } from './services/livekitTtsService.js';
import { generateStoryFromUpload } from './services/storyService.js';
import { createTrpcContext } from './trpc/context.js';
import { appRouter } from './trpc/router.js';
import { HttpError } from './utils/httpError.js';

export const createApp = () => {
  const app = express();
  const upload = multer();

  app.use(cors());
  app.use(express.json());
  app.use('/generated', express.static(config.storage.generatedRoot));
  app.use('/uploads', express.static(config.storage.uploadsRoot));

  app.get('/health', (_req, res) => {
    res.json({ success: true });
  });

  app.post('/stories/generate', upload.single('image'), async (req, res, next) => {
    try {
      if (!req.file?.buffer) {
        throw new HttpError(
          400,
          'Missing image form field. Send multipart/form-data with `image`.',
        );
      }

      const result = await generateStoryFromUpload({
        buffer: req.file.buffer,
        mimeType: req.file.mimetype || 'application/octet-stream',
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.post('/voice/dialogue', async (req, res, next) => {
    try {
      const { text, speakerName = null, characterId = null } = req.body || {};

      const result = await synthesizeDialogueLine({
        text,
        speakerName,
        characterId,
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  });

  app.use(
    '/trpc',
    createExpressMiddleware({
      router: appRouter,
      createContext: createTrpcContext,
      onError: ({ error }) => {
        if (error.code === 'INTERNAL_SERVER_ERROR') {
          console.error(error);
        }
      },
    }),
  );

  app.use((error, _req, res, _next) => {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';

    if (statusCode >= 500) {
      console.error(error);
    }

    res.status(statusCode).json({
      success: false,
      error: message,
    });
  });

  return app;
};
