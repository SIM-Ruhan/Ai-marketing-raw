import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { route, HttpError, parseObjectId } from '@/lib/http';
import { requireWorkspace } from '@/lib/guard';
import { generateJson, AI_MODEL } from '@/lib/ai/gemini';
import { buildFunnelPrompt, sanitizeFunnel } from '@/lib/funnel/prompt';
import { insertFunnelVersion } from '@/lib/funnel/saveVersion';

export const maxDuration = 60;

const DAILY_LIMIT_PER_WORKSPACE = 15;

export const GET = route(async (_req, { params }) => {
  const { workspaceId } = await requireWorkspace();
  const brandId = parseObjectId((await params).id);
  const db = await getDb();
  const funnels = await db
    .collection('funnels')
    .find({ brandId, workspaceId }, { projection: { stages: 0 } }) // list: metadata only
    .sort({ version: -1 })
    .limit(20)
    .toArray();
  return NextResponse.json({ funnels });
});

// Generates a NEW version from the latest audit (+ latest comparison for that audit, if any).
export const POST = route(async (_req, { params }) => {
  const { workspaceId, userId } = await requireWorkspace();
  const brandId = parseObjectId((await params).id);
  const db = await getDb();

  const brand = await db.collection('brands').findOne({ _id: brandId, workspaceId });
  if (!brand) throw new HttpError(404, 'Brand not found');

  const audit = await db
    .collection('audits')
    .findOne({ brandId, workspaceId, status: 'done' }, { sort: { createdAt: -1 } });
  if (!audit) throw new HttpError(400, 'Run an audit first. The funnel is built from it.');

  const comparison = await db
    .collection('comparisons')
    .findOne({ brandId, workspaceId, auditId: audit._id, status: 'done' }, { sort: { createdAt: -1 } });

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const count = await db
    .collection('funnels')
    .countDocuments({ workspaceId, source: 'ai', createdAt: { $gt: dayAgo } });
  if (count >= DAILY_LIMIT_PER_WORKSPACE) throw new HttpError(429, 'Daily funnel limit reached for this workspace.');

  const raw = await generateJson(buildFunnelPrompt(brand, audit, comparison), { temperature: 0.4 });
  const crawledUrls = [...(audit.meta?.crawledUrls || []), ...(comparison?.meta?.crawledUrls || [])];
  const clean = sanitizeFunnel(raw, crawledUrls);

  const now = new Date();
  const funnel = await insertFunnelVersion(db, {
    workspaceId,
    brandId,
    createdBy: userId,
    source: 'ai',
    status: 'draft',
    parentId: null,
    overview: clean.overview,
    stages: clean.stages,
    sources: {
      auditId: audit._id,
      comparisonId: comparison?._id || null,
      crawledUrls,
      model: AI_MODEL,
    },
    createdAt: now,
  });
  return NextResponse.json({ funnel }, { status: 201 });
});
