import { Command } from 'commander';
import { listHistory, getHistoryEntry } from '../history/history';
import { SnapshotHistoryEntry } from '../history/history';

function formatEntry(entry: SnapshotHistoryEntry): string {
  const label = entry.label ? ` (${entry.label})` : '';
  const fileCount = Object.keys(entry.files).length;
  return `  [${entry.id}] ${entry.timestamp}${label} — ${fileCount} file(s)`;
}

export function registerHistoryCommand(program: Command): void {
  const historyCmd = program
    .command('history')
    .description('View or inspect snapshot history');

  historyCmd
    .command('list')
    .description('List recent snapshots')
    .action(() => {
      const entries = listHistory();
      if (entries.length === 0) {
        console.log('No snapshot history found.');
        return;
      }
      console.log('Snapshot history (newest first):');
      entries.forEach((e) => console.log(formatEntry(e)));
    });

  historyCmd
    .command('show <id>')
    .description('Show details of a specific snapshot by ID')
    .action((id: string) => {
      const entry = getHistoryEntry(id);
      if (!entry) {
        console.error(`No snapshot found with id: ${id}`);
        process.exit(1);
      }
      console.log(`ID:        ${entry.id}`);
      console.log(`Timestamp: ${entry.timestamp}`);
      if (entry.label) console.log(`Label:     ${entry.label}`);
      console.log('Files:');
      for (const [src, dest] of Object.entries(entry.files)) {
        console.log(`  ${src} -> ${dest}`);
      }
    });
}
