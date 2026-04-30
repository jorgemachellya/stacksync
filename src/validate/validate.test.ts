import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { validatePaths, validateManifestIntegrity } from './validate';
import { StackSyncManifest } from '../manifest/types';

function makeManifest(overrides: Partial<StackSyncManifest> = {}): StackSyncManifest {
  return {
    version: '1',
    name: 'test-manifest',
    files: [],
    ...overrides,
  };
}

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stacksync-validate-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('validatePaths', () => {
  it('returns valid with warning when no files are listed', () => {
    const result = validatePaths(makeManifest());
    expect(result.valid).toBe(true);
    expect(result.warnings).toContain('Manifest contains no file entries.');
  });

  it('reports error for non-existent source path', () => {
    const manifest = makeManifest({
      files: [{ source: '/nonexistent/path/.config', dest: '~/.config' }],
    });
    const result = validatePaths(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/does not exist/);
  });

  it('reports warning for missing dest directory', () => {
    const src = path.join(tmpDir, 'myconfig.yaml');
    fs.writeFileSync(src, 'key: value');
    const manifest = makeManifest({
      files: [{ source: src, dest: path.join(tmpDir, 'nonexistent', 'dest.yaml') }],
    });
    const result = validatePaths(manifest);
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.includes('will need to be created'))).toBe(true);
  });

  it('passes cleanly when source and dest directory both exist', () => {
    const src = path.join(tmpDir, 'cfg.yaml');
    fs.writeFileSync(src, 'a: b');
    const manifest = makeManifest({
      files: [{ source: src, dest: path.join(tmpDir, 'cfg_dest.yaml') }],
    });
    const result = validatePaths(manifest);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('validateManifestIntegrity', () => {
  it('errors when version is missing', () => {
    const manifest = makeManifest({ version: '' });
    const result = validateManifestIntegrity(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/version/);
  });

  it('warns when name is missing', () => {
    const manifest = makeManifest({ name: '' });
    const result = validateManifestIntegrity(manifest);
    expect(result.warnings.some((w) => w.includes('no name'))).toBe(true);
  });

  it('errors on duplicate source entries', () => {
    const manifest = makeManifest({
      files: [
        { source: '~/.bashrc', dest: '/tmp/bashrc' },
        { source: '~/.bashrc', dest: '/tmp/bashrc2' },
      ],
    });
    const result = validateManifestIntegrity(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/Duplicate/);
  });
});
