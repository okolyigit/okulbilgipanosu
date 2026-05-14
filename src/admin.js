import { api, getSlugFromPath } from './api.js';

const slug = getSlugFromPath();

if (!slug) {
  window.location.href = '/';
}

// ----- Auth kontrolü -----
async function ensureAuth() {
  try {
    const me = await api.get('/api/auth/me');
    if (!me.authenticated || me.slug !== slug) {
      window.location.href = `/giris`;
      return false;
    }
    return true;
  } catch {
    window.location.href = `/giris`;
    return false;
  }
}

// ----- Tab navigation -----
function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.tab-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.toggle('active', t === tab));
      panels.forEach(p => p.classList.toggle('active', p.dataset.panel === target));
    });
  });
}

// ----- Modal yardımcıları -----
const modalBackdrop = document.getElementById('modal-backdrop');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalError = document.getElementById('modal-error');
const modalSave = document.getElementById('modal-save');
const modalCancel = document.getElementById('modal-cancel');

let modalSubmitFn = null;

function openModal(title, bodyHTML, onSubmit, saveLabel = 'Kaydet') {
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHTML;
  modalError.classList.remove('visible');
  modalSubmitFn = onSubmit;
  modalSave.textContent = saveLabel;
  modalBackdrop.classList.add('visible');
  const firstInput = modalBody.querySelector('input, textarea, select');
  if (firstInput) firstInput.focus();
}

function closeModal() {
  modalBackdrop.classList.remove('visible');
  modalSubmitFn = null;
}

function showModalError(msg) {
  modalError.textContent = msg;
  modalError.classList.add('visible');
}

modalCancel.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', (e) => {
  if (e.target === modalBackdrop) closeModal();
});
modalSave.addEventListener('click', async () => {
  if (!modalSubmitFn) return;
  modalSave.disabled = true;
  try {
    await modalSubmitFn();
    closeModal();
  } catch (err) {
    showModalError(err.message);
  } finally {
    modalSave.disabled = false;
  }
});

// ----- Okul Bilgileri -----
let currentSchool = null;

async function loadInfo() {
  const data = await api.get(`/api/schools/${encodeURIComponent(slug)}`);
  currentSchool = data.school;
  document.getElementById('school-tag').textContent = `Okul: ${currentSchool.name}`;
  document.getElementById('view-link').href = `/${slug}`;
  document.getElementById('info-name').value = currentSchool.name || '';
  document.getElementById('info-motto').value = currentSchool.motto || '';
  document.getElementById('info-city').value = currentSchool.city || '';
  document.getElementById('info-logo').value = currentSchool.logo_url || '';
  updateLogoPreview();
}

function updateLogoPreview() {
  const url = document.getElementById('info-logo').value.trim();
  const wrap = document.getElementById('logo-preview');
  const img = document.getElementById('logo-preview-img');
  if (url) {
    img.src = url;
    wrap.style.display = 'block';
  } else {
    wrap.style.display = 'none';
  }
}

function setupInfoForm() {
  const form = document.getElementById('info-form');
  const errorEl = document.getElementById('info-error');
  const status = document.getElementById('info-status');
  document.getElementById('info-logo').addEventListener('input', updateLogoPreview);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.classList.remove('visible');
    status.textContent = '';
    const payload = {
      name: document.getElementById('info-name').value.trim(),
      motto: document.getElementById('info-motto').value.trim(),
      city: document.getElementById('info-city').value.trim(),
      logo_url: document.getElementById('info-logo').value.trim()
    };
    try {
      await api.put(`/api/schools/${encodeURIComponent(slug)}`, payload);
      status.textContent = '✓ Kaydedildi';
      setTimeout(() => { status.textContent = ''; }, 2500);
      document.getElementById('school-tag').textContent = `Okul: ${payload.name}`;
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.add('visible');
    }
  });
}

