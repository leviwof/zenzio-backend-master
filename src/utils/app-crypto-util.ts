import { createCipheriv, createDecipheriv } from 'crypto';

const ENCRYPTION_KEY = process.env.APP_ENCRYPTION_SECRET || ''; // Must be 32 bytes
const IV = process.env.APP_ENCRYPTION_IV || ''; // Must be 16 bytes

if (ENCRYPTION_KEY.length !== 32) {
  throw new Error('APP_ENCRYPTION_SECRET must be 32 bytes long.');
}

if (IV.length !== 16) {
  throw new Error('APP_ENCRYPTION_IV must be 16 bytes long.');
}

export function encrypt(text: string): string {
  const cipher = createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), IV);
  let encrypted = cipher.update(text, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString('hex');
}

export function decrypt(text: string): string {
  const encryptedText = Buffer.from(text, 'hex');
  const decipher = createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), IV);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString('utf8');
}
