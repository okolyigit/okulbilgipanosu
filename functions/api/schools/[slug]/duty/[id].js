import { updateAndDelete } from '../../../../_lib/crud.js';

const ALLOWED = ['zone', 'teacher_name', 'day_of_week'];

function validate(body) {
  if (typeof body.zone !== 'string' || !body.zone.trim()) return 'zone zorunlu';
  if (typeof body.teacher_name !== 'string' || !body.teacher_name.trim()) return 'teacher_name zorunlu';
  if (body.day_of_week != null) {
    const d = Number(body.day_of_week);
    if (!Number.isInteger(d) || d < 1 || d > 7) return 'day_of_week 1-7 arası olmalı';
  }
  return null;
}

const handlers = updateAndDelete({ table: 'duty_teachers', allowedFields: ALLOWED, validate });
export const onRequestPut = handlers.onRequestPut;
export const onRequestDelete = handlers.onRequestDelete;