// ----- Genel CRUD resource'u -----
function escapeHTML(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function field(name, label, value, type = 'text') {
  const v = escapeHTML(value ?? '');
  if (type === 'textarea') {
    return `<div class="form-row"><label>${label}</label><textarea name="${name}">${v}</textarea></div>`;
  }
  return `<div class="form-row"><label>${label}</label><input type="${type}" name="${name}" value="${v}" /></div>`;
}

function selectField(name, label, value, options) {
  const opts = options.map(o =>
    `<option value="${o.value}"${o.value === value ? ' selected' : ''}>${escapeHTML(o.label)}</option>`
  ).join('');
  return `<div class="form-row"><label>${label}</label><select name="${name}">${opts}</select></div>`;
}

function formValues(fields) {
  const result = {};
  for (const f of fields) {
    const el = modalBody.querySelector(`[name="${f}"]`);
    result[f] = el ? el.value : '';
  }
  return result;
}

function createResource({ basePath, listId, addBtnId, emptyText, getFormHTML, getFormValues, renderListItem, allowedFields }) {
  const listEl = document.getElementById(listId);
  let items = [];

  async function refresh() {
    items = await api.get(basePath);
    if (items.length === 0) {
      listEl.innerHTML = `<div class="empty-state">${emptyText}</div>`;
      return;
    }
    listEl.innerHTML = items.map(renderListItem).join('');
    listEl.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => openEdit(parseInt(btn.dataset.edit, 10)));
    });
    listEl.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', () => doDelete(parseInt(btn.dataset.delete, 10)));
    });
    listEl.querySelectorAll('[data-toggle-active]').forEach(input => {
      input.addEventListener('change', () => doToggleActive(parseInt(input.dataset.toggleActive, 10), input.checked));
    });
  }

  function openCreate() {
    openModal('Yeni Kayıt', getFormHTML({}), async () => {
      const values = getFormValues();
      values.sort_order = items.length;
      await api.post(basePath, values);
      await refresh();
    });
  }

  function openEdit(id) {
    const item = items.find(x => x.id === id);
    if (!item) return;
    openModal('Düzenle', getFormHTML(item), async () => {
      const values = getFormValues();
      values.sort_order = item.sort_order ?? 0;
      await api.put(`${basePath}/${id}`, values);
      await refresh();
    });
  }

  async function doDelete(id) {
    if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    await api.delete(`${basePath}/${id}`);
    await refresh();
  }

  async function doToggleActive(id, active) {
    const item = items.find(x => x.id === id);
    if (!item) return;
    // Tüm alanları geri gönder + active değişikliği
    const payload = { ...item, active: active ? 1 : 0 };
    delete payload.id;
    await api.put(`${basePath}/${id}`, payload);
    item.active = active ? 1 : 0;
    // Liste'yi tekrar render et — pasif görünüm güncellensin
    await refresh();
  }

  document.getElementById(addBtnId).addEventListener('click', openCreate);
  return { refresh };
}

// ----- Resources -----

const announcementsBase = `/api/schools/${encodeURIComponent(slug)}/announcements`;
const announcements = createResource({
  basePath: announcementsBase,
  listId: 'announcements-list',
  addBtnId: 'add-announcement',
  emptyText: 'Henüz duyuru yok. + Yeni Duyuru ile başlayın.',
  getFormHTML: (item) => `
    <div class="form-row">
      <label>YouTube Video Linki (opsiyonel)</label>
      <input type="url" name="video_url" value="${escapeHTML(item.video_url || '')}"
             placeholder="https://www.youtube.com/watch?v=..." />
      <small style="color:var(--text-secondary);font-size:0.8rem;">
        Video linki girilirse o slayt video olarak oynatılır (otomatik döngü, sessiz). Boş bırakılırsa görsel+yazı gösterilir.
      </small>
    </div>
    ${field('title', 'Başlık *', item.title)}
    ${field('body', 'Açıklama', item.body, 'textarea')}
    ${field('badge_text', 'Etiket Yazısı', item.badge_text || '')}
    ${selectField('badge_type', 'Etiket Rengi', item.badge_type || 'default', [
      { value: 'default', label: 'Mavi (Varsayılan)' },
      { value: 'success', label: 'Yeşil (Başarı)' },
      { value: 'warning', label: 'Sarı (Hatırlatma)' }
    ])}
    ${field('image_url', 'Arka Plan Görsel URL', item.image_url || '')}
  `,
  getFormValues: () => {
    const v = formValues(['title', 'body', 'badge_text', 'badge_type', 'image_url', 'video_url']);
    return { ...v, active: 1 };
  },
  renderListItem: (item) => `
    <div class="list-item ${item.active ? '' : 'inactive'}">
      <label class="active-toggle" title="${item.active ? 'Döngüde — kaldırmak için tıkla' : 'Pasif — döngüye almak için tıkla'}">
        <input type="checkbox" data-toggle-active="${item.id}" ${item.active ? 'checked' : ''} />
      </label>
      <div class="list-item-main">
        <div class="list-item-title">
          ${item.video_url ? '<span style="color:var(--danger-color);margin-right:6px;" title="Video">▶</span>' : ''}
          ${escapeHTML(item.title)}
        </div>
        <div class="list-item-meta">
          ${item.badge_text ? `[${escapeHTML(item.badge_text)}] ` : ''}
          ${escapeHTML(item.body || '')}
        </div>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-secondary btn-small" data-edit="${item.id}">Düzenle</button>
        <button class="btn btn-danger btn-small" data-delete="${item.id}">Sil</button>
      </div>
    </div>
  `
});

