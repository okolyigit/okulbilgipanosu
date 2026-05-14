// Video duyuru ekleme testi
const loginRes = await fetch('http://127.0.0.1:8788/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ slug: 'sanliurfa-bilsem', password: 'demo1234' })
});
const cookie = loginRes.headers.get('set-cookie');
const sid = (cookie?.match(/okul_session=([^;]+)/) || [])[1];
const headers = { 'Content-Type': 'application/json', 'Cookie': `okul_session=${sid}` };

// Mevcut duyuruları temizle
const list = await fetch('http://127.0.0.1:8788/api/schools/sanliurfa-bilsem/announcements', { headers });
for (const a of await list.json()) {
  await fetch(`http://127.0.0.1:8788/api/schools/sanliurfa-bilsem/announcements/${a.id}`, {
    method: 'DELETE', headers
  });
}

// 1 video + 1 normal duyuru ekle
const videos = [
  { title: 'Tanıtım Videosu', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', active: 1 },
  { title: 'Veli Toplantısı', body: 'Bu hafta sonu saat 10:00', badge_text: 'Önemli', badge_type: 'default', active: 1 }
];

for (const v of videos) {
  const r = await fetch('http://127.0.0.1:8788/api/schools/sanliurfa-bilsem/announcements', {
    method: 'POST', headers, body: JSON.stringify(v)
  });
  console.log(r.status, await r.text());
}

const fetched = await fetch('http://127.0.0.1:8788/api/schools/sanliurfa-bilsem');
const data = await fetched.json();
console.log('\nDuyurular:');
for (const a of data.announcements) {
  console.log(`  ${a.video_url ? '[VIDEO] ' : ''}${a.title}${a.video_url ? ' → ' + a.video_url : ''}`);
}
