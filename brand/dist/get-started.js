const section = document.querySelector('.get-started');
const canvas = section.querySelector('.get-started-mountain');
if (canvas) {
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const landingMountain = window.Mountain;

await import('./mountain/templates.js');
await import('./mountain/editions.js');
await import('./mountain/spatial.js');
await import('./mountain/data.js');
await import('./mountain/dither.js');
await import('./mountain/engine.js');
const grain = window.Mountain;
window.Mountain = landingMountain;

const preset = grain.presets.findIndex(item => item.short === 'Grain Massif');
const recipe = grain.defaults(preset);
recipe.squareColor = '#f4faf9';
recipe.squareOpacity = 100;
recipe.lineOpacity = 0;
recipe.stroke = 0;
recipe.nodeStyle = 'solid';
recipe.motion = false;
recipe.background = '#051413';

const cycle = 18000;
let playing = false;
let drawn = 0;

function dissolve(now) {
  if (reduced) return 8;
  const turn = (now % cycle) / cycle;
  return Math.round((1 - Math.cos(turn * Math.PI * 2)) / 2 * 74);
}

function fit() {
  const box = canvas.getBoundingClientRect();
  const ratio = Math.min(devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(box.width * ratio));
  const height = Math.max(1, Math.round(box.height * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    drawn = 0;
  }
}

function paint(now) {
  const erosion = dissolve(now);
  if (erosion === drawn && canvas.width) return;
  drawn = erosion;
  recipe.erosion = erosion;
  fit();
  grain.render(canvas, recipe, { transparent: true, time: 0 });
}

function tick(now) {
  if (!playing) return;
  paint(now);
  requestAnimationFrame(tick);
}

new IntersectionObserver(entries => {
  playing = !reduced && entries.some(entry => entry.isIntersecting);
  if (playing) requestAnimationFrame(tick);
}).observe(section);

paint(0);
addEventListener('resize', () => paint(performance.now()));
}
