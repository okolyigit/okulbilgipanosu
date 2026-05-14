// Test verilerini sıfırlar — Türkçe karakterler UTF-8 ile doğru yazılsın diye
// SQL dosyasını Node'dan yazıyoruz; sonra wrangler --file ile çalıştırıyoruz.

import { writeFileSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const slug = process.argv[2] || 'sanliurfa-bilsem';
const remote = process.argv.includes('--remote');

const sql = `
DELETE FROM announcements WHERE school_id IN (SELECT id FROM schools WHERE slug = '${slug}');
DELETE FROM duty_teachers  WHERE school_id IN (SELECT id FROM schools WHERE slug = '${slug}');
DELETE FROM ticker_items   WHERE school_id IN (SELECT id FROM schools WHERE slug = '${slug}');

UPDATE schools
SET name = 'ŞANLIURFA BİLSEM',
    motto = 'Geleceğin Liderleri Yetişiyor',
    city = 'Şanlıurfa'
WHERE slug = '${slug}';
`;

const tmp = `.reset-${Date.now()}.sql`;
writeFileSync(tmp, sql, 'utf8');
try {
  const env = remote ? '--remote' : '--local';
  const r = spawnSync('npx', ['wrangler', 'd1', 'execute', 'okul-panosu', env, `--file=${tmp}`], {
    stdio: 'inherit', shell: true
  });
  process.exit(r.status || 0);
} finally {
  try { unlinkSync(tmp); } catch {}
}
