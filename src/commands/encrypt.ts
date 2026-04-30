import { Command } from 'commander';
import * as path from 'path';
import * as readline from 'readline';
import { encryptFile, decryptFile } from '../encrypt/encrypt';

function promptPassphrase(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    // Hide input for passphrase
    process.stdout.write(prompt);
    const stdin = process.openStdin();
    process.stdin.on('data', (char) => {
      char = char + '';
      if (char === '\n' || char === '\r' || char === '\u0004') {
        stdin.pause();
      }
    });
    rl.question('', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerEncryptCommand(program: Command): void {
  program
    .command('encrypt <file>')
    .description('Encrypt a snapshot or config file with a passphrase')
    .option('-o, --output <path>', 'Output path for encrypted file')
    .option('-p, --passphrase <passphrase>', 'Passphrase (omit to prompt)')
    .action(async (file: string, opts: { output?: string; passphrase?: string }) => {
      const inputPath = path.resolve(file);
      const outputPath = opts.output ? path.resolve(opts.output) : inputPath + '.enc';
      const passphrase = opts.passphrase ?? await promptPassphrase('Passphrase: ');

      try {
        encryptFile(inputPath, outputPath, passphrase);
        console.log(`✔ Encrypted → ${outputPath}`);
      } catch (err: any) {
        console.error(`✖ Encryption failed: ${err.message}`);
        process.exit(1);
      }
    });
}

export function registerDecryptCommand(program: Command): void {
  program
    .command('decrypt <file>')
    .description('Decrypt an encrypted snapshot or config file')
    .option('-o, --output <path>', 'Output path for decrypted file')
    .option('-p, --passphrase <passphrase>', 'Passphrase (omit to prompt)')
    .action(async (file: string, opts: { output?: string; passphrase?: string }) => {
      const inputPath = path.resolve(file);
      const defaultOutput = inputPath.endsWith('.enc')
        ? inputPath.slice(0, -4)
        : inputPath + '.dec';
      const outputPath = opts.output ? path.resolve(opts.output) : defaultOutput;
      const passphrase = opts.passphrase ?? await promptPassphrase('Passphrase: ');

      try {
        decryptFile(inputPath, outputPath, passphrase);
        console.log(`✔ Decrypted → ${outputPath}`);
      } catch (err: any) {
        console.error(`✖ Decryption failed: ${err.message}`);
        process.exit(1);
      }
    });
}
