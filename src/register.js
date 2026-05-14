import { api } from './api.js';

const form = document.getElementById('register-form');
const errorEl = document.getElementById('error');
const submitBtn = document.getElementById('submit-btn');
const nameInput = document.getElementById('school_name');
const slugInput = document.getElementById('slug');

let slugManuallyEdited = false;

// Slug'ı okul adından otomatik üret
function slugify(s) {
  return s
    .toLocaleLowerCase('tr-TR')
    .replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ç/g, 'c')
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/İ/g, 'i')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

nameInput.addEventListener('input', () => {
  if (!slugManuallyEdited) slugInput.value = slugify(nameInput.value);
});
slugInput.addEventListener('input', () => { slugManuallyEdited = true; });

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.add('visible');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.classList.remove('visible');

  const payload = {
    school_name: nameInput.value.trim(),
    slug: slugInput.value.trim().toLowerCase(),
    email: document.getElementById('email').value.trim(),
    password: document.getElementById('password').value
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Hesap oluşturuluyor...';
  try {
    const r = await api.post('/api/auth/register', payload);
    window.location.href = `/${r.slug}/admin`;
  } catch (err) {
    showError(err.message);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Hesap Oluştur';
  }
});
