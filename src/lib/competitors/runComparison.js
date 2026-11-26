import { getDb } from '@/lib/db';
import { crawlSite, CrawlError } from '@/lib/crawler';
import { generateJson, UserFacingError, AI_MODEL } from '@/lib/ai/gemini';
import { buildComparisonPrompt, sanitizeComparison } from '@/lib/competitors/prompt';

const FRESH_MS = 24 * 60 * 60 * 1000;

async function update(db, id, patch) {
  await db.collection('comparisons').updateOne({ _id: id }, { $set: { ...patch, updatedAt: new Date() } });
}

// Crawl a competitor unless we already have a crawl from the last 24h.
async function ensureCrawl(db, competitor) {
  const c = competitor.crawl;
  if (c?.fetchedAt && Date.now() - new Date(c.fetchedAt).getTime() < FRESH_MS) return c;
  let crawl;
  try {
    const pages = await crawlSite(competitor.websiteUrl, { maxPages: 3 });
    crawl = { fetchedAt: new Date(), pages, error: null };
  } catch (err) {
    crawl = { fetchedAt: new Date(), pages: [], error: err.message };
  }
  await db
    .collection('competitors')
    .updateOne({ _id: competitor._id, workspaceId: competitor.workspaceId }, { $set: { crawl } });
  return crawl;
}

export async function runComparison(comparisonId) {
  const db = await getDb();
  const cmp = await db.collection('comparisons').findOne({ _id: comparisonId });
  if (!cmp) return;

  try {
    await update(db, comparisonId, { status: 'running', step: 'crawling' });

    const brand = await db.collection('brands').findOne({ _id: cmp.brandId, workspaceId: cmp.workspaceId });
    if (!brand) throw new UserFacingError('Brand no longer exists');

    const brandCrawl = await db.collection('crawls').findOne({ auditId: cmp.auditId, workspaceId: cmp.workspaceId });
    const brandPages = (brandCrawl?.pages || []).filter((p) => p.ok);
    if (!brandPages.length) throw new UserFacingError('The audit has no readable pages. Run a new audit first.');

    // Only competitors the user confirmed are ever crawled.
    const competitors = await db
      .collection('competitors')
      .find({ _id: { $in: cmp.competitorIds }, workspaceId: cmp.workspaceId, brandId: cmp.brandId, confirmed: true })
      .toArray();
    if (!competitors.length) throw new UserFacingError('No confirmed competitors to compare.');

    const prepared = await Promise.all(
      competitors.map(async (c) => {
        const crawl = await ensureCrawl(db, c);
        return { name: c.name, websiteUrl: c.websiteUrl, pages: crawl.pages.filter((p) => p.ok), error: crawl.error };
      })
    );
    const usable = prepared.filter((c) => c.pages.length > 0);
    if (!usable.length) {
      throw new UserFacingError(
        'None of the competitor websites could be read. ' + (prepared[0]?.error ? `Example: ${prepared[0].error}` : '')
      );
    }

    await update(db, comparisonId, { step: 'analyzing' });
    const raw = await generateJson(buildComparisonPrompt(brand, brandPages, usable));

    const allPages = [...brandPages, ...usable.flatMap((c) => c.pages)];
    const pageTextByUrl = {};
    for (const p of allPages) {
      pageTextByUrl[p.url] = [p.title, p.description, p.headings.map((h) => h.text).join(' '), p.text].join(' ');
    }
    const crawledUrls = allPages.map((p) => p.url);
    const result = sanitizeComparison(raw, crawledUrls, pageTextByUrl);

    await update(db, comparisonId, {
      status: 'done',
      step: 'finished',
      result,
      meta: {
        model: AI_MODEL,
        comparedAt: new Date(),
        crawledUrls,
        competitorsCompared: usable.map((c) => ({ name: c.name, websiteUrl: c.websiteUrl })),
        competitorsFailed: prepared
          .filter((c) => !c.pages.length)
          .map((c) => ({ name: c.name, websiteUrl: c.websiteUrl, reason: c.error || 'No readable pages' })),
      },
    });
  } catch (err) {
    console.error('Comparison failed:', comparisonId.toString(), err);
    const message =
      err instanceof UserFacingError || err instanceof CrawlError
        ? err.message
        : 'The comparison failed. Please try again in a minute.';
    await update(db, comparisonId, { status: 'failed', error: message });
  }
}
