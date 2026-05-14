import { getSession, verifyPassword } from '../../_lib/auth.js';
import { json, error, readBody } from '../../_lib/http.js';

export const onRequestPost = async ({ request, env }) => {
  const session = await getSession(request, env);
  if (!session) return error(401, 'Oturum yok');

  const body = await readBody(request);
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!password) return error(400, 'Parola gerekli');

  const row = await env.DB.prepare(
    'SELECT password_hash FROM schools WHERE id = ?'
  ).bind(session.sid).first();
  if (!row) return error(404, 'Hesap bulunamadı');

  const ok = await verifyPassword(password, row.password_hash);
  if (!ok) return error(401, 'Parola yanlış');

  return json({ ok: true });
};
