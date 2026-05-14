import { getSession } from '../../_lib/auth.js';
import { json } from '../../_lib/http.js';

export const onRequestGet = async ({ request, env }) => {
  const session = await getSession(request, env);
  if (!session) return json({ authenticated: false });
  return json({ authenticated: true, slug: session.slug, sid: session.sid });
};
