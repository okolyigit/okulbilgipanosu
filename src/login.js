import { api } from './api.js';

const form = document.getElementById('login-form');
const errorEl = document.getElementById('error');
const submitBtn = document.getElementById('submit-btn');

// Same-origin yol kontrolü — open redirect saldırılarını engelle
function safeNextPath() {
  const raw = new URLSearchParams(window.location.search).get('next');
  if (!raw) return null;
  if (!raw.startsWith('/') || raw.startsWith('//')) return null;
  return raw;
}

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.add('visible');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.classList.remove('visible');
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  if (!email || !password) return;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Giriş yapılıyor...';
  try {
    const r = await api.post('/api/auth/login', { email, password });
    const next = safeNextPath();
    window.location.href = next || `/${r.slug}/admin`;
  } catch (err) {
    showError(err.message);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Giriş Yap';
  }
});
