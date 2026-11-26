export function normalizeUrl(raw) {
  let value = typeof raw === 'string' ? raw.trim().slice(0, 2048) : '';
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

// "https://www.Example.com/x" -> "example.com" (used to detect duplicates)
export function hostKey(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}
