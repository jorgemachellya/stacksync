import path from 'path';
import chalk from 'chalk';
import { loadManifest } from '../manifest/parser';
import { takeSnapshot, restoreSnapshot, SnapshotResult } from '../snapshot/snapshot';

const DEFAULT_MANIFEST = 'stacksync.yaml';
const DEFAULT_SNAPSHOT_DIR = '.stacksync-snapshot';

function printResult(result: SnapshotResult, action: string): void {
  if (result.success.length > 0) {
    console.log(chalk.green(`\n✔ ${action} ${result.success.length} file(s) successfully:`));
    result.success.forEach((f) => console.log(chalk.green(`  - ${f}`)));
  }

  if (result.failed.length > 0) {
    console.log(chalk.red(`\n✘ Failed to ${action.toLowerCase()} ${result.failed.length} file(s):`));
    result.failed.forEach(({ file, error }) =>
      console.log(chalk.red(`  - ${file}: ${error}`))
    );
  }

  console.log(chalk.gray(`\nTimestamp: ${result.timestamp}`));
}

export async function runSnapshot(
  manifestPath = DEFAULT_MANIFEST,
  snapshotDir = DEFAULT_SNAPSHOT_DIR
): Promise<void> {
  try {
    const manifest = loadManifest(manifestPath);
    const absSnapshotDir = path.resolve(snapshotDir);

    console.log(chalk.blue(`📸 Taking snapshot from manifest: ${manifestPath}`));
    const result = takeSnapshot(manifest, absSnapshotDir);
    printResult(result, 'Snapshotted');

    if (result.failed.length > 0) process.exit(1);
  } catch (err) {
    console.error(chalk.red(`Error: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }
}

export async function runRestore(
  manifestPath = DEFAULT_MANIFEST,
  snapshotDir = DEFAULT_SNAPSHOT_DIR
): Promise<void> {
  try {
    const manifest = loadManifest(manifestPath);
    const absSnapshotDir = path.resolve(snapshotDir);

    console.log(chalk.blue(`♻️  Restoring snapshot from: ${absSnapshotDir}`));
    const result = restoreSnapshot(manifest, absSnapshotDir);
    printResult(result, 'Restored');

    if (result.failed.length > 0) process.exit(1);
  } catch (err) {
    console.error(chalk.red(`Error: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }
}
