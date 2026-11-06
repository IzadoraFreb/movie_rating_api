import { readdir, readFile } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';
import type { NextRequest } from 'next/server';

const imageTypes: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.jpe': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

function normalizeTitle(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .toLowerCase();
}

async function imageFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) return imageFiles(path);
      return entry.isFile() ? [path] : [];
    }),
  );
  return nested.flat();
}

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get('title')?.trim();
  if (!title) return new Response('Título obrigatório', { status: 400 });

  const directory = resolve(process.cwd(), '..', 'public');
  const target = normalizeTitle(title);
  const files = (await imageFiles(directory))
    .filter((file) => imageTypes[extname(file).toLowerCase()])
    .sort((left, right) => left.localeCompare(right));
  const match = files.find(
    (file) => normalizeTitle(basename(file, extname(file))) === target,
  );

  if (!match) return new Response(null, { status: 404 });

  const extension = extname(match).toLowerCase();
  const image = await readFile(match);
  return new Response(image, {
    headers: {
      'Content-Type': imageTypes[extension],
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
