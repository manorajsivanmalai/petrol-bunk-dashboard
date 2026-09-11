import crypto from 'crypto';

export function generateTempPassword() {
  return `${crypto.randomBytes(5).toString('hex')}Aa1`;
}
