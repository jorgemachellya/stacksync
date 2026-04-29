import * as fs from 'fs';
import * as path from 'path';
import { StackSyncManifest, FileEntry } from '../manifest/types';
import { expandHome } from '../snapshot/snapshot';

export interface FileDiffResult {
  path: string;
  status: 'added' | 'removed' | 'modified' | 'unchanged';
  snapshotExists: boolean;
  localExists: boolean;
}

export interface DiffResult {
  files: FileDiffResult[];
  hasChanges: boolean;
}

export function diffSnapshot(manifest: StackSyncManifest): DiffResult {
  const results: FileDiffResult[] = [];

  for (const entry of manifest.files) {
    const localPath = expandHome(entry.path);
    const snapshotPath = path.join(manifest.snapshotDir, entry.name);

    const localExists = fs.existsSync(localPath);
    const snapshotExists = fs.existsSync(snapshotPath);

    if (!snapshotExists && !localExists) {
      continue;
    }

    if (!snapshotExists && localExists) {
      results.push({ path: entry.path, status: 'added', snapshotExists, localExists });
      continue;
    }

    if (snapshotExists && !localExists) {
      results.push({ path: entry.path, status: 'removed', snapshotExists, localExists });
      continue;
    }

    const snapshotContent = fs.readFileSync(snapshotPath, 'utf-8');
    const localContent = fs.readFileSync(localPath, 'utf-8');

    if (snapshotContent !== localContent) {
      results.push({ path: entry.path, status: 'modified', snapshotExists, localExists });
    } else {
      results.push({ path: entry.path, status: 'unchanged', snapshotExists, localExists });
    }
  }

  const hasChanges = results.some(r => r.status !== 'unchanged');
  return { files: results, hasChanges };
}
