import { listAndCreate } from '../../../_lib/crud.js';

const ALLOWED = ['text', 'active'];

function validate(body) {
  if (typeof body.text !== 'string' || !body.text.trim()) return 'text zorunlu';
  return null;
}

const handlers = listAndCreate({ table: 'ticker_items', allowedFields: ALLOWED, validate });
export const onRequestGet = handlers.onRequestGet;
export const onRequestPost = handlers.onRequestPost;
