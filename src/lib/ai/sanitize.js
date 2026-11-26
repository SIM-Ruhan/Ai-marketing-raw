// Shared helpers for cleaning model output. Never trust the model's shapes or URLs.
export function makeSanitizers(allowedUrls) {
  const allowed = new Set(allowedUrls);
  return {
    allowed,
    str: (v, max = 800) => (typeof v === 'string' ? v.trim().slice(0, max) : ''),
    strList: (v, n = 10, max = 300) =>
      Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? x.trim().slice(0, max) : '')).filter(Boolean).slice(0, n) : [],
    // Keep only URLs that were actually crawled.
    urls: (v) => (Array.isArray(v) ? v.filter((u) => allowed.has(u)).slice(0, 5) : []),
    list: (v, n = 8) => (Array.isArray(v) ? v.slice(0, n) : []),
    pick: (v, options, fallback) => (options.includes(v) ? v : fallback),
  };
}
