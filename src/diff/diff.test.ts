import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { diffSnapshot, DiffResult } from './diff';
import { StackSyncManifest } from '../manifest/types';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stacksync-diff-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function makeManifest(files: { name: string; path: string }[]): StackSyncManifest {
  return {
    version: '1',
    snapshotDir: tmpDir,
    files: files.map(f => ({ name: f.name, path: f.path })),
  };
}

test('marks file as unchanged when contents match', () => {
  const localFile = path.join(tmpDir, 'local_bashrc');
  const snapshotFile = path.join(tmpDir, '.bashrc');
  fs.writeFileSync(localFile, 'export PATH=~/.local/bin:$PATH\n');
  fs.writeFileSync(snapshotFile, 'export PATH=~/.local/bin:$PATH\n');

  const manifest = makeManifest([{ name: '.bashrc', path: localFile }]);
  const result = diffSnapshot(manifest);

  expect(result.hasChanges).toBe(false);
  expect(result.files[0].status).toBe('unchanged');
});

test('marks file as modified when contents differ', () => {
  const localFile = path.join(tmpDir, 'local_vimrc');
  const snapshotFile = path.join(tmpDir, '.vimrc');
  fs.writeFileSync(localFile, 'set number\n');
  fs.writeFileSync(snapshotFile, 'set nonumber\n');

  const manifest = makeManifest([{ name: '.vimrc', path: localFile }]);
  const result = diffSnapshot(manifest);

  expect(result.hasChanges).toBe(true);
  expect(result.files[0].status).toBe('modified');
});

test('marks file as added when only local exists', () => {
  const localFile = path.join(tmpDir, 'local_zshrc');
  fs.writeFileSync(localFile, 'autoload -U compinit\n');

  const manifest = makeManifest([{ name: '.zshrc', path: localFile }]);
  const result = diffSnapshot(manifest);

  expect(result.hasChanges).toBe(true);
  expect(result.files[0].status).toBe('added');
});

test('marks file as removed when only snapshot exists', () => {
  const snapshotFile = path.join(tmpDir, '.tmux.conf');
  fs.writeFileSync(snapshotFile, 'set -g mouse on\n');

  const manifest = makeManifest([{ name: '.tmux.conf', path: path.join(tmpDir, 'nonexistent') }]);
  const result = diffSnapshot(manifest);

  expect(result.hasChanges).toBe(true);
  expect(result.files[0].status).toBe('removed');
});
