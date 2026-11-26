import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { route, HttpError, parseObjectId } from '@/lib/http';
import { requireWorkspace } from '@/lib/guard';

const STALE_MS = 5 * 60 * 1000;

export const GET = route(async (_req, { params }) => {
  const { workspaceId } = await requireWorkspace();
  const _id = parseObjectId((await params).id);
  const db = await getDb();

  let comparison = await db.collection('comparisons').findOne({ _id, workspaceId });
  if (!comparison) throw new HttpError(404, 'Comparison not found');

  const isActive = comparison.status === 'queued' || comparison.status === 'running';
  if (isActive && Date.now() - new Date(comparison.updatedAt).getTime() > STALE_MS) {
    const error = 'The comparison timed out. Please run it again.';
    await db.collection('comparisons').updateOne({ _id }, { $set: { status: 'failed', error, updatedAt: new Date() } });
    comparison = { ...comparison, status: 'failed', error };
  }
  return NextResponse.json({ comparison });
});
