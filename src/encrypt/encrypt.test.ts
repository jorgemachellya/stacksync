import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encryptFile, decryptFile, encryptString, decryptString, deriveKey } from './encrypt';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stacksync-encrypt-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('deriveKey', () => {
  it('produces a 32-byte key', () => {
    const salt = Buffer.alloc(16, 'a');
    const key = deriveKey('mypassphrase', salt);
    expect(key.length).toBe(32);
  });

  it('is deterministic for same inputs', () => {
    const salt = Buffer.alloc(16, 'b');
    expect(deriveKey('pass', salt).toString('hex')).toBe(deriveKey('pass', salt).toString('hex'));
  });
});

describe('encryptString / decryptString', () => {
  it('round-trips a string', () => {
    const original = 'super secret value';
    const encoded = encryptString(original, 'passphrase123');
    expect(decryptString(encoded, 'passphrase123')).toBe(original);
  });

  it('produces different ciphertext each call', () => {
    const a = encryptString('hello', 'pass');
    const b = encryptString('hello', 'pass');
    expect(a).not.toBe(b);
  });

  it('throws on wrong passphrase', () => {
    const encoded = encryptString('secret', 'correct');
    expect(() => decryptString(encoded, 'wrong')).toThrow();
  });
});

describe('encryptFile / decryptFile', () => {
  it('round-trips a file', () => {
    const src = path.join(tmpDir, 'plain.txt');
    const enc = path.join(tmpDir, 'plain.enc');
    const dec = path.join(tmpDir, 'plain.dec.txt');

    fs.writeFileSync(src, 'file contents here');
    encryptFile(src, enc, 'filepass');
    decryptFile(enc, dec, 'filepass');

    expect(fs.readFileSync(dec, 'utf8')).toBe('file contents here');
  });

  it('encrypted file differs from original', () => {
    const src = path.join(tmpDir, 'data.txt');
    const enc = path.join(tmpDir, 'data.enc');
    fs.writeFileSync(src, 'plaintext');
    encryptFile(src, enc, 'pass');
    expect(fs.readFileSync(enc)).not.toEqual(fs.readFileSync(src));
  });

  it('throws on wrong passphrase for file', () => {
    const src = path.join(tmpDir, 'f.txt');
    const enc = path.join(tmpDir, 'f.enc');
    const dec = path.join(tmpDir, 'f.dec');
    fs.writeFileSync(src, 'data');
    encryptFile(src, enc, 'right');
    expect(() => decryptFile(enc, dec, 'wrong')).toThrow();
  });
});
