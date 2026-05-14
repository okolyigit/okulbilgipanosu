import { updateAndDelete } from '../../../../_lib/crud.js';

const ALLOWED = ['badge_text', 'badge_type', 'title', 'body', 'image_url', 'video_url', 'active'];

function validate(body) {
  if (typeof body.title !== 'string' || !body.title.trim()) return 'title zorunlu';
  if (body.badge_type && !['default', 'success', 'warning'].includes(body.badge_type)) {
    return 'badge_type geçersiz';
  }
  return null;
}

const handlers = updateAndDelete({ table: 'announcements', allowedFields: ALLOWED, validate });
export const onRequestPut = handlers.onRequestPut;
export const onRequestDelete = handlers.onRequestDelete;
