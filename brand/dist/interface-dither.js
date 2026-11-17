import { loadStudioSettings } from './hero-controls.js';

const BAYER = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21];
const defaults = { strength: 16, size: 2, contrast: 1 };
const storageKey = 'alpic-interface-dither';
const stage = document.querySelector('.interface-stage');
const photo = stage?.querySelector('.interface-photo');
if (stage && photo) {
  const canvas = document.createElement('canvas');
  canvas.className = 'interface-dither';
  canvas.setAttribute('aria-hidden', 'true');
  photo.after(canvas);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let state = { ...defaults };
  let clean = null;

  const published = await loadStudioSettings('dither');
  let local = null;
  let localAt = 0;
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey));
    if (raw?.state) {
      local = raw.state;
      localAt = Date.parse(raw.savedAt) || 0;
    }
  } catch {}
  const publishedAt = Date.parse(published?.savedAt) || 0;
  const stored = published?.state && publishedAt >= localAt ? published.state : local;
  if (stored) state = { strength: Number(stored.strength) || 0, size: Number(stored.size) || 1, contrast: Number(stored.contrast) || 1 };

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'mountain-config-trigger dither-trigger';
  trigger.textContent = '⚙ Dither';
  trigger.setAttribute('aria-label', 'Configure dither');
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-expanded', 'false');
  stage.append(trigger);

  const popup = document.createElement('div');
  popup.className = 'dither-popup';
  popup.setAttribute('popover', 'auto');
  popup.setAttribute('role', 'dialog');
  popup.setAttribute('aria-label', 'Dither configuration');
  popup.innerHTML = `<div class="dither-head"><div><span class="studio-kicker">STATION</span><h3>Dither</h3></div><button type="button" class="studio-close" aria-label="Close dither configuration">×</button></div>
    <label class="dither-row"><span>Strength<output data-for="strength"></output></span><input data-setting="strength" type="range" min="0" max="48" step="1" aria-label="Dither strength"></label>
    <label class="dither-row"><span>Size<output data-for="size"></output></span><input data-setting="size" type="range" min="1" max="8" step="1" aria-label="Dither size"></label>
    <label class="dither-row"><span>Contrast<output data-for="contrast"></output></span><input data-setting="contrast" type="range" min="0.6" max="1.8" step="0.05" aria-label="Dither contrast"></label>
    <div class="dither-actions"><button type="button" class="studio-export">Save settings ↓</button><button type="button" class="studio-reset">Reset ↺</button></div>
    <span class="dither-status">Save applies everywhere this page is opened</span>`;
  document.body.append(popup);

  const field = (key) => popup.querySelector(`[data-setting="${key}"]`);
  const labelFor = (key) => popup.querySelector(`[data-for="${key}"]`);
  function sync() {
    for (const key of Object.keys(defaults)) field(key).value = state[key];
    labelFor('strength').textContent = `${state.strength}`;
    labelFor('size').textContent = `${state.size}px`;
    labelFor('contrast').textContent = `${Number(state.contrast).toFixed(2)}×`;
  }

  function paint() {
    const width = canvas.width;
    const height = canvas.height;
    if (!clean || !width) return;
    const pixels = new Uint8ClampedArray(clean);
    const strength = state.strength;
    const size = state.size;
    const contrast = state.contrast;
    for (let y = 0, i = 0; y < height; y++) {
      const by = (Math.floor(y / size) & 7) * 8;
      for (let x = 0; x < width; x++, i += 4) {
        const shift = (BAYER[by + (Math.floor(x / size) & 7)] / 63 - 0.5) * strength;
        pixels[i] = clamp((pixels[i] - 128) * contrast + 128 + shift);
        pixels[i + 1] = clamp((pixels[i + 1] - 128) * contrast + 128 + shift);
        pixels[i + 2] = clamp((pixels[i + 2] - 128) * contrast + 128 + shift);
      }
    }
    ctx.putImageData(new ImageData(pixels, width, height), 0, 0);
  }

  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    const width = Math.round(stage.clientWidth * ratio);
    const height = Math.round(stage.clientHeight * ratio);
    if (!photo.naturalWidth || !width || !height) return;
    canvas.width = width;
    canvas.height = height;
    const scale = Math.max(width / photo.naturalWidth, height / photo.naturalHeight);
    const dw = photo.naturalWidth * scale;
    const dh = photo.naturalHeight * scale;
    ctx.drawImage(photo, (width - dw) * 0.5, (height - dh) * 0.62, dw, dh);
    clean = ctx.getImageData(0, 0, width, height).data;
    paint();
  }

  function position() {
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(320, innerWidth - 24);
    popup.style.position = 'fixed';
    popup.style.margin = '0';
    popup.style.left = Math.max(12, Math.min(rect.right - width, innerWidth - width - 12)) + 'px';
    popup.style.top = Math.max(12, rect.top - popup.offsetHeight - 10) + 'px';
  }

  for (const input of popup.querySelectorAll('[data-setting]')) {
    input.addEventListener('input', () => {
      state[input.dataset.setting] = Number(input.value);
      sync();
      paint();
    });
  }
  popup.querySelector('.studio-reset').addEventListener('click', () => {
    state = { ...defaults };
    sync();
    paint();
  });
  const status = popup.querySelector('.dither-status');
  popup.querySelector('.studio-export').addEventListener('click', async () => {
    status.textContent = 'Saving…';
    try {
      const response = await fetch('/studio-settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'dither', state }) });
      if (!response.ok) throw new Error();
      const saved = await response.json();
      localStorage.setItem(storageKey, JSON.stringify({ savedAt: saved.savedAt, state }));
      status.textContent = 'Saved. This is what every browser will show.';
    } catch {
      status.textContent = 'Could not save. The preview server has to be running.';
    }
  });
  trigger.addEventListener('click', () => {
    popup.togglePopover();
    if (popup.matches(':popover-open')) position();
  });
  popup.querySelector('.studio-close').addEventListener('click', () => popup.hidePopover());
  popup.addEventListener('toggle', (event) => trigger.setAttribute('aria-expanded', String(event.newState === 'open')));

  function openFromHash() {
    if (location.hash !== '#configure-dither') return;
    stage.scrollIntoView({ block: 'center' });
    if (!popup.matches(':popover-open')) popup.showPopover();
    position();
  }
  window.addEventListener('hashchange', openFromHash);
  if (performance.getEntriesByType('navigation')[0]?.type !== 'reload') openFromHash();
  new ResizeObserver(resize).observe(stage);
  if (photo.complete) resize();
  else photo.addEventListener('load', resize);
  sync();
}

function clamp(value) {
  return value < 0 ? 0 : value > 255 ? 255 : value;
}
