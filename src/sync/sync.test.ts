import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { syncFiles, SyncOptions } from './sync';
import { Manifest } from '../manifest/types';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stacksync-sync-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function makeManifest(files: { path: string; alias?: string }[]): Manifest {
  return { version: '1', name: 'test', files: files.map(f => ({ ...f, tags: [] })) };
}

test('push copies existing file to store', async () => {
  const srcFile = path.join(tmpDir, 'src', '.testrc');
  const storeDir = path.join(tmpDir, 'store');
  fs.mkdirSync(path.dirname(srcFile), { recursive: true });
  fs.mkdirSync(storeDir, { recursive: true });
  fs.writeFileSync(srcFile, 'hello=world');

  const manifest = makeManifest([{ path: srcFile, alias: '.testrc' }]);
  const result = await syncFiles(manifest, storeDir, { direction: 'push', force: true });

  expect(result.pushed).toContain(srcFile);
  expect(result.errors).toHaveLength(0);
  expect(fs.existsSync(path.join(storeDir, '.testrc'))).toBe(true);
});

test('push skips missing source file', async () => {
  const storeDir = path.join(tmpDir, 'store');
  fs.mkdirSync(storeDir, { recursive: true });
  const manifest = makeManifest([{ path: '/nonexistent/.missingrc', alias: '.missingrc' }]);
  const result = await syncFiles(manifest, storeDir, { direction: 'push' });

  expect(result.skipped).toContain('/nonexistent/.missingrc');
  expect(result.pushed).toHaveLength(0);
});

test('pull skips when store file missing', async () => {
  const storeDir = path.join(tmpDir, 'store');
  fs.mkdirSync(storeDir, { recursive: true });
  const manifest = makeManifest([{ path: '/tmp/.neverexists', alias: '.neverexists' }]);
  const result = await syncFiles(manifest, storeDir, { direction: 'pull' });

  expect(result.skipped).toContain('/tmp/.neverexists');
});

test('dryRun push does not write to store', async () => {
  const srcFile = path.join(tmpDir, 'src', '.dryrc');
  const storeDir = path.join(tmpDir, 'store');
  fs.mkdirSync(path.dirname(srcFile), { recursive: true });
  fs.mkdirSync(storeDir, { recursive: true });
  fs.writeFileSync(srcFile, 'dry=true');

  const manifest = makeManifest([{ path: srcFile, alias: '.dryrc' }]);
  const result = await syncFiles(manifest, storeDir, { direction: 'push', force: true, dryRun: true });

  expect(result.pushed).toContain(srcFile);
  expect(fs.existsSync(path.join(storeDir, '.dryrc'))).toBe(false);
});
