import { makeSanitizers } from '@/lib/ai/sanitize';

export const STAGES = ['awareness', 'consideration', 'conversion', 'retention'];
export const CHANNELS = [
  'website', 'seo', 'content', 'instagram', 'facebook', 'whatsapp', 'email',
  'google_ads', 'meta_ads', 'google_business_profile', 'referral', 'other',
];

export function buildFunnelPrompt(brand, audit, comparison) {
  const compBlock = comparison?.result
    ? `COMPETITOR COMPARISON (from crawled pages):\n${JSON.stringify({
        summary: comparison.result.summary,
        messagingGaps: comparison.result.messagingGaps,
        positioningDifferences: comparison.result.positioningDifferences,
      }).slice(0, 6000)}`
    : 'COMPETITOR COMPARISON: not available.';

  return `You are a growth strategist. Design an awareness-to-sales funnel for this brand using ONLY the analysis below.

BRAND: ${brand.name} (${brand.websiteUrl})
INDUSTRY: ${brand.industry || 'not provided'}
COUNTRY: ${brand.country || 'not provided'}

WEBSITE AUDIT (AI analysis of crawled pages):
${JSON.stringify(audit.result).slice(0, 9000)}

${compBlock}

STRICT RULES:
1. Ground every stage in the analysis. In "basedOn", name the audit/comparison finding the stage responds to.
2. Do NOT invent numeric targets, benchmarks, conversion rates, budgets or prices. KPIs are names of metrics to track, without target values.
3. "channels" may only use: ${CHANNELS.join(', ')}.
4. "evidenceUrls" may only contain URLs that appear in the analysis above.
5. Return exactly 4 stages in this order: ${STAGES.join(', ')}.

Return ONLY valid JSON:
{
  "overview": string,
  "stages": [ { "stage": "awareness"|"consideration"|"conversion"|"retention", "goal": string, "channels": string[], "contentIdeas": string[], "kpis": string[], "basedOn": string, "evidenceUrls": string[] } ]
}`;
}

// Always returns exactly 4 stages in order, with cleaned fields.
export function sanitizeFunnel(raw, allowedUrls) {
  const { str, strList, urls } = makeSanitizers(allowedUrls);
  const incoming = Array.isArray(raw?.stages) ? raw.stages : [];

  const stages = STAGES.map((name) => {
    const s = incoming.find((x) => x?.stage === name) || {};
    return {
      stage: name,
      goal: str(s.goal, 500),
      channels: strList(s.channels, 8, 40).filter((c) => CHANNELS.includes(c)),
      contentIdeas: strList(s.contentIdeas, 8, 300),
      kpis: strList(s.kpis, 8, 120),
      basedOn: str(s.basedOn, 400),
      evidenceUrls: urls(s.evidenceUrls),
    };
  });

  return { overview: str(raw?.overview, 1500), stages };
}
