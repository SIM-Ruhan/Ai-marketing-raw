import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { route } from '@/lib/http';
import { requireWorkspace } from '@/lib/guard';

// Real counts from your database for the current workspace. Nothing here is estimated.
export const GET = route(async () => {
  const { workspaceId } = await requireWorkspace();
  const db = await getDb();

  const [brands, auditsDone, competitors, comparisonsDone, funnels, recentBrands] = await Promise.all([
    db.collection('brands').countDocuments({ workspaceId }),
    db.collection('audits').countDocuments({ workspaceId, status: 'done' }),
    db.collection('competitors').countDocuments({ workspaceId, confirmed: true }),
    db.collection('comparisons').countDocuments({ workspaceId, status: 'done' }),
    db.collection('funnels').countDocuments({ workspaceId }),
    db
      .collection('brands')
      .find({ workspaceId }, { projection: { name: 1, websiteUrl: 1 } })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray(),
  ]);

  return NextResponse.json({
    counts: { brands, auditsDone, competitors, comparisonsDone, funnels },
    recentBrands,
  });
});
