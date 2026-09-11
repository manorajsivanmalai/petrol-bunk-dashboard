import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/api-guard';
import { getDashboardSummary } from '@/lib/queries/dashboard';

export async function GET() {
  const { error } = await requireSession();
  if (error) return error;

  const summary = await getDashboardSummary();
  return NextResponse.json(summary);
}
