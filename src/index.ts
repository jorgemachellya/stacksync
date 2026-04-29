#!/usr/bin/env node

/**
 * stacksync - CLI entry point
 * Snapshot and restore local dev environment configs across machines.
 */

import { Command } from 'commander';
import { registerSnapshotCommand } from './commands/snapshot';
import { registerRestoreCommand } from './commands/restore';
import { initManifest } from './manifest/init';
import { loadManifest } from './manifest/parser';
import * as path from 'path';
import * as fs from 'fs';

const DEFAULT_MANIFEST = 'stacksync.yaml';

const program = new Command();

program
  .name('stacksync')
  .description('Snapshot and restore local dev environment configs across machines')
  .version('0.1.0');

/**
 * `init` command — scaffolds a new stacksync.yaml manifest in the current directory.
 */
program
  .command('init')
  .description('Initialize a new stacksync.yaml manifest in the current directory')
  .option('-f, --force', 'Overwrite existing manifest if present', false)
  .action(async (options: { force: boolean }) => {
    const manifestPath = path.resolve(process.cwd(), DEFAULT_MANIFEST);

    if (fs.existsSync(manifestPath) && !options.force) {
      console.error(
        `Manifest already exists at ${manifestPath}.\nUse --force to overwrite.`
      );
      process.exit(1);
    }

    try {
      await initManifest(manifestPath);
      console.log(`✔ Initialized manifest at ${manifestPath}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Failed to initialize manifest: ${message}`);
      process.exit(1);
    }
  });

/**
 * `snapshot` command — reads the manifest and copies tracked files into the snapshot store.
 */
registerSnapshotCommand(program, DEFAULT_MANIFEST);

/**
 * `restore` command — reads the manifest and restores tracked files from the snapshot store.
 */
registerRestoreCommand(program, DEFAULT_MANIFEST);

/**
 * `status` command — shows which tracked files differ from their snapshots.
 */
program
  .command('status')
  .description('Show which tracked files differ from their last snapshot')
  .option('-m, --manifest <path>', 'Path to manifest file', DEFAULT_MANIFEST)
  .action(async (options: { manifest: string }) => {
    const manifestPath = path.resolve(process.cwd(), options.manifest);

    try {
      const manifest = await loadManifest(manifestPath);
      const snapshotDir = path.resolve(
        path.dirname(manifestPath),
        manifest.snapshotDir ?? '.stacksync'
      );

      let hasChanges = false;

      for (const entry of manifest.files) {
        const src = entry.path.replace(/^~/, process.env.HOME ?? '~');
        const dest = path.join(snapshotDir, entry.name ?? path.basename(src));

        const srcExists = fs.existsSync(src);
        const destExists = fs.existsSync(dest);

        if (!destExists) {
          console.log(`  ? ${entry.path}  (no snapshot yet)`);
          hasChanges = true;
        } else if (!srcExists) {
          console.log(`  ! ${entry.path}  (source missing)`);
          hasChanges = true;
        } else {
          const srcContent = fs.readFileSync(src);
          const destContent = fs.readFileSync(dest);
          if (!srcContent.equals(destContent)) {
            console.log(`  M ${entry.path}  (modified)`);
            hasChanges = true;
          } else {
            console.log(`  ✔ ${entry.path}`);
          }
        }
      }

      if (!hasChanges) {
        console.log('All tracked files are in sync.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Status check failed: ${message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
