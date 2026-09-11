import { NextResponse } from 'next/server';
import { requireAction } from '@/lib/api-guard';
import { getReportsSummary } from '@/lib/queries/reports';

export async function GET() {
  const { error } = await requireAction('viewReports');
  if (error) return error;

  const summary = await getReportsSummary();
  return NextResponse.json(summary);
}
