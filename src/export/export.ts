import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { StackSyncManifest } from '../manifest/types';
import { listHistory, getHistoryEntry } from '../history/history';

export interface ExportOptions {
  includeHistory?: boolean;
  historyLimit?: number;
}

export interface ExportBundle {
  version: string;
  exportedAt: string;
  manifest: StackSyncManifest;
  history?: Array<{ id: string; timestamp: string; snapshot: Record<string, string> }>;
}

export async function exportBundle(
  manifest: StackSyncManifest,
  outputPath: string,
  options: ExportOptions = {}
): Promise<void> {
  const bundle: ExportBundle = {
    version: '1',
    exportedAt: new Date().toISOString(),
    manifest,
  };

  if (options.includeHistory) {
    const entries = await listHistory(manifest);
    const limit = options.historyLimit ?? 10;
    const recent = entries.slice(0, limit);
    bundle.history = await Promise.all(
      recent.map(async (e) => {
        const full = await getHistoryEntry(manifest, e.id);
        return {
          id: e.id,
          timestamp: e.timestamp,
          snapshot: full?.snapshot ?? {},
        };
      })
    );
  }

  const content = yaml.dump(bundle, { lineWidth: 120 });
  await fs.promises.writeFile(outputPath, content, 'utf8');
}

export async function importBundle(
  inputPath: string
): Promise<ExportBundle> {
  const raw = await fs.promises.readFile(inputPath, 'utf8');
  const parsed = yaml.load(raw) as ExportBundle;

  if (!parsed || typeof parsed !== 'object' || !parsed.manifest) {
    throw new Error('Invalid export bundle: missing manifest');
  }

  if (!parsed.version) {
    throw new Error('Invalid export bundle: missing version');
  }

  return parsed;
}
