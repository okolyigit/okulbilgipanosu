import { getSession } from './auth.js';
import { error } from './http.js';

export async function findSchoolBySlug(env, slug) {
  if (!slug) return null;
  return env.DB.prepare(
    'SELECT id, slug, name, motto, city, logo_url FROM schools WHERE slug = ?'
  ).bind(slug).first();
}

// Yazma endpoint'leri için yetki kontrolü.
// Dönen değer null değilse hata yanıtıdır; null ise yetki OK.
export async function requireSchoolAuth(context, slug) {
  const { request, env } = context;
  const session = await getSession(request, env);
  if (!session) return { school: null, response: error(401, 'Giriş yapılmamış') };
  const school = await findSchoolBySlug(env, slug);
  if (!school) return { school: null, response: error(404, 'Okul bulunamadı') };
  if (session.sid !== school.id) {
    return { school: null, response: error(403, 'Bu okula erişim yetkiniz yok') };
  }
  return { school, response: null };
}
