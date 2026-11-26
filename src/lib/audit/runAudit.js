// import { GoogleGenerativeAI } from '@google/generative-ai';
// import { getDb } from '@/lib/db';
// import { crawlSite, CrawlError } from '@/lib/crawler';
// import { buildAuditPrompt, sanitizeAuditResult } from '@/lib/audit/prompt';

// const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

// async function update(db, auditId, patch) {
//   await db.collection('audits').updateOne({ _id: auditId }, { $set: { ...patch, updatedAt: new Date() } });
// }

// // Runs in the background (see the POST route). Every outcome is written to the database.
// export async function runAudit(auditId) {
//   const db = await getDb();
//   const audit = await db.collection('audits').findOne({ _id: auditId });
//   if (!audit) return;

//   try {
//     const brand = await db.collection('brands').findOne({ _id: audit.brandId, workspaceId: audit.workspaceId });
//     if (!brand) throw new Error('Brand no longer exists');

//     await update(db, auditId, { status: 'running', step: 'crawling' });
//     const pages = await crawlSite(brand.websiteUrl);
//     const okPages = pages.filter((p) => p.ok);

//     await db.collection('crawls').insertOne({
//       auditId,
//       brandId: audit.brandId,
//       workspaceId: audit.workspaceId,
//       fetchedAt: new Date(),
//       pages,
//     });

//     await update(db, auditId, { step: 'analyzing' });
//     const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
//     const model = genAI.getGenerativeModel({
//       model: MODEL,
//       generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
//     });
//     const response = await model.generateContent(buildAuditPrompt(brand, okPages));

//     let parsed;
//     try {
//       parsed = JSON.parse(response.response.text());
//     } catch {
//       throw new Error('The AI returned an unreadable answer. Please run the audit again.');
//     }

//     const result = sanitizeAuditResult(parsed, okPages.map((p) => p.url));
//     await update(db, auditId, {
//       status: 'done',
//       step: 'finished',
//       result,
//       meta: {
//         model: MODEL,
//         pagesCrawled: okPages.length,
//         pagesFailed: pages.length - okPages.length,
//         crawledUrls: okPages.map((p) => p.url),
//         crawledAt: new Date(),
//       },
//     });
//   } catch (err) {
//     console.error('Audit failed:', auditId.toString(), err);
//     const message =
//       err instanceof CrawlError || /unreadable answer|no longer exists/.test(err.message)
//         ? err.message
//         : 'The audit failed. Please try again in a minute.';
//     await update(db, auditId, { status: 'failed', error: message });
//   }
// }


import { getDb } from '@/lib/db';
import { crawlSite, CrawlError } from '@/lib/crawler';
import { generateJson, UserFacingError, AI_MODEL } from '@/lib/ai/provider';
import { buildAuditPrompt, sanitizeAuditResult } from '@/lib/audit/prompt';

async function update(db, auditId, patch) {
  await db.collection('audits').updateOne({ _id: auditId }, { $set: { ...patch, updatedAt: new Date() } });
}

// Runs in the background (see the POST route). Every outcome is written to the database.
export async function runAudit(auditId) {
  const db = await getDb();
  const audit = await db.collection('audits').findOne({ _id: auditId });
  if (!audit) return;

  try {
    const brand = await db.collection('brands').findOne({ _id: audit.brandId, workspaceId: audit.workspaceId });
    if (!brand) throw new UserFacingError('Brand no longer exists');

    await update(db, auditId, { status: 'running', step: 'crawling' });
    const pages = await crawlSite(brand.websiteUrl);
    const okPages = pages.filter((p) => p.ok);

    await db.collection('crawls').insertOne({
      auditId,
      brandId: audit.brandId,
      workspaceId: audit.workspaceId,
      fetchedAt: new Date(),
      pages,
    });

    await update(db, auditId, { step: 'analyzing' });
    const raw = await generateJson(buildAuditPrompt(brand, okPages));
    const result = sanitizeAuditResult(raw, okPages.map((p) => p.url));

    await update(db, auditId, {
      status: 'done',
      step: 'finished',
      result,
      meta: {
        model: AI_MODEL,
        pagesCrawled: okPages.length,
        pagesFailed: pages.length - okPages.length,
        crawledUrls: okPages.map((p) => p.url),
        crawledAt: new Date(),
      },
    });
  } catch (err) {
    console.error('Audit failed:', auditId.toString(), err);
    const message =
      err instanceof CrawlError || err instanceof UserFacingError
        ? err.message
        : 'The audit failed. Please try again in a minute.';
    await update(db, auditId, { status: 'failed', error: message });
  }
}
