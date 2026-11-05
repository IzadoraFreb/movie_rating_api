import 'dotenv/config';
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';
if (!databaseUrl.startsWith('file:'))
  throw new Error('Este projeto usa um banco SQLite com URL file:.');
const filename = resolve(databaseUrl.slice(5));
mkdirSync(dirname(filename), { recursive: true });
// Garante a inicialização do arquivo antes de chamar o engine de migrações.
// Abrir um banco existente não altera seu conteúdo.
new Database(filename).close();
const result = spawnSync(
  process.execPath,
  [
    'node_modules/prisma/build/index.js',
    'migrate',
    'deploy',
    '--config',
    'prisma7.config.ts',
  ],
  {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: 'file:' + filename },
  },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
