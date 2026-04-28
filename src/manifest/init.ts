import * as path from 'path';
import * as fs from 'fs';
import { Manifest, MANIFEST_VERSION, DEFAULT_MANIFEST_FILENAME } from './types';
import { saveManifest } from './parser';

export interface InitOptions {
  name?: string;
  description?: string;
  author?: string;
  outputDir?: string;
  force?: boolean;
}

export function initManifest(options: InitOptions = {}): string {
  const outputDir = options.outputDir
    ? path.resolve(options.outputDir)
    : process.cwd();

  const outputPath = path.join(outputDir, DEFAULT_MANIFEST_FILENAME);

  if (fs.existsSync(outputPath) && !options.force) {
    throw new Error(
      `Manifest already exists at ${outputPath}. Use --force to overwrite.`
    );
  }

  const now = new Date().toISOString();

  const manifest: Manifest = {
    version: MANIFEST_VERSION,
    name: options.name ?? path.basename(outputDir),
    description: options.description ?? 'My local dev environment snapshot',
    author: options.author,
    created_at: now,
    updated_at: now,
    tools: [
      {
        name: 'example-tool',
        version: '1.0.0',
        files: [
          {
            source: '~/.example-tool/config',
            description: 'Example tool configuration',
          },
        ],
      },
    ],
  };

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  saveManifest(manifest, outputPath);
  return outputPath;
}
