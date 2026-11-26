import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { route, HttpError, parseObjectId } from '@/lib/http';
import { requireWorkspace } from '@/lib/guard';
import { generateJson } from '@/lib/ai/gemini';
import { normalizeUrl, hostKey } from '@/lib/urlUtils';

export const maxDuration = 60;

const MAX_COMPETITORS_PER_BRAND = 10;

// AI suggestions come from the model's own knowledge, NOT from verified research.
// They are stored unconfirmed and are never crawled until the user confirms them.
export const POST = route(async (_req, { params }) => {
  const { workspaceId, userId } = await requireWorkspace();
  const brandId = parseObjectId((await params).id);
  const db = await getDb();

  const brand = await db.collection('brands').findOne({ _id: brandId, workspaceId });
  if (!brand) throw new HttpError(404, 'Brand not found');

  const audit = await db
    .collection('audits')
    .findOne({ brandId, workspaceId, status: 'done' }, { sort: { createdAt: -1 } });
  if (!audit) throw new HttpError(400, 'Run an audit first so the AI knows what this business does');

  const existing = await db.collection('competitors').find({ brandId, workspaceId }, { projection: { websiteUrl: 1 } }).toArray();
  const room = MAX_COMPETITORS_PER_BRAND - existing.length;
  if (room <= 0) throw new HttpError(400, 'Competitor limit reached');

  const raw = await generateJson(`Based on this business summary, suggest up to 5 direct competitors that you are CONFIDENT are real companies with their own websites.
If you are not sure a company exists, leave it out. Returning fewer (or none) is better than guessing.
Do not invent URLs.

BUSINESS: ${brand.name} (${brand.websiteUrl})
INDUSTRY: ${brand.industry || 'not provided'}
COUNTRY: ${brand.country || 'not provided'}
SUMMARY: ${audit.result?.summary || ''}
VALUE PROPOSITION: ${audit.result?.positioning?.valueProposition || ''}

Return ONLY JSON: { "competitors": [ { "name": string, "websiteUrl": string, "reason": string } ] }`);

  const seen = new Set([hostKey(brand.websiteUrl), ...existing.map((c) => hostKey(c.websiteUrl))]);
  const docs = [];
  for (const c of Array.isArray(raw?.competitors) ? raw.competitors : []) {
    const url = normalizeUrl(c?.websiteUrl);
    const key = hostKey(url);
    if (!url || !key || seen.has(key) || docs.length >= Math.min(5, room)) continue;
    seen.add(key);
    const now = new Date();
    docs.push({
      workspaceId,
      brandId,
      createdBy: userId,
      name: String(c?.name || key).trim().slice(0, 120),
      websiteUrl: url,
      source: 'ai_suggested',
      confirmed: false,
      note: String(c?.reason || '').trim().slice(0, 300),
      crawl: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  if (docs.length) await db.collection('competitors').insertMany(docs);
  return NextResponse.json({ added: docs.length });
});
