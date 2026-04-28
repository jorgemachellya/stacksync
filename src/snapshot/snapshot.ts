import fs from 'fs';
import path from 'path';
import os from 'os';
import { StackSyncManifest, FileEntry } from '../manifest/types';

export interface SnapshotResult {
  success: string[];
  failed: { file: string; error: string }[];
  timestamp: string;
}

export function expandHome(filePath: string): string {
  if (filePath.startsWith('~')) {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return filePath;
}

export function takeSnapshot(
  manifest: StackSyncManifest,
  snapshotDir: string
): SnapshotResult {
  const result: SnapshotResult = {
    success: [],
    failed: [],
    timestamp: new Date().toISOString(),
  };

  if (!fs.existsSync(snapshotDir)) {
    fs.mkdirSync(snapshotDir, { recursive: true });
  }

  for (const entry of manifest.files) {
    const sourcePath = expandHome(entry.path);
    const destPath = path.join(snapshotDir, entry.alias || path.basename(entry.path));

    try {
      if (!fs.existsSync(sourcePath)) {
        throw new Error(`Source file not found: ${sourcePath}`);
      }
      fs.copyFileSync(sourcePath, destPath);
      result.success.push(entry.path);
    } catch (err) {
      result.failed.push({
        file: entry.path,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return result;
}

export function restoreSnapshot(
  manifest: StackSyncManifest,
  snapshotDir: string
): SnapshotResult {
  const result: SnapshotResult = {
    success: [],
    failed: [],
    timestamp: new Date().toISOString(),
  };

  for (const entry of manifest.files) {
    const destPath = expandHome(entry.path);
    const sourcePath = path.join(snapshotDir, entry.alias || path.basename(entry.path));

    try {
      if (!fs.existsSync(sourcePath)) {
        throw new Error(`Snapshot file not found: ${sourcePath}`);
      }
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(sourcePath, destPath);
      result.success.push(entry.path);
    } catch (err) {
      result.failed.push({
        file: entry.path,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return result;
}
