import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { loadManifest, saveManifest, ManifestParseError } from './parser';
import { Manifest } from './types';

const sampleManifest: Manifest = {
  version: '1.0',
  name: 'my-dev-env',
  description: 'My development environment',
  tools: [
    {
      name: 'git',
      version: '2.40.0',
      files: [{ source: '~/.gitconfig', description: 'Git global config' }],
    },
  ],
};

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'stacksync-test-'));
}

describe('loadManifest', () => {
  it('loads a valid manifest from a file', () => {
    const dir = tmpDir();
    const filePath = path.join(dir, 'stacksync.yaml');
    saveManifest(sampleManifest, filePath);

    const result = loadManifest(filePath);
    expect(result.name).toBe('my-dev-env');
    expect(result.tools).toHaveLength(1);
    expect(result.tools[0].name).toBe('git');
  });

  it('throws ManifestParseError when file does not exist', () => {
    expect(() => loadManifest('/nonexistent/path/stacksync.yaml')).toThrow(
      ManifestParseError
    );
  });

  it('throws ManifestParseError for invalid YAML', () => {
    const dir = tmpDir();
    const filePath = path.join(dir, 'stacksync.yaml');
    fs.writeFileSync(filePath, 'invalid: yaml: : :', 'utf-8');
    expect(() => loadManifest(filePath)).toThrow(ManifestParseError);
  });

  it('throws ManifestParseError when version is missing', () => {
    const dir = tmpDir();
    const filePath = path.join(dir, 'stacksync.yaml');
    fs.writeFileSync(filePath, 'name: test\ntools: []', 'utf-8');
    expect(() => loadManifest(filePath)).toThrow(/version/);
  });

  it('throws ManifestParseError when tools is not an array', () => {
    const dir = tmpDir();
    const filePath = path.join(dir, 'stacksync.yaml');
    fs.writeFileSync(filePath, 'version: "1.0"\nname: test\ntools: "bad"', 'utf-8');
    expect(() => loadManifest(filePath)).toThrow(/tools/);
  });
});

describe('saveManifest', () => {
  it('saves and reloads a manifest correctly', () => {
    const dir = tmpDir();
    const filePath = path.join(dir, 'stacksync.yaml');
    saveManifest(sampleManifest, filePath);

    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('name: my-dev-env');
    expect(content).toContain('version: \'1.0\'');
  });
});
