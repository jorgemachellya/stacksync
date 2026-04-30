import * as fs from 'fs';
import * as path from 'path';
import { StackSyncManifest } from '../manifest/types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validatePaths(manifest: StackSyncManifest): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!manifest.files || manifest.files.length === 0) {
    warnings.push('Manifest contains no file entries.');
    return { valid: true, errors, warnings };
  }

  for (const entry of manifest.files) {
    const expanded = entry.source.replace(/^~/, process.env.HOME ?? '');
    const resolved = path.resolve(expanded);

    if (!fs.existsSync(resolved)) {
      errors.push(`Source path does not exist: ${entry.source}`);
      continue;
    }

    const stat = fs.statSync(resolved);
    if (stat.isDirectory()) {
      warnings.push(`Source path is a directory (not a file): ${entry.source}`);
    }

    if (!entry.dest || entry.dest.trim() === '') {
      errors.push(`Missing destination for source: ${entry.source}`);
    }

    const destExpanded = entry.dest.replace(/^~/, process.env.HOME ?? '');
    const destDir = path.dirname(path.resolve(destExpanded));
    if (!fs.existsSync(destDir)) {
      warnings.push(`Destination directory does not exist and will need to be created: ${destDir}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateManifestIntegrity(manifest: StackSyncManifest): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!manifest.version) {
    errors.push('Manifest is missing required field: version');
  }

  if (!manifest.name || manifest.name.trim() === '') {
    warnings.push('Manifest has no name set.');
  }

  const sources = manifest.files?.map((f) => f.source) ?? [];
  const duplicates = sources.filter((s, i) => sources.indexOf(s) !== i);
  for (const dup of [...new Set(duplicates)]) {
    errors.push(`Duplicate source entry found: ${dup}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
