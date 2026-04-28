export interface ManifestFile {
  source: string;
  destination?: string;
  description?: string;
}

export interface ManifestTool {
  name: string;
  version?: string;
  files?: ManifestFile[];
}

export interface Manifest {
  version: string;
  name: string;
  description?: string;
  author?: string;
  created_at?: string;
  updated_at?: string;
  tools: ManifestTool[];
}

export const MANIFEST_VERSION = '1.0';
export const DEFAULT_MANIFEST_FILENAME = 'stacksync.yaml';
