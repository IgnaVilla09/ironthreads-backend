import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { env } from '../../config/env';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getEncryptionKey() {
  return createHash('sha256').update(env.APP_CREDENTIALS_SECRET).digest();
}

export function encryptText(value: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptText(value: string): string {
  const [ivText, tagText, payloadText] = value.split('.');

  if (!ivText || !tagText || !payloadText) {
    throw new Error('Encrypted payload inválido');
  }

  const decipher = createDecipheriv(
    ENCRYPTION_ALGORITHM,
    getEncryptionKey(),
    Buffer.from(ivText, 'base64url')
  );

  decipher.setAuthTag(Buffer.from(tagText, 'base64url'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payloadText, 'base64url')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
