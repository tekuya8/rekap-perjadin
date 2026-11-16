/* ===== Rekap Perjadin — surat tugas & bukti perjalanan dinas ===== */
'use strict';

// ---------- Utilitas ----------
const LS = { cfg: 'rp_cfg', cache: 'rp_cache', pref: 'rp_pref' };
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* penuh */ } };
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const sum = (arr, f) => arr.reduce((a, x) => a + (f ? f(x) : x), 0);

// ---------- Tanggal ----------
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const todayStr = () => ymd(today());
const diffDays = (a, b) => Math.round((parseYmd(b) - parseYmd(a)) / 864e5);
const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const fmtTgl = s => { if (!s) return '—'; const d = parseYmd(s); return `${d.getDate()} ${BLN[d.getMonth()]} ${d.getFullYear()}`; };
const fmtPanjang = s => { if (!s) return '—'; const d = parseYmd(s); return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`; };
function rentang(a, b) {
  if (!a) return '—';
  if (!b || a === b) return fmtTgl(a);
  const x = parseYmd(a), y = parseYmd(b);
  if (x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth()) return `${x.getDate()}–${y.getDate()} ${BLN[y.getMonth()]} ${y.getFullYear()}`;
  return `${fmtTgl(a)} – ${fmtTgl(b)}`;
}

const ICON = {
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  search: '<svg viewBox="0 0 24 24"><path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm9 3-4.3-4.3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  cam: '<svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Zm8 9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  clip: '<svg viewBox="0 0 24 24"><path d="m20 11-8 8a5 5 0 0 1-7-7l8-8a3.5 3.5 0 0 1 5 5l-8 8a2 2 0 0 1-3-3l7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  doc: '<svg viewBox="0 0 24 24"><path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 0v5h5M9 13h6M9 17h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>',
  scan: '<svg viewBox="0 0 24 24"><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  plane: '<svg viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5Z"/></svg>',
  print: '<svg viewBox="0 0 24 24"><path d="M7 9V3h10v6M7 18H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M7 14h10v7H7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'
};
const ATURAN_TXT = { wajib: 'Wajib', opsional: 'Opsional', luar: 'Wajib jika luar wilayah kerja', hotel: 'Wajib jika lebih dari 1 hari', kendaraan: 'Wajib jika kendaraan pribadi' };

// ---------- State ----------
const cache = load(LS.cache, {});
const S = {
  cfg: load(LS.cfg, null),
  pj: cache.perjadin || [], pelaku: cache.pelaku || [], bukti: cache.bukti || [], ket: cache.ket || [],
  def: cache.buktiDef || [], settings: cache.pengaturan || { wilayahDarat: [] }, gemini: !!cache.gemini,
  urlSheet: cache.urlSheet || '', urlFolder: cache.urlFolder || '', lastSync: cache.waktu || 0,
  pref: Object.assign({ instansi: 'Satuan Kerja Pelaksanaan Prasarana Strategis Papua', kota: 'Jayapura', penerima: '', jabatan: 'Konsultan Individual' }, load(LS.pref, {})),
  view: 'beranda',
  filter: { q: '', status: 'semua', periode: 'semua' },
  rekap: { periode: 'bulan', from: '', to: '', tab: 'pelaku' },
  loaded: !!cache.waktu, syncing: false, busy: false
};

// ---------- API ----------
async function api(action, data = {}, cfg = S.cfg, timeoutMs = 45000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(cfg.url, { method: 'POST', body: JSON.stringify({ token: cfg.token, action, data }), redirect: 'follow', signal: ctrl.signal });
    if (!res.ok) throw netErr('Server membalas ' + res.status);
    let j;
    try { j = await res.json(); } catch (e) { throw new Error('Balasan server tidak valid. Pastikan URL Web App benar dan akses "Siapa saja".'); }
    if (!j.ok) throw new Error(j.error || 'Permintaan gagal');
    return j.data;
  } catch (e) {
    if (e.name === 'AbortError') throw netErr('Server terlalu lama membalas');
    if (e instanceof TypeError) throw netErr(navigator.onLine ? 'Kiriman terputus di tengah jalan' : 'Tidak ada koneksi internet');
    throw e;
  } finally { clearTimeout(timer); }
}
function netErr(msg) { const e = new Error(msg); e.network = true; return e; }

function saveCache() {
  store(LS.cache, { perjadin: S.pj, pelaku: S.pelaku, bukti: S.bukti, ket: S.ket, buktiDef: S.def, pengaturan: S.settings,
    gemini: S.gemini, urlSheet: S.urlSheet, urlFolder: S.urlFolder, waktu: S.lastSync });
}
async function sync(silent) {
  if (!S.cfg || S.syncing) return;
  S.syncing = true; $('#btnSync').classList.add('spin');
  try {
    const d = await api('ambilSemua');
    Object.assign(S, { pj: d.perjadin, pelaku: d.pelaku, bukti: d.bukti, ket: d.ket, def: d.buktiDef, settings: d.pengaturan,
      gemini: d.gemini, urlSheet: d.urlSheet, urlFolder: d.urlFolder, lastSync: d.waktu, loaded: true });
    saveCache(); render();
    if (!silent) toast('Data tersinkron', 'ok');
  } catch (e) {
    if (!S.loaded) render();
    if (!silent || !e.network) toast(e.message, 'err');
  } finally { S.syncing = false; $('#btnSync').classList.remove('spin'); }
}
// Ganti data satu perjadin dengan versi terbaru dari server
function terapkanPaket(pk) {
  const id = pk.perjadin.id;
  S.pj = S.pj.filter(x => x.id !== id).concat(pk.perjadin);
  S.pelaku = S.pelaku.filter(x => x.idPerjadin !== id).concat(pk.pelaku);
  S.bukti = S.bukti.filter(x => x.idPerjadin !== id).concat(pk.bukti);
  S.ket = S.ket.filter(x => x.idPerjadin !== id).concat(pk.ket);
  saveCache();
}

// ---------- Logika kelengkapan (sama dengan server) ----------
function wajibKah(def, p) {
  return def.aturan === 'wajib' || (def.aturan === 'luar' && p.wilayah === 'Luar') ||
    (def.aturan === 'hotel' && Number(p.durasi) > 1) || (def.aturan === 'kendaraan' && p.kendaraan === 'Ya');
}
function cekItem(p, def) {
  const files = S.bukti.filter(b => b.idPerjadin === p.id && b.jenis === def.jenis);
  const k = S.ket.find(x => x.idPerjadin === p.id && x.jenis === def.jenis);
  const wajib = wajibKah(def, p);
  const state = files.length ? 'ada' : wajib ? (k && k.keterangan ? 'ket' : 'kurang') : (def.aturan === 'opsional' ? 'opsional' : 'tidakperlu');
  return { def, files, ket: k ? k.keterangan : '', wajib, state };
}
function ringkas(p) {
  const items = S.def.map(d => cekItem(p, d));
  const W = items.filter(i => i.wajib).length, A = items.filter(i => i.wajib && i.state === 'ada').length, K = items.filter(i => i.state === 'ket').length;
  return { items, W, A, K, lengkap: A + K >= W, kurang: items.filter(i => i.state === 'kurang') };
}
const pelakuOf = id => S.pelaku.filter(x => x.idPerjadin === id);
const sortPj = ls => ls.slice().sort((a, b) => (b.berangkat || '').localeCompare(a.berangkat || '') || (b.dibuat || 0) - (a.dibuat || 0));
const diWilayahDarat = t => S.settings.wilayahDarat.some(k => String(t || '').toLowerCase().includes(k.toLowerCase()));

function rangePeriode(key, from, to) {
  const t = today();
  if (key === 'bulan') return { from: ymd(new Date(t.getFullYear(), t.getMonth(), 1)), to: ymd(new Date(t.getFullYear(), t.getMonth() + 1, 0)), label: `${BULAN[t.getMonth()]} ${t.getFullYear()}` };
  if (key === 'lalu') { const a = new Date(t.getFullYear(), t.getMonth() - 1, 1); return { from: ymd(a), to: ymd(new Date(t.getFullYear(), t.getMonth(), 0)), label: `${BULAN[a.getMonth()]} ${a.getFullYear()}` }; }
  if (key === 'tahun') return { from: `${t.getFullYear()}-01-01`, to: `${t.getFullYear()}-12-31`, label: `Tahun ${t.getFullYear()}` };
  if (key === 'custom' && from && to) { const [a, b] = from <= to ? [from, to] : [to, from]; return { from: a, to: b, label: `${fmtPanjang(a)} – ${fmtPanjang(b)}` }; }
  return { from: '0000-01-01', to: '9999-12-31', label: 'Semua waktu' };
}
const dalamRentang = (p, r) => (p.berangkat || '') <= r.to && (p.kembali || p.berangkat || '') >= r.from;

// ---------- Render ----------
const TITLES = { beranda: 'Beranda', daftar: 'Daftar Perjadin', rekap: 'Rekap', atur: 'Pengaturan' };
function render() {
  $('#topTitle').textContent = TITLES[S.view];
  const h = new Date().getHours();
  $('#topSub').textContent = S.view === 'beranda'
    ? (h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam')
    : (S.lastSync ? 'Sinkron ' + waktuLalu(S.lastSync) : '');
  $$('.view').forEach(v => v.classList.toggle('hidden', v.id !== 'view-' + S.view));
  $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === S.view));
  ({ beranda: renderBeranda, daftar: renderDaftar, rekap: renderRekap, atur: renderAtur })[S.view]();
}
function waktuLalu(ms) {
  const m = Math.round((Date.now() - ms) / 60000);
  if (m < 1) return 'barusan';
  if (m < 60) return m + ' menit lalu';
  const j = Math.round(m / 60);
  return j < 24 ? j + ' jam lalu' : Math.round(j / 24) + ' hari lalu';
}
function go(view) {
  S.view = view;
  const el = $('#view-' + view);
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  render(); window.scrollTo({ top: 0 });
}
const skeleton = () => `<div class="skel" style="height:160px;border-radius:26px;margin-bottom:14px"></div><div class="skel" style="height:84px;margin-bottom:14px"></div><div class="skel" style="height:240px"></div>`;
function emptyState(title, text, btn) {
  return `<div class="empty"><div class="empty-ic">${ICON.plane}</div><b>${title}</b><p>${text}</p>
    ${btn ? '<button class="btn btn-primary btn-sm" data-add>Upload Surat Tugas</button>' : ''}</div>`;
}
function bindCommon(root) {
  $$('[data-add]', root).forEach(b => b.onclick = () => openUploadST());
  $$('[data-open]', root).forEach(b => b.onclick = () => openDetail(b.dataset.open));
}
function pjCard(p) {
  const r = ringkas(p), names = pelakuOf(p.id).map(x => x.nama);
  return `<button class="pj ${r.lengkap ? '' : 'kurang'}" data-open="${esc(p.id)}">
    <div class="task-top"><div class="pj-no">${esc(p.nomor)}</div>
      <span class="pill ${r.lengkap ? 'st-selesai' : 'st-tertunda'}"><i></i>${r.lengkap ? 'Lengkap' : 'Kurang ' + (r.W - r.A - r.K)}</span></div>
    <div class="pj-title">${esc(p.tujuan)}</div>
    <div class="pj-meta">${rentang(p.berangkat, p.kembali)} · ${p.durasi} hari · ${p.wilayah === 'Luar' ? 'Luar wilayah' : 'Dalam wilayah'}</div>
    <div class="pj-names">👤 ${esc(names.slice(0, 3).join(', '))}${names.length > 3 ? ` +${names.length - 3}` : ''}</div>
    <div class="task-foot"><div class="bar ${r.lengkap ? 'done' : ''}"><i style="width:${r.W ? Math.round((r.A + r.K) / r.W * 100) : 0}%"></i></div><b class="num">${r.A}/${r.W}</b></div>
  </button>`;
}

// ---------- BERANDA ----------
function renderBeranda() {
  const el = $('#view-beranda');
  if (!S.loaded) { el.innerHTML = skeleton(); return; }
  const r = rangePeriode('bulan');
  const bln = S.pj.filter(p => dalamRentang(p, r));
  const plBln = S.pelaku.filter(x => bln.some(p => p.id === x.idPerjadin));
  const belum = sortPj(S.pj.filter(p => !ringkas(p).lengkap));
  const cta = `<button class="cta" data-add><div class="cta-ic">${ICON.scan}</div><div><b>Upload Surat Tugas</b>
    <span>${S.gemini ? 'Scan PDF/foto ST: AI membaca pelaku, tujuan & durasi' : 'API key Gemini belum diatur, data diisi manual'}</span></div></button>`;
  if (!S.pj.length) { el.innerHTML = cta + `<div class="card">${emptyState('Belum ada perjadin', 'Mulai dengan mengunggah scan Surat Tugas. Data pelaku, tujuan, dan durasi akan terisi otomatis.', false)}</div>`; bindCommon(el); return; }

  el.innerHTML = `
    <div class="hero">
      <p class="hero-label">Perjalanan dinas · ${esc(r.label)}</p>
      <div class="hero-amount num">${bln.length} <span style="font-size:15px;font-weight:600;opacity:.9">surat tugas</span></div>
      <div class="stat-grid">
        <div class="hero-box"><small>Hari-orang</small><b class="num">${sum(plBln, x => x.durasi)}</b></div>
        <div class="hero-box"><small>Pelaku</small><b class="num">${new Set(plBln.map(x => x.nama.toLowerCase())).size}</b></div>
        <button class="hero-box" data-belum><small>Belum lengkap</small><b class="num">${belum.length}</b></button>
      </div>
    </div>
    ${cta}
    <div class="card">
      <div class="card-title">Bukti belum lengkap ${belum.length ? `<button class="link" data-belum>Lihat semua</button>` : ''}</div>
      ${belum.length ? belum.slice(0, 5).map(p => { const k = ringkas(p).kurang; return `
        <button class="att" style="width:100%;text-align:left" data-open="${esc(p.id)}">
          <div class="att-dot" style="background:#fff7ed;color:#c2410c">${k.length}</div>
          <div style="min-width:0"><b>${esc(p.tujuan)} · ${rentang(p.berangkat, p.kembali)}</b>
          <span>Kurang: ${esc(k.map(i => i.def.jenis.split('/')[0]).join(', '))}</span></div></button>`; }).join('')
        : '<p class="muted" style="margin:0;font-size:14px">👍 Semua perjadin sudah lengkap buktinya.</p>'}
    </div>
    <div class="card">
      <div class="card-title">Terbaru</div>
      ${sortPj(S.pj).slice(0, 4).map(pjCard).join('')}
    </div>`;
  bindCommon(el);
  $$('[data-belum]', el).forEach(b => b.onclick = () => { S.filter = { q: '', status: 'belum', periode: 'semua' }; go('daftar'); });
}

// ---------- DAFTAR ----------
function renderDaftar() {
  const el = $('#view-daftar');
  if (!S.loaded) { el.innerHTML = skeleton(); return; }
  const f = S.filter;
  el.innerHTML = `
    <div class="search">${ICON.search}<input id="dq" type="search" placeholder="Cari nomor ST, tujuan, nama pelaku…" value="${esc(f.q)}"></div>
    <div class="chips">${[['semua', 'Semua'], ['belum', 'Belum lengkap'], ['lengkap', 'Lengkap']].map(([k, l]) => `<button class="chip ${f.status === k ? 'active' : ''}" data-st="${k}">${l}</button>`).join('')}</div>
    <div class="filter-row" style="grid-template-columns:1fr"><select id="dp">${[['semua', 'Semua waktu'], ['bulan', 'Bulan ini'], ['lalu', 'Bulan lalu'], ['tahun', 'Tahun ini']].map(([k, l]) => `<option value="${k}" ${f.periode === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    <div id="dList"></div>`;
  $('#dq', el).oninput = debounce(() => { f.q = $('#dq', el).value; renderDaftarList(); }, 180);
  $$('[data-st]', el).forEach(b => b.onclick = () => { f.status = b.dataset.st; renderDaftar(); });
  $('#dp', el).onchange = e => { f.periode = e.target.value; renderDaftarList(); };
  renderDaftarList();
}
function renderDaftarList() {
  const f = S.filter, box = $('#dList'), q = f.q.trim().toLowerCase(), r = rangePeriode(f.periode);
  const ls = sortPj(S.pj.filter(p => {
    if (!dalamRentang(p, r)) return false;
    const lengkap = ringkas(p).lengkap;
    if (f.status === 'belum' && lengkap) return false;
    if (f.status === 'lengkap' && !lengkap) return false;
    if (q) { const hay = (p.nomor + ' ' + p.tujuan + ' ' + p.maksud + ' ' + pelakuOf(p.id).map(x => x.nama + ' ' + x.nip).join(' ')).toLowerCase(); if (!hay.includes(q)) return false; }
    return true;
  }));
  if (!S.pj.length) { box.innerHTML = `<div class="card">${emptyState('Belum ada perjadin', 'Tekan tombol + untuk mengunggah surat tugas.', true)}</div>`; bindCommon(box); return; }
  if (!ls.length) { box.innerHTML = `<div class="card">${emptyState('Tidak ada yang cocok', 'Coba ubah kata kunci atau filter.', false)}</div>`; return; }
  let html = `<p class="hist-sum" style="margin:2px 4px 6px"><span>${ls.length} surat tugas</span><span>${sum(ls.map(p => p.durasi * Math.max(1, p.jumlah)))} hari-orang</span></p>`;
  let bulan = '';
  ls.forEach(p => {
    const b = (p.berangkat || '').slice(0, 7);
    if (b !== bulan) { bulan = b; const d = b ? parseYmd(b + '-01') : null; html += `<p class="section-label" style="margin:16px 4px 8px">${d ? BULAN[d.getMonth()] + ' ' + d.getFullYear() : 'Tanpa tanggal'}</p>`; }
    html += pjCard(p);
  });
  box.innerHTML = html; bindCommon(box);
}

// ---------- UPLOAD ST ----------
async function kompresGambar(file, max = 2400, q = 0.85) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const sc = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * sc); c.height = Math.round(img.naturalHeight * sc);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise(res => c.toBlob(res, 'image/jpeg', q));
    if (!blob) throw new Error('kompres gagal');
    return blob;
  } finally { URL.revokeObjectURL(url); }
}
const keBase64 = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });
// File besar dikirim per potongan (~570 KB) supaya tahan sinyal naik-turun.
// Potongan yang gagal dicoba ulang otomatis sampai 3 kali.
const POTONG = 786432; // panjang base64 per potongan (kelipatan 4)
const tidur = ms => new Promise(r => setTimeout(r, ms));
async function kirimIsi(b64, onProg) {
  if (b64.length <= POTONG) { onProg && onProg(0); return { base64: b64 }; }
  const uploadId = 'UP' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const total = Math.ceil(b64.length / POTONG);
  for (let i = 0; i < total; i++) {
    const data = b64.slice(i * POTONG, (i + 1) * POTONG);
    for (let coba = 1; ; coba++) {
      try { await api('unggahPotongan', { uploadId, index: i, total, data }, S.cfg, 90000); break; }
      catch (e) {
        if (!e.network || coba >= 3) throw e;
        onProg && onProg(i / total, `sinyal tersendat, mencoba lagi (${coba}/2)…`);
        await tidur(2000 * coba);
      }
    }
    onProg && onProg((i + 1) / total);
  }
  return { uploadId, total };
}
const persen = x => Math.round(x * 100) + '%';

