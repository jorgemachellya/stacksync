import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { Manifest, DEFAULT_MANIFEST_FILENAME } from './types';

export class ManifestParseError extends Error {
  constructor(message: string, public readonly filePath?: string) {
    super(message);
    this.name = 'ManifestParseError';
  }
}

export function loadManifest(filePath?: string): Manifest {
  const resolvedPath = filePath
    ? path.resolve(filePath)
    : path.resolve(process.cwd(), DEFAULT_MANIFEST_FILENAME);

  if (!fs.existsSync(resolvedPath)) {
    throw new ManifestParseError(
      `Manifest file not found: ${resolvedPath}`,
      resolvedPath
    );
  }

  let rawContent: string;
  try {
    rawContent = fs.readFileSync(resolvedPath, 'utf-8');
  } catch (err) {
    throw new ManifestParseError(
      `Failed to read manifest file: ${(err as Error).message}`,
      resolvedPath
    );
  }

  let parsed: unknown;
  try {
    parsed = yaml.load(rawContent);
  } catch (err) {
    throw new ManifestParseError(
      `Failed to parse YAML: ${(err as Error).message}`,
      resolvedPath
    );
  }

  return validateManifest(parsed, resolvedPath);
}

export function saveManifest(manifest: Manifest, filePath?: string): void {
  const resolvedPath = filePath
    ? path.resolve(filePath)
    : path.resolve(process.cwd(), DEFAULT_MANIFEST_FILENAME);

  const yamlContent = yaml.dump(manifest, { indent: 2, lineWidth: 120 });
  fs.writeFileSync(resolvedPath, yamlContent, 'utf-8');
}

function validateManifest(data: unknown, filePath: string): Manifest {
  if (typeof data !== 'object' || data === null) {
    throw new ManifestParseError('Manifest must be a YAML object', filePath);
  }

  const obj = data as Record<string, unknown>;

  if (!obj.version || typeof obj.version !== 'string') {
    throw new ManifestParseError('Manifest must include a "version" field', filePath);
  }

  if (!obj.name || typeof obj.name !== 'string') {
    throw new ManifestParseError('Manifest must include a "name" field', filePath);
  }

  if (!Array.isArray(obj.tools)) {
    throw new ManifestParseError('Manifest must include a "tools" array', filePath);
  }

  return data as Manifest;
}
