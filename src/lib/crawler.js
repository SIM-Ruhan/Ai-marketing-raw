import * as cheerio from 'cheerio';
import { safeFetchText } from '@/lib/safeFetch';

const PRIORITY_WORDS = [
  'pricing', 'price', 'plans', 'about', 'product', 'products', 'services',
  'shop', 'collections', 'features', 'solutions', 'contact', 'faq',
];
const SKIP_EXT = /\.(pdf|jpe?g|png|gif|webp|svg|zip|mp4|mp3|css|js|xml)$/i;

export class CrawlError extends Error {}

export function extractPage(html, pageUrl) {
  const $ = cheerio.load(html);

  const jsonLd = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      jsonLd.push(JSON.parse($(el).text()));
    } catch {
      /* ignore invalid JSON-LD */
    }
  });

  const title = $('title').first().text().replace(/\s+/g, ' ').trim();
  const description = ($('meta[name="description"]').attr('content') || '').trim();

  const headings = [];
  $('h1, h2, h3').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text && headings.length < 40) headings.push({ level: el.tagName, text });
  });

  // Collect same-site links BEFORE stripping nav/footer.
  const origin = new URL(pageUrl).origin;
  const links = new Set();
  $('a[href]').each((_, el) => {
    try {
      const u = new URL($(el).attr('href'), pageUrl);
      u.hash = '';
      u.search = '';
      if (u.origin === origin && !SKIP_EXT.test(u.pathname)) links.add(u.toString());
    } catch {
      /* ignore bad hrefs */
    }
  });

  $('script, style, noscript, svg, iframe, nav, footer').remove();
  const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 6000);

  return {
    title,
    description,
    headings,
    text,
    jsonLd: JSON.stringify(jsonLd).slice(0, 3000),
    links: [...links],
  };
}

function scoreLink(link) {
  const path = new URL(link).pathname.toLowerCase();
  const hit = PRIORITY_WORDS.some((w) => path.includes(w));
  return (hit ? 0 : 1000) + path.length; // lower is better
}

// Crawls the homepage + the most useful internal pages. Homepage failure = CrawlError.
export async function crawlSite(startUrl, { maxPages = 5 } = {}) {
  const pages = [];

  let home;
  try {
    const { finalUrl, html } = await safeFetchText(startUrl);
    home = { url: finalUrl, ok: true, ...extractPage(html, finalUrl) };
  } catch (err) {
    throw new CrawlError(`Could not read ${startUrl}: ${err.message}`);
  }
  pages.push(home);

  const candidates = home.links
    .filter((l) => l !== home.url && l !== home.url.replace(/\/$/, ''))
    .sort((a, b) => scoreLink(a) - scoreLink(b))
    .slice(0, maxPages - 1);

  for (const link of candidates) {
    try {
      const { finalUrl, html } = await safeFetchText(link);
      pages.push({ url: finalUrl, ok: true, ...extractPage(html, finalUrl) });
    } catch (err) {
      pages.push({ url: link, ok: false, error: err.message });
    }
  }

  // Links are only needed during crawling.
  return pages.map(({ links, ...rest }) => rest);
}
