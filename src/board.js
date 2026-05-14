// Pano sayfası — API'den veri çeker ve DOM'a basar.

import { api, getSlugFromPath } from './api.js';
import { startClock, renderHeader, renderSlider, renderDuty, renderTicker } from './board-render.js';

function showError(message, hint) {
  const dashboard = document.getElementById('dashboard');
  const hintHtml = hint
    ? `<p class="error-hint">${hint}</p>`
    : `<p class="error-hint">URL'de geçerli bir okul kısa adı (örn. <code>/okul-adi</code>) olmalı.</p>`;
  dashboard.innerHTML = `
    <div class="error-screen glass-panel">
      <h1>Okul Panosu</h1>
      <p>${message}</p>
      ${hintHtml}
    </div>
  `;
}

function wireSettingsModal(slug) {
  const btn = document.getElementById('settings-btn');
  const modal = document.getElementById('settings-modal');
  const form = document.getElementById('settings-form');
  const passInput = document.getElementById('modal-password');
  const errorEl = document.getElementById('modal-error');
  const cancelBtn = document.getElementById('modal-cancel');
  const submitBtn = document.getElementById('modal-submit');

  function open() {
    errorEl.classList.remove('visible');
    errorEl.textContent = '';
    passInput.value = '';
    modal.hidden = false;
    setTimeout(() => passInput.focus(), 50);
  }
  function close() {
    modal.hidden = true;
  }

  btn.addEventListener('click', (e) => { e.preventDefault(); open(); });
  cancelBtn.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) close();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.classList.remove('visible');
    const password = passInput.value;
    if (!password) return;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Doğrulanıyor...';
    try {
      await api.post('/api/auth/verify-password', { password });
      window.location.href = `/${encodeURIComponent(slug)}/admin`;
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.add('visible');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Devam Et';
      passInput.select();
    }
  });
}

async function init() {
  startClock();

  const slug = getSlugFromPath();
  const settingsBtn = document.getElementById('settings-btn');

  if (!slug) {
    showError('Lütfen bir okul adresi açın.');
    settingsBtn.style.display = 'none';
    return;
  }

  try {
    const data = await api.get(`/api/schools/${encodeURIComponent(slug)}`);
    renderHeader(data.school);
    renderSlider(data.announcements);
    renderDuty(data.duty);
    renderTicker(data.ticker);
    wireSettingsModal(slug);
  } catch (err) {
    if (err.status === 401) {
      const next = `/${encodeURIComponent(slug)}`;
      window.location.href = `/giris?next=${encodeURIComponent(next)}`;
      return;
    }
    if (err.status === 403) {
      settingsBtn.style.display = 'none';
      showError(
        'Bu panoyu görüntüleme yetkiniz yok.',
        'Yalnızca okulun sahibi kendi panosunu görebilir. <a href="/giris">Doğru hesapla giriş yapın.</a>'
      );
      return;
    }
    if (err.status === 404) {
      settingsBtn.style.display = 'none';
      showError(`"${slug}" adında bir okul bulunamadı.`);
    } else {
      showError(`Veriler yüklenemedi: ${err.message}`);
    }
  }
}

init();
