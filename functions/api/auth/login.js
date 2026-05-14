import { verifyPassword, signSession, buildSessionCookie, SESSION_TTL_SECONDS } from '../../_lib/auth.js';
import { json, error, readBody, isSecureRequest } from '../../_lib/http.js';

export const onRequestPost = async ({ request, env }) => {
  const body = await readBody(request);
  if (!body || typeof body.email !== 'string' || typeof body.password !== 'string') {
    return error(400, 'email ve password gerekli');
  }

  const school = await env.DB.prepare(
    'SELECT id, slug, password_hash FROM schools WHERE email = ?'
  ).bind(body.email.trim().toLowerCase()).first();

  // Constant-ish time: bulamasak da hash karşılaştır
  const stored = school?.password_hash || 'pbkdf2$100000$AAAA$AAAA';
  const ok = await verifyPassword(body.password, stored);

  if (!school || !ok) {
    return error(401, 'E-posta veya parola hatalı');
  }

  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const token = await signSession({ sid: school.id, slug: school.slug, exp }, env.JWT_SECRET);
  const cookie = buildSessionCookie(token, { secure: isSecureRequest(request) });
  return json({ slug: school.slug }, { headers: { 'Set-Cookie': cookie } });
};
