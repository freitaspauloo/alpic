const TAU = Math.PI * 2;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ratio = Math.min(devicePixelRatio || 1, 2);
const sheet = getComputedStyle(document.documentElement);
const tone = name => sheet.getPropertyValue(`--alpic-${name}`).trim();
const tones = names => names.map(name => name && tone(name));

const ramps = {
  colour: tones(['midnight-950', 'midnight-700', 'midnight-300', 'ice', 'berry-600', 'berry-500', 'berry-50', 'white']),
  day: tones(['midnight-950', 'midnight-700', 'midnight-300', 'midnight-100', 'midnight-50']),
  night: tones([null, 'midnight-600', 'midnight-300', 'ice', 'midnight-25']),
  dark: tones(['midnight-800', 'midnight-600', 'midnight-300', 'ice', 'berry-600', 'berry-500', 'berry-200', 'midnight-25']),
  ink: tones(['midnight-950', 'midnight-700', 'midnight-300', null])
};

const BAYER = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21];
const bayer = (c, r) => (BAYER[(r & 7) * 8 + (c & 7)] + .5) / 64;
const fract = n => n - Math.floor(n);
const scatter = (c, r) => fract(52.9829189 * fract(.06711056 * c + .00583715 * r));
const clamp = (n, low = 0, high = 1) => Math.max(low, Math.min(high, n));
const HOUSE = 55 * Math.PI / 180;
const sweep = (c, r, cols, rows) => (c * Math.sin(HOUSE) + (rows - r) * Math.cos(HOUSE)) / (cols * Math.sin(HOUSE) + rows * Math.cos(HOUSE)) * .88 + bayer(c, r) * .12;
const develop = (c, r) => bayer(c, r) * .7 + scatter(c, r) * .3;

function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = state + 0x6D2B79F5 | 0;
    let mixed = Math.imul(state ^ state >>> 15, 1 | state);
    mixed = mixed + Math.imul(mixed ^ mixed >>> 7, 61 | mixed) ^ mixed;
    return ((mixed ^ mixed >>> 14) >>> 0) / 4294967296;
  };
}

const images = new Map();
function load(src) {
  if (!images.has(src)) images.set(src, new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  }));
  return images.get(src);
}

let loading;
function stack() {
  loading ||= (async () => {
    for (const file of ['templates', 'editions', 'spatial', 'data', 'dither', 'engine']) await import(`../mountain/${file}.js`);
    return window.Mountain;
  })();
  return loading;
}

function fit(canvas) {
  const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
  const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
  if (canvas.width === width && canvas.height === height) return false;
  canvas.width = width;
  canvas.height = height;
  return true;
}

