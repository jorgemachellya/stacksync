import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { loadManifest } from '../manifest/parser';
import { restoreSnapshot } from '../snapshot/snapshot';

export interface RestoreResult {
  file: string;
  source: string;
  destination: string;
  success: boolean;
  error?: string;
}

export function printRestoreResult(results: RestoreResult[]): void {
  const succeeded = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  if (succeeded.length > 0) {
    console.log(`\n✅ Restored ${succeeded.length} file(s):`);
    for (const r of succeeded) {
      console.log(`   ${r.file} → ${r.destination}`);
    }
  }

  if (failed.length > 0) {
    console.log(`\n❌ Failed to restore ${failed.length} file(s):`);
    for (const r of failed) {
      console.log(`   ${r.file}: ${r.error}`);
    }
  }

  console.log();
}

export function registerRestoreCommand(program: Command): void {
  program
    .command('restore')
    .description('Restore config files from snapshot to their original locations')
    .option('-m, --manifest <path>', 'Path to manifest file', 'stacksync.yaml')
    .option('-s, --snapshot-dir <path>', 'Directory containing snapshots', '.stacksync')
    .option('--dry-run', 'Preview what would be restored without making changes', false)
    .action(async (options) => {
      const manifestPath = path.resolve(options.manifest);

      if (!fs.existsSync(manifestPath)) {
        console.error(`Manifest not found: ${manifestPath}`);
        process.exit(1);
      }

      const manifest = loadManifest(manifestPath);
      const snapshotDir = path.resolve(options.snapshotDir);

      if (!fs.existsSync(snapshotDir)) {
        console.error(`Snapshot directory not found: ${snapshotDir}`);
        process.exit(1);
      }

      if (options.dryRun) {
        console.log('\n🔍 Dry run — no files will be written:\n');
        for (const file of manifest.files) {
          console.log(`   would restore: ${file.path}`);
        }
        console.log();
        return;
      }

      const results = await restoreSnapshot(manifest, snapshotDir);

      const mapped: RestoreResult[] = results.map((r) => ({
        file: r.file,
        source: r.source ?? '',
        destination: r.destination ?? r.file,
        success: r.success,
        error: r.error,
      }));

      printRestoreResult(mapped);

      if (mapped.some((r) => !r.success)) {
        process.exit(1);
      }
    });
}