async function siapkan(file, maxImg) {
  if (/^image\/(jpeg|png|webp)$/.test(file.type) && file.size > 400 * 1024) {
    try { return { nama: file.name.replace(/\.[^.]+$/, '') + '.jpg', tipe: 'image/jpeg', blob: await kompresGambar(file, maxImg) }; } catch (e) { /* kirim asli */ }
  }
  if (file.size > 20 * 1024 * 1024) throw new Error(`"${file.name}" lebih dari 20 MB`);
  return { nama: file.name || 'file', tipe: file.type || 'application/octet-stream', blob: file };
}

function openUploadST() {
  if (!navigator.onLine) return toast('Butuh internet untuk mengunggah surat tugas', 'err');
  openSheet(`
    ${sheetHead('Surat tugas baru')}
    <div class="drop">
      <div class="cta-ic">${ICON.scan}</div>
      <b>Unggah scan Surat Tugas</b>
      <p>${S.gemini ? 'PDF hasil scan (boleh termasuk Nota Dinas) atau foto. AI akan membaca nomor, pelaku, tujuan, dan tanggal.' : 'API key Gemini belum diatur. File tetap disimpan, data diisi manual.'}</p>
      <div class="drop-btns">
        <label class="btn btn-primary">${ICON.doc} Pilih file<input type="file" id="stFile" accept="application/pdf,image/*"></label>
        <label class="btn btn-ghost">${ICON.cam} Foto ST<input type="file" id="stCam" accept="image/*" capture="environment"></label>
      </div>
    </div>
    <div id="stProg"></div>
    <button class="btn btn-ghost btn-block btn-sm" id="stManual" style="margin-top:12px">Isi manual tanpa file</button>`, root => {
    const go = async e => {
      const file = e.target.files[0]; e.target.value = '';
      if (!file) return;
      if (!/^application\/pdf$|^image\//.test(file.type)) return toast('Pilih file PDF atau foto', 'err');
      $('.drop', root).classList.add('hidden'); $('#stManual', root).classList.add('hidden');
      const prog = $('#stProg', root);
      const langkah = (n, info = '') => {
        const L = [['Menyiapkan file', ''], ['Mengunggah ke Drive', info], ['Membaca surat tugas dengan AI', 'Biasanya 10–40 detik']];
        prog.innerHTML = `<div class="steps">${L.map(([t, s], i) => `<div class="step ${i < n ? 'ok' : i === n ? 'now' : ''}"><i>${i < n ? '✓' : ''}</i><div>${t}${i === n && s ? `<small>${s}</small>` : ''}</div></div>`).join('')}</div>`;
      };
      try {
        langkah(0);
        const p = await siapkan(file, 2400);
        if (p.blob.size > 18 * 1024 * 1024) throw new Error('File lebih dari 18 MB. Scan ulang dengan resolusi lebih kecil.');
        const b64 = await keBase64(p.blob);
        const kb = Math.round(p.blob.size / 1024) + ' KB';
        langkah(1, kb);
        const isi = await kirimIsi(b64, (x, info) => langkah(1, `${kb} · ${persen(x)}${info ? ' · ' + info : ''}`));
        langkah(2);
        const r = await api('bacaST', { nama: p.nama, tipe: p.tipe, ...isi }, S.cfg, 240000);
        langkah(3);
        setTimeout(() => openForm(null, r), 350);
      } catch (err) {
        prog.innerHTML = `<div class="notice warn">${esc(err.message)}</div>`;
        $('.drop', root).classList.remove('hidden'); $('#stManual', root).classList.remove('hidden');
      }
    };
    $('#stFile', root).onchange = go; $('#stCam', root).onchange = go;
    $('#stManual', root).onclick = () => openForm(null, null);
  });
}

// ---------- FORM REVIEW / UBAH ----------
function openForm(edit, ai) {
  const h = ai && ai.hasil;
  const f = edit ? { ...edit, pelaku: pelakuOf(edit.id).map(x => ({ nama: x.nama, nip: x.nip, jabatan: x.jabatan })) } : {
    nomor: h ? h.nomor : '', tanggalST: h ? h.tanggalST : '', tujuan: h ? h.tujuan : '', maksud: h ? h.maksud : '',
    berangkat: h ? h.berangkat : '', kembali: h ? h.kembali : '', pelaku: h && h.pelaku.length ? h.pelaku : [{ nama: '', nip: '', jabatan: '' }],
    wilayah: ai && ai.wilayah ? ai.wilayah : 'Dalam', kendaraan: 'Tidak'
  };
  let wilayahManual = !!edit;
  const durasi = () => (f.berangkat ? diffDays(f.berangkat, f.kembali || f.berangkat) + 1 : 0);
  const pelHtml = () => f.pelaku.map((p, i) => `
    <div class="pel-row"><span class="pel-num">PELAKU ${i + 1}</span>
      ${f.pelaku.length > 1 ? `<button type="button" class="x-btn" data-delp="${i}" aria-label="Hapus pelaku">${ICON.close}</button>` : ''}
      <input class="nama" data-p="${i}" data-k="nama" placeholder="Nama lengkap & gelar" value="${esc(p.nama)}">
      <input data-p="${i}" data-k="nip" inputmode="numeric" placeholder="NIP (kosongkan jika tidak ada)" value="${esc(p.nip)}">
      <input data-p="${i}" data-k="jabatan" placeholder="Jabatan" value="${esc(p.jabatan)}">
    </div>`).join('');
  const seg = (id, val, a, b, la, lb) => `<div class="seg" id="${id}" data-v="${val === b ? 'pemasukan' : 'pengeluaran'}"><span class="seg-ind"></span>
    <button type="button" data-v="${a}" style="${val === a ? 'color:var(--pri)' : ''}">${la}</button><button type="button" data-v="${b}" style="${val === b ? 'color:var(--pri)' : ''}">${lb}</button></div>`;

  openSheet(`
    ${sheetHead(edit ? 'Ubah data perjadin' : 'Periksa data surat tugas')}
    ${h ? `<div class="notice ai">✨ Dibaca otomatis oleh AI${ai.model ? ' (' + esc(ai.model) + ')' : ''}. Periksa sekali lagi sebelum menyimpan.</div>` : ''}
    ${h && h.peringatan ? `<div class="notice warn">⚠️ ${esc(h.peringatan)}</div>` : ''}
    ${ai && ai.pesan ? `<div class="notice warn">${esc(ai.pesan)}</div>` : ''}
    <form id="pForm" novalidate>
      <label class="field"><span>Nomor ST *</span><input id="fNomor" value="${esc(f.nomor)}" placeholder="133/B/ST/Gs36/PAPUA/2026"></label>
      <div class="row2">
        <label class="field"><span>Tanggal ST</span><input type="date" id="fTglST" value="${f.tanggalST || ''}"></label>
        <label class="field"><span>Tujuan *</span><input id="fTujuan" value="${esc(f.tujuan)}" placeholder="Kab. Mappi"></label>
      </div>
      <div class="row2">
        <label class="field"><span>Berangkat *</span><input type="date" id="fBrk" value="${f.berangkat || ''}"></label>
        <label class="field"><span>Kembali</span><input type="date" id="fKmb" value="${f.kembali || ''}"></label>
      </div>
      <p class="muted" style="margin:-6px 2px 12px;font-size:13px" id="fDur"></p>
      <label class="field"><span>Maksud perjalanan</span><textarea id="fMaksud" maxlength="500" placeholder="Mis. Pengawasan pekerjaan fisik PHTC Madrasah">${esc(f.maksud)}</textarea></label>

      <div class="lbl"><span>Pelaku (${f.pelaku.length})</span></div>
      <div id="fPel">${pelHtml()}</div>
      <button type="button" class="btn btn-ghost btn-block btn-sm" id="fAddPel" style="margin-bottom:16px">+ Tambah pelaku</button>

      <div class="lbl"><span>Wilayah</span><span id="fWilInfo" style="font-weight:600"></span></div>
      ${seg('fWil', f.wilayah, 'Dalam', 'Luar', 'Dalam wilayah kerja', 'Luar wilayah kerja')}
      <div class="lbl"><span>Memakai kendaraan pribadi?</span></div>
      ${seg('fKdr', f.kendaraan, 'Tidak', 'Ya', 'Tidak', 'Ya')}
      <p class="form-err" id="fErr"></p>
      <button class="btn btn-primary btn-block" type="submit" id="fSave">${edit ? 'Simpan perubahan' : 'Simpan perjadin'}</button>
    </form>`, root => {
    const upDur = () => {
      const n = durasi();
      $('#fDur', root).innerHTML = n > 0 ? `Durasi: <b>${n} hari</b>${h && h.lamaHari && h.lamaHari !== n && !edit ? ` · <span style="color:#c2410c">di dokumen tertulis ${h.lamaHari} hari</span>` : ''}` : (f.berangkat && f.kembali < f.berangkat ? '<span style="color:#dc2626">Tanggal kembali sebelum berangkat</span>' : '');
    };
    const setSeg = (id, v) => {
      const s = $('#' + id, root); const vals = $$('button', s).map(b => b.dataset.v);
      s.dataset.v = v === vals[1] ? 'pemasukan' : 'pengeluaran';
      $$('button', s).forEach(b => b.style.color = b.dataset.v === v ? 'var(--pri)' : '');
    };
    const upWil = () => {
      if (wilayahManual || !f.tujuan) { $('#fWilInfo', root).textContent = ''; return; }
      f.wilayah = diWilayahDarat(f.tujuan) ? 'Dalam' : 'Luar'; setSeg('fWil', f.wilayah);
      $('#fWilInfo', root).textContent = 'terdeteksi otomatis';
    };
    const bindPel = () => {
      $$('[data-p]', root).forEach(inp => inp.oninput = () => { f.pelaku[+inp.dataset.p][inp.dataset.k] = inp.dataset.k === 'nip' ? inp.value.replace(/\D/g, '') : inp.value; });
      $$('[data-delp]', root).forEach(b => b.onclick = () => { f.pelaku.splice(+b.dataset.delp, 1); $('#fPel', root).innerHTML = pelHtml(); bindPel(); });
    };
    bindPel(); upDur(); if (!edit) upWil();
    $('#fAddPel', root).onclick = () => { f.pelaku.push({ nama: '', nip: '', jabatan: '' }); $('#fPel', root).innerHTML = pelHtml(); bindPel(); $$('.nama', root).pop().focus(); };
    $('#fBrk', root).onchange = e => { f.berangkat = e.target.value; if (!f.kembali || f.kembali < f.berangkat) { f.kembali = f.berangkat; $('#fKmb', root).value = f.kembali; } upDur(); };
    $('#fKmb', root).onchange = e => { f.kembali = e.target.value; upDur(); };
    $('#fTujuan', root).oninput = e => { f.tujuan = e.target.value; upWil(); };
    $$('#fWil button', root).forEach(b => b.onclick = () => { wilayahManual = true; f.wilayah = b.dataset.v; setSeg('fWil', f.wilayah); $('#fWilInfo', root).textContent = ''; });
    $$('#fKdr button', root).forEach(b => b.onclick = () => { f.kendaraan = b.dataset.v; setSeg('fKdr', f.kendaraan); });
    $('#pForm', root).onsubmit = async e => {
      e.preventDefault();
      Object.assign(f, { nomor: $('#fNomor', root).value.trim(), tanggalST: $('#fTglST', root).value, tujuan: $('#fTujuan', root).value.trim(),
        maksud: $('#fMaksud', root).value.trim(), berangkat: $('#fBrk', root).value, kembali: $('#fKmb', root).value || $('#fBrk', root).value });
      const err = $('#fErr', root);
      const pel = f.pelaku.filter(p => p.nama.trim());
      const salah = !f.nomor ? 'Nomor ST wajib diisi' : !f.tujuan ? 'Tujuan wajib diisi' : !f.berangkat ? 'Tanggal berangkat wajib diisi'
        : f.kembali < f.berangkat ? 'Tanggal kembali tidak boleh sebelum berangkat' : !pel.length ? 'Minimal 1 nama pelaku' : '';
      if (salah) { err.textContent = salah; if (navigator.vibrate) navigator.vibrate(30); return; }
      err.textContent = '';
      const data = { ...f, pelaku: pel, id: edit ? edit.id : undefined, stFileId: ai ? ai.fileId : '' };
      await kirimPerjadin(data, $('#fSave', root), !!edit);
    };
  });
}
async function kirimPerjadin(data, btn, isEdit) {
  setBusy(btn, true, 'Menyimpan…');
  try {
    const pk = await api('simpanPerjadin', data, S.cfg, 60000);
    terapkanPaket(pk); closeSheet(true); render();
    toast(isEdit ? 'Perubahan tersimpan' : 'Perjadin tersimpan. Lanjut unggah bukti', 'ok');
    setTimeout(() => openDetail(pk.perjadin.id), 280);
  } catch (e) {
    setBusy(btn, false);
    if (/^DUPLIKAT/.test(e.message)) {
      const ok = await confirmDialog('Nomor ST sudah ada', e.message.replace('DUPLIKAT: ', '') + ' Tetap simpan sebagai data baru?', 'Tetap simpan');
      if (ok) return kirimPerjadin({ ...data, paksa: true }, btn, isEdit);
      return;
    }
    toast(e.network ? 'Butuh internet untuk menyimpan' : e.message, 'err');
  }
}

// ---------- DETAIL & CHECKLIST BUKTI ----------
function openDetail(id, keepScroll) {
  const p = S.pj.find(x => x.id === id);
  if (!p) return;
  const scroll = keepScroll ? $('#sheet').scrollTop : 0;
  const r = ringkas(p), pl = pelakuOf(id);
  const iconOf = { ada: '✓', ket: 'i', kurang: '!', opsional: '–', tidakperlu: '–' };
  const hint = it => it.state === 'tidakperlu' ? 'Tidak diperlukan untuk perjadin ini' : ATURAN_TXT[it.def.aturan];
  openSheet(`
    ${sheetHead('Detail perjadin')}
    <div class="pj-no">${esc(p.nomor)}${p.tanggalST ? ' · ' + fmtTgl(p.tanggalST) : ''}</div>
    <h3 class="detail-title" style="margin-top:2px">${esc(p.tujuan)}</h3>
    <div class="task-pills" style="margin-top:0">
      <span class="pill ${r.lengkap ? 'st-selesai' : 'st-tertunda'}"><i></i>${r.lengkap ? 'Lengkap' : 'Belum lengkap'}</span>
      <span class="pill pill-soft">${p.wilayah === 'Luar' ? 'Luar wilayah' : 'Dalam wilayah'}</span>
      <span class="pill pill-soft">${p.kendaraan === 'Ya' ? 'Kendaraan pribadi' : 'Tanpa kendaraan pribadi'}</span>
    </div>
    <div class="big-progress"><b class="num">${r.A}/${r.W}</b><div class="bar ${r.lengkap ? 'done' : ''}"><i style="width:${r.W ? Math.round((r.A + r.K) / r.W * 100) : 0}%"></i></div></div>
    <div class="kv"><span class="muted">Tanggal</span><span>${rentang(p.berangkat, p.kembali)}</span></div>
    <div class="kv"><span class="muted">Durasi</span><span>${p.durasi} hari</span></div>
    ${p.maksud ? `<div class="kv" style="display:block"><span class="muted" style="display:block;margin-bottom:3px">Maksud</span><span style="font-weight:500;text-align:left;display:block">${esc(p.maksud)}</span></div>` : ''}

    <div class="sec-title"><span>Pelaku (${pl.length})</span></div>
    ${pl.map((x, i) => `<div class="att"><div class="att-dot">${i + 1}</div><div style="min-width:0"><b>${esc(x.nama)}</b><span>${x.nip ? 'NIP ' + esc(x.nip) : 'Tanpa NIP'}${x.jabatan ? ' · ' + esc(x.jabatan) : ''}</span></div></div>`).join('')}

    <div class="sec-title"><span>Checklist bukti</span>${p.folder ? `<a class="link" href="${esc(p.folder)}" target="_blank" rel="noopener">Folder Drive</a>` : ''}</div>
    <div class="card" style="padding:4px 14px;margin-bottom:0">
    ${r.items.map((it, i) => `
      <div class="ck" data-i="${i}">
        <div class="ck-top">
          <div class="ck-ic ${it.state}">${iconOf[it.state]}</div>
          <div class="ck-main"><b>${esc(it.def.jenis)}</b><small style="${it.state === 'kurang' ? 'color:#dc2626' : ''}">${hint(it)}${it.files.length ? ' · ' + it.files.length + ' file' : ''}</small></div>
          <div class="ck-act">
            <label aria-label="Foto">${ICON.cam}<input type="file" accept="image/*" capture="environment" data-up="${i}"></label>
            <label aria-label="File">${ICON.clip}<input type="file" multiple accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx" data-up="${i}"></label>
          </div>
        </div>
        ${it.files.length ? `<div class="ck-files">${it.files.map(b => `<a class="fchip" href="${esc(b.url)}" target="_blank" rel="noopener"><span>${b.pelaku ? '👤 ' + esc(b.pelaku) + ' · ' : ''}${esc(b.nama)}</span><button class="x-btn" data-delb="${esc(b.id)}" aria-label="Hapus">${ICON.close}</button></a>`).join('')}</div>` : ''}
        <div class="ck-extra" id="up${i}"></div>
        ${it.def.perPelaku && pl.length > 1 ? `<div class="ck-extra"><select data-pel="${i}"><option value="">Untuk: semua / rombongan</option>${pl.map(x => `<option>${esc(x.nama)}</option>`).join('')}</select></div>` : ''}
        ${it.wajib && !it.files.length ? `<div class="ck-extra"><input data-ket="${i}" maxlength="500" placeholder="Keterangan jika tidak dilampirkan…" value="${esc(it.ket)}"></div>` : ''}
      </div>`).join('')}
    </div>

    <div class="btn-row" style="grid-template-columns:auto 1fr 1fr;margin-top:18px">
      <button class="btn btn-danger" id="dDel" aria-label="Hapus perjadin">${ICON.trash}</button>
      <button class="btn btn-ghost" id="dEdit">Ubah data</button>
      <button class="btn btn-primary" id="dPrint">${ICON.print} Tanda terima</button>
    </div>`, root => {
    root.scrollTop = scroll;
    $('#dEdit', root).onclick = () => { closeSheet(true); setTimeout(() => openForm(p, null), 260); };
    $('#dPrint', root).onclick = () => cetakTandaTerima(p);
    $('#dDel', root).onclick = async () => {
      const ok = await confirmDialog('Hapus data perjadin ini?', `${p.nomor} (${p.tujuan}) beserta daftar pelaku & bukti akan dihapus dari spreadsheet. File di Google Drive tetap aman.`, 'Ya, hapus');
      if (!ok) return;
      try {
        await api('hapusPerjadin', { id });
        S.pj = S.pj.filter(x => x.id !== id); ['pelaku', 'bukti', 'ket'].forEach(k => S[k] = S[k].filter(x => x.idPerjadin !== id));
        saveCache(); closeSheet(); render(); toast('Data perjadin dihapus', 'ok');
      } catch (e) { toast(e.network ? 'Butuh internet untuk menghapus' : e.message, 'err'); }
    };
    $$('[data-up]', root).forEach(inp => inp.onchange = e => {
      const files = [...e.target.files]; e.target.value = '';
      const i = +inp.dataset.up, sel = $(`[data-pel="${i}"]`, root);
      if (files.length) unggahBukti(p, r.items[i].def.jenis, sel ? sel.value : '', files, $('#up' + i, root));
    });
    $$('[data-delb]', root).forEach(b => b.onclick = async e => {
      e.preventDefault(); e.stopPropagation();
      const bk = S.bukti.find(x => x.id === b.dataset.delb);
      const ok = await confirmDialog('Hapus bukti ini?', `"${bk ? bk.nama : ''}" dipindah ke Sampah Google Drive (bisa dipulihkan 30 hari).`, 'Hapus');
      if (!ok) return;
      try {
        await api('hapusBukti', { id: b.dataset.delb });
        S.bukti = S.bukti.filter(x => x.id !== b.dataset.delb); perbaruiStatus(p.id); saveCache(); openDetail(id, true); render(); toast('Bukti dihapus', 'ok');
      } catch (err) { toast(err.network ? 'Butuh internet untuk menghapus' : err.message, 'err'); }
    });
    $$('[data-ket]', root).forEach(inp => inp.onchange = async () => {
      const it = r.items[+inp.dataset.ket], v = inp.value.trim();
      if (v === (it.ket || '')) return;
      it.ket = v;
      try {
        await api('simpanKeterangan', { idPerjadin: id, jenis: it.def.jenis, keterangan: v });
        S.ket = S.ket.filter(x => !(x.idPerjadin === id && x.jenis === it.def.jenis));
        if (v) S.ket.push({ idPerjadin: id, nomor: p.nomor, jenis: it.def.jenis, keterangan: v, diubah: Date.now() });
        perbaruiStatus(id); saveCache(); openDetail(id, true); render(); toast('Keterangan disimpan', 'ok');
      } catch (e) { toast(e.network ? 'Butuh internet untuk menyimpan' : e.message, 'err'); }
    });
  });
}
function perbaruiStatus(id) {
  const p = S.pj.find(x => x.id === id); if (!p) return;
  const r = ringkas(p);
  p.kelengkapan = `${r.A}/${r.W} wajib${r.K ? ', ' + r.K + ' berketerangan' : ''}`; p.status = r.lengkap ? 'Lengkap' : 'Belum Lengkap';
}
async function unggahBukti(p, jenis, pelaku, files, box) {
  if (!navigator.onLine) return toast('Butuh internet untuk mengunggah', 'err');
  let ok = 0;
  for (let i = 0; i < files.length; i++) {
    const tampil = ket => { if (box) box.innerHTML = `<span class="fchip up"><span class="spinner" style="width:14px;height:14px;border:2px solid #bfdbfe;border-top-color:#2563eb;border-radius:50%;animation:spin .7s linear infinite"></span><span>${files.length > 1 ? `File ${i + 1}/${files.length} · ` : ''}${esc(ket)}</span></span>`; };
    tampil('Menyiapkan ' + files[i].name);
    try {
      const s = await siapkan(files[i], 1920);
      const b64 = await keBase64(s.blob);
      const kb = Math.round(s.blob.size / 1024);
      const isi = await kirimIsi(b64, (x, info) => tampil(`Mengunggah ${kb} KB · ${persen(x)}${info ? ' · ' + info : ''}`));
      tampil('Menyimpan ke Drive…');
      const r = await api('unggahBukti', { idPerjadin: p.id, jenis, pelaku, nama: s.nama, tipe: s.tipe, ...isi }, S.cfg, 180000);
      S.bukti.push(r.bukti); ok++;
    } catch (e) { toast('Gagal unggah: ' + e.message, 'err'); }
  }
  if (box) box.innerHTML = '';
  perbaruiStatus(p.id); saveCache();
  if (ok) toast(`${ok} file terunggah: ${jenis.split('/')[0]}`, 'ok');
  if (sheetOpen) openDetail(p.id, true);
  render();
}

// ---------- REKAP ----------
function dataRekap() {
  const R = S.rekap, r = rangePeriode(R.periode, R.from, R.to);
  const pj = sortPj(S.pj.filter(p => dalamRentang(p, r))).reverse();
  const ids = new Set(pj.map(p => p.id));
  const pl = S.pelaku.filter(x => ids.has(x.idPerjadin));
  const perOrang = {};
  pl.forEach(x => {
    const k = x.nama.trim().toLowerCase();
    const o = perOrang[k] = perOrang[k] || { nama: x.nama, nip: '', jabatan: '', st: 0, hari: 0, tujuan: [] };
    o.nip = o.nip || x.nip; o.jabatan = o.jabatan || x.jabatan; o.st++; o.hari += Number(x.durasi) || 0;
    if (!o.tujuan.includes(x.tujuan)) o.tujuan.push(x.tujuan);
  });
  const perTujuan = {};
  pj.forEach(p => { const o = perTujuan[p.tujuan] = perTujuan[p.tujuan] || { tujuan: p.tujuan, st: 0, hariOrang: 0 }; o.st++; o.hariOrang += p.durasi * Math.max(1, p.jumlah); });
  return {
    r, pj, pl,
    orang: Object.values(perOrang).sort((a, b) => b.hari - a.hari || a.nama.localeCompare(b.nama)),
    tujuan: Object.values(perTujuan).sort((a, b) => b.st - a.st),
    belum: pj.filter(p => !ringkas(p).lengkap).length
  };
}
function renderRekap() {
  const el = $('#view-rekap');
  if (!S.loaded) { el.innerHTML = skeleton(); return; }
  const R = S.rekap, D = dataRekap();
  el.innerHTML = `
    <div class="chips">${[['bulan', 'Bulan ini'], ['lalu', 'Bulan lalu'], ['tahun', 'Tahun ini'], ['custom', 'Pilih tanggal'], ['semua', 'Semua']].map(([k, l]) => `<button class="chip ${R.periode === k ? 'active' : ''}" data-per="${k}">${l}</button>`).join('')}</div>
    ${R.periode === 'custom' ? `<div class="row2"><label class="field"><span>Dari</span><input type="date" id="rFrom" value="${R.from}"></label><label class="field"><span>Sampai</span><input type="date" id="rTo" value="${R.to}"></label></div>` : ''}
    <div class="card">
      <div class="rep-head"><b>Rekap perjalanan dinas</b><div class="muted" style="font-size:13px">${esc(D.r.label)}</div></div>
      <div class="rep-tiles">
        <div><b>${D.pj.length}</b><small>Surat tugas</small></div>
        <div><b>${sum(D.pl, x => x.durasi)}</b><small>Hari-orang</small></div>
        <div><b style="color:#c2410c">${D.belum}</b><small>Belum lengkap</small></div>
      </div>
    </div>
    <div class="seg" data-v="${R.tab === 'tujuan' ? 'pemasukan' : 'pengeluaran'}" id="rTab" style="${R.tab === 'st' ? 'display:none' : ''}">
      <span class="seg-ind"></span><button type="button" data-t="pelaku" style="${R.tab === 'pelaku' ? 'color:var(--pri)' : ''}">Per pelaku</button><button type="button" data-t="tujuan" style="${R.tab === 'tujuan' ? 'color:var(--pri)' : ''}">Per tujuan</button>
    </div>
    <div class="card">
      ${!D.pj.length ? emptyState('Tidak ada perjadin', 'Tidak ada surat tugas di periode ini.', false)
        : R.tab === 'tujuan' ? D.tujuan.map(t => `<div class="rk"><div><b>${esc(t.tujuan)}</b><small>${t.st} surat tugas</small></div><div class="num-big"><b>${t.hariOrang}</b><small>hari-orang</small></div></div>`).join('')
        : D.orang.map(o => `<div class="rk"><div style="min-width:0"><b>${esc(o.nama)}</b><small>${o.nip ? 'NIP ' + esc(o.nip) : 'Tanpa NIP'} · ${o.st} ST</small><small>${esc(o.tujuan.join(', '))}</small></div><div class="num-big"><b>${o.hari}</b><small>hari</small></div></div>`).join('')}
    </div>
    <div class="btn-row" style="grid-template-columns:1fr 1fr 1fr;margin-top:0">
      <button class="btn btn-ghost btn-sm" id="rCsv" ${D.pj.length ? '' : 'disabled'}>Unduh Excel</button>
      <button class="btn btn-ghost btn-sm" id="rShare" ${D.pj.length ? '' : 'disabled'}>Bagikan</button>
      <button class="btn btn-primary btn-sm" id="rPrint" ${D.pj.length ? '' : 'disabled'}>Cetak/PDF</button>
    </div>
    <p class="muted" style="font-size:12px;text-align:center;margin-top:10px">Excel berbentuk CSV per pelaku. Untuk PDF, pilih printer "Simpan sebagai PDF".</p>`;
  $$('[data-per]', el).forEach(b => b.onclick = () => {
    R.periode = b.dataset.per;
    if (R.periode === 'custom' && !R.from) { R.from = ymd(new Date(today().getFullYear(), today().getMonth(), 1)); R.to = todayStr(); }
    renderRekap();
  });
  const fr = $('#rFrom', el), to = $('#rTo', el);
  if (fr) fr.onchange = e => { R.from = e.target.value; renderRekap(); };
  if (to) to.onchange = e => { R.to = e.target.value; renderRekap(); };
  $$('#rTab button', el).forEach(b => b.onclick = () => { R.tab = b.dataset.t; renderRekap(); });
  $('#rPrint', el).onclick = cetakRekap;
  $('#rCsv', el).onclick = unduhCsv;
  $('#rShare', el).onclick = bagikanRekap;
}

function unduhCsv() {
  const D = dataRekap();
  const q = v => (v && v.raw) ? v.raw : `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [['No', 'Nomor ST', 'Tanggal ST', 'Nama', 'NIP', 'Jabatan', 'Tujuan', 'Berangkat', 'Kembali', 'Durasi (hari)', 'Wilayah', 'Kelengkapan', 'Status']];
  let no = 0;
  D.pj.forEach(p => {
    const r = ringkas(p);
    pelakuOf(p.id).forEach(x => rows.push([++no, p.nomor, fmtTgl(p.tanggalST), x.nama, x.nip ? { raw: '="' + x.nip + '"' } : '', x.jabatan, p.tujuan, fmtTgl(p.berangkat), fmtTgl(p.kembali), p.durasi, p.wilayah, `${r.A}/${r.W}`, r.lengkap ? 'Lengkap' : 'Belum Lengkap']));
  });
  const csv = '﻿' + 'sep=;\r\n' + rows.map(r => r.map(q).join(';')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `Rekap Perjadin - ${D.r.label}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('File rekap diunduh', 'ok');
}

async function bagikanRekap() {
  const D = dataRekap();
  const L = [`*Rekap Perjalanan Dinas*`, D.r.label, `${D.pj.length} surat tugas · ${sum(D.pl, x => x.durasi)} hari-orang · ${D.belum} belum lengkap`, ''];
  D.pj.forEach((p, i) => {
    const r = ringkas(p);
    L.push(`${i + 1}. ${p.tujuan} · ${rentang(p.berangkat, p.kembali)} (${p.durasi} hr)`, `   ${p.nomor}`, `   ${pelakuOf(p.id).map(x => x.nama).join(', ')}`,
      `   Bukti: ${r.lengkap ? 'lengkap ✅' : 'kurang ' + r.kurang.map(k => k.def.jenis.split('/')[0]).join(', ') + ' ⚠️'}`);
  });
  const text = L.join('\n');
  try {
    if (navigator.share) { await navigator.share({ text }); return; }
    await navigator.clipboard.writeText(text); toast('Ringkasan disalin', 'ok');
  } catch (e) { if (e.name !== 'AbortError') { try { await navigator.clipboard.writeText(text); toast('Ringkasan disalin', 'ok'); } catch (_) { toast('Tidak bisa membagikan', 'err'); } } }
}

function cetak(html) {
  $('#printArea').innerHTML = html;
  document.body.classList.add('printing');   // hanya berpengaruh saat mencetak
  setTimeout(() => window.print(), 60);
}
const ttd = () => `<div class="ttd"><p>${esc(S.pref.kota || 'Jayapura')}, ${fmtPanjang(todayStr())}</p><p>${esc(S.pref.jabatan || '')}</p><div class="sp"></div><p><b><u>${esc(S.pref.penerima || '(nama)')}</u></b></p></div>`;

function cetakRekap() {
  const D = dataRekap();
  cetak(`
    <div class="kop"><h1>REKAP PERJALANAN DINAS</h1><p>${esc(S.pref.instansi)}</p><p>Periode: <b>${esc(D.r.label)}</b></p></div>
    <div class="ringkas"><span>Jumlah surat tugas: <b>${D.pj.length}</b></span><span>Total hari-orang: <b>${sum(D.pl, x => x.durasi)}</b></span><span>Pelaku: <b>${D.orang.length}</b></span><span>Bukti belum lengkap: <b>${D.belum}</b></span></div>
    <h2>A. Daftar surat tugas</h2>
    <table><thead><tr><th style="width:22px">No</th><th>Nomor ST</th><th>Tujuan</th><th style="width:90px">Tanggal</th><th style="width:30px">Hari</th><th>Pelaku</th><th style="width:70px">Bukti</th></tr></thead>
    <tbody>${D.pj.map((p, i) => { const r = ringkas(p); return `<tr><td>${i + 1}</td><td>${esc(p.nomor)}</td><td>${esc(p.tujuan)}${p.maksud ? `<br><small>${esc(p.maksud)}</small>` : ''}</td><td>${rentang(p.berangkat, p.kembali)}</td><td class="c">${p.durasi}</td>
      <td><ul>${pelakuOf(p.id).map(x => `<li>${esc(x.nama)}</li>`).join('')}</ul></td><td>${r.lengkap ? 'Lengkap' : 'Kurang ' + r.kurang.length}<br><small>${r.A}/${r.W} wajib</small></td></tr>`; }).join('')}</tbody></table>
    <h2>B. Rekap per pelaku</h2>
    <table><thead><tr><th style="width:22px">No</th><th>Nama</th><th>NIP</th><th>Jabatan</th><th style="width:40px">Jml ST</th><th style="width:40px">Total hari</th><th>Tujuan</th></tr></thead>
    <tbody>${D.orang.map((o, i) => `<tr><td>${i + 1}</td><td>${esc(o.nama)}</td><td>${esc(o.nip) || '—'}</td><td>${esc(o.jabatan)}</td><td class="c">${o.st}</td><td class="c">${o.hari}</td><td>${esc(o.tujuan.join(', '))}</td></tr>`).join('')}</tbody></table>
    ${ttd()}`);
}

function cetakTandaTerima(p) {
  const r = ringkas(p), pl = pelakuOf(p.id);
  cetak(`
    <div class="kop"><h1>TANDA TERIMA KEGIATAN PERJALANAN DINAS</h1><p>${esc(S.pref.instansi)}</p></div>
    <table class="tt-head" style="border:0"><tbody>
      <tr><td style="width:120px">Nomor ST</td><td>: ${esc(p.nomor)}</td></tr>
      <tr><td>Tujuan</td><td>: ${esc(p.tujuan)}</td></tr>
      <tr><td>Tanggal</td><td>: ${rentang(p.berangkat, p.kembali)} (${p.durasi} hari)</td></tr>
      <tr><td style="vertical-align:top">Nama pelaku</td><td>${pl.map((x, i) => `${i ? '' : ': '}${i + 1}. ${esc(x.nama)}${x.nip ? ' / ' + esc(x.nip) : ''}`).join('<br>&nbsp;&nbsp;')}</td></tr>
    </tbody></table>
    <table><thead><tr><th style="width:24px">No</th><th>Jenis bukti</th><th style="width:44px">Ada</th><th style="width:44px">Tidak</th><th>Keterangan</th></tr></thead>
    <tbody>${r.items.map((it, i) => `<tr><td>${i + 1}</td><td>${esc(it.def.jenis)}</td><td class="c">${it.state === 'ada' ? '✓' : ''}</td><td class="c">${it.state === 'ada' ? '' : '✓'}</td>
      <td>${it.state === 'ada' ? it.files.length + ' file' : it.state === 'ket' ? esc(it.ket) : it.state === 'kurang' ? 'Belum dilampirkan' : it.state === 'tidakperlu' ? 'Tidak diperlukan' : 'Opsional'}</td></tr>`).join('')}</tbody></table>
    <p style="margin-top:8px">Status kelengkapan: <b>${r.lengkap ? 'Lengkap' : 'Belum lengkap'}</b> (${r.A}/${r.W} bukti wajib${r.K ? ', ' + r.K + ' berketerangan' : ''})</p>
    <div class="ttd2"><div><p>&nbsp;<br>Yang menyerahkan,</p><div class="sp"></div><p><b><u>${esc(pl[0] ? pl[0].nama : '(nama)')}</u></b></p></div>
      <div><p>${esc(S.pref.kota || 'Jayapura')}, ${fmtPanjang(todayStr())}<br>Yang menerima,</p><div class="sp"></div><p><b><u>${esc(S.pref.penerima || '(nama)')}</u></b><br>${esc(S.pref.jabatan || '')}</p></div></div>`);
}

// ---------- PENGATURAN ----------
function renderAtur() {
  const el = $('#view-atur'), s = S.settings, P = S.pref;
  el.innerHTML = `
    <p class="section-label">Wilayah kerja darat</p>
    <div class="card set-list">
      <p class="muted" style="font-size:13px;margin:0 0 10px">Tujuan yang mengandung kata ini dianggap <b>dalam wilayah kerja</b>. Selain itu dianggap luar wilayah (wajib invoice pesawat & boarding pass).</p>
      <div class="chip-grid">${s.wilayahDarat.map((v, i) => `<span class="chip">${esc(v)}<button class="chip-x" data-del="${i}" aria-label="Hapus">×</button></span>`).join('') || '<span class="muted" style="font-size:13px">Belum ada</span>'}</div>
      <form class="add-row" id="addWil"><input placeholder="Mis. Sentani" maxlength="60"><button class="btn btn-primary btn-sm" type="submit">Tambah</button></form>
    </div>
    <p class="section-label">Aturan bukti (dari Code.gs)</p>
    <div class="card">${S.def.map(d => `<div class="kv"><span>${esc(d.jenis)}</span><span class="muted" style="font-weight:500;font-size:12.5px">${ATURAN_TXT[d.aturan]}</span></div>`).join('')}</div>
    <p class="section-label">Identitas cetak</p>
    <div class="card">
      <label class="field"><span>Instansi / satker</span><input id="pInst" value="${esc(P.instansi)}"></label>
      <label class="field"><span>Nama penerima / penyusun</span><input id="pNama" value="${esc(P.penerima)}" placeholder="Nama lengkap"></label>
      <div class="row2"><label class="field"><span>Jabatan</span><input id="pJab" value="${esc(P.jabatan)}"></label><label class="field"><span>Kota</span><input id="pKota" value="${esc(P.kota)}"></label></div>
      <button class="btn btn-ghost btn-block btn-sm" id="pSave">Simpan identitas</button>
    </div>
    <p class="section-label">Koneksi</p>
    <div class="card">
      <div class="kv"><span class="muted">Status</span><span>${navigator.onLine ? '🟢 Online' : '🟠 Offline'}</span></div>
      <div class="kv"><span class="muted">AI pembaca ST</span><span>${S.gemini ? '✨ Gemini aktif' : '⚠️ API key belum diatur'}</span></div>
      <div class="kv"><span class="muted">Sinkron terakhir</span><span>${S.lastSync ? waktuLalu(S.lastSync) : '—'}</span></div>
      <div class="kv"><span class="muted">ST · pelaku · bukti</span><span>${S.pj.length} · ${S.pelaku.length} · ${S.bukti.length}</span></div>
      <div class="btn-row">
        ${S.urlSheet ? `<a class="btn btn-ghost btn-sm" href="${esc(S.urlSheet)}" target="_blank" rel="noopener">Buka Sheet</a>` : '<span></span>'}
        ${S.urlFolder ? `<a class="btn btn-ghost btn-sm" href="${esc(S.urlFolder)}" target="_blank" rel="noopener">Folder Drive</a>` : '<span></span>'}
      </div>
      <button class="btn btn-ghost btn-block btn-sm" id="sSync" style="margin-top:10px">Sinkron sekarang</button>
      <button class="btn btn-danger btn-block btn-sm" id="sLogout" style="margin-top:10px">Putuskan perangkat ini</button>
    </div>
    <p class="muted" style="text-align:center;font-size:12px;margin-top:18px">Rekap Perjadin v1.0 · Data di Google Sheets & Drive milikmu</p>`;
  const simpanWil = async (list, pesan) => {
    const lama = S.settings; S.settings = { wilayahDarat: list }; renderAtur();
    try { S.settings = await api('simpanPengaturan', { wilayahDarat: list }); saveCache(); renderAtur(); toast(pesan, 'ok'); }
    catch (e) { S.settings = lama; renderAtur(); toast(e.network ? 'Butuh internet' : e.message, 'err'); }
  };
  $('#addWil', el).onsubmit = e => {
    e.preventDefault(); const v = $('#addWil input', el).value.trim();
    if (!v) return; if (s.wilayahDarat.some(x => x.toLowerCase() === v.toLowerCase())) return toast('Sudah ada', 'err');
    simpanWil([...s.wilayahDarat, v], `"${v}" ditambahkan`);
  };
  $$('[data-del]', el).forEach(b => b.onclick = async () => {
    const v = s.wilayahDarat[+b.dataset.del];
    if (await confirmDialog(`Hapus "${v}"?`, 'Perjadin yang sudah tersimpan tidak berubah. Hanya berlaku untuk deteksi berikutnya.', 'Hapus'))
      simpanWil(s.wilayahDarat.filter((_, j) => j !== +b.dataset.del), `"${v}" dihapus`);
  });
  $('#pSave', el).onclick = () => {
    Object.assign(S.pref, { instansi: $('#pInst', el).value.trim(), penerima: $('#pNama', el).value.trim(), jabatan: $('#pJab', el).value.trim(), kota: $('#pKota', el).value.trim() });
    store(LS.pref, S.pref); toast('Identitas cetak disimpan', 'ok');
  };
  $('#sSync', el).onclick = () => sync(false);
  $('#sLogout', el).onclick = async () => {
    if (!(await confirmDialog('Putuskan perangkat ini?', 'URL & token dihapus dari HP ini. Data di spreadsheet & Drive tetap aman.', 'Putuskan'))) return;
    [LS.cfg, LS.cache].forEach(k => localStorage.removeItem(k)); location.reload();
  };
}

// ---------- Sheet, dialog, toast ----------
function sheetHead(title) {
  return `<div class="sheet-grip"></div><div class="sheet-head"><h2>${title}</h2><button class="close-btn" data-close aria-label="Tutup">${ICON.close}</button></div>`;
}
let sheetOpen = false;
function openSheet(html, onMount) {
  const sh = $('#sheet');
  sh.innerHTML = html; sh.scrollTop = 0;
  requestAnimationFrame(() => { sh.classList.add('show'); $('#sheetBackdrop').classList.add('show'); });
  if (!(history.state && history.state.sheet)) history.pushState({ sheet: 1 }, '');
  sheetOpen = true;
  $$('[data-close]', sh).forEach(b => b.onclick = () => closeSheet());
  bindCommon(sh);
  if (onMount) onMount(sh);
}
function closeSheet(keepHistory) {
  if (!sheetOpen) return;
  sheetOpen = false;
  $('#sheet').classList.remove('show'); $('#sheetBackdrop').classList.remove('show');
  if (!keepHistory && history.state && history.state.sheet) history.back();
  if (document.activeElement) document.activeElement.blur();
}
window.addEventListener('popstate', () => { if (sheetOpen) { sheetOpen = false; $('#sheet').classList.remove('show'); $('#sheetBackdrop').classList.remove('show'); } });
function confirmDialog(title, text, okLabel) {
  return new Promise(res => {
    const w = $('#dialog');
    w.innerHTML = `<div class="dialog"><div class="dialog-ic">${ICON.trash}</div><h3>${esc(title)}</h3><p>${esc(text)}</p>
      <div class="btn-row" style="margin-top:0"><button class="btn btn-ghost" data-r="0">Batal</button><button class="btn btn-danger-solid" data-r="1">${esc(okLabel)}</button></div></div>`;
    w.classList.remove('hidden');
    const done = v => { w.classList.add('hidden'); w.innerHTML = ''; res(v); };
    $$('[data-r]', w).forEach(b => b.onclick = () => done(b.dataset.r === '1'));
    w.onclick = e => { if (e.target === w) done(false); };
  });
}
function toast(msg, type = 'info', ms = 2800) {
  const box = $('#toasts'), el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = `<span class="t-ic">${type === 'ok' ? '✓' : type === 'err' ? '!' : 'i'}</span><span>${esc(msg)}</span>`;
  box.appendChild(el);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 260); }, ms);
}
function setBusy(btn, busy, label = 'Menghubungkan…') {
  if (!btn) return;
  btn.disabled = busy;
  if (busy) { btn.dataset.label = btn.innerHTML; btn.innerHTML = `<span class="spinner"></span> ${label}`; }
  else if (btn.dataset.label) btn.innerHTML = btn.dataset.label;
}

