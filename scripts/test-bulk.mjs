// Bulk endpoint testi — Türkçe karakterler için Node fetch kullan

const loginRes = await fetch('http://127.0.0.1:8788/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ slug: 'sanliurfa-bilsem', password: 'demo1234' })
});
const cookie = loginRes.headers.get('set-cookie');
const sessionValue = (cookie?.match(/okul_session=([^;]+)/) || [])[1];
if (!sessionValue) {
  console.error('Login başarısız:', loginRes.status, await loginRes.text());
  process.exit(1);
}

const entries = [
  { zone: '1. Kat', teacher_name: 'Ahmet Yılmaz', day_of_week: 1 },
  { zone: '1. Kat', teacher_name: 'Ayşe Demir', day_of_week: 2 },
  { zone: '1. Kat', teacher_name: 'Mehmet Kaya', day_of_week: 3 },
  { zone: '1. Kat', teacher_name: 'Fatma Şahin', day_of_week: 4 },
  { zone: '1. Kat', teacher_name: 'Ali Çelik', day_of_week: 5 },
  { zone: 'Bahçe', teacher_name: 'Zeynep Öztürk', day_of_week: 1 },
  { zone: 'Bahçe', teacher_name: 'Hüseyin Güneş', day_of_week: 3 },
  { zone: 'Bahçe', teacher_name: 'İrem Çetin', day_of_week: 5 }
];

const headers = {
  'Content-Type': 'application/json',
  'Cookie': `okul_session=${sessionValue}`
};

const res = await fetch('http://127.0.0.1:8788/api/schools/sanliurfa-bilsem/duty-bulk', {
  method: 'POST', headers, body: JSON.stringify({ entries })
});
console.log('POST /duty/bulk →', res.status, await res.text());

const fetched = await fetch('http://127.0.0.1:8788/api/schools/sanliurfa-bilsem', { headers });
const data = await fetched.json();
console.log('\nKaydedilen nöbet listesi:');
for (const d of data.duty) {
  const dayName = ['', 'Pzt', 'Salı', 'Çar', 'Per', 'Cuma'][d.day_of_week] || '?';
  console.log(`  [${dayName}] ${d.zone} → ${d.teacher_name}`);
}

// Bugünün filtresi (board.js'in yapacağı şey)
const today = new Date().getDay();
const dbDay = today >= 1 && today <= 5 ? today : null;
console.log(`\nBugün (JS getDay=${today}, DB day=${dbDay}):`);
if (dbDay == null) {
  console.log('  Hafta sonu — gösterilmez');
} else {
  const filtered = data.duty.filter(d => d.day_of_week == null || d.day_of_week === dbDay);
  for (const d of filtered) console.log(`  ${d.zone} → ${d.teacher_name}`);
}
