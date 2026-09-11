import { SignJWT, jwtVerify } from 'jose';

export const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'kannusamy_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

function secretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set. Copy .env.example to .env.local and set it.');
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user) {
  return new SignJWT({
    sub: user.id,
    role: user.role,
    name: user.name,
    username: user.username,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload;
  } catch {
    return null;
  }
}
