// Vice Cover render engine: multi-panel poster, per-panel crop, sunset/neon
// grades, bold caption lettering. Pure canvas, no libraries, no network.
export const DISPLAY_FONT = '"Arial Narrow", "HelveticaNeue-CondensedBold", Impact, "Franklin Gothic Medium", sans-serif';
export const BODY_FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Panel rectangles as fractions of the poster, per layout name. */
export const LAYOUTS = {
  triptych: [
    [0, 0, 1 / 3, 1],
    [1 / 3, 0, 1 / 3, 1],
    [2 / 3, 0, 1 / 3, 1],
  ],
  hero: [
    [0, 0, 1, 0.62],
    [0, 0.62, 0.5, 0.38],
    [0.5, 0.62, 0.5, 0.38],
  ],
  quad: [
    [0, 0, 0.5, 0.5],
    [0.5, 0, 0.5, 0.5],
    [0, 0.5, 0.5, 0.5],
    [0.5, 0.5, 0.5, 0.5],
  ],
};

/** Colour grades: a wash laid over the whole poster after the photos. */
export const GRADES = {
  sunset: {
    wash: [[0, 'rgba(255, 122, 61, 0.00)'], [0.55, 'rgba(255, 90, 60, 0.10)'], [1, 'rgba(255, 46, 136, 0.38)']],
    vignette: 0.32,
  },
  neon: {
    wash: [[0, 'rgba(25, 227, 194, 0.16)'], [0.5, 'rgba(255, 46, 136, 0.10)'], [1, 'rgba(120, 40, 220, 0.34)']],
    vignette: 0.38,
  },
  dusk: {
    wash: [[0, 'rgba(30, 60, 120, 0.20)'], [0.6, 'rgba(60, 30, 90, 0.12)'], [1, 'rgba(255, 122, 61, 0.22)']],
    vignette: 0.42,
  },
  clean: { wash: [[0, 'rgba(0, 0, 0, 0)'], [1, 'rgba(0, 0, 0, 0)']], vignette: 0.22 },
};

/** A fresh, empty cover state. Panels are built from the layout name. */
export function freshState() {
  return {
    photos: [null, null, null],
    layout: 'triptych',
    panels: defaultPanels('triptych'),
    grade: 'sunset',
    caption: 'Sunset Heist',
    tagline: 'Vice City · Leonida',
    ink: '#fff6e8',
    captionSize: 1,
    captionPos: 'bottom',
  };
}

export function defaultPanels(layout) {
  return LAYOUTS[layout].map(() => ({ photo: 0, zoom: 1, ox: 0, oy: 0 }));
}

/** Rects (px) of the layout's panels for a poster of w x h, with gutters. */
export function panelRects(layout, w, h) {
  const g = Math.max(2, Math.round(w * 0.006));
  return LAYOUTS[layout].map(([fx, fy, fw, fh]) => {
    const x = Math.round(fx * w) + (fx > 0 ? g / 2 : 0);
    const y = Math.round(fy * h) + (fy > 0 ? g / 2 : 0);
    const pw = Math.round(fw * w) - (fx > 0 ? g / 2 : 0) - (fx + fw < 1 ? g / 2 : 0);
    const ph = Math.round(fh * h) - (fy > 0 ? g / 2 : 0) - (fy + fh < 1 ? g / 2 : 0);
    return { x, y, w: pw, h: ph };
  });
}

/** Which panel index holds point (x, y) on a w x h poster, or -1. */
export function panelAt(layout, w, h, x, y) {
  const rects = panelRects(layout, w, h);
  for (let i = 0; i < rects.length; i += 1) {
    const r = rects[i];
    if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return i;
  }
  return -1;
}

function drawPhotoInto(ctx, img, rect, panel) {
  if (!img) {
    ctx.fillStyle = '#241a33';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    return;
  }
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const scale = base * panel.zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const maxOx = Math.max(0, (dw - rect.w) / 2);
  const maxOy = Math.max(0, (dh - rect.h) / 2);
  const ox = Math.max(-maxOx, Math.min(maxOx, panel.ox * rect.w));
  const oy = Math.max(-maxOy, Math.min(maxOy, panel.oy * rect.h));
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, rect.x + (rect.w - dw) / 2 + ox, rect.y + (rect.h - dh) / 2 + oy, dw, dh);
  ctx.restore();
}

function applyGrade(ctx, w, h, gradeName) {
  const grade = GRADES[gradeName] ?? GRADES.sunset;
  const wash = ctx.createLinearGradient(0, 0, w * 0.35, h);
  for (const [stop, color] of grade.wash) wash.addColorStop(stop, color);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, 'rgba(10, 6, 18, 0)');
  vg.addColorStop(1, `rgba(10, 6, 18, ${grade.vignette})`);
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
}

function drawCaption(ctx, w, h, state) {
  const text = state.caption.trim().toUpperCase();
  if (!text) return;
  const atTop = state.captionPos === 'top';
  const bandH = h * 0.34;
  const band = ctx.createLinearGradient(0, atTop ? 0 : h - bandH, 0, atTop ? bandH : h);
  band.addColorStop(0, 'rgba(10, 6, 18, 0)');
  band.addColorStop(1, 'rgba(10, 6, 18, 0.72)');
  if (atTop) {
    const rev = ctx.createLinearGradient(0, 0, 0, bandH);
    rev.addColorStop(0, 'rgba(10, 6, 18, 0.72)');
    rev.addColorStop(1, 'rgba(10, 6, 18, 0)');
    ctx.fillStyle = rev;
  } else {
    ctx.fillStyle = band;
  }
  ctx.fillRect(0, atTop ? 0 : h - bandH, w, bandH);

  let size = h * 0.115 * state.captionSize;
  ctx.font = `900 ${size}px ${DISPLAY_FONT}`;
  while (ctx.measureText(text).width > w * 0.92 && size > 14) {
    size -= 2;
    ctx.font = `900 ${size}px ${DISPLAY_FONT}`;
  }
  const baseline = atTop ? h * 0.06 + size : h - h * 0.055;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(14, 11, 22, 0.9)';
  ctx.lineWidth = Math.max(2, size * 0.07);
  ctx.strokeText(text, w / 2, baseline);
  ctx.fillStyle = state.ink;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = size * 0.16;
  ctx.shadowOffsetY = size * 0.03;
  ctx.fillText(text, w / 2, baseline);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  const tag = state.tagline.trim();
  if (tag) {
    const tagSize = Math.max(12, h * 0.022);
    ctx.font = `600 ${tagSize}px ${BODY_FONT}`;
    ctx.fillStyle = 'rgba(255, 246, 232, 0.92)';
    const tagY = atTop ? baseline + tagSize * 1.9 : baseline - size - tagSize * 0.9;
    ctx.fillText(tag.toUpperCase(), w / 2, tagY);
  }
}

/** Draws the whole cover for `state` onto `canvas` (its own width/height). */
export function drawPoster(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  ctx.fillStyle = '#0e0b16';
  ctx.fillRect(0, 0, w, h);
  const rects = panelRects(state.layout, w, h);
  state.panels.forEach((panel, i) => {
    drawPhotoInto(ctx, state.photos[panel.photo] ?? null, rects[i], panel);
  });
  applyGrade(ctx, w, h, state.grade);
  drawCaption(ctx, w, h, state);
}

/** Renders `state` at an exact export size and returns the canvas. */
export function renderExport(state, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawPoster(canvas, state);
  return canvas;
}
