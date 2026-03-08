import { createTRPCClient, httpLink } from '@trpc/client';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
).replace(/\/+$/, '');

export const trpcClient: any = createTRPCClient<any>({
  links: [
    httpLink({
      url: `${API_BASE_URL}/trpc`,
    }),
  ],
});

export function resolveAssetUrl(assetUrl: string | null | undefined) {
  if (!assetUrl) {
    return null;
  }

  if (/^(https?:|data:|blob:)/i.test(assetUrl)) {
    return assetUrl;
  }

  return new URL(assetUrl, `${API_BASE_URL}/`).toString();
}
