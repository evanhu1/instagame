import { router } from './init.js';
import { storyRouter } from './routers/storyRouter.js';

export const appRouter = router({
  story: storyRouter,
});
