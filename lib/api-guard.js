import { NextResponse } from 'next/server';
import { getSession } from './session';
import { can } from './rbac';

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    return { session: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { session, error: null };
}

export async function requireAction(action) {
  const { session, error } = await requireSession();
  if (error) return { session: null, error };
  if (!can(session.role, action)) {
    return { session: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { session, error: null };
}
