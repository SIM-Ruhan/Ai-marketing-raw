import { HttpError } from '@/lib/http';

function cleanString(v, max) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function normalizeUrl(raw) {
  let value = cleanString(raw, 2048);
  if (!value) return '';
  if (!/^https?:\/\//i.test(value)) value = 'https://' + value;
  try {
    const u = new URL(value);
    if (!['http:', 'https:'].includes(u.protocol)) return '';
    return u.toString();
  } catch {
    return '';
  }
}

// partial=true is used by PATCH: only validate fields that were sent.
export function validateBrandInput(body, { partial = false } = {}) {
  const out = {};

  if (!partial || body.name !== undefined) {
    const name = cleanString(body.name, 100);
    if (!name) throw new HttpError(400, 'Brand name is required');
    out.name = name;
  }

  if (!partial || body.websiteUrl !== undefined) {
    const url = normalizeUrl(body.websiteUrl);
    if (!url) throw new HttpError(400, 'Enter a valid website URL, e.g. https://example.com');
    out.websiteUrl = url;
  }

  if (body.industry !== undefined) out.industry = cleanString(body.industry, 100);
  if (body.country !== undefined) out.country = cleanString(body.country, 100);

  if (body.socialUrls !== undefined) {
    if (!Array.isArray(body.socialUrls)) throw new HttpError(400, 'socialUrls must be a list');
    out.socialUrls = body.socialUrls.slice(0, 5).map(normalizeUrl).filter(Boolean);
  }

  return out;
}
