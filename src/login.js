import { api } from './api.js';

const form = document.getElementById('login-form');
const errorEl = document.getElementById('error');
const submitBtn = document.getElementById('submit-btn');

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
    window.location.href = `/${r.slug}/admin`;
  } catch (err) {
    showError(err.message);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Giriş Yap';
  }
});
