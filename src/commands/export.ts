import { Command } from 'commander';
import * as path from 'path';
import { loadManifest } from '../manifest/parser';
import { exportBundle, importBundle } from '../export/export';
import { saveManifest } from '../manifest/parser';

export function registerExportCommand(program: Command): void {
  program
    .command('export <output>')
    .description('Export the current manifest and optionally its history to a YAML bundle')
    .option('--history', 'Include snapshot history in the bundle')
    .option('--history-limit <n>', 'Max number of history entries to include', '10')
    .action(async (output: string, opts) => {
      try {
        const manifest = await loadManifest();
        const outputPath = path.resolve(output);
        await exportBundle(manifest, outputPath, {
          includeHistory: !!opts.history,
          historyLimit: parseInt(opts.historyLimit, 10),
        });
        console.log(`✔ Exported bundle to ${outputPath}`);
      } catch (err: any) {
        console.error(`✖ Export failed: ${err.message}`);
        process.exit(1);
      }
    });
}

export function registerImportCommand(program: Command): void {
  program
    .command('import <input>')
    .description('Import a stacksync bundle and restore the manifest')
    .option('--dry-run', 'Preview the manifest without writing it')
    .action(async (input: string, opts) => {
      try {
        const inputPath = path.resolve(input);
        const bundle = await importBundle(inputPath);

        if (opts.dryRun) {
          console.log('Dry run — manifest that would be imported:');
          console.log(JSON.stringify(bundle.manifest, null, 2));
          return;
        }

        await saveManifest(bundle.manifest);
        console.log(`✔ Imported manifest "${bundle.manifest.name}" from ${inputPath}`);

        if (bundle.history) {
          console.log(`  ↳ Bundle contained ${bundle.history.length} history entries (not restored automatically).`);
        }
      } catch (err: any) {
        console.error(`✖ Import failed: ${err.message}`);
        process.exit(1);
      }
    });
}