function squares(canvas, source, o) {
  const unit = Math.max(1, Math.round(o.cell * ratio));
  const cols = Math.ceil(canvas.width / unit);
  const rows = Math.ceil(canvas.height / unit);
  const sourceWidth = source.naturalWidth || source.width;
  const sourceHeight = source.naturalHeight || source.height;
  const cover = o.fit !== 'base';
  const scale = (cover ? Math.max(cols / sourceWidth, rows / sourceHeight) : cols / sourceWidth) * (o.scale || 1);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  const x = (cols - width) * (o.x ?? .5);
  const y = cover ? (rows - height) * (o.y ?? .5) : rows - height + height * (o.y ?? 0);
  const probe = document.createElement('canvas');
  probe.width = cols;
  probe.height = rows;
  const reader = probe.getContext('2d', { willReadFrequently: true });
  reader.imageSmoothingQuality = 'high';
  reader.drawImage(source, x, y, width, height);
  const data = reader.getImageData(0, 0, cols, rows).data;
  const cut = o.cut || 128;
  const luma = i => (.2126 * data[i] + .7152 * data[i + 1] + .0722 * data[i + 2]) / 255;
  let balanced = light => light;
  if (o.balance) {
    const lights = [];
    for (let i = 0; i < data.length; i += 4) if (data[i + 3] >= cut) lights.push(luma(i));
    lights.sort((a, b) => a - b);
    const at = share => lights[Math.floor((lights.length - 1) * share)] ?? .5;
    const low = at(.05);
    const middle = at(.5);
    const high = at(.95);
    balanced = light => light < middle ? .05 + .45 * (light - low) / Math.max(.01, middle - low) : .5 + .45 * (light - middle) / Math.max(.01, high - middle);
  }
  const ctx = canvas.getContext('2d');
  const first = Math.floor(cols * (o.from ?? 0));
  const last = Math.ceil(cols * (o.to ?? 1));
  const resolve = o.resolve || 0;
  const top = o.ramp.length - 1;
  if (!o.keep) ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (resolve > 0) {
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, x * unit, y * unit, width * unit, height * unit);
  }
  for (let r = 0; r < rows; r++) for (let c = first; c < last; c++) {
    if (resolve > 0) {
      if (o.order(c, r, cols, rows) < resolve) continue;
      ctx.clearRect(c * unit, r * unit, unit, unit);
    }
    const i = (r * cols + c) * 4;
    if (o.mute || data[i + 3] < cut) continue;
    if (o.density < 1 && scatter(c, r) >= o.density) continue;
    const level = clamp((balanced(luma(i)) - .5) * (o.contrast || 1) + .5 + (o.lift || 0)) * top;
    let step = Math.floor(level);
    if (level - step > bayer(c, r)) step++;
    const fill = o.ramp[Math.min(step, top)];
    if (!fill) continue;
    ctx.fillStyle = fill;
    ctx.fillRect(c * unit, r * unit, unit, unit);
  }
  return { cols, rows, unit, data };
}

function planTrace(grid, o) {
  const { cols, rows, data } = grid;
  const random = seeded(o.seed);
  const solid = (c, r) => c >= 0 && c < cols && r >= 0 && r < rows && data[(r * cols + c) * 4 + 3] >= 128;
  const nodes = [];
  const stride = Math.max(4, Math.round(cols / o.ridge));
  for (let c = Math.round(stride / 2); c < cols; c += Math.max(2, Math.round(stride * (.6 + random() * .8)))) {
    let r = 0;
    while (r < rows && !solid(c, r)) r++;
    if (r < rows) nodes.push({ c, r: Math.max(0, r - 1 - Math.round(random() * 3)) });
  }
  const ridge = nodes.length;
  for (let tries = 0; nodes.length < ridge + o.inside && tries < 900; tries++) {
    const c = Math.floor(random() * cols);
    const r = Math.floor(random() * rows);
    if (solid(c, r) && nodes.every(node => Math.hypot(node.c - c, node.r - r) > stride * .75)) nodes.push({ c, r });
  }
  const edges = new Set();
  const link = (a, b) => {
    const tilt = Math.abs(Math.atan2(nodes[b].r - nodes[a].r, nodes[b].c - nodes[a].c)) * 180 / Math.PI % 90;
    if (Math.min(tilt, 90 - tilt) < 9) return;
    edges.add(a < b ? `${a}:${b}` : `${b}:${a}`);
  };
  for (let i = 1; i < ridge; i++) link(i - 1, i);
  nodes.forEach((node, i) => nodes
    .map((other, j) => [Math.hypot(other.c - node.c, other.r - node.r), j])
    .filter(([, j]) => j !== i)
    .sort((a, b) => a[0] - b[0])
    .slice(0, i < ridge ? 2 : 3)
    .forEach(([, j]) => link(i, j)));
  return { nodes, edges: [...edges].map(key => key.split(':').map(Number)) };
}

