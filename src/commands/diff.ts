import { Command } from 'commander';
import chalk from 'chalk';
import { loadManifest } from '../manifest/parser';
import { diffSnapshot, FileDiffResult } from '../diff/diff';

const STATUS_ICONS: Record<FileDiffResult['status'], string> = {
  added: chalk.green('+ added'),
  removed: chalk.red('- removed'),
  modified: chalk.yellow('~ modified'),
  unchanged: chalk.gray('  unchanged'),
};

export function registerDiffCommand(program: Command): void {
  program
    .command('diff')
    .description('Show differences between local files and the current snapshot')
    .option('-m, --manifest <path>', 'Path to manifest file', 'stacksync.yaml')
    .option('--changed-only', 'Only show files with changes', false)
    .action(async (options) => {
      let manifest;
      try {
        manifest = await loadManifest(options.manifest);
      } catch (err: any) {
        console.error(chalk.red(`Error loading manifest: ${err.message}`));
        process.exit(1);
      }

      const result = diffSnapshot(manifest);

      if (result.files.length === 0) {
        console.log(chalk.gray('No files tracked in manifest.'));
        return;
      }

      const filesToShow = options.changedOnly
        ? result.files.filter(f => f.status !== 'unchanged')
        : result.files;

      if (filesToShow.length === 0) {
        console.log(chalk.green('✔ All tracked files are in sync.'));
        return;
      }

      console.log(chalk.bold(`\nDiff against snapshot in: ${manifest.snapshotDir}\n`));

      for (const file of filesToShow) {
        console.log(`  ${STATUS_ICONS[file.status]}  ${file.path}`);
      }

      console.log('');

      if (result.hasChanges) {
        const changed = result.files.filter(f => f.status !== 'unchanged').length;
        console.log(chalk.yellow(`${changed} file(s) differ from snapshot.`));
      } else {
        console.log(chalk.green('✔ All tracked files are in sync.'));
      }
    });
}
