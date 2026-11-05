import { spawn, execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { once } from 'node:events';
const front = resolve(import.meta.dirname, '..');
const root = resolve(front, '..');
const directory = await mkdtemp(join(tmpdir(), 'movie-browser-test-'));
await writeFile(join(directory, 'browser.db'), '');
const env = {
  ...process.env,
  NODE_ENV: 'test',
  DATABASE_URL: 'file:' + join(directory, 'browser.db'),
  DEMO_PASSWORD: 'Cinema123!',
  JWT_SECRET: 'browser-test-only-secret',
  PORT: '4300',
  PROFILE_UPLOAD_DIR: join(directory, 'profiles'),
};
execFileSync(
  process.execPath,
  [
    join(root, 'node_modules/prisma/build/index.js'),
    'migrate',
    'deploy',
    '--config',
    'prisma7.config.ts',
  ],
  { cwd: root, env, stdio: 'pipe' },
);
execFileSync(process.execPath, ['dist/seed.js'], {
  cwd: root,
  env,
  stdio: 'pipe',
});
const api = spawn(process.execPath, ['dist/main.js'], {
  cwd: root,
  env,
  stdio: 'inherit',
});
const web = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', '4301'],
  {
    cwd: front,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      API_URL: 'http://127.0.0.1:4300',
    },
    stdio: 'inherit',
  },
);
let stopping = false;
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  const children = [api, web];
  await Promise.all(
    children.map(async (child) => {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill();
        await once(child, 'exit');
      }
    }),
  );
  await rm(directory, { recursive: true, force: true });
  process.exit(code);
}
process.on('SIGTERM', () => void stop());
process.on('SIGINT', () => void stop());
api.on('exit', (code) => {
  if (!stopping) void stop(code || 0);
});
web.on('exit', (code) => {
  if (!stopping) void stop(code || 0);
});
