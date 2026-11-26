import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { route, HttpError } from '@/lib/http';
import { requireWorkspace } from '@/lib/guard';
import { validateBrandInput } from '@/lib/validators';
import { assertPublicUrl } from '@/lib/safeFetch';

const MAX_BRANDS_PER_WORKSPACE = 50;

export const GET = route(async () => {
  const { workspaceId } = await requireWorkspace();
  const db = await getDb();
  const brands = await db
    .collection('brands')
    .find({ workspaceId })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();
  return NextResponse.json({ brands });
});

export const POST = route(async (request) => {
  const { workspaceId, userId } = await requireWorkspace();
  const body = await request.json().catch(() => ({}));
  const input = validateBrandInput(body);
  await assertPublicUrl(input.websiteUrl); // rejects localhost / private IPs up front

  const db = await getDb();
  const count = await db.collection('brands').countDocuments({ workspaceId });
  if (count >= MAX_BRANDS_PER_WORKSPACE) {
    throw new HttpError(400, `Brand limit reached (${MAX_BRANDS_PER_WORKSPACE})`);
  }

  const now = new Date();
  const doc = {
    workspaceId,
    createdBy: userId,
    name: input.name,
    websiteUrl: input.websiteUrl,
    industry: input.industry || '',
    country: input.country || '',
    socialUrls: input.socialUrls || [],
    createdAt: now,
    updatedAt: now,
  };
  const { insertedId } = await db.collection('brands').insertOne(doc);
  return NextResponse.json({ brand: { _id: insertedId, ...doc } }, { status: 201 });
});
