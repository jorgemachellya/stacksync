import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { exportBundle, importBundle } from './export';
import { StackSyncManifest } from '../manifest/types';

function makeManifest(): StackSyncManifest {
  return {
    name: 'test-env',
    version: '1',
    files: [
      { source: '~/.bashrc', dest: 'configs/bashrc' },
    ],
  };
}

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'stacksync-export-'));
});

afterEach(async () => {
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe('exportBundle', () => {
  it('writes a valid YAML bundle to disk', async () => {
    const manifest = makeManifest();
    const outPath = path.join(tmpDir, 'bundle.yaml');
    await exportBundle(manifest, outPath);

    const exists = fs.existsSync(outPath);
    expect(exists).toBe(true);

    const content = await fs.promises.readFile(outPath, 'utf8');
    expect(content).toContain('test-env');
    expect(content).toContain('exportedAt');
  });

  it('does not include history when includeHistory is false', async () => {
    const manifest = makeManifest();
    const outPath = path.join(tmpDir, 'bundle.yaml');
    await exportBundle(manifest, outPath, { includeHistory: false });

    const content = await fs.promises.readFile(outPath, 'utf8');
    expect(content).not.toContain('history:');
  });
});

describe('importBundle', () => {
  it('reads a bundle and returns the manifest', async () => {
    const manifest = makeManifest();
    const outPath = path.join(tmpDir, 'bundle.yaml');
    await exportBundle(manifest, outPath);

    const bundle = await importBundle(outPath);
    expect(bundle.manifest.name).toBe('test-env');
    expect(bundle.version).toBe('1');
    expect(bundle.exportedAt).toBeTruthy();
  });

  it('throws on invalid bundle file', async () => {
    const badPath = path.join(tmpDir, 'bad.yaml');
    await fs.promises.writeFile(badPath, 'just: a: random: yaml', 'utf8');
    await expect(importBundle(badPath)).rejects.toThrow('Invalid export bundle');
  });
});
