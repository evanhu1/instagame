import { createTRPCClient, httpLink } from '@trpc/client';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
).replace(/\/+$/, '');

export const trpcClient = createTRPCClient({
  links: [
    httpLink({
      url: `${API_BASE_URL}/trpc`,
    }),
  ],
});

export const resolveAssetUrl = (assetUrl) => {
  if (!assetUrl) {
    return null;
  }

  return new URL(assetUrl, `${API_BASE_URL}/`).toString();
};