function drawTrace(canvas, grid, plan, color) {
  const ctx = canvas.getContext('2d');
  const { unit } = grid;
  ctx.strokeStyle = ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1, ratio * .75);
  ctx.beginPath();
  const middle = unit < 6 * ratio ? unit : unit / 2;
  for (const [a, b] of plan.edges) {
    ctx.moveTo(plan.nodes[a].c * unit + middle, plan.nodes[a].r * unit + middle);
    ctx.lineTo(plan.nodes[b].c * unit + middle, plan.nodes[b].r * unit + middle);
  }
  ctx.stroke();
  const size = unit < 6 * ratio ? unit * 2 : unit;
  for (const node of plan.nodes) ctx.fillRect(node.c * unit, node.r * unit, size, size);
}

const kernels = { bayer: 'Ordered Horn', grain: 'Grain Massif', block: 'Pixel Icon' };

const painters = {
  async plate(canvas, d) {
    const image = await load(d.src);
    const number = key => d[key] === undefined ? undefined : Number(d[key]);
    const base = {
      cell: number('cell') || 8, ramp: ramps[d.ramp || 'colour'], fit: d.fit, scale: number('scale'), x: number('x'), y: number('y'),
      contrast: number('contrast'), lift: number('lift'), balance: d.fit === 'base', mute: d.only === 'trace', order: d.motion === 'sweep' ? sweep : develop
    };
    const cycle = number('cycle') || 18000;
    const mix = d.mix && d.mix.split(',').map(Number);
    let shown = -1;
    let plan;
    let planned = '';
    return now => {
      const resized = fit(canvas);
      const turn = d.motion && !reduced ? now % cycle / cycle : d.motion && d.motion !== 'snow' ? .27 : .5;
      const step = Math.round((1 - Math.cos(turn * TAU)) / 2 * 60);
      if (!resized && step === shown) return;
      shown = step;
      const amount = step / 60;
      const state = {
        ...base,
        density: d.motion === 'snow' ? .1 + .9 * amount : 1,
        resolve: d.resolve ? Number(d.resolve) : d.motion === 'sweep' || d.motion === 'develop' ? clamp((amount - .12) / .7) : 0
      };
      let grid;
      if (mix) {
        squares(canvas, image, { ...state, cell: mix[0], to: .5 });
        grid = squares(canvas, image, { ...state, cell: mix[1], from: .5, keep: true });
      } else grid = squares(canvas, image, state);
      if (!d.trace) return;
      const key = `${grid.cols}x${grid.rows}`;
      if (key !== planned) {
        plan = planTrace(grid, { seed: number('seed') || 7, ridge: number('ridge') || 13, inside: number('inside') ?? 18 });
        planned = key;
      }
      drawTrace(canvas, grid, plan, tone(d.trace));
    };
  },

  async peak(canvas, d) {
    const engine = await stack();
    const source = engine.presets.find(item => item.short === kernels[d.kernel || 'bayer']);
    const preset = engine.presets.push({ ...source, short: `Guide ${engine.presets.length}`, massif: d.massif || 'massif', cols: [2, 0] }) - 1;
    const recipe = Object.assign(engine.defaults(preset), {
      squareColor: tone(d.color || 'midnight-950'), squareOpacity: 100, lineOpacity: 0, stroke: 0, nodeStyle: 'solid', motion: false, dot: 10,
      width: Number(d.wide) || 100, height: Number(d.tall) || 100
    });
    const rest = Number(d.erosion ?? 8);
    const off = document.createElement('canvas');
    let shown = -1;
    return now => {
      const resized = fit(canvas);
      const erosion = d.motion && !reduced ? Math.round((1 - Math.cos(now % 18000 / 18000 * TAU)) / 2 * 74) : rest;
      if (!resized && erosion === shown) return;
      shown = erosion;
      const unit = Math.max(1, Math.round((Number(d.cell) || 8) * ratio));
      const cols = Math.max(8, 2 * Math.round(canvas.width * (Number(d.span) || .9) / unit / 2));
      const rows = cols / 2;
      engine.presets[preset].cols = [cols, 0];
      recipe.density = cols;
      recipe.erosion = erosion;
      off.width = Math.ceil(cols * unit / .84) + 2;
      off.height = Math.ceil(rows * unit / .62) + 2;
      engine.render(off, recipe, { transparent: true, time: 0 });
      const left = Math.round(off.width * .5) - unit * cols / 2;
      const foot = Math.round(off.height * .8);
      const x = Math.round((canvas.width - cols * unit) * Number(d.x ?? .5) / unit) * unit;
      const y = Math.round((canvas.height + Number(d.sink || 0) * rows * unit) / unit) * unit;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(off, x - left, y - foot);
    };
  },

  async word(canvas, d) {
    await document.fonts.load("400 100px 'Mozilla Text'");
    const stages = [32, 16, 8, 4, 0, 0, 0, 0, 4, 8, 16, 32];
    const color = tone(d.color || 'midnight-950');
    const art = document.createElement('canvas');
    let shown = -1;
    return now => {
      const resized = fit(canvas);
      const stage = reduced ? 2 : Math.floor(now / 600) % stages.length;
      if (!resized && stage === shown) return;
      shown = stage;
      art.width = canvas.width;
      art.height = canvas.height;
      const pen = art.getContext('2d');
      pen.fillStyle = color;
      pen.textAlign = 'center';
      pen.textBaseline = 'middle';
      pen.font = `400 ${canvas.height * .5}px 'Mozilla Text'`;
      const size = canvas.height * .5 * Math.min(1, canvas.width * .84 / pen.measureText(d.word).width);
      pen.font = `400 ${size}px 'Mozilla Text'`;
      pen.fillText(d.word, canvas.width / 2, canvas.height * .52);
      const ctx = canvas.getContext('2d');
      if (stages[stage]) squares(canvas, art, { cell: stages[stage], ramp: [color, color], cut: 40 });
      else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(art, 0, 0);
      }
    };
  },

  async swatch(canvas, d) {
    const color = tone(d.color || 'midnight-950');
    return () => {
      if (!fit(canvas)) return;
      const unit = Math.max(1, Math.round(Number(d.cell || 8) * ratio));
      const pitch = d.gap ? Math.round(unit * 1.25) : unit;
      const level = Number(d.level ?? 1);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = color;
      for (let r = 0; r * pitch < canvas.height; r++) for (let c = 0; c * pitch < canvas.width; c++) {
        if (bayer(c, r) < level) ctx.fillRect(c * pitch, r * pitch, unit, unit);
      }
    };
  }
};