// ----- Haftalık Nöbet Grid -----
const DAY_LABELS = ['Pzt', 'Salı', 'Çar', 'Per', 'Cuma']; // index 0-4 = day_of_week 1-5
const dutyBase = `/api/schools/${encodeURIComponent(slug)}/duty`;

const dutyGrid = {
  rows: [], // [{ zone: '1. Kat', teachers: ['Ahmet', '', 'Mehmet', '', 'Ali'] }, ...]

  async refresh() {
    const entries = await api.get(dutyBase);
    // entries → zone bazlı grupla
    const byZone = new Map();
    for (const e of entries) {
      if (!byZone.has(e.zone)) byZone.set(e.zone, { zone: e.zone, teachers: ['', '', '', '', ''] });
      const day = e.day_of_week;
      if (day >= 1 && day <= 5) {
        byZone.get(e.zone).teachers[day - 1] = e.teacher_name;
      }
    }
    this.rows = byZone.size > 0
      ? Array.from(byZone.values())
      : [{ zone: '', teachers: ['', '', '', '', ''] }];
    this.render();
  },

  render() {
    const wrap = document.getElementById('duty-grid-wrap');
    let html = '<div class="duty-grid-wrap"><table class="duty-grid"><thead><tr>';
    html += '<th>Bölge</th>';
    for (const d of DAY_LABELS) html += `<th>${d}</th>`;
    html += '<th></th></tr></thead><tbody>';
    this.rows.forEach((row, ri) => {
      html += '<tr>';
      html += `<td><input class="zone-input" data-r="${ri}" data-c="zone" value="${escapeHTML(row.zone)}" placeholder="örn. 1. Kat" /></td>`;
      for (let ci = 0; ci < 5; ci++) {
        html += `<td><input data-r="${ri}" data-c="${ci}" value="${escapeHTML(row.teachers[ci] || '')}" placeholder="—" /></td>`;
      }
      html += `<td><button class="row-remove" data-remove="${ri}" title="Bölgeyi sil">×</button></td>`;
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    wrap.innerHTML = html;

    wrap.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', () => {
        const r = parseInt(input.dataset.r, 10);
        const c = input.dataset.c;
        if (c === 'zone') this.rows[r].zone = input.value;
        else this.rows[r].teachers[parseInt(c, 10)] = input.value;
      });
    });
    wrap.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.rows.splice(parseInt(btn.dataset.remove, 10), 1);
        if (this.rows.length === 0) this.rows.push({ zone: '', teachers: ['', '', '', '', ''] });
        this.render();
      });
    });
  },

  addRow() {
    this.rows.push({ zone: '', teachers: ['', '', '', '', ''] });
    this.render();
  },

  applyPasted(matrix) {
    // matrix: [[zone, day1, day2, day3, day4, day5], ...]
    this.rows = matrix
      .filter(r => r.length > 0 && (r[0] || '').trim() !== '')
      .map(r => ({
        zone: (r[0] || '').trim(),
        teachers: [0, 1, 2, 3, 4].map(i => (r[i + 1] || '').trim())
      }));
    if (this.rows.length === 0) this.rows = [{ zone: '', teachers: ['', '', '', '', ''] }];
    this.render();
  },

  async save() {
    const status = document.getElementById('duty-save-status');
    status.textContent = '';
    status.style.color = 'var(--success-color)';
    const entries = [];
    for (const row of this.rows) {
      const zone = (row.zone || '').trim();
      if (!zone) continue;
      for (let ci = 0; ci < 5; ci++) {
        const name = (row.teachers[ci] || '').trim();
        if (!name) continue;
        entries.push({ zone, teacher_name: name, day_of_week: ci + 1 });
      }
    }
    try {
      const r = await api.post(`/api/schools/${encodeURIComponent(slug)}/duty-bulk`, { entries });
      status.textContent = `✓ ${r.count} kayıt kaydedildi`;
      setTimeout(() => { status.textContent = ''; }, 3000);
      await this.refresh();
    } catch (err) {
      status.style.color = 'var(--danger-color)';
      status.textContent = '✗ ' + err.message;
    }
  }
};

