import fs from 'fs';
import path from 'path';
import os from 'os';
import { takeSnapshot, restoreSnapshot, expandHome } from './snapshot';
import { StackSyncManifest } from '../manifest/types';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stacksync-snap-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

const makeManifest = (files: { path: string; alias?: string }[]): StackSyncManifest => ({
  version: '1',
  name: 'test',
  files: files.map((f) => ({ path: f.path, alias: f.alias })),
});

describe('expandHome', () => {
  it('expands ~ to home directory', () => {
    const result = expandHome('~/.bashrc');
    expect(result).toBe(path.join(os.homedir(), '.bashrc'));
  });

  it('leaves absolute paths unchanged', () => {
    expect(expandHome('/etc/hosts')).toBe('/etc/hosts');
  });
});

describe('takeSnapshot', () => {
  it('copies files to snapshot directory', () => {
    const sourceFile = path.join(tmpDir, 'config.txt');
    fs.writeFileSync(sourceFile, 'hello=world');

    const snapshotDir = path.join(tmpDir, 'snapshot');
    const manifest = makeManifest([{ path: sourceFile, alias: 'config.txt' }]);

    const result = takeSnapshot(manifest, snapshotDir);

    expect(result.success).toContain(sourceFile);
    expect(result.failed).toHaveLength(0);
    expect(fs.existsSync(path.join(snapshotDir, 'config.txt'))).toBe(true);
  });

  it('records failure when source file is missing', () => {
    const snapshotDir = path.join(tmpDir, 'snapshot');
    const manifest = makeManifest([{ path: '/nonexistent/file.txt' }]);

    const result = takeSnapshot(manifest, snapshotDir);

    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].file).toBe('/nonexistent/file.txt');
  });
});

describe('restoreSnapshot', () => {
  it('restores files from snapshot to destination', () => {
    const snapshotDir = path.join(tmpDir, 'snapshot');
    fs.mkdirSync(snapshotDir);
    fs.writeFileSync(path.join(snapshotDir, 'config.txt'), 'restored=true');

    const destFile = path.join(tmpDir, 'restored', 'config.txt');
    const manifest = makeManifest([{ path: destFile, alias: 'config.txt' }]);

    const result = restoreSnapshot(manifest, snapshotDir);

    expect(result.success).toContain(destFile);
    expect(fs.readFileSync(destFile, 'utf-8')).toBe('restored=true');
  });

  it('records failure when snapshot file is missing', () => {
    const snapshotDir = path.join(tmpDir, 'snapshot');
    fs.mkdirSync(snapshotDir);

    const manifest = makeManifest([{ path: '/some/dest/file.txt', alias: 'missing.txt' }]);
    const result = restoreSnapshot(manifest, snapshotDir);

    expect(result.failed).toHaveLength(1);
  });
});
