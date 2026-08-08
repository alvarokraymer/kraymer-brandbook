/* ===== Theme ===== */
const THEME_KEY = 'kraymer-theme';
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}
applyTheme(localStorage.getItem(THEME_KEY) || 'light');

document.getElementById('themeToggle')?.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

/* ===== Toast ===== */
const toastEl = document.getElementById('toast');
let toastTimer;
function showToast(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800);
}

/* ===== Mobile nav toggle ===== */
const toggle = document.getElementById('navToggle');
const sidebar = document.getElementById('sidebar');
toggle?.addEventListener('click', () => sidebar.classList.toggle('open'));
document.querySelectorAll('#toc a').forEach(link => {
  link.addEventListener('click', () => sidebar.classList.remove('open'));
});

/* ===== Sidebar scroll-spy with sliding pill ===== */
const sections = document.querySelectorAll('main.content section[id]');
const links = document.querySelectorAll('#toc a');
const pill = document.getElementById('tocPill');

function movePill(link) {
  if (!pill || !link) return;
  const tocRect = link.closest('nav.toc').getBoundingClientRect();
  const linkRect = link.getBoundingClientRect();
  const top = linkRect.top - tocRect.top;
  if (window.gsap) {
    gsap.to(pill, { top, height: linkRect.height, opacity: 1, duration: 0.35, ease: 'power3.out' });
  } else {
    pill.style.top = top + 'px';
    pill.style.height = linkRect.height + 'px';
    pill.style.opacity = 1;
  }
}

const setActive = (id) => {
  links.forEach(l => {
    const isActive = l.getAttribute('href') === `#${id}`;
    l.classList.toggle('active', isActive);
    if (isActive) movePill(l);
  });
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => { if (entry.isIntersecting) setActive(entry.target.id); });
}, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });
sections.forEach(s => observer.observe(s));

