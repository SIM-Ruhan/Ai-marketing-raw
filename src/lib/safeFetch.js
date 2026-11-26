import dns from 'node:dns/promises';
import net from 'node:net';
import { HttpError } from '@/lib/http';

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB per page
const TIMEOUT_MS = 30_000;
const MAX_REDIRECTS = 4;

export class UnsafeUrlError extends HttpError {
  constructor(message) {
    super(400, message);
  }
}

function isPrivateIPv4(ip) {
  const [a, b] = ip.split('.').map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
    (a === 169 && b === 254) || // link-local + cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224 // multicast / reserved
  );
}

function isPrivateIPv6(ip) {
  const v = ip.toLowerCase();
  if (v === '::1' || v === '::') return true;
  if (v.startsWith('fc') || v.startsWith('fd')) return true; // unique local
  if (/^fe[89ab]/.test(v)) return true; // link-local
  if (v.startsWith('::ffff:')) {
    const mapped = v.slice(7);
    return net.isIPv4(mapped) ? isPrivateIPv4(mapped) : true;
  }
  return false;
}

function isPrivateIp(ip) {
  return net.isIPv4(ip) ? isPrivateIPv4(ip) : isPrivateIPv6(ip);
}

// Throws UnsafeUrlError unless the URL is http(s) and resolves only to public IPs.
export async function assertPublicUrl(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeUrlError('Invalid URL');
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new UnsafeUrlError('Only http and https URLs are allowed');
  }
  if (url.username || url.password) {
    throw new UnsafeUrlError('URLs with credentials are not allowed');
  }

  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    throw new UnsafeUrlError('This address is not publicly reachable');
  }

  let addrs;
  if (net.isIP(host)) {
    addrs = [{ address: host }];
  } else {
    try {
      addrs = await dns.lookup(host, { all: true });
    } catch {
      throw new UnsafeUrlError('Could not resolve this domain');
    }
  }
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) {
    throw new UnsafeUrlError('This address is not publicly reachable');
  }
  return url;
}

async function readLimited(res, maxBytes) {
  const reader = res.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    chunks.push(value);
    if (total >= maxBytes) {
      await reader.cancel();
      break; // truncate instead of failing
    }
  }
  return new TextDecoder('utf-8').decode(Buffer.concat(chunks));
}

// Fetch an HTML page safely: validates every hop of a redirect chain, times out, caps size.
export async function safeFetchText(rawUrl, { maxBytes = MAX_BYTES } = {}) {
  let current = rawUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = await assertPublicUrl(current);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        redirect: 'manual',
        signal: ctrl.signal,
        headers: {
          'User-Agent': 'MarketingOSBot/1.0 (website audit)',
          Accept: 'text/html,application/xhtml+xml',
        },
      });

      const location = res.headers.get('location');
      if (res.status >= 300 && res.status < 400 && location) {
        await res.body?.cancel();
        current = new URL(location, url).toString();
        continue;
      }
      if (!res.ok) throw new Error(`The site responded with HTTP ${res.status}`);

      const type = res.headers.get('content-type') || '';
      if (!type.includes('text/html') && !type.includes('xhtml')) {
        throw new Error('The URL did not return an HTML page');
      }

      const html = await readLimited(res, maxBytes);
      return { finalUrl: url.toString(), html };
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('The site took too long to respond');
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error('Too many redirects');
}