function tracks(svg) {
  const { width, height } = svg.viewBox.baseVal;
  const d = svg.dataset;
  const random = seeded(Number(d.seed) || 3);
  const node = Number(d.node) || 8;
  const count = Number(d.count) || 3;
  const low = Number(d.low) || 35;
  const high = Number(d.high) || 65;
  const lean = d.lean === 'up' ? -1 : 1;
  const gap = Number(d.pair) || 0;
  const snap = n => Math.round(n / node) * node;
  let paths = '';
  let ends = '';
  for (let i = 0; i < count; i++) {
    const angle = (low + random() * (high - low)) * Math.PI / 180;
    const reach = height * (.52 + random() * .4) / Math.sin(angle);
    const middle = width * (i + .25 + random() * .5) / count;
    const x0 = snap(middle - Math.cos(angle) * reach / 2);
    const y0 = snap(height / 2 - lean * Math.sin(angle) * reach / 2 + (random() - .5) * height * .08);
    const x1 = snap(x0 + Math.cos(angle) * reach);
    const y1 = snap(y0 + lean * Math.sin(angle) * reach);
    const bend = (random() - .5) * reach * .16;
    const nx = -lean * Math.sin(angle);
    const ny = Math.cos(angle);
    const curve = shift => `<path vector-effect="non-scaling-stroke" d="M${x0 + nx * shift} ${y0 + ny * shift}Q${(x0 + x1) / 2 + nx * (bend + shift)} ${(y0 + y1) / 2 + ny * (bend + shift)} ${x1 + nx * shift} ${y1 + ny * shift}"/>`;
    paths += curve(0) + (gap ? curve(gap) : '');
    ends += `<rect x="${x0 - node / 2}" y="${y0 - node / 2}" width="${node}" height="${node}"/><rect x="${x1 - node / 2}" y="${y1 - node / 2}" width="${node}" height="${node}"/>`;
  }
  svg.innerHTML = `<g fill="none" stroke="currentColor" stroke-width="${d.weight || 1}">${paths}</g><g fill="currentColor">${ends}</g>`;
}

