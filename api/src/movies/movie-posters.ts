import { readdir } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';

const supportedExtensions = new Set(['.jpg', '.jpeg', '.jpe', '.png', '.webp']);
const publicDirectory = resolve(__dirname, '..', '..', 'public');

export type LocalMoviePoster = {
  title: string;
  posterUrl: string;
};

export async function findLocalMoviePosterFile(title: string) {
  const files = (await findImageFiles(publicDirectory)).sort((left, right) =>
    left.localeCompare(right),
  );
  return files.find(
    (file) => basename(file, extname(file)).replace(/_/g, ' ') === title,
  );
}

async function findImageFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) return findImageFiles(path);
      return entry.isFile() && supportedExtensions.has(extname(entry.name).toLowerCase())
        ? [path]
        : [];
    }),
  );
  return nested.flat();
}

export async function getLocalMoviePosters(): Promise<LocalMoviePoster[]> {
  const files = (await findImageFiles(publicDirectory)).sort((left, right) =>
    left.localeCompare(right),
  );
  const posters = new Map<string, LocalMoviePoster>();

  for (const file of files) {
    const title = basename(file, extname(file)).replace(/_/g, ' ');
    if (!posters.has(title)) {
      posters.set(title, {
        title,
        posterUrl: '/posters?title=' + encodeURIComponent(title),
      });
    }
  }

  if (posters.size === 0) {
    throw new Error(`Nenhum cartaz compatível encontrado em ${publicDirectory}`);
  }

  return [...posters.values()];
}

export async function findLocalMoviePoster(
  title: string,
): Promise<LocalMoviePoster | undefined> {
  return (await getLocalMoviePosters()).find((poster) => poster.title === title);
}
