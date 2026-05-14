// Tüm API çağrıları için merkezi yardımcı. Cookie tabanlı auth kullanır.

const HEADERS = { 'Content-Type': 'application/json' };

async function request(method, url, body) {
  const res = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: body !== undefined ? HEADERS : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const message = data?.error || `İstek başarısız (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  get:    (url)        => request('GET', url),
  post:   (url, body)  => request('POST', url, body ?? {}),
  put:    (url, body)  => request('PUT', url, body ?? {}),
  delete: (url)        => request('DELETE', url)
};

// URL'in ilk path segmentinden okul slug'ını al.
// "/sanliurfa-bilsem" → "sanliurfa-bilsem"
// "/sanliurfa-bilsem/admin" → "sanliurfa-bilsem"
export function getSlugFromPath() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  return segments[0] || null;
}
