import { listAndCreate } from '../../../_lib/crud.js';

const ALLOWED = ['badge_text', 'badge_type', 'title', 'body', 'image_url', 'video_url', 'active'];

function validate(body) {
  if (typeof body.title !== 'string' || !body.title.trim()) return 'title zorunlu';
  if (body.badge_type && !['default', 'success', 'warning'].includes(body.badge_type)) {
    return 'badge_type geçersiz';
  }
  return null;
}

const handlers = listAndCreate({ table: 'announcements', allowedFields: ALLOWED, validate });
export const onRequestGet = handlers.onRequestGet;
export const onRequestPost = handlers.onRequestPost;
