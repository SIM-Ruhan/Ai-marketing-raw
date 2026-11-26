import { NextResponse } from 'next/server';
import { after } from 'next/server';
import { getDb } from '@/lib/db';
import { route, HttpError, parseObjectId } from '@/lib/http';
import { requireWorkspace } from '@/lib/guard';
import { runAudit } from '@/lib/audit/runAudit';

export const maxDuration = 60; // seconds (Vercel). Crawl + Gemini must fit inside this.

const DAILY_AUDIT_LIMIT_PER_WORKSPACE = 10;

export const GET = route(async (_req, { params }) => {
  const { workspaceId } = await requireWorkspace();
  const brandId = parseObjectId((await params).id);
  const db = await getDb();
  const audits = await db
    .collection('audits')
    .find({ brandId, workspaceId }, { projection: { result: 0 } }) // list view: no heavy result
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();
  return NextResponse.json({ audits });
});

export const POST = route(async (_req, { params }) => {
  const { workspaceId, userId } = await requireWorkspace();
  const brandId = parseObjectId((await params).id);
  const db = await getDb();

  const brand = await db.collection('brands').findOne({ _id: brandId, workspaceId });
  if (!brand) throw new HttpError(404, 'Brand not found');

  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  const active = await db.collection('audits').findOne({
    brandId,
    workspaceId,
    status: { $in: ['queued', 'running'] },
    updatedAt: { $gt: fiveMinAgo },
  });
  if (active) {
    return NextResponse.json({ error: 'An audit is already running', auditId: active._id }, { status: 409 });
  }

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const todayCount = await db.collection('audits').countDocuments({ workspaceId, createdAt: { $gt: dayAgo } });
  if (todayCount >= DAILY_AUDIT_LIMIT_PER_WORKSPACE) {
    throw new HttpError(429, 'Daily audit limit reached for this workspace. Try again tomorrow.');
  }

  const now = new Date();
  const { insertedId } = await db.collection('audits').insertOne({
    workspaceId,
    brandId,
    createdBy: userId,
    status: 'queued',
    step: 'queued',
    error: null,
    result: null,
    createdAt: now,
    updatedAt: now,
  });

  after(() => runAudit(insertedId)); // runs after the response is sent
  return NextResponse.json({ auditId: insertedId }, { status: 202 });
});
