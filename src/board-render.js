// Pano render yardımcıları — board ve demo sayfaları paylaşır.

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1564069114553-7215e1ff1890?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1920&auto=format&fit=crop'
];

const BADGE_GRADIENT = {
  default: 'linear-gradient(135deg, rgba(30,58,138,0.8), rgba(17,24,39,0.9))',
  success: 'linear-gradient(135deg, rgba(6,78,59,0.8), rgba(17,24,39,0.9))',
  warning: 'linear-gradient(135deg, rgba(120,53,15,0.8), rgba(17,24,39,0.9))'
};

const BADGE_LABEL = {
  default: 'Duyuru',
  success: 'Başarı',
  warning: 'Hatırlatma'
};

export function startClock() {
  const clockEl = document.getElementById('clock');
  const dateEl = document.getElementById('date');
  function tick() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${hh}:${mm}:${ss}`;
    dateEl.textContent = now.toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'long', weekday: 'long'
    });
  }
  tick();
  setInterval(tick, 1000);
}

function extractYouTubeId(url) {
  if (!url) return null;
  let m = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  m = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  m = url.match(/youtube\.com\/(?:embed|shorts)\/([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  return null;
}

function buildYouTubeEmbedUrl(videoId) {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    controls: '0',
    loop: '1',
    playlist: videoId,
    modestbranding: '1',
    rel: '0',
    playsinline: '1',
    iv_load_policy: '3',
    disablekb: '1'
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

export function renderSlider(announcements) {
  const slider = document.getElementById('slider');
  const indicatorsEl = document.getElementById('slider-indicators');
  slider.innerHTML = '';
  indicatorsEl.innerHTML = '';

  const items = announcements.length > 0
    ? announcements
    : [{
        badge_type: 'default',
        badge_text: 'Hoş Geldiniz',
        title: 'Henüz duyuru yok',
        body: 'Yönetici panelinden duyuru ekleyince burada görüntülenecek.',
        image_url: DEFAULT_IMAGES[0]
      }];

  items.forEach((item, i) => {
    const slide = document.createElement('div');
    slide.className = 'slide' + (i === 0 ? ' active' : '');

    const videoId = extractYouTubeId(item.video_url);

    if (videoId) {
      slide.classList.add('slide-video');
      slide.dataset.videoId = videoId;
      if (i === 0) {
        slide.innerHTML = `<iframe src="${buildYouTubeEmbedUrl(videoId)}"
          frameborder="0"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowfullscreen></iframe>`;
      }
    } else {
      const img = item.image_url || DEFAULT_IMAGES[i % DEFAULT_IMAGES.length];
      const grad = BADGE_GRADIENT[item.badge_type] || BADGE_GRADIENT.default;
      slide.style.background = `${grad}, url('${img}') center/cover`;

      const badgeClass = item.badge_type && item.badge_type !== 'default'
        ? `badge badge-${item.badge_type}`
        : 'badge';
      const badgeText = item.badge_text || BADGE_LABEL[item.badge_type] || BADGE_LABEL.default;

      slide.innerHTML = `
        <div class="slide-content">
          <span class="${badgeClass}"></span>
          <h2></h2>
          <p></p>
        </div>
      `;
      slide.querySelector('.badge').textContent = badgeText;
      slide.querySelector('h2').textContent = item.title || '';
      slide.querySelector('p').textContent = item.body || '';
    }

    slider.appendChild(slide);

    const dot = document.createElement('div');
    dot.className = 'indicator' + (i === 0 ? ' active' : '');
    indicatorsEl.appendChild(dot);
  });

  const slides = slider.querySelectorAll('.slide');
  const indicators = indicatorsEl.querySelectorAll('.indicator');
  if (slides.length <= 1) return;

  let current = 0;
  function goTo(i) {
    const prev = slides[current];
    if (prev.classList.contains('slide-video')) {
      prev.innerHTML = '';
    }
    prev.classList.remove('active');
    indicators[current].classList.remove('active');
    current = i;
    const next = slides[current];
    next.classList.add('active');
    indicators[current].classList.add('active');
    if (next.classList.contains('slide-video') && !next.querySelector('iframe')) {
      next.innerHTML = `<iframe src="${buildYouTubeEmbedUrl(next.dataset.videoId)}"
        frameborder="0"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowfullscreen></iframe>`;
    }
  }
  setInterval(() => goTo((current + 1) % slides.length), 10000);
}

export function renderDuty(duty) {
  const list = document.getElementById('duty-list');
  list.innerHTML = '';

  const jsDay = new Date().getDay();
  const todayDb = jsDay >= 1 && jsDay <= 5 ? jsDay : null;

  if (todayDb == null) {
    const li = document.createElement('li');
    li.textContent = 'Hafta sonu — nöbet yok.';
    list.appendChild(li);
    return;
  }

  const todayDuty = duty.filter(d => d.day_of_week == null || d.day_of_week === todayDb);
  if (todayDuty.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'Bugün nöbetçi öğretmen bilgisi girilmemiş.';
    list.appendChild(li);
    return;
  }
  for (const d of todayDuty) {
    const li = document.createElement('li');
    const zone = document.createElement('span');
    zone.className = 'duty-zone';
    zone.textContent = `${d.zone}:`;
    li.appendChild(zone);
    li.appendChild(document.createTextNode(' ' + d.teacher_name));
    list.appendChild(li);
  }
}

export function renderTicker(items) {
  const ticker = document.getElementById('ticker');
  ticker.innerHTML = '';
  if (items.length === 0) {
    const span = document.createElement('span');
    span.className = 'ticker-item';
    span.textContent = 'Henüz duyuru yok.';
    ticker.appendChild(span);
    return;
  }
  for (const item of items) {
    const span = document.createElement('span');
    span.className = 'ticker-item';
    span.textContent = item.text;
    ticker.appendChild(span);
  }
}

export function renderHeader(school) {
  document.title = `${school.name} — Pano`;
  document.getElementById('school-name').textContent = school.name;
  document.getElementById('school-motto').textContent = school.motto || '';
  document.getElementById('weather-desc').textContent = school.city
    ? `${school.city}, Parçalı Bulutlu`
    : 'Hava durumu';

  const logoEl = document.getElementById('logo-icon');
  if (school.logo_url) {
    logoEl.innerHTML = '';
    logoEl.classList.add('has-image');
    const img = document.createElement('img');
    img.src = school.logo_url;
    img.alt = 'Okul Logosu';
    img.onerror = () => {
      logoEl.classList.remove('has-image');
      logoEl.textContent = '🏫';
    };
    logoEl.appendChild(img);
  }
}
