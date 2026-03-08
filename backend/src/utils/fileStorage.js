import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';

const extensionByMimeType = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/ogg': 'ogg',
  'audio/flac': 'flac',
};

const ensureDirectory = async (directoryPath) => {
  await fs.mkdir(directoryPath, { recursive: true });
};

const buildPublicUrl = (...segments) =>
  `${config.appBaseUrl}/${segments.map((segment) => encodeURIComponent(segment)).join('/')}`;

const persistPublicFile = async ({
  buffer,
  mimeType,
  directoryPath,
  publicSegments,
  filePrefix,
}) => {
  const normalizedMimeType = mimeType.split(';', 1)[0].trim().toLowerCase();
  const extension = extensionByMimeType[normalizedMimeType];

  if (!extension) {
    throw new Error(`Unsupported file mime type: ${mimeType}`);
  }

  await ensureDirectory(directoryPath);

  const fileName = `${filePrefix}-${randomUUID()}.${extension}`;
  const absolutePath = path.join(directoryPath, fileName);

  await fs.writeFile(absolutePath, buffer);

  return {
    absolutePath,
    publicUrl: buildPublicUrl(...publicSegments, fileName),
  };
};

export const persistPublicImage = async (params) => persistPublicFile(params);

export const persistPublicAudio = async (params) => persistPublicFile(params);

export const persistSourceUpload = async ({ buffer, mimeType }) =>
  persistPublicImage({
    buffer,
    mimeType,
    directoryPath: config.storage.sourceUploads,
    publicSegments: ['uploads', 'source'],
    filePrefix: 'source',
  });