// Excel paste modal
function openDutyPasteModal() {
  const example = [
    'Bölge    Pzt      Salı     Çar      Per      Cuma',
    '1. Kat   Ahmet    Ayşe     Mehmet   Fatma    Ali',
    '2. Kat   Can      Dilek    Emre     Gül      Hasan',
    'Bahçe    İrem     Jale     Kemal    Lale     Murat'
  ].join('\n');

  const body = `
    <p style="color:var(--text-secondary);margin-bottom:12px;font-size:0.9rem;">
      Excel'de tabloyu (Bölge + Pzt + Salı + Çar + Per + Cuma — toplam 6 sütun) seçip kopyala, aşağıya yapıştır.
      Mevcut nöbet listesi <strong>tamamen değiştirilir</strong>.
    </p>
    <div class="paste-example">${escapeHTML(example)}</div>
    <textarea class="paste-textarea" id="paste-input" placeholder="Buraya yapıştır (Ctrl+V)"></textarea>
  `;
  openModal('Excel\'den Nöbet Listesi Yapıştır', body, async () => {
    const raw = document.getElementById('paste-input').value;
    if (!raw.trim()) {
      throw new Error('Boş içerik yapıştırıldı');
    }
    // Parse TSV/CSV (Excel kopyalama tab ile ayırır)
    const matrix = raw
      .replace(/\r\n/g, '\n')
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => line.split('\t').length > 1 ? line.split('\t') : line.split(','));
    dutyGrid.applyPasted(matrix);
  }, 'Önizle');
}

document.getElementById('duty-paste').addEventListener('click', openDutyPasteModal);
document.getElementById('duty-add-row').addEventListener('click', () => dutyGrid.addRow());
document.getElementById('duty-save').addEventListener('click', () => dutyGrid.save());

const tickerBase = `/api/schools/${encodeURIComponent(slug)}/ticker`;
const ticker = createResource({
  basePath: tickerBase,
  listId: 'ticker-list-admin',
  addBtnId: 'add-ticker',
  emptyText: 'Henüz kayan yazı eklenmemiş.',
  getFormHTML: (item) => `
    ${field('text', 'Metin *', item.text, 'textarea')}
  `,
  getFormValues: () => {
    const v = formValues(['text']);
    return { ...v, active: 1 };
  },
  renderListItem: (item) => `
    <div class="list-item ${item.active ? '' : 'inactive'}">
      <label class="active-toggle" title="${item.active ? 'Yayında' : 'Pasif'}">
        <input type="checkbox" data-toggle-active="${item.id}" ${item.active ? 'checked' : ''} />
      </label>
      <div class="list-item-main">
        <div class="list-item-meta">${escapeHTML(item.text)}</div>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-secondary btn-small" data-edit="${item.id}">Düzenle</button>
        <button class="btn btn-danger btn-small" data-delete="${item.id}">Sil</button>
      </div>
    </div>
  `
});

// ----- Logout -----
document.getElementById('logout-btn').addEventListener('click', async () => {
  try { await api.post('/api/auth/logout'); } catch {}
  window.location.href = `/giris`;
});

// ----- Init -----
(async () => {
  if (!await ensureAuth()) return;
  setupTabs();
  setupInfoForm();
  await loadInfo();
  await Promise.all([announcements.refresh(), dutyGrid.refresh(), ticker.refresh()]);
})();
