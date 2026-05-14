import { updateAndDelete } from '../../../../_lib/crud.js';

const ALLOWED = ['text', 'active'];

function validate(body) {
  if (typeof body.text !== 'string' || !body.text.trim()) return 'text zorunlu';
  return null;
}

const handlers = updateAndDelete({ table: 'ticker_items', allowedFields: ALLOWED, validate });
export const onRequestPut = handlers.onRequestPut;
export const onRequestDelete = handlers.onRequestDelete;
