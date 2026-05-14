import { json, error, readBody } from './http.js';
import { requireSchoolAuth } from './school.js';

// Basit CRUD generator. Her kaynak için izin verilen alanlar ve doğrulama
// fonksiyonu tanımlanır; geriye onRequestGet/Post veya onRequestPut/Delete döner.
export function listAndCreate({ table, allowedFields, validate }) {
  return {
    onRequestGet: async (context) => {
      const { school, response } = await requireSchoolAuth(context, context.params.slug);
      if (response) return response;
      const cols = ['id', ...allowedFields, 'sort_order'].join(', ');
      const rows = await context.env.DB.prepare(
        `SELECT ${cols} FROM ${table} WHERE school_id = ? ORDER BY sort_order, id`
      ).bind(school.id).all();
      return json(rows.results ?? []);
    },

    onRequestPost: async (context) => {
      const { school, response } = await requireSchoolAuth(context, context.params.slug);
      if (response) return response;
      const body = await readBody(context.request);
      if (!body) return error(400, 'Geçersiz JSON');
      const err = validate(body);
      if (err) return error(400, err);

      const sortOrder = Number.isFinite(body.sort_order) ? body.sort_order : 0;
      const cols = ['school_id', ...allowedFields, 'sort_order'];
      const placeholders = cols.map(() => '?').join(', ');
      const values = [school.id, ...allowedFields.map(f => body[f] ?? null), sortOrder];

      const result = await context.env.DB.prepare(
        `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`
      ).bind(...values).run();

      return json({ id: result.meta?.last_row_id ?? null }, { status: 201 });
    }
  };
}

export function updateAndDelete({ table, allowedFields, validate }) {
  return {
    onRequestPut: async (context) => {
      const { school, response } = await requireSchoolAuth(context, context.params.slug);
      if (response) return response;
      const id = parseInt(context.params.id, 10);
      if (!Number.isFinite(id)) return error(400, 'Geçersiz id');
      const body = await readBody(context.request);
      if (!body) return error(400, 'Geçersiz JSON');
      const err = validate(body);
      if (err) return error(400, err);

      const sets = [...allowedFields, 'sort_order'].map(f => `${f} = ?`).join(', ');
      const sortOrder = Number.isFinite(body.sort_order) ? body.sort_order : 0;
      const values = [...allowedFields.map(f => body[f] ?? null), sortOrder, id, school.id];

      const result = await context.env.DB.prepare(
        `UPDATE ${table} SET ${sets} WHERE id = ? AND school_id = ?`
      ).bind(...values).run();

      if ((result.meta?.changes ?? 0) === 0) return error(404, 'Kayıt bulunamadı');
      return json({ ok: true });
    },

    onRequestDelete: async (context) => {
      const { school, response } = await requireSchoolAuth(context, context.params.slug);
      if (response) return response;
      const id = parseInt(context.params.id, 10);
      if (!Number.isFinite(id)) return error(400, 'Geçersiz id');
      const result = await context.env.DB.prepare(
        `DELETE FROM ${table} WHERE id = ? AND school_id = ?`
      ).bind(id, school.id).run();
      if ((result.meta?.changes ?? 0) === 0) return error(404, 'Kayıt bulunamadı');
      return json({ ok: true });
    }
  };
}
