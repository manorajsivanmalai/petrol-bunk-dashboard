import { cookies } from 'next/headers';
import { COOKIE_NAME, verifySessionToken } from './auth';

export async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
