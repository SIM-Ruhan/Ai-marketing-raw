import { NextResponse, after } from 'next/server';
import { getDb } from '@/lib/db';
import { route, HttpError, parseObjectId } from '@/lib/http';
import { requireWorkspace } from '@/lib/guard';
import { runComparison } from '@/lib/competitors/runComparison';

export const maxDuration = 60;

const DAILY_LIMIT_PER_WORKSPACE = 10;
const MAX_COMPETITORS_PER_COMPARISON = 3;

export const GET = route(async (_req, { params }) => {
  const { workspaceId } = await requireWorkspace();
  const brandId = parseObjectId((await params).id);
  const db = await getDb();
  const comparisons = await db
    .collection('comparisons')
    .find({ brandId, workspaceId }, { projection: { result: 0 } })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();
  return NextResponse.json({ comparisons });
});

export const POST = route(async (_req, { params }) => {
  const { workspaceId, userId } = await requireWorkspace();
  const brandId = parseObjectId((await params).id);
  const db = await getDb();

  const brand = await db.collection('brands').findOne({ _id: brandId, workspaceId });
  if (!brand) throw new HttpError(404, 'Brand not found');

  const audit = await db
    .collection('audits')
    .findOne({ brandId, workspaceId, status: 'done' }, { sort: { createdAt: -1 } });
  if (!audit) throw new HttpError(400, 'Run an audit first. The comparison builds on it.');

  const competitors = await db
    .collection('competitors')
    .find({ brandId, workspaceId, confirmed: true }, { projection: { _id: 1 } })
    .sort({ createdAt: -1 })
    .limit(MAX_COMPETITORS_PER_COMPARISON)
    .toArray();
  if (!competitors.length) throw new HttpError(400, 'Add or confirm at least one competitor first');

  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  const active = await db.collection('comparisons').findOne({
    brandId,
    workspaceId,
    status: { $in: ['queued', 'running'] },
    updatedAt: { $gt: fiveMinAgo },
  });
  if (active) {
    return NextResponse.json({ error: 'A comparison is already running', comparisonId: active._id }, { status: 409 });
  }

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const count = await db.collection('comparisons').countDocuments({ workspaceId, createdAt: { $gt: dayAgo } });
  if (count >= DAILY_LIMIT_PER_WORKSPACE) {
    throw new HttpError(429, 'Daily comparison limit reached for this workspace.');
  }

  const now = new Date();
  const { insertedId } = await db.collection('comparisons').insertOne({
    workspaceId,
    brandId,
    createdBy: userId,
    auditId: audit._id,
    competitorIds: competitors.map((c) => c._id),
    status: 'queued',
    step: 'queued',
    error: null,
    result: null,
    createdAt: now,
    updatedAt: now,
  });

  after(() => runComparison(insertedId));
  return NextResponse.json({ comparisonId: insertedId }, { status: 202 });
});
