export interface EncryptOptions {
  passphrase: string;
  outputPath?: string;
}

export interface DecryptOptions {
  passphrase: string;
  outputPath?: string;
}

export interface EncryptResult {
  success: boolean;
  outputPath: string;
  error?: string;
}

export interface DecryptResult {
  success: boolean;
  outputPath: string;
  error?: string;
}
