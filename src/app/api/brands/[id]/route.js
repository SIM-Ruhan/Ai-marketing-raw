import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { route, HttpError, parseObjectId } from '@/lib/http';
import { requireWorkspace } from '@/lib/guard';
import { validateBrandInput } from '@/lib/validators';
import { assertPublicUrl } from '@/lib/safeFetch';

export const GET = route(async (_req, { params }) => {
  const { workspaceId } = await requireWorkspace();
  const _id = parseObjectId((await params).id);
  const db = await getDb();
  // Always match _id AND workspaceId: guessing an ID from another workspace returns 404.
  const brand = await db.collection('brands').findOne({ _id, workspaceId });
  if (!brand) throw new HttpError(404, 'Brand not found');
  return NextResponse.json({ brand });
});

export const PATCH = route(async (request, { params }) => {
  const { workspaceId } = await requireWorkspace();
  const _id = parseObjectId((await params).id);
  const body = await request.json().catch(() => ({}));
  const input = validateBrandInput(body, { partial: true });
  if (input.websiteUrl) await assertPublicUrl(input.websiteUrl);

  const db = await getDb();
  const result = await db
    .collection('brands')
    .findOneAndUpdate({ _id, workspaceId }, { $set: { ...input, updatedAt: new Date() } }, { returnDocument: 'after' });
  const brand = result?.value ?? result; // driver v5 returns the doc, v4 returns { value }
  if (!brand) throw new HttpError(404, 'Brand not found');
  return NextResponse.json({ brand });
});

export const DELETE = route(async (_req, { params }) => {
  const { workspaceId } = await requireWorkspace();
  const _id = parseObjectId((await params).id);
  const db = await getDb();
  const { deletedCount } = await db.collection('brands').deleteOne({ _id, workspaceId });
  if (!deletedCount) throw new HttpError(404, 'Brand not found');
  await Promise.all([
    db.collection('audits').deleteMany({ brandId: _id, workspaceId }),
    db.collection('crawls').deleteMany({ brandId: _id, workspaceId }),
  ]);
  return NextResponse.json({ success: true });
});
