import { Command } from 'commander';
import * as path from 'path';
import * as os from 'os';
import chalk from 'chalk';
import { loadManifest } from '../manifest/parser';
import { syncFiles, SyncResult } from '../sync/sync';

const DEFAULT_STORE = path.join(os.homedir(), '.stacksync', 'store');

function printSyncResult(result: SyncResult, direction: 'push' | 'pull', dryRun: boolean): void {
  const label = dryRun ? chalk.yellow('[dry-run] ') : '';
  const arrow = direction === 'push' ? '↑' : '↓';

  if (result.pushed.length > 0) {
    console.log(chalk.green(`${label}${arrow} Pushed (${result.pushed.length}):`) );
    result.pushed.forEach(f => console.log(`  ${chalk.cyan(f)}`));
  }
  if (result.pulled.length > 0) {
    console.log(chalk.green(`${label}${arrow} Pulled (${result.pulled.length}):`) );
    result.pulled.forEach(f => console.log(`  ${chalk.cyan(f)}`));
  }
  if (result.skipped.length > 0) {
    console.log(chalk.gray(`  Skipped (${result.skipped.length}): ${result.skipped.join(', ')}`) );
  }
  if (result.errors.length > 0) {
    console.log(chalk.red(`  Errors:`));
    result.errors.forEach(e => console.log(`  ${chalk.red(e.file)}: ${e.error}`));
  }
  if (result.pushed.length === 0 && result.pulled.length === 0 && result.errors.length === 0) {
    console.log(chalk.gray('  Everything up to date.'));
  }
}

export function registerSyncCommand(program: Command): void {
  program
    .command('sync <direction>')
    .description('Sync files push (local→store) or pull (store→local)')
    .option('-m, --manifest <path>', 'Path to manifest file', 'stacksync.yml')
    .option('-s, --store <path>', 'Path to store directory', DEFAULT_STORE)
    .option('-f, --force', 'Overwrite without mtime check', false)
    .option('-n, --dry-run', 'Preview changes without writing', false)
    .action(async (direction: string, opts) => {
      if (direction !== 'push' && direction !== 'pull') {
        console.error(chalk.red('Direction must be "push" or "pull"'));
        process.exit(1);
      }
      try {
        const manifest = await loadManifest(opts.manifest);
        const result = await syncFiles(manifest, opts.store, {
          direction,
          force: opts.force,
          dryRun: opts.dryRun,
        });
        printSyncResult(result, direction, opts.dryRun);
        if (result.errors.length > 0) process.exit(1);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    });
}
