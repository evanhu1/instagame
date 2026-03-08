import cors from 'cors';
import express from 'express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { config } from './config.js';
import { createTrpcContext } from './trpc/context.js';
import { appRouter } from './trpc/router.js';

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use('/generated', express.static(config.storage.generatedRoot));
  app.use('/uploads', express.static(config.storage.uploadsRoot));

  app.get('/health', (_req, res) => {
    res.json({ success: true });
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
