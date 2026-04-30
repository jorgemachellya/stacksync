import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  saveHistoryEntry,
  listHistory,
  getHistoryEntry,
} from './history';
import { StackSyncManifest } from '../manifest/types';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stacksync-history-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function makeManifest(files: Record<string, string> = {}): StackSyncManifest {
  return { version: 1, files };
}

test('saveHistoryEntry creates a JSON file in historyDir', () => {
  const manifest = makeManifest({ '~/.bashrc': '/tmp/bashrc' });
  const entry = saveHistoryEntry(manifest, 'initial', tmpDir);

  expect(entry.id).toBeTruthy();
  expect(entry.label).toBe('initial');
  expect(entry.files).toEqual({ '~/.bashrc': '/tmp/bashrc' });

  const files = fs.readdirSync(tmpDir);
  expect(files).toHaveLength(1);
  expect(files[0]).toBe(`${entry.id}.json`);
});

test('listHistory returns entries sorted newest first', () => {
  const m = makeManifest();
  const e1 = saveHistoryEntry(m, 'first', tmpDir);
  const e2 = saveHistoryEntry(m, 'second', tmpDir);

  const history = listHistory(tmpDir);
  expect(history).toHaveLength(2);
  // newest first — e2 was saved after e1
  expect(history[0].id).toBe(e2.id);
  expect(history[1].id).toBe(e1.id);
});

test('getHistoryEntry returns correct entry by id', () => {
  const manifest = makeManifest({ '~/.vimrc': '/tmp/vimrc' });
  const saved = saveHistoryEntry(manifest, 'vim-config', tmpDir);

  const found = getHistoryEntry(saved.id, tmpDir);
  expect(found).not.toBeNull();
  expect(found!.label).toBe('vim-config');
  expect(found!.files).toEqual({ '~/.vimrc': '/tmp/vimrc' });
});

test('getHistoryEntry returns null for unknown id', () => {
  const result = getHistoryEntry('nonexistent', tmpDir);
  expect(result).toBeNull();
});

test('listHistory returns empty array when dir does not exist', () => {
  const missing = path.join(tmpDir, 'no-such-dir');
  expect(listHistory(missing)).toEqual([]);
});

test('pruneHistory keeps at most 10 entries', () => {
  const m = makeManifest();
  for (let i = 0; i < 12; i++) {
    saveHistoryEntry(m, `entry-${i}`, tmpDir);
  }
  const history = listHistory(tmpDir);
  expect(history).toHaveLength(10);
});
