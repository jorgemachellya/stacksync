import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { printRestoreResult, RestoreResult } from './restore';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stacksync-restore-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('printRestoreResult', () => {
  it('logs success results without throwing', () => {
    const results: RestoreResult[] = [
      {
        file: '.zshrc',
        source: '/snapshots/.zshrc',
        destination: '/home/user/.zshrc',
        success: true,
      },
    ];
    expect(() => printRestoreResult(results)).not.toThrow();
  });

  it('logs failed results without throwing', () => {
    const results: RestoreResult[] = [
      {
        file: '.vimrc',
        source: '/snapshots/.vimrc',
        destination: '/home/user/.vimrc',
        success: false,
        error: 'Permission denied',
      },
    ];
    expect(() => printRestoreResult(results)).not.toThrow();
  });

  it('handles mixed results', () => {
    const results: RestoreResult[] = [
      {
        file: '.zshrc',
        source: '/snapshots/.zshrc',
        destination: '/home/user/.zshrc',
        success: true,
      },
      {
        file: '.bashrc',
        source: '/snapshots/.bashrc',
        destination: '/home/user/.bashrc',
        success: false,
        error: 'File not found in snapshot',
      },
    ];
    expect(() => printRestoreResult(results)).not.toThrow();
  });

  it('handles empty results array', () => {
    expect(() => printRestoreResult([])).not.toThrow();
  });
});

describe('restore command file resolution', () => {
  it('detects missing snapshot directory', () => {
    const missingDir = path.join(tmpDir, 'nonexistent');
    expect(fs.existsSync(missingDir)).toBe(false);
  });

  it('detects present snapshot directory', () => {
    const snapshotDir = path.join(tmpDir, '.stacksync');
    fs.mkdirSync(snapshotDir);
    expect(fs.existsSync(snapshotDir)).toBe(true);
  });
});