/* ===== Colour swatches: copy hex + shade ramps ===== */
function hexToHsl(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  const d = max - min;
  if (d === 0) { h = 0; s = 0; }
  else {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      default: h = ((r - g) / d + 4);
    }
    h *= 60;
  }
  return [h, s * 100, l * 100];
}
function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = x => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`.toUpperCase();
}
function shadeRamp(hex) {
  const [h, s] = hexToHsl(hex);
  return [92, 80, 66, 52, 38, 26, 16, 8].map(l => hslToHex(h, s, l));
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch { return false; }
}

document.querySelectorAll('.swatch').forEach(swatch => {
  const hex = swatch.dataset.hex;
  const fill = swatch.querySelector('.fill');
  if (fill) fill.style.background = hex;
  const shadesRow = swatch.querySelector('.shades');
  if (shadesRow) {
    shadeRamp(hex).forEach(shade => {
      const d = document.createElement('div');
      d.style.background = shade;
      d.title = shade;
      d.addEventListener('click', (e) => {
        e.stopPropagation();
        copyText(shade).then(() => showToast(`Copied ${shade}`));
      });
      shadesRow.appendChild(d);
    });
  }
  swatch.addEventListener('click', () => {
    copyText(hex).then(ok => showToast(ok ? `Copied ${hex}` : hex));
    swatch.classList.toggle('expanded');
  });
});

/* ===== Checklists with persistence ===== */
document.querySelectorAll('.checklist').forEach(list => {
  const id = list.dataset.checklist;
  const boxes = [...list.querySelectorAll('input[type="checkbox"]')];
  const progressBar = document.querySelector(`.checklist-progress[data-for="${id}"] .fill`);
  const progressLabel = document.querySelector(`.checklist-progress[data-for="${id}"] .label`);
  const stored = JSON.parse(localStorage.getItem(`kraymer-checklist-${id}`) || '[]');

  function updateProgress() {
    const checked = boxes.filter(b => b.checked).length;
    const pct = boxes.length ? Math.round((checked / boxes.length) * 100) : 0;
    if (progressBar) progressBar.style.width = pct + '%';
    if (progressLabel) progressLabel.textContent = `${checked}/${boxes.length}`;
  }

  boxes.forEach((box, i) => {
    if (stored[i]) box.checked = true;
    box.addEventListener('change', () => {
      const state = boxes.map(b => b.checked);
      localStorage.setItem(`kraymer-checklist-${id}`, JSON.stringify(state));
      updateProgress();
    });
  });
  updateProgress();

  const progressEl = document.querySelector(`.checklist-progress[data-for="${id}"]`);
  if (progressEl && !progressEl.querySelector('.reset-btn')) {
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'reset-btn';
    resetBtn.textContent = 'Reset';
    resetBtn.addEventListener('click', () => {
      boxes.forEach(b => { b.checked = false; });
      localStorage.removeItem(`kraymer-checklist-${id}`);
      updateProgress();
    });
    progressEl.appendChild(resetBtn);
  }
});

/* ===== Accordions ===== */
document.querySelectorAll('.accordion-head').forEach(head => {
  head.addEventListener('click', () => {
    head.closest('.accordion').classList.toggle('open');
  });
});

/* ===== Gallery lightbox ===== */
const galleryItems = [...document.querySelectorAll('.gallery-item')];
const lightbox = document.getElementById('lightbox');
const lightboxStage = document.getElementById('lightboxStage');
let currentGalleryIndex = 0;

function renderLightbox(i) {
  currentGalleryIndex = (i + galleryItems.length) % galleryItems.length;
  const item = galleryItems[currentGalleryIndex];
  lightboxStage.style.background = item.style.background;
  lightboxStage.querySelector('.g-label').textContent = item.querySelector('.g-label').textContent;
}
function openLightbox(i) {
  if (!lightbox) return;
  renderLightbox(i);
  lightbox.classList.add('show');
}
function closeLightbox() { lightbox?.classList.remove('show'); }

galleryItems.forEach((item, i) => item.addEventListener('click', () => openLightbox(i)));
document.getElementById('lightboxClose')?.addEventListener('click', closeLightbox);
document.getElementById('lightboxPrev')?.addEventListener('click', () => renderLightbox(currentGalleryIndex - 1));
document.getElementById('lightboxNext')?.addEventListener('click', () => renderLightbox(currentGalleryIndex + 1));
lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => {
  if (!lightbox?.classList.contains('show')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') renderLightbox(currentGalleryIndex + 1);
  if (e.key === 'ArrowLeft') renderLightbox(currentGalleryIndex - 1);
});

/* ===== Grid demo toggle ===== */
document.querySelectorAll('.grid-demo-controls').forEach(controls => {
  const buttons = [...controls.querySelectorAll('.seg-btn')];
  const targetSel = controls.dataset.target;
  const desktopGrid = document.querySelector(`${targetSel} .grid-desktop`);
  const mobileGrid = document.querySelector(`${targetSel} .grid-mobile`);
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mode;
      if (desktopGrid) desktopGrid.style.display = mode === 'desktop' ? 'grid' : 'none';
      if (mobileGrid) mobileGrid.style.display = mode === 'mobile' ? 'grid' : 'none';
    });
  });
});

/* ===== Naming generator ===== */
const genForm = document.getElementById('genForm');
if (genForm) {
  const inputs = [...genForm.querySelectorAll('input')];
  const output = document.getElementById('genOutput');
  function updateGen() {
    const parts = inputs.map(i => (i.value.trim() || i.placeholder).replace(/\s+/g, ''));
    output.textContent = parts.join('_');
  }
  inputs.forEach(i => i.addEventListener('input', updateGen));
  updateGen();
  document.getElementById('genCopy')?.addEventListener('click', () => {
    copyText(output.textContent).then(() => showToast('Filename copied'));
  });
}

/* ===== Motion demo ===== */
document.querySelectorAll('.motion-demo').forEach(demo => {
  const dot = demo.querySelector('.motion-dot');
  const track = demo.querySelector('.motion-track');
  const btn = demo.querySelector('button');
  const easeType = demo.dataset.ease;
  btn?.addEventListener('click', () => {
    const distance = track.offsetWidth - 16;
    if (window.gsap) {
      gsap.fromTo(dot, { x: 0 }, { x: distance, duration: easeType === 'restrained' ? 0.9 : 1.6, ease: easeType === 'restrained' ? 'power2.out' : 'elastic.out(1, 0.3)', onComplete: () => gsap.to(dot, { x: 0, duration: 0.01, delay: 0.4 }) });
    }
  });
});

/* ===== Command palette / search ===== */
const cmdkOverlay = document.getElementById('cmdk');
const cmdkInput = document.getElementById('cmdkInput');
const cmdkResults = document.getElementById('cmdkResults');
let searchIndex = [];
let activeResultIndex = 0;

function buildSearchIndex() {
  const groupLabels = {};
  document.querySelectorAll('#toc .group').forEach(g => {
    const label = g.querySelector('.group-label')?.textContent || '';
    g.querySelectorAll('a').forEach(a => { groupLabels[a.getAttribute('href')] = label; });
  });
  searchIndex = [];
  sections.forEach(section => {
    const title = section.querySelector('h2, h1')?.textContent?.trim();
    if (title) searchIndex.push({ title, group: groupLabels['#' + section.id] || '', id: section.id });
    section.querySelectorAll('h3, h4').forEach(h => {
      const t = h.textContent.trim();
      if (t) searchIndex.push({ title: t, group: title || '', id: section.id });
    });
  });
}
buildSearchIndex();

function openCmdk() {
  cmdkOverlay.classList.add('show');
  cmdkInput.value = '';
  cmdkInput.focus();
  renderResults('');
}
function closeCmdk() { cmdkOverlay.classList.remove('show'); }

function renderResults(query) {
  const q = query.trim().toLowerCase();
  const filtered = q ? searchIndex.filter(item => item.title.toLowerCase().includes(q) || item.group.toLowerCase().includes(q)) : searchIndex.slice(0, 12);
  cmdkResults.innerHTML = '';
  activeResultIndex = 0;
  if (!filtered.length) {
    cmdkResults.innerHTML = '<div class="cmdk-empty">No results — try another term.</div>';
    return;
  }
  filtered.slice(0, 40).forEach((item, i) => {
    const row = document.createElement('div');
    row.className = 'cmdk-item' + (i === 0 ? ' active' : '');
    row.innerHTML = `<span>${item.title}</span><span class="grp">${item.group}</span>`;
    row.addEventListener('click', () => jumpTo(item.id));
    row.addEventListener('mousemove', () => setActiveResult(i));
    cmdkResults.appendChild(row);
  });
}
function setActiveResult(i) {
  const rows = [...cmdkResults.querySelectorAll('.cmdk-item')];
  rows.forEach(r => r.classList.remove('active'));
  activeResultIndex = (i + rows.length) % rows.length;
  rows[activeResultIndex]?.classList.add('active');
  rows[activeResultIndex]?.scrollIntoView({ block: 'nearest' });
}
function jumpTo(id) {
  closeCmdk();
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  target.classList.add('pulse-target');
  setTimeout(() => target.classList.remove('pulse-target'), 1500);
}

document.getElementById('searchTrigger')?.addEventListener('click', openCmdk);
document.getElementById('cmdkClose')?.addEventListener('click', closeCmdk);
cmdkOverlay?.addEventListener('click', (e) => { if (e.target === cmdkOverlay) closeCmdk(); });
cmdkInput?.addEventListener('input', (e) => renderResults(e.target.value));
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openCmdk(); }
  else if (e.key === '/' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); openCmdk(); }
  if (!cmdkOverlay?.classList.contains('show')) return;
  if (e.key === 'Escape') closeCmdk();
  if (e.key === 'ArrowDown') { e.preventDefault(); setActiveResult(activeResultIndex + 1); }
  if (e.key === 'ArrowUp') { e.preventDefault(); setActiveResult(activeResultIndex - 1); }
  if (e.key === 'Enter') {
    e.preventDefault();
    const active = cmdkResults.querySelector('.cmdk-item.active');
    const idx = active ? [...cmdkResults.querySelectorAll('.cmdk-item')].indexOf(active) : 0;
    const q = cmdkInput.value.trim().toLowerCase();
    const filtered = q ? searchIndex.filter(item => item.title.toLowerCase().includes(q) || item.group.toLowerCase().includes(q)) : searchIndex.slice(0, 12);
    if (filtered[idx]) jumpTo(filtered[idx].id);
  }
});

/* ===== Prompt builder ===== */
document.querySelectorAll('.prompt-builder').forEach(builder => {
  const fields = [...builder.querySelectorAll('textarea')];
  const output = builder.querySelector('.prompt-output pre');
  function update() {
    output.textContent = fields.map(f => `${f.dataset.label}: ${f.value.trim()}`).join('\n\n');
  }
  fields.forEach(f => f.addEventListener('input', update));
  update();
  builder.querySelector('.prompt-copy')?.addEventListener('click', () => {
    copyText(output.textContent).then(() => showToast('Prompt copied'));
  });
  builder.querySelector('.prompt-reset')?.addEventListener('click', () => {
    fields.forEach(f => { f.value = f.defaultValue; });
    update();
  });
});

/* ===== Master checklist aggregator (multi-group progress, e.g. full QA page) ===== */
document.querySelectorAll('[data-master]').forEach(masterBar => {
  const group = masterBar.dataset.master;
  const boxes = [...document.querySelectorAll(`.checklist[data-qa-group="${group}"] input[type="checkbox"]`)];
  const fill = masterBar.querySelector('.fill');
  const label = masterBar.querySelector('.label');
  function updateMaster() {
    const checked = boxes.filter(b => b.checked).length;
    const pct = boxes.length ? Math.round((checked / boxes.length) * 100) : 0;
    if (fill) fill.style.width = pct + '%';
    if (label) label.textContent = `${checked}/${boxes.length}`;
  }
  boxes.forEach(b => b.addEventListener('change', updateMaster));
  updateMaster();
});

/* ===== Reset checklist group ===== */
document.querySelectorAll('.reset-btn[data-reset]').forEach(btn => {
  btn.addEventListener('click', () => {
    const prefix = btn.dataset.reset;
    Object.keys(localStorage).filter(k => k.startsWith(`kraymer-checklist-${prefix}`)).forEach(k => localStorage.removeItem(k));
    location.reload();
  });
});

/* ===== GSAP scroll reveals ===== */
if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);

  gsap.utils.toArray('main.content section.block:not(.hero)').forEach(section => {
    const targets = section.querySelectorAll(':scope > *');
    gsap.from(targets, {
      opacity: 0, y: 26, duration: 0.7, ease: 'power2.out', stagger: 0.06,
      scrollTrigger: { trigger: section, start: 'top 78%' }
    });
  });

  const heroEls = document.querySelectorAll('section.hero > *');
  gsap.from(heroEls, { opacity: 0, y: 30, duration: 0.9, ease: 'power3.out', stagger: 0.1, delay: 0.1 });
}