function angles(svg) {
  const ox = 56;
  const oy = 44;
  const reach = 300;
  const at = (degrees, length = reach) => [ox + Math.cos(degrees * Math.PI / 180) * length, oy + Math.sin(degrees * Math.PI / 180) * length];
  const [ax, ay] = at(35);
  const [bx, by] = at(65);
  const [hx, hy] = at(55, 288);
  const [lx, ly] = at(0, 250);
  const [px, py] = at(90, 300);
  const label = (x, y, text, anchor = 'start') => `<text x="${x}" y="${y}" text-anchor="${anchor}">${text}</text>`;
  svg.innerHTML = `
    <path d="M${ox} ${oy}L${ax} ${ay}A${reach} ${reach} 0 0 1 ${bx} ${by}Z" fill="${tone('midnight-100')}"/>
    <g fill="none" stroke="${tone('berry-500')}" stroke-width="1" stroke-dasharray="3 7"><path d="M${ox} ${oy}L${lx} ${ly}"/><path d="M${ox} ${oy}L${px} ${py}"/></g>
    <path d="M${ox} ${oy}L${hx} ${hy}" fill="none" stroke="${tone('midnight-950')}" stroke-width="2"/>
    <g fill="${tone('midnight-950')}"><rect x="${ox - 5}" y="${oy - 5}" width="10" height="10"/><rect x="${hx - 5}" y="${hy - 5}" width="10" height="10"/></g>
    <g font-family="Roboto Mono, monospace" font-size="11" letter-spacing="1" fill="${tone('midnight-700')}">
      ${label(ax + 10, ay + 4, '35°')}${label(bx - 6, by + 22, '65°', 'middle')}${label(hx + 14, hy + 10, '55° · THE MARK')}
      <g fill="${tone('berry-600')}">${label(lx + 8, ly + 4, '0° NEVER')}${label(px + 10, py, '90° NEVER')}</g>
    </g>`;
}

document.querySelectorAll('svg[data-tracks]').forEach(tracks);
document.querySelectorAll('svg[data-angles]').forEach(angles);
document.querySelectorAll('.matrix').forEach(matrix => {
  const random = seeded(214);
  matrix.innerHTML = Array.from({ length: 56 }, (_, i) => `<i class="${i % 14 > 11 ? 'wait' : random() < .2 ? 'fail' : 'pass'}"></i>`).join('');
});

const pending = new Map();
const ready = new Map();
const visible = new Set();

function mount(canvas) {
  if (!pending.has(canvas)) pending.set(canvas, painters[canvas.dataset.fig](canvas, canvas.dataset).then(frame => {
    ready.set(canvas, frame);
    return frame;
  }));
  return pending.get(canvas);
}

const watcher = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) {
      visible.delete(entry.target);
      continue;
    }
    visible.add(entry.target);
    mount(entry.target).then(frame => frame(performance.now()));
  }
}, { rootMargin: '240px' });

document.querySelectorAll('canvas[data-fig]').forEach(canvas => watcher.observe(canvas));

function tick(now) {
  for (const canvas of visible) if (canvas.dataset.motion || canvas.dataset.fig === 'word') ready.get(canvas)?.(now);
  requestAnimationFrame(tick);
}
if (!reduced) requestAnimationFrame(tick);

addEventListener('resize', () => {
  for (const canvas of visible) ready.get(canvas)?.(performance.now());
});
