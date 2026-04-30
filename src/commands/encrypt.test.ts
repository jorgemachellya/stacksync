import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerEncryptCommand, registerDecryptCommand } from './encrypt';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stacksync-cmd-enc-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerEncryptCommand(program);
  registerDecryptCommand(program);
  return program;
}

describe('encrypt command', () => {
  it('encrypts a file to .enc output', async () => {
    const src = path.join(tmpDir, 'config.yaml');
    const enc = path.join(tmpDir, 'config.yaml.enc');
    fs.writeFileSync(src, 'key: value');

    const program = makeProgram();
    await program.parseAsync(['encrypt', src, '-p', 'testpass', '-o', enc], { from: 'user' });

    expect(fs.existsSync(enc)).toBe(true);
    expect(fs.readFileSync(enc)).not.toEqual(fs.readFileSync(src));
  });

  it('defaults output to <file>.enc', async () => {
    const src = path.join(tmpDir, 'snap.yaml');
    fs.writeFileSync(src, 'data: 123');

    const program = makeProgram();
    await program.parseAsync(['encrypt', src, '-p', 'pass'], { from: 'user' });

    expect(fs.existsSync(src + '.enc')).toBe(true);
  });
});

describe('decrypt command', () => {
  it('decrypts back to original content', async () => {
    const src = path.join(tmpDir, 'file.yaml');
    const enc = path.join(tmpDir, 'file.yaml.enc');
    const dec = path.join(tmpDir, 'file.yaml.dec');
    fs.writeFileSync(src, 'restored: true');

    const program = makeProgram();
    await program.parseAsync(['encrypt', src, '-p', 'mypass', '-o', enc], { from: 'user' });
    await program.parseAsync(['decrypt', enc, '-p', 'mypass', '-o', dec], { from: 'user' });

    expect(fs.readFileSync(dec, 'utf8')).toBe('restored: true');
  });

  it('strips .enc extension for default output', async () => {
    const src = path.join(tmpDir, 'snap.yaml');
    fs.writeFileSync(src, 'x: 1');

    const p1 = makeProgram();
    await p1.parseAsync(['encrypt', src, '-p', 'pw'], { from: 'user' });

    const encFile = src + '.enc';
    const p2 = makeProgram();
    await p2.parseAsync(['decrypt', encFile, '-p', 'pw'], { from: 'user' });

    expect(fs.existsSync(src)).toBe(true);
    expect(fs.readFileSync(src, 'utf8')).toBe('x: 1');
  });
});
