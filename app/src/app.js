// Vice Cover wiring: photos, panels, words, grade, export, screenshot scenes.
import { freshState, defaultPanels, panelAt, panelRects, drawPoster, renderExport } from './poster.js';

const SIZES = { '1080x1080': [1080, 1080], '1080x1350': [1080, 1350], '1920x1080': [1920, 1080] };
const state = freshState();
let sizeKey = '1920x1080';
let selected = 0;

const canvas = document.getElementById('preview');
const status = document.getElementById('status');
const slotsEl = document.getElementById('slots');
const panelPhoto = document.getElementById('panelPhoto');
const panelZoom = document.getElementById('panelZoom');

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function redraw() {
  const [w, h] = SIZES[sizeKey];
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  drawPoster(canvas, state);
}

function refreshPanelControls() {
  panelPhoto.innerHTML = '';
  const empty = document.createElement('option');
  empty.value = '-1';
  empty.textContent = 'Empty panel';
  panelPhoto.appendChild(empty);
  state.photos.forEach((photo, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = photo ? `Photo ${i + 1}` : `Photo ${i + 1} (empty)`;
    panelPhoto.appendChild(opt);
  });
  panelPhoto.value = String(state.panels[selected]?.photo ?? 0);
  panelZoom.value = String(state.panels[selected]?.zoom ?? 1);
}

function buildSlots() {
  slotsEl.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const slot = document.createElement('div');
    slot.className = 'slot';
    if (photo) {
      const thumb = document.createElement('img');
      thumb.src = photo.src;
      thumb.alt = `Photo ${i + 1}`;
      slot.appendChild(thumb);
    }
    const name = document.createElement('span');
    name.className = 'slot-name';
    name.textContent = photo ? `Photo ${i + 1}` : `Empty slot ${i + 1}`;
    slot.appendChild(name);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.id = `file-${i}`;
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      state.photos[i] = await loadImage(URL.createObjectURL(file));
      buildSlots();
      refreshPanelControls();
      redraw();
    });
    slot.appendChild(input);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'slot-btn';
    btn.textContent = photo ? 'Replace' : 'Add photo';
    btn.addEventListener('click', () => input.click());
    slot.appendChild(btn);
    slotsEl.appendChild(slot);
  });
}

async function loadSample(name, slotIndex) {
  const img = await loadImage(`samples/${name}.jpg`);
  state.photos[slotIndex] = img;
}

function pickGroup(container, attr, onPick) {
  container.addEventListener('click', (e) => {
    const btn = e.target.closest(`[data-${attr}]`);
    if (!btn) return;
    container.querySelectorAll(`[data-${attr}]`).forEach((b) => b.classList.remove('is-on'));
    btn.classList.add('is-on');
    onPick(btn.dataset[attr]);
  });
}

pickGroup(document.getElementById('layouts'), 'layout', (layout) => {
  state.layout = layout;
  state.panels = defaultPanels(layout);
  state.panels.forEach((panel, i) => { panel.photo = Math.min(i, 2); });
  selected = 0;
  refreshPanelControls();
  redraw();
});

pickGroup(document.getElementById('grades'), 'grade', (grade) => {
  state.grade = grade;
  redraw();
});

pickGroup(document.getElementById('sizes'), 'size', (key) => {
  sizeKey = key;
  redraw();
});

document.querySelectorAll('.sample').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const free = state.photos.findIndex((p) => !p);
    await loadSample(btn.dataset.sample, free === -1 ? 0 : free);
    buildSlots();
    refreshPanelControls();
    redraw();
  });
});

document.getElementById('caption').addEventListener('input', (e) => {
  state.caption = e.target.value;
  redraw();
});
document.getElementById('tagline').addEventListener('input', (e) => {
  state.tagline = e.target.value;
  redraw();
});
document.getElementById('captionSize').addEventListener('input', (e) => {
  state.captionSize = Number(e.target.value);
  redraw();
});
document.getElementById('inkRow').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-ink]');
  if (!btn) return;
  document.querySelectorAll('#inkRow .swatch').forEach((b) => b.classList.remove('is-on'));
  btn.classList.add('is-on');
  state.ink = btn.dataset.ink;
  redraw();
});
function setCaptionPos(pos) {
  state.captionPos = pos;
  document.getElementById('captionTop').classList.toggle('is-on', pos === 'top');
  document.getElementById('captionBottom').classList.toggle('is-on', pos === 'bottom');
  redraw();
}
document.getElementById('captionTop').addEventListener('click', () => setCaptionPos('top'));
document.getElementById('captionBottom').addEventListener('click', () => setCaptionPos('bottom'));

panelPhoto.addEventListener('change', () => {
  state.panels[selected].photo = Number(panelPhoto.value);
  redraw();
});
panelZoom.addEventListener('input', () => {
  state.panels[selected].zoom = Number(panelZoom.value);
  redraw();
});

let drag = null;
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const idx = panelAt(state.layout, canvas.width, canvas.height, p.x, p.y);
  if (idx < 0) return;
  selected = idx;
  refreshPanelControls();
  const panel = state.panels[idx];
  drag = { x: p.x, y: p.y, ox: panel.ox, oy: panel.oy };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  const rect = rects[selected];
  const panel = state.panels[selected];
  panel.ox = drag.ox + (p.x - drag.x) / rect.w;
  panel.oy = drag.oy + (p.y - drag.y) / rect.h;
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });

document.getElementById('export').addEventListener('click', () => {
  const [w, h] = SIZES[sizeKey];
  const out = renderExport(state, w, h);
  out.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed. Try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${w}x${h}.png`;
    a.click();
    status.textContent = `Saved vice-cover-${w}x${h}.png`;
  }, 'image/png');
});

// Screenshot scenes: ?shot=editor shows the workbench with samples loaded;
// ?shot=cover shows the cover alone (size/layout/caption/grade via query).
async function runShot() {
  const query = new URLSearchParams(location.search);
  const shot = query.get('shot');
  if (!shot) return;
  await loadSample('pier', 0);
  await loadSample('boulevard', 1);
  state.caption = query.get('caption') ?? 'Sunset Heist';
  document.getElementById('caption').value = state.caption;
  state.tagline = query.get('tagline') ?? 'Vice City · Leonida';
  document.getElementById('tagline').value = state.tagline;
  if (query.get('layout')) {
    state.layout = query.get('layout');
    state.panels = defaultPanels(state.layout);
    state.panels.forEach((panel, i) => { panel.photo = Math.min(i, 2); });
    document.querySelectorAll('#layouts .choice').forEach((b) => {
      b.classList.toggle('is-on', b.dataset.layout === state.layout);
    });
  }
  if (query.get('grade')) {
    state.grade = query.get('grade');
    document.querySelectorAll('#grades .choice').forEach((b) => {
      b.classList.toggle('is-on', b.dataset.grade === state.grade);
    });
  }
  if (query.get('size') && SIZES[query.get('size')]) {
    sizeKey = query.get('size');
    document.querySelectorAll('#sizes .choice').forEach((b) => {
      b.classList.toggle('is-on', b.dataset.size === sizeKey);
    });
  }
  if (shot === 'cover') document.body.classList.add('shot-cover');
  buildSlots();
  refreshPanelControls();
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

buildSlots();
refreshPanelControls();
redraw();
runShot();
