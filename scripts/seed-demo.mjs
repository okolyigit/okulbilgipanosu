// Demo okul — Atatürk Anadolu Lisesi — rastgele/gerçekçi verilerle oluşturur.
// Çalışma için wrangler pages dev (port 8788) ayakta olmalı.

const API = process.env.API || 'http://127.0.0.1:8788';
const SLUG = 'ataturk-anadolu-lisesi';
const EMAIL = 'demo@ataturkaal.k12.tr';
const PASSWORD = 'demo1234';

// --- Yardımcılar ---
async function call(method, path, body, cookie) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers['Cookie'] = `okul_session=${cookie}`;
  const r = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: r.status, data, cookie: (r.headers.get('set-cookie')?.match(/okul_session=([^;]+)/) || [])[1] };
}

// --- 1. Mevcutsa temizle, sonra hesap oluştur ---
let reg = await call('POST', '/api/auth/register', {
  school_name: 'Atatürk Anadolu Lisesi',
  slug: SLUG,
  email: EMAIL,
  password: PASSWORD
});

if (reg.status === 409) {
  console.log('Demo okul zaten var, giriş yapılıyor...');
  reg = await call('POST', '/api/auth/login', { email: EMAIL, password: PASSWORD });
}
if (reg.status >= 400) {
  console.error('Hata:', reg.status, reg.data);
  process.exit(1);
}
const cookie = reg.cookie;
console.log('✓ Hesap hazır');

// --- 2. Okul bilgileri ---
await call('PUT', `/api/schools/${SLUG}`, {
  name: 'Atatürk Anadolu Lisesi',
  motto: 'İlim, Erdem, Cumhuriyet',
  city: 'Ankara',
  logo_url: 'https://placehold.co/200x200/0f172a/38bdf8?text=AAL&font=roboto'
}, cookie);
console.log('✓ Okul bilgileri kaydedildi');

// --- 3. Mevcut duyuru/nöbet/ticker'ları temizle ---
const existingAnn = (await call('GET', `/api/schools/${SLUG}/announcements`, undefined, cookie)).data;
for (const a of existingAnn) {
  await call('DELETE', `/api/schools/${SLUG}/announcements/${a.id}`, undefined, cookie);
}
const existingTicker = (await call('GET', `/api/schools/${SLUG}/ticker`, undefined, cookie)).data;
for (const t of existingTicker) {
  await call('DELETE', `/api/schools/${SLUG}/ticker/${t.id}`, undefined, cookie);
}
console.log('✓ Eski içerik temizlendi');

// --- 4. Duyurular ---
const announcements = [
  {
    title: 'Cumhuriyetimizin 103. Yılı Kutlu Olsun',
    body: '29 Ekim Cumhuriyet Bayramı törenimiz okul bahçesinde saat 10:00\'da düzenlenecektir. Tüm öğrenci, veli ve öğretmenlerimizi bekliyoruz.',
    badge_text: 'Önemli Duyuru',
    badge_type: 'default',
    image_url: 'https://images.unsplash.com/photo-1565035010268-a3816f98589a?q=80&w=1920&auto=format&fit=crop',
    active: 1
  },
  {
    title: 'TÜBİTAK Bilim Fuarı\'nda Birincilik',
    body: 'Öğrencilerimiz fizik dalında il birincisi olmuştur. Emeği geçen tüm öğretmen ve öğrencilerimizi tebrik ederiz.',
    badge_text: 'Başarı',
    badge_type: 'success',
    image_url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1920&auto=format&fit=crop',
    active: 1
  },
  {
    title: 'Veli Toplantısı — 15 Kasım',
    body: 'Birinci dönem genel veli toplantımız 15 Kasım Cumartesi günü saat 13:00\'te konferans salonunda gerçekleştirilecektir.',
    badge_text: 'Veliler',
    badge_type: 'default',
    image_url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1920&auto=format&fit=crop',
    active: 1
  },
  {
    title: 'Kütüphane Kitap İadeleri',
    body: 'Ödünç alınan kitapların en geç Cuma günü mesai bitimine kadar iade edilmesi rica olunur.',
    badge_text: 'Hatırlatma',
    badge_type: 'warning',
    image_url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1920&auto=format&fit=crop',
    active: 1
  },
  {
    title: '10. Yıl Marşı',
    body: '',
    video_url: 'https://www.youtube.com/watch?v=ePOI56Y2nE0',
    active: 1
  }
];
for (const a of announcements) {
  const r = await call('POST', `/api/schools/${SLUG}/announcements`, a, cookie);
  if (r.status >= 400) console.error('  Duyuru hatası:', r.data);
}
console.log(`✓ ${announcements.length} duyuru eklendi`);

// --- 5. Haftalık nöbet listesi (Pzt-Cuma, 4 bölge) ---
const TEACHERS = {
  'A Blok 1. Kat':   ['Ahmet Yılmaz', 'Ayşe Demir', 'Mehmet Kaya', 'Fatma Şahin', 'Ali Çelik'],
  'A Blok 2. Kat':   ['Zeynep Aydın', 'Mustafa Polat', 'Elif Korkmaz', 'İbrahim Yıldız', 'Selin Öztürk'],
  'B Blok 1. Kat':   ['Hasan Güneş', 'Sibel Çetin', 'Emre Tunç', 'Pınar Acar', 'Burak Doğan'],
  'Bahçe ve Kantin': ['Murat Erdoğan', 'Gül Karaca', 'Hüseyin Aksoy', 'Leyla Uçar', 'Cem Bozkurt']
};
const entries = [];
for (const [zone, names] of Object.entries(TEACHERS)) {
  names.forEach((teacher_name, idx) => {
    entries.push({ zone, teacher_name, day_of_week: idx + 1 });
  });
}
await call('POST', `/api/schools/${SLUG}/duty-bulk`, { entries }, cookie);
console.log(`✓ ${entries.length} nöbetçi kaydı eklendi (4 bölge × 5 gün)`);

// --- 6. Kayan yazılar (ticker) ---
const tickerItems = [
  'Destekleme ve Yetiştirme Kursları (DYK) kayıtları başlamıştır.',
  'Spor salonu Perşembe günü bakıma alınacaktır.',
  'Satranç turnuvası başvuruları müdür yardımcısı odasından yapılabilir.',
  'İngilizce kulübü her Çarşamba saat 15:30\'da toplanacaktır.',
  'Kantin menüsü yeni dönem için güncellenmiştir.'
];
for (const text of tickerItems) {
  await call('POST', `/api/schools/${SLUG}/ticker`, { text, active: 1 }, cookie);
}
console.log(`✓ ${tickerItems.length} kayan yazı eklendi`);

console.log('');
console.log('Demo hazır!');
console.log(`  Pano:  ${API}/${SLUG}`);
console.log(`  Giriş: ${EMAIL} / ${PASSWORD}`);
