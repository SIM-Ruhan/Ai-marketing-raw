import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { route, HttpError, parseObjectId } from '@/lib/http';
import { requireWorkspace } from '@/lib/guard';
import { assertPublicUrl } from '@/lib/safeFetch';
import { normalizeUrl, hostKey } from '@/lib/urlUtils';

const MAX_COMPETITORS_PER_BRAND = 10;

export const GET = route(async (_req, { params }) => {
  const { workspaceId } = await requireWorkspace();
  const brandId = parseObjectId((await params).id);
  const db = await getDb();
  const competitors = await db
    .collection('competitors')
    .find({ brandId, workspaceId }, { projection: { crawl: 0 } }) // crawl data is large; list doesn't need it
    .sort({ createdAt: -1 })
    .toArray();
  return NextResponse.json({ competitors });
});

// User adds a competitor by URL. User-added competitors are confirmed immediately.
export const POST = route(async (request, { params }) => {
  const { workspaceId, userId } = await requireWorkspace();
  const brandId = parseObjectId((await params).id);
  const body = await request.json().catch(() => ({}));

  const websiteUrl = normalizeUrl(body.websiteUrl);
  if (!websiteUrl) throw new HttpError(400, 'Enter a valid competitor website URL');
  await assertPublicUrl(websiteUrl);

  const db = await getDb();
  const brand = await db.collection('brands').findOne({ _id: brandId, workspaceId });
  if (!brand) throw new HttpError(404, 'Brand not found');

  const key = hostKey(websiteUrl);
  if (key === hostKey(brand.websiteUrl)) throw new HttpError(400, "That is the brand's own website");

  const existing = await db.collection('competitors').find({ brandId, workspaceId }, { projection: { websiteUrl: 1 } }).toArray();
  if (existing.length >= MAX_COMPETITORS_PER_BRAND) {
    throw new HttpError(400, `Competitor limit reached (${MAX_COMPETITORS_PER_BRAND})`);
  }
  if (existing.some((c) => hostKey(c.websiteUrl) === key)) {
    throw new HttpError(409, 'This competitor is already on the list');
  }

  const name = (typeof body.name === 'string' && body.name.trim().slice(0, 120)) || key;
  const now = new Date();
  const doc = {
    workspaceId,
    brandId,
    createdBy: userId,
    name,
    websiteUrl,
    source: 'user',
    confirmed: true,
    note: '',
    crawl: null,
    createdAt: now,
    updatedAt: now,
  };
  const { insertedId } = await db.collection('competitors').insertOne(doc);
  const { crawl, ...safe } = doc;
  return NextResponse.json({ competitor: { _id: insertedId, ...safe } }, { status: 201 });
});