// ---------- Setup & mulai ----------
function showSetup() {
  $('#setup').classList.remove('hidden'); $('#app').classList.add('hidden');
  $('#setupForm').onsubmit = async e => {
    e.preventDefault();
    const url = $('#setupUrl').value.trim(), token = $('#setupToken').value.trim(), err = $('#setupErr'), btn = $('#setupBtn');
    err.textContent = '';
    if (!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(url)) { err.textContent = 'URL harus diawali https://script.google.com/macros/s/ dan diakhiri /exec'; return; }
    setBusy(btn, true);
    try { await api('ping', {}, { url, token }); S.cfg = { url, token }; store(LS.cfg, S.cfg); toast('Terhubung! Memuat data…', 'ok'); startApp(); }
    catch (ex) { err.textContent = ex.message; } finally { setBusy(btn, false); }
  };
}
function startApp() { $('#setup').classList.add('hidden'); $('#app').classList.remove('hidden'); render(); sync(true); }

$$('.nav-item').forEach(b => b.onclick = () => go(b.dataset.view));
$('#fab').onclick = () => openUploadST();
$('#btnSync').onclick = () => sync(false);
$('#sheetBackdrop').onclick = () => closeSheet();
const setOnline = () => $('#offlineBar').classList.toggle('hidden', navigator.onLine);
window.addEventListener('online', () => { setOnline(); sync(true); });
window.addEventListener('offline', setOnline);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.cfg && Date.now() - S.lastSync > 60000) sync(true); });
setOnline();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));

if (S.cfg) startApp(); else showSetup();
