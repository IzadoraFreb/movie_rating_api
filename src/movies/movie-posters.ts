import { readdir } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';
import type { PrismaService } from '../prisma/prisma.service';

const supportedExtensions = new Set(['.jpg', '.jpeg', '.jpe', '.png', '.webp']);
const publicDirectory = resolve(__dirname, '..', '..', 'public');

export type LocalMoviePoster = {
  title: string;
  posterUrl: string;
};

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

export async function synchronizeMovieCatalog(prisma: PrismaService) {
  const posters = await getLocalMoviePosters();

  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.movie.findMany({
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    const retainedIds = new Set<string>();
    let created = 0;
    let updated = 0;

    for (const poster of posters) {
      const current = existing.find(
        (movie) => movie.title === poster.title && !retainedIds.has(movie.id),
      );

      if (current) {
        retainedIds.add(current.id);
        if (current.posterUrl !== poster.posterUrl) {
          await transaction.movie.update({
            where: { id: current.id },
            data: { posterUrl: poster.posterUrl },
          });
          updated += 1;
        }
      } else {
        const movie = await transaction.movie.create({
          data: { title: poster.title, posterUrl: poster.posterUrl },
        });
        retainedIds.add(movie.id);
        created += 1;
      }
    }

    const obsoleteIds = existing
      .filter((movie) => !retainedIds.has(movie.id))
      .map((movie) => movie.id);
    if (obsoleteIds.length > 0) {
      await transaction.movie.deleteMany({ where: { id: { in: obsoleteIds } } });
    }

    return { created, updated, removed: obsoleteIds.length, total: posters.length };
  });
}
