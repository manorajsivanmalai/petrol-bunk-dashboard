import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/api-guard';
import { listApprovals } from '@/lib/queries/approvals';

export async function GET(request) {
  const { error } = await requireSession();
  if (error) return error;

  const status = new URL(request.url).searchParams.get('status');
  const approvals = await listApprovals(status);
  return NextResponse.json({ approvals });
}
