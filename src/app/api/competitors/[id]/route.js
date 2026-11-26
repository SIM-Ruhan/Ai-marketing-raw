import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { route, HttpError, parseObjectId } from '@/lib/http';
import { requireWorkspace } from '@/lib/guard';
import { assertPublicUrl } from '@/lib/safeFetch';
import { normalizeUrl } from '@/lib/urlUtils';

// Confirm an AI suggestion and/or edit name or URL. Editing the URL clears the old crawl.
export const PATCH = route(async (request, { params }) => {
  const { workspaceId } = await requireWorkspace();
  const _id = parseObjectId((await params).id);
  const body = await request.json().catch(() => ({}));
  const db = await getDb();

  const current = await db.collection('competitors').findOne({ _id, workspaceId });
  if (!current) throw new HttpError(404, 'Competitor not found');

  const set = { updatedAt: new Date() };
  if (typeof body.name === 'string' && body.name.trim()) set.name = body.name.trim().slice(0, 120);

  if (body.websiteUrl !== undefined) {
    const url = normalizeUrl(body.websiteUrl);
    if (!url) throw new HttpError(400, 'Enter a valid URL');
    await assertPublicUrl(url);
    set.websiteUrl = url;
    set.crawl = null;
  }

  if (body.confirmed === true) {
    await assertPublicUrl(set.websiteUrl || current.websiteUrl); // re-check before it can ever be crawled
    set.confirmed = true;
  }

  await db.collection('competitors').updateOne({ _id, workspaceId }, { $set: set });
  const updated = await db.collection('competitors').findOne({ _id, workspaceId }, { projection: { crawl: 0 } });
  return NextResponse.json({ competitor: updated });
});

export const DELETE = route(async (_req, { params }) => {
  const { workspaceId } = await requireWorkspace();
  const _id = parseObjectId((await params).id);
  const db = await getDb();
  const { deletedCount } = await db.collection('competitors').deleteOne({ _id, workspaceId });
  if (!deletedCount) throw new HttpError(404, 'Competitor not found');
  return NextResponse.json({ success: true });
});
