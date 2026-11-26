import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { route, HttpError, parseObjectId } from '@/lib/http';
import { requireWorkspace } from '@/lib/guard';

export const GET = route(async (_req, { params }) => {
  const { workspaceId } = await requireWorkspace();
  const _id = parseObjectId((await params).id);
  const db = await getDb();
  const funnel = await db.collection('funnels').findOne({ _id, workspaceId });
  if (!funnel) throw new HttpError(404, 'Funnel not found');
  return NextResponse.json({ funnel });
});
