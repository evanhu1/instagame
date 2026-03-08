import { TRPCError } from '@trpc/server';
import {
  doTurnInputSchema,
  drawBackgroundInputSchema,
  drawBackgroundResultSchema,
  drawCharacterInputSchema,
  drawCharacterResultSchema,
  generateStoryInputSchema,
  generateStoryResultSchema,
  storyByIdInputSchema,
  storyEnvelopeSchema,
} from '../../../../shared/src/storySchemas.js';
import {
  advanceStoryTurn,
  generateCharacterPortrait,
  generateSceneBackground,
  generateStoryFromUpload,
  getStoryOrThrow,
} from '../../services/storyService.js';
import { publicProcedure, router } from '../init.js';
import { asTrpcError } from '../trpcError.js';

const getImageFromFormData = (formData) => {
  const image = formData.get('image');

  if (
    !image ||
    typeof image !== 'object' ||
    typeof image.arrayBuffer !== 'function' ||
    typeof image.type !== 'string'
  ) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message:
        'Missing image form field. Send multipart/form-data with `image`.',
    });
  }

  return image;
};

export const storyRouter = router({
  generate: publicProcedure
    .input(generateStoryInputSchema)
    .output(generateStoryResultSchema)
    .mutation(async ({ input }) => {
      try {
        const image = getImageFromFormData(input);

        return await generateStoryFromUpload({
          buffer: Buffer.from(await image.arrayBuffer()),
          mimeType: image.type || 'application/octet-stream',
        });
      } catch (error) {
        throw asTrpcError(error);
      }
    }),

  byId: publicProcedure
    .input(storyByIdInputSchema)
    .output(storyEnvelopeSchema)
    .query(async ({ input }) => {
      try {
        return {
          story: await getStoryOrThrow(input.storyId),
        };
      } catch (error) {
        throw asTrpcError(error);
      }
    }),

  doTurn: publicProcedure
    .input(doTurnInputSchema)
    .output(storyEnvelopeSchema)
    .mutation(async ({ input }) => {
      try {
        return {
          story: await advanceStoryTurn(input),
        };
      } catch (error) {
        throw asTrpcError(error);
      }
    }),

  drawBackground: publicProcedure
    .input(drawBackgroundInputSchema)
    .output(drawBackgroundResultSchema)
    .mutation(async ({ input }) => {
      try {
        return {
          sceneId: input.sceneId,
          backgroundImageUrl: await generateSceneBackground(input),
        };
      } catch (error) {
        throw asTrpcError(error);
      }
    }),

  drawCharacter: publicProcedure
    .input(drawCharacterInputSchema)
    .output(drawCharacterResultSchema)
    .mutation(async ({ input }) => {
      try {
        return {
          characterId: input.characterId,
          imageUrl: await generateCharacterPortrait(input),
        };
      } catch (error) {
        throw asTrpcError(error);
      }
    }),
});
