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

export const generateStoryFromImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_BASE_URL}/stories/generate`, {
    method: 'POST',
    body: formData,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.error || payload?.message || 'Failed to upload image to the backend.',
    );
  }

  return payload;
};

export const resolveAssetUrl = (assetUrl) => {
  if (!assetUrl) {
    return null;
  }

  return new URL(assetUrl, `${API_BASE_URL}/`).toString();
};
