import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Manifest, FileEntry } from '../manifest/types';
import { takeSnapshot, restoreSnapshot, expandHome } from '../snapshot/snapshot';

export interface SyncResult {
  pushed: string[];
  pulled: string[];
  skipped: string[];
  errors: { file: string; error: string }[];
}

export interface SyncOptions {
  direction: 'push' | 'pull';
  force?: boolean;
  dryRun?: boolean;
}

export async function syncFiles(
  manifest: Manifest,
  storeDir: string,
  options: SyncOptions
): Promise<SyncResult> {
  const result: SyncResult = { pushed: [], pulled: [], skipped: [], errors: [] };

  for (const entry of manifest.files) {
    const sourcePath = expandHome(entry.path);
    const storePath = path.join(storeDir, entry.alias || path.basename(entry.path));

    try {
      if (options.direction === 'push') {
        if (!fs.existsSync(sourcePath)) {
          result.skipped.push(entry.path);
          continue;
        }
        const storeExists = fs.existsSync(storePath);
        if (storeExists && !options.force) {
          const srcMtime = fs.statSync(sourcePath).mtimeMs;
          const storeMtime = fs.statSync(storePath).mtimeMs;
          if (srcMtime <= storeMtime) {
            result.skipped.push(entry.path);
            continue;
          }
        }
        if (!options.dryRun) {
          await takeSnapshot([entry], storeDir);
        }
        result.pushed.push(entry.path);
      } else {
        if (!fs.existsSync(storePath)) {
          result.skipped.push(entry.path);
          continue;
        }
        const localExists = fs.existsSync(sourcePath);
        if (localExists && !options.force) {
          const srcMtime = fs.statSync(sourcePath).mtimeMs;
          const storeMtime = fs.statSync(storePath).mtimeMs;
          if (srcMtime >= storeMtime) {
            result.skipped.push(entry.path);
            continue;
          }
        }
        if (!options.dryRun) {
          await restoreSnapshot([entry], storeDir);
        }
        result.pulled.push(entry.path);
      }
    } catch (err: any) {
      result.errors.push({ file: entry.path, error: err.message });
    }
  }

  return result;
}
