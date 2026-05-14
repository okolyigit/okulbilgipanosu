import { hashPassword, signSession, buildSessionCookie, SESSION_TTL_SECONDS } from '../../_lib/auth.js';
import { json, error, readBody, isSecureRequest } from '../../_lib/http.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/;

export const onRequestPost = async ({ request, env }) => {
  const body = await readBody(request);
  if (!body) return error(400, 'Geçersiz istek');

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const name = typeof body.school_name === 'string' ? body.school_name.trim() : '';
  const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : '';

  if (!EMAIL_RE.test(email)) return error(400, 'Geçerli bir e-posta girin');
  if (password.length < 8) return error(400, 'Parola en az 8 karakter olmalı');
  if (name.length < 2) return error(400, 'Okul adı en az 2 karakter olmalı');
  if (!SLUG_RE.test(slug)) {
    return error(400, 'Kısa ad sadece küçük harf, rakam ve - içerebilir (örn. sanliurfa-bilsem)');
  }

  // Çakışma kontrolü
  const existing = await env.DB.prepare(
    'SELECT id FROM schools WHERE email = ? OR slug = ? LIMIT 1'
  ).bind(email, slug).first();
  if (existing) {
    return error(409, 'Bu e-posta veya kısa ad zaten kullanılıyor');
  }

  const passwordHash = await hashPassword(password);
  const result = await env.DB.prepare(
    `INSERT INTO schools (slug, name, email, password_hash) VALUES (?, ?, ?, ?)`
  ).bind(slug, name, email, passwordHash).run();

  const schoolId = result.meta?.last_row_id;
  if (!schoolId) return error(500, 'Hesap oluşturulamadı');

  // Otomatik giriş yap
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const token = await signSession({ sid: schoolId, slug, exp }, env.JWT_SECRET);
  const cookie = buildSessionCookie(token, { secure: isSecureRequest(request) });
  return json({ slug }, { headers: { 'Set-Cookie': cookie }, status: 201 });
};
