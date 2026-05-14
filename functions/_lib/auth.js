// Auth utilities — PBKDF2 password hashing + HMAC-signed session cookies.
// Workers / Pages Functions çalışma ortamında Web Crypto API'si yerleşik gelir.

const COOKIE_NAME = 'okul_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 gün
const PBKDF2_ITERATIONS = 100_000;

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64uEncode(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64uDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// --- Password hashing (PBKDF2-SHA256) ---

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key, 256
  );
  return `pbkdf2$${PBKDF2_ITERATIONS}$${b64uEncode(salt)}$${b64uEncode(new Uint8Array(bits))}`;
}

export async function verifyPassword(password, stored) {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = parseInt(parts[1], 10);
  const salt = b64uDecode(parts[2]);
  const expected = b64uDecode(parts[3]);
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    key, expected.length * 8
  ));
  if (bits.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < bits.length; i++) diff |= bits[i] ^ expected[i];
  return diff === 0;
}

// --- Signed session token (compact JWT-like: payload.signature) ---

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
  );
}

export async function signSession(payload, secret) {
  const body = b64uEncode(enc.encode(JSON.stringify(payload)));
  const key = await hmacKey(secret);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(body)));
  return `${body}.${b64uEncode(sig)}`;
}

export async function verifySession(token, secret) {
  if (!token || typeof token !== 'string') return null;
  const idx = token.indexOf('.');
  if (idx < 0) return null;
  const body = token.slice(0, idx);
  const sigStr = token.slice(idx + 1);
  const key = await hmacKey(secret);
  const ok = await crypto.subtle.verify(
    'HMAC', key, b64uDecode(sigStr), enc.encode(body)
  );
  if (!ok) return null;
  let payload;
  try {
    payload = JSON.parse(dec.decode(b64uDecode(body)));
  } catch { return null; }
  if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return payload;
}

// --- Cookie helpers ---

export function buildSessionCookie(token, { secure = true } = {}) {
  const flags = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${SESSION_TTL_SECONDS}`
  ];
  if (secure) flags.push('Secure');
  return flags.join('; ');
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}

export function readSessionCookie(request) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === COOKIE_NAME) return rest.join('=');
  }
  return null;
}

export async function getSession(request, env) {
  const token = readSessionCookie(request);
  if (!token) return null;
  return verifySession(token, env.JWT_SECRET);
}

export { SESSION_TTL_SECONDS };
