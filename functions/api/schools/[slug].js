import { json, error, readBody } from '../../_lib/http.js';
import { findSchoolBySlug, requireSchoolAuth } from '../../_lib/school.js';

export const onRequestGet = async ({ env, params }) => {
  const school = await findSchoolBySlug(env, params.slug);
  if (!school) return error(404, 'Okul bulunamadı');

  const [announcements, duty, ticker] = await Promise.all([
    env.DB.prepare(
      `SELECT id, badge_text, badge_type, title, body, image_url, video_url, sort_order
       FROM announcements
       WHERE school_id = ? AND active = 1
       ORDER BY sort_order, id`
    ).bind(school.id).all(),
    env.DB.prepare(
      `SELECT id, zone, teacher_name, day_of_week, sort_order
       FROM duty_teachers
       WHERE school_id = ?
       ORDER BY sort_order, id`
    ).bind(school.id).all(),
    env.DB.prepare(
      `SELECT id, text, sort_order
       FROM ticker_items
       WHERE school_id = ? AND active = 1
       ORDER BY sort_order, id`
    ).bind(school.id).all()
  ]);

  return json({
    school,
    announcements: announcements.results ?? [],
    duty: duty.results ?? [],
    ticker: ticker.results ?? []
  });
};

export const onRequestPut = async (context) => {
  const { school, response } = await requireSchoolAuth(context, context.params.slug);
  if (response) return response;
  const body = await readBody(context.request);
  if (!body) return error(400, 'Geçersiz JSON');

  const name = typeof body.name === 'string' ? body.name.trim() : null;
  const motto = typeof body.motto === 'string' ? body.motto.trim() : null;
  const city = typeof body.city === 'string' ? body.city.trim() : null;
  const logoUrl = typeof body.logo_url === 'string' ? body.logo_url.trim() : null;
  if (!name) return error(400, 'name zorunlu');

  await context.env.DB.prepare(
    'UPDATE schools SET name = ?, motto = ?, city = ?, logo_url = ? WHERE id = ?'
  ).bind(name, motto, city, logoUrl || null, school.id).run();

  return json({ ok: true });
};
