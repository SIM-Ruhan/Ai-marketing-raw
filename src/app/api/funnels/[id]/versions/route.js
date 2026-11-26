import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { route, HttpError, parseObjectId } from '@/lib/http';
import { requireWorkspace } from '@/lib/guard';
import { sanitizeFunnel } from '@/lib/funnel/prompt';
import { insertFunnelVersion } from '@/lib/funnel/saveVersion';

// User edits a funnel -> we never overwrite; we save the edit as a new version.
export const POST = route(async (request, { params }) => {
  const { workspaceId, userId } = await requireWorkspace();
  const parentId = parseObjectId((await params).id);
  const body = await request.json().catch(() => ({}));
  const db = await getDb();

  const parent = await db.collection('funnels').findOne({ _id: parentId, workspaceId });
  if (!parent) throw new HttpError(404, 'Funnel not found');
  if (!Array.isArray(body.stages)) throw new HttpError(400, 'stages are required');

  // Evidence links may only come from pages the parent version was built from.
  const clean = sanitizeFunnel(
    { overview: body.overview ?? parent.overview, stages: body.stages },
    parent.sources?.crawledUrls || []
  );

  const funnel = await insertFunnelVersion(db, {
    workspaceId,
    brandId: parent.brandId,
    createdBy: userId,
    source: 'user_edit',
    status: 'draft',
    parentId,
    overview: clean.overview,
    stages: clean.stages,
    sources: parent.sources,
    createdAt: new Date(),
  });
  return NextResponse.json({ funnel }, { status: 201 });
});
