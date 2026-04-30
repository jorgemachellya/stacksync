import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { StackSyncManifest } from '../manifest/types';

export interface SnapshotHistoryEntry {
  id: string;
  timestamp: string;
  label?: string;
  files: Record<string, string>;
}

const HISTORY_DIR = path.join(os.homedir(), '.stacksync', 'history');
const MAX_HISTORY_ENTRIES = 10;

export function getHistoryDir(): string {
  return HISTORY_DIR;
}

export function ensureHistoryDir(historyDir: string = HISTORY_DIR): void {
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }
}

export function saveHistoryEntry(
  manifest: StackSyncManifest,
  label?: string,
  historyDir: string = HISTORY_DIR
): SnapshotHistoryEntry {
  ensureHistoryDir(historyDir);

  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const timestamp = new Date().toISOString();
  const entry: SnapshotHistoryEntry = {
    id,
    timestamp,
    label,
    files: manifest.files ?? {},
  };

  const entryPath = path.join(historyDir, `${id}.json`);
  fs.writeFileSync(entryPath, JSON.stringify(entry, null, 2), 'utf-8');

  pruneHistory(historyDir);
  return entry;
}

export function listHistory(historyDir: string = HISTORY_DIR): SnapshotHistoryEntry[] {
  if (!fs.existsSync(historyDir)) return [];

  const files = fs
    .readdirSync(historyDir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .reverse();

  return files.map((f) => {
    const raw = fs.readFileSync(path.join(historyDir, f), 'utf-8');
    return JSON.parse(raw) as SnapshotHistoryEntry;
  });
}

export function getHistoryEntry(
  id: string,
  historyDir: string = HISTORY_DIR
): SnapshotHistoryEntry | null {
  const entryPath = path.join(historyDir, `${id}.json`);
  if (!fs.existsSync(entryPath)) return null;
  return JSON.parse(fs.readFileSync(entryPath, 'utf-8')) as SnapshotHistoryEntry;
}

function pruneHistory(historyDir: string): void {
  const files = fs
    .readdirSync(historyDir)
    .filter((f) => f.endsWith('.json'))
    .sort();

  while (files.length > MAX_HISTORY_ENTRIES) {
    const oldest = files.shift()!;
    fs.unlinkSync(path.join(historyDir, oldest));
  }
}
