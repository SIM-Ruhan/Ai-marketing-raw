import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { route, HttpError, parseObjectId } from '@/lib/http';
import { requireWorkspace } from '@/lib/guard';

const STALE_MS = 5 * 60 * 1000;

export const GET = route(async (_req, { params }) => {
  const { workspaceId } = await requireWorkspace();
  const _id = parseObjectId((await params).id);
  const db = await getDb();

  let audit = await db.collection('audits').findOne({ _id, workspaceId });
  if (!audit) throw new HttpError(404, 'Audit not found');

  // If the server died mid-job, don't leave the UI spinning forever.
  const isActive = audit.status === 'queued' || audit.status === 'running';
  if (isActive && Date.now() - new Date(audit.updatedAt).getTime() > STALE_MS) {
    const error = 'The audit timed out. Please run it again.';
    await db.collection('audits').updateOne({ _id }, { $set: { status: 'failed', error, updatedAt: new Date() } });
    audit = { ...audit, status: 'failed', error };
  }
  return NextResponse.json({ audit });
});
