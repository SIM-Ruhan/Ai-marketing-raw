export async function apiFetch(url, options) {
  let res;
  try {
    res = await fetch(url, options);
  } catch {
    return { ok: false, status: 0, data: null, error: 'Network error. Is the dev server running?' };
  }
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* not JSON */
  }
  if (!res.ok || data === null) {
    const error = data?.error || (res.ok ? 'Unexpected response from the server' : `Request to ${url} failed (HTTP ${res.status})`);
    return { ok: false, status: res.status, data, error };
  }
  return { ok: true, status: res.status, data, error: null };
}
