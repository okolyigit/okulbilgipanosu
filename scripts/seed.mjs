// Yeni okul ekleme yardımcısı.
// Kullanım: node scripts/seed.mjs <slug> "Okul Adı" <parola> [--remote]
//
// Local D1 için bu script SQL dosyası üretir ve wrangler ile çalıştırır.
// Parolayı PBKDF2 ile hashler (functions/_lib/auth.js ile aynı format).
//
// Wrangler kurulu olmalı ve `wrangler login` yapılmış olmalı (--remote için).

import { spawnSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';

const args = process.argv.slice(2);
const remote = args.includes('--remote');
const positional = args.filter(a => !a.startsWith('--'));
if (positional.length < 3) {
  console.error('Kullanım: node scripts/seed.mjs <slug> "Okul Adı" <parola> [--remote]');
  process.exit(1);
}
const [slug, name, password] = positional;

const enc = new TextEncoder();

function b64u(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return Buffer.from(s, 'binary').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hash(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256
  ));
  return `pbkdf2$100000$${b64u(salt)}$${b64u(bits)}`;
}

const passwordHash = await hash(password);
const escaped = (s) => s.replace(/'/g, "''");
const sql = `INSERT INTO schools (slug, name, password_hash) VALUES ('${escaped(slug)}', '${escaped(name)}', '${passwordHash}');`;

const tmp = `.seed-${Date.now()}.sql`;
writeFileSync(tmp, sql);

try {
  const env = remote ? '--remote' : '--local';
  const result = spawnSync('npx', ['wrangler', 'd1', 'execute', 'okul-panosu', env, `--file=${tmp}`], {
    stdio: 'inherit', shell: true
  });
  if (result.status !== 0) process.exit(result.status || 1);
  console.log(`\nOkul eklendi: ${slug}`);
  console.log(`Pano:  /${slug}`);
  console.log(`Giriş: /${slug}/login`);
} finally {
  try { unlinkSync(tmp); } catch {}
}
