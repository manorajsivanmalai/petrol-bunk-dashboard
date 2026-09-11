const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

export function randomPassword(length = 10) {
  let out = '';
  for (let i = 0; i < length; i += 1) out += CHARS[Math.floor(Math.random() * CHARS.length)];
  return `${out}!1`;
}
