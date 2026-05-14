// Toplu nöbetçi yerleştirme — mevcut tüm kayıtları siler, gelen listeyi yazar.
// Body: { entries: [{ zone, teacher_name, day_of_week }, ...] }
// day_of_week: 1-5 (Pzt-Cuma). 6=Cmt, 7=Pzr (kullanılmıyor ama izinli).

import { json, error, readBody } from '../../../_lib/http.js';
import { requireSchoolAuth } from '../../../_lib/school.js';

export const onRequestPost = async (context) => {
  const { school, response } = await requireSchoolAuth(context, context.params.slug);
  if (response) return response;

  const body = await readBody(context.request);
  if (!body || !Array.isArray(body.entries)) {
    return error(400, 'entries dizisi gerekli');
  }

  // Doğrula
  const clean = [];
  for (let i = 0; i < body.entries.length; i++) {
    const e = body.entries[i];
    if (!e || typeof e.zone !== 'string' || !e.zone.trim()) {
      return error(400, `Satır ${i + 1}: bölge boş olamaz`);
    }
    if (typeof e.teacher_name !== 'string' || !e.teacher_name.trim()) {
      // Boş öğretmen hücreleri sessizce atlanır (Excel'de boş hücre olabilir)
      continue;
    }
    let day = null;
    if (e.day_of_week != null) {
      const d = Number(e.day_of_week);
      if (!Number.isInteger(d) || d < 1 || d > 7) {
        return error(400, `Satır ${i + 1}: day_of_week 1-7 arası olmalı`);
      }
      day = d;
    }
    clean.push({
      zone: e.zone.trim(),
      teacher_name: e.teacher_name.trim(),
      day_of_week: day,
      sort_order: clean.length
    });
  }

  const { DB } = context.env;
  await DB.prepare('DELETE FROM duty_teachers WHERE school_id = ?').bind(school.id).run();
  if (clean.length > 0) {
    const stmts = clean.map(c => DB.prepare(
      `INSERT INTO duty_teachers (school_id, zone, teacher_name, day_of_week, sort_order)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(school.id, c.zone, c.teacher_name, c.day_of_week, c.sort_order));
    await DB.batch(stmts);
  }

  return json({ ok: true, count: clean.length });
};
