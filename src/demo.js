// Demo pano — sahte verilerle çalışır, API/auth gerektirmez.

import { startClock, renderHeader, renderSlider, renderDuty, renderTicker } from './board-render.js';

const DEMO_SCHOOL = {
  name: 'Demo Anadolu Lisesi',
  motto: 'Bilgi, gayret, başarı.',
  city: 'İstanbul',
  logo_url: null
};

const DEMO_ANNOUNCEMENTS = [
  {
    badge_type: 'success',
    badge_text: 'Başarı',
    title: 'TÜBİTAK Proje Yarışmasında 1.lik',
    body: '12-A sınıfı öğrencimiz Ayşe Yılmaz, Türkiye birincisi oldu. Kendisini tebrik ediyoruz.',
    image_url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=1920&auto=format&fit=crop'
  },
  {
    badge_type: 'default',
    badge_text: 'Duyuru',
    title: 'Veli Toplantısı Pazartesi Günü',
    body: '2. dönem birinci veli toplantısı 19 Mayıs Pazartesi saat 14:00\'te konferans salonunda yapılacaktır.',
    image_url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1920&auto=format&fit=crop'
  },
  {
    badge_type: 'warning',
    badge_text: 'Hatırlatma',
    title: 'Yarın Yarıyıl Karneleri Dağıtılacak',
    body: 'Tüm öğrencilerin sabah 09:00\'da sınıflarında hazır bulunmaları gerekmektedir.',
    image_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1920&auto=format&fit=crop'
  },
  {
    badge_type: 'default',
    badge_text: 'Etkinlik',
    title: 'Geleneksel Bahar Şenliği',
    body: '23 Mayıs Cuma günü okul bahçesinde düzenlenecek şenlikte konserler, stantlar ve sportif aktiviteler olacak.',
    image_url: 'https://images.unsplash.com/photo-1464047736614-af63643285bf?q=80&w=1920&auto=format&fit=crop'
  }
];

// day_of_week: 1=Pzt, 2=Salı, 3=Çar, 4=Per, 5=Cuma. null = her gün.
const DEMO_DUTY = [
  { zone: 'A Blok Giriş', teacher_name: 'Mehmet Demir',  day_of_week: 1 },
  { zone: 'B Blok Giriş', teacher_name: 'Zeynep Kaya',   day_of_week: 1 },
  { zone: 'Bahçe',        teacher_name: 'Ali Şahin',     day_of_week: 1 },

  { zone: 'A Blok Giriş', teacher_name: 'Fatma Öztürk',  day_of_week: 2 },
  { zone: 'B Blok Giriş', teacher_name: 'Hasan Yıldız',  day_of_week: 2 },
  { zone: 'Bahçe',        teacher_name: 'Ayşe Çelik',    day_of_week: 2 },

  { zone: 'A Blok Giriş', teacher_name: 'Murat Arslan',  day_of_week: 3 },
  { zone: 'B Blok Giriş', teacher_name: 'Selin Polat',   day_of_week: 3 },
  { zone: 'Bahçe',        teacher_name: 'Emre Doğan',    day_of_week: 3 },

  { zone: 'A Blok Giriş', teacher_name: 'Burcu Kara',    day_of_week: 4 },
  { zone: 'B Blok Giriş', teacher_name: 'Okan Tekin',    day_of_week: 4 },
  { zone: 'Bahçe',        teacher_name: 'Deniz Aydın',   day_of_week: 4 },

  { zone: 'A Blok Giriş', teacher_name: 'Gül Erden',     day_of_week: 5 },
  { zone: 'B Blok Giriş', teacher_name: 'Cem Yurt',      day_of_week: 5 },
  { zone: 'Bahçe',        teacher_name: 'Pınar Koç',     day_of_week: 5 },

  { zone: 'Müdür Yardımcısı', teacher_name: 'Hakan Bey', day_of_week: null }
];

const DEMO_TICKER = [
  { text: 'Yarıyıl karneleri yarın dağıtılacaktır.' },
  { text: 'Veli toplantısı 19 Mayıs Pazartesi.' },
  { text: 'Bahar şenliği için kayıtlar başladı — sınıf öğretmeninize başvurun.' },
  { text: 'Kütüphane öğle arası saatlerinde de açıktır.' },
  { text: 'Okul kantininde fiyat değişikliği — yeni fiyat listesi panoda.' }
];

startClock();
renderHeader(DEMO_SCHOOL);
renderSlider(DEMO_ANNOUNCEMENTS);
renderDuty(DEMO_DUTY);
renderTicker(DEMO_TICKER);
