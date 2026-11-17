const stage = document.querySelector('.footer-run');
if (stage) {
  const canvas = stage;
  const context = canvas.getContext('2d');
  const backdrop = document.createElement('canvas');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const names = ['chair-pink', 'chair-white', 'chair-lime', 'skier-pink', 'skier-white', 'skier-lime', 'board'];
  const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(rank => (rank + 0.5) / 16);
  const sky = ['#69bfbb', '#7dccc8', '#9ad8d2', '#e7f3ee'].map(ink);
  const snow = ['#f4fffb', '#e7f3ee', '#9ad8d2'].map(ink);
  const needles = ['#0a2221', '#123a37', '#1d524c'].map(ink);
  const lit = '#f4fffb';
  const cool = '#9ad8d2';
  const pace = 0.0165;

  const chairs = [
    { art: 0, sway: 0.05, beat: 1.7, phase: 0.4 },
    { art: 1, sway: 0.04, beat: 2, phase: 2.1 },
    { art: 2, sway: 0.055, beat: 1.55, phase: 3.9 },
    { art: 0, sway: 0.045, beat: 1.85, phase: 5.2 },
    { art: 1, sway: 0.05, beat: 1.65, phase: 1.2 }
  ];
  const riders = [
    { art: 3, offset: 0.1, speed: 0.046, lane: 0.1, weave: 0.03, turn: 2.6, phase: 0.6, lean: 0.1, tall: 0.135 },
    { art: 6, offset: 0.37, speed: 0.054, lane: 0.2, weave: 0.036, turn: 2.2, phase: 2.4, lean: 0.12, tall: 0.16 },
    { art: 4, offset: 0.63, speed: 0.04, lane: 0.14, weave: 0.032, turn: 2.9, phase: 4.1, lean: 0.09, tall: 0.145 },
    { art: 5, offset: 0.88, speed: 0.05, lane: 0.075, weave: 0.026, turn: 3.1, phase: 1.5, lean: 0.1, tall: 0.125 }
  ];
  const groves = [
    { seed: 7, every: 120, lane: 0.002, deep: 0.012, tall: 0.062, grow: 0.026, tiers: 3, frost: 0, haze: 0.9 },
    { seed: 23, every: 210, lane: 0.02, deep: 0.03, tall: 0.105, grow: 0.045, tiers: 3, frost: 1, haze: 0 },
    { seed: 41, every: 340, lane: 0.27, deep: 0.25, tall: 0.2, grow: 0.08, tiers: 4, frost: 2, haze: 0 }
  ];
  const queue = riders.slice();
  const probe = { x: 0, y: 0, depth: 0, tilt: 0 };
  const chairArt = [];
  const cable = { path: new Path2D(), tops: new Int16Array(0) };
  let art = [];
  let width = 1;
  let height = 1;
  let ratio = 1;
  let unit = 4;
  let columns = 1;
  let rows = 1;
  let margin = 0;
  let grade = 0;
  let gauge = 4;
  let onscreen = false;
  let frame = 0;
  let origin = 0;
  let finished = false;

  function ink(hex) {
    const value = parseInt(hex.slice(1), 16);
    return (0xff000000 | ((value & 0xff) << 16) | (value & 0xff00) | (value >> 16)) >>> 0;
  }

  function load(name) {
    return new Promise(resolve => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = `assets/slope/${name}.svg`;
    });
  }

  function seeded(seed) {
    let state = seed;
    return () => {
      state = (state + 0x6d2b79f5) | 0;
      let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
      mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
      return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    };
  }

  function noise(a, b) {
    const wave = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return wave - Math.floor(wave);
  }

  function wrap(value) {
    return value - Math.floor(value);
  }

  function tone(value, column, row, bands) {
    const level = bands ? Math.round(value * bands) / bands : value;
    const floor = Math.floor(level);
    return level - floor > bayer[(row & 3) * 4 + (column & 3)] ? floor + 1 : floor;
  }

  function surfaceY(x) {
    return height * (0.44 - 0.18 * (x / width));
  }

  function cableY(x) {
    const along = x / width;
    return height * (0.16 - 0.08 * along + 0.03 * along * (1 - along));
  }

  function drift(lane) {
    return 5 + (150 * lane) / (1 + 5 * lane);
  }

  function drawBackdrop() {
    backdrop.width = columns;
    backdrop.height = rows;
    const pen = backdrop.getContext('2d');
    const image = pen.createImageData(columns, rows);
    const pixels = new Uint32Array(image.data.buffer);
    for (let column = 0; column < columns; column++) {
      const across = column / columns;
      const crest = surfaceY((column + 0.5) * unit) / unit;
      const broad = across * 9.2 + 0.8;
      const fine = across * 21 + 2.4;
      const ridge = crest - rows * (0.075 + 0.04 * Math.sin(broad) + 0.02 * Math.sin(fine));
      const sunny = 0.5 - 0.234 * Math.cos(broad) - 0.266 * Math.cos(fine);
      const first = 0.085 + 0.012 * Math.sin(column * 0.045 + 1.3);
      const second = 0.21 + 0.018 * Math.sin(column * 0.031 + 4);
      const third = 0.4 + 0.026 * Math.sin(column * 0.022 + 2.2);
      for (let row = 0; row < rows; row++) {
        const drop = (row + 0.5 - crest) / rows;
        let colour = 0;
        if (drop < 0 && row + 0.5 < ridge) {
          const value = Math.min(1, row / rows / 0.28) + Math.max(0, 1 + drop / 0.22) + across * 0.3;
          colour = sky[tone(Math.min(2, value), column, row, 4)];
        } else if (drop < 0) {
          const fade = Math.max(0, 1 - (row - ridge) / (rows * 0.1));
          colour = sky[Math.min(3, tone(2 + fade * (0.3 + 0.7 * sunny), column, row, 4))];
        } else {
          const top = drop >= third ? third : drop >= second ? second : drop >= first ? first : 0;
          const base = drop >= third ? 1 : drop >= second ? third : drop >= first ? second : first;
          const fall = (drop - top) / (base - top);
          const value = (drop - top) * rows < 1.5 ? 0 : 0.1 + Math.pow(fall, 1.4) + (1 - across) * 0.45;
          colour = snow[tone(Math.min(1.5, value), column, row, 4)];
        }
        pixels[row * columns + column] = colour;
      }
    }
    pen.putImageData(image, 0, 0);
  }

  function stringCable() {
    cable.path = new Path2D();
    cable.tops = new Int16Array(columns);
    for (let column = 0; column < columns; column++) {
      const top = Math.round(cableY((column + 0.5) * unit) - gauge / 2);
      cable.tops[column] = top;
      cable.path.rect(column * unit, top, unit, gauge);
    }
  }

  function pine(random, tall, tiers, reach, frost, haze) {
    const trunk = Math.max(1, Math.round(tall * 0.09));
    const crown = tall - trunk;
    const shade = frost ? Math.round(reach * 1.5) : 0;
    const centre = reach + shade + 1;
    const sprite = document.createElement('canvas');
    sprite.width = centre + reach + 2;
    sprite.height = tall + (frost ? 2 : 0);
    const pen = sprite.getContext('2d');
    const image = pen.createImageData(sprite.width, sprite.height);
    const pixels = new Uint32Array(image.data.buffer);
    const skew = [];
    for (let tier = 0; tier < tiers; tier++) skew.push(random() * 1.6 - 0.8);
    for (let row = 0; row < crown; row++) {
      const climb = (row / crown) * tiers;
      const tier = Math.min(tiers - 1, Math.floor(climb));
      const within = climb - tier;
      const outer = (reach * (tier + 1)) / tiers;
      const inner = tier ? ((reach * tier) / tiers) * 0.45 : 0;
      const half = inner + (outer - inner) * within;
      const left = centre - Math.max(0, Math.round(half - skew[tier]));
      const right = centre + Math.max(0, Math.round(half + skew[tier]));
      const dusted = frost && within > 0.3 && right - left > 3;
      for (let column = left; column <= right; column++) {
        const across = (column - left + 0.5) / (right - left + 1);
        const value = across * 2.4 - 0.4 + (within - 0.4) * 0.6 + haze;
        // Snow sits one cell inside the lit edge so it still reads against a white slope.
        const capped = dusted && column < right && column >= right - frost && (frost > 1 || (column + row) & 1);
        pixels[row * sprite.width + column] = capped
          ? snow[frost > 1 ? 0 : 1]
          : needles[Math.max(0, Math.min(2, tone(value, column, row)))];
      }
    }
    for (let row = crown; row < tall; row++) {
      pixels[row * sprite.width + centre] = needles[0];
      if (reach > 6) pixels[row * sprite.width + centre - 1] = needles[0];
    }
    for (let band = 0; band < (frost ? 3 : 0); band++) {
      const row = tall - 1 + band;
      const from = centre - 2 - Math.round(shade * [0.65, 1, 0.6][band]);
      for (let column = Math.max(0, from); column < centre - 1; column++) {
        if ((column + row) & 1) pixels[row * sprite.width + column] = snow[2];
      }
    }
    pen.putImageData(image, 0, 0);
    return { sprite, centre: centre + 0.5, ground: tall, start: 0, lane: 0 };
  }

  function plant() {
    groves.forEach(grove => {
      const random = seeded(grove.seed);
      const count = Math.max(3, Math.round(width / ratio / grove.every));
      grove.trees = [];
      grove.pad = 0;
      for (let index = 0; index < count; index++) {
        const tall = Math.max(7, Math.round(rows * (grove.tall + random() * grove.grow)));
        const reach = Math.max(2, Math.round(tall * (0.3 + random() * 0.1)));
        const tree = pine(random, tall, grove.tiers + (random() < 0.5 ? 1 : 0), reach, grove.frost, grove.haze);
        tree.start = (index + 0.15 + random() * 0.7) / count;
        tree.lane = grove.lane + random() * grove.deep;
        grove.pad = Math.max(grove.pad, tree.sprite.width * unit);
        grove.trees.push(tree);
      }
      grove.trees.sort((a, b) => a.lane - b.lane);
      grove.rate = drift(grove.lane + grove.deep / 2) * ratio;
    });
  }

  // SVG paths are slow to re-rasterise every frame, so each sprite is drawn once per size.
  function raster(image, tall, flip) {
    if (!image) return null;
    const sprite = document.createElement('canvas');
    sprite.height = Math.max(1, Math.round(tall));
    sprite.width = Math.max(1, Math.round((tall * image.naturalWidth) / image.naturalHeight));
    const pen = sprite.getContext('2d');
    if (flip) {
      pen.translate(sprite.width, 0);
      pen.scale(-1, 1);
    }
    pen.drawImage(image, 0, 0, sprite.width, sprite.height);
    return sprite;
  }

  function cut() {
    if (!art.length) return;
    for (let index = 0; index < 3; index++) chairArt[index] = raster(art[index], height * 0.155, false);
    riders.forEach(rider => {
      rider.sprite = raster(art[rider.art], height * rider.tall, true);
    });
  }

  function pose(sprite, x, y, angle, top) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    context.setTransform(cos, sin, -sin, cos, Math.round(x), Math.round(y));
    context.drawImage(sprite, -(sprite.width >> 1), top);
    context.setTransform(1, 0, 0, 1, 0, 0);
  }

  function place(rider, time, spot) {
    const swing = rider.phase + time * rider.turn;
    spot.x = width + margin - wrap(rider.offset + time * rider.speed) * (width + margin * 2);
    spot.depth = rider.lane + rider.weave * Math.sin(swing);
    spot.y = surfaceY(spot.x) + spot.depth * height;
    spot.tilt = -rider.lean * Math.cos(swing);
  }

  function forest(grove, time) {
    const span = width + grove.pad * 2;
    for (let index = 0; index < grove.trees.length; index++) {
      const tree = grove.trees[index];
      const x = wrap(tree.start - (time * grove.rate) / span) * span - grove.pad;
      const y = surfaceY(x) + tree.lane * height;
      context.drawImage(
        tree.sprite,
        Math.round(x - tree.centre * unit),
        Math.round(y) - tree.ground * unit,
        tree.sprite.width * unit,
        tree.sprite.height * unit
      );
    }
  }

  function carve(rider, time) {
    const step = unit / (rider.speed * (width + margin * 2));
    const groove = unit >> 1;
    for (let mark = 2; mark < 64; mark++) {
      const age = mark * step;
      place(rider, time - age, probe);
      // The ground slides with the nearest tree layer, so old marks slide with it.
      const slip = drift(probe.depth) * ratio * age;
      const column = Math.floor((probe.x - slip) / unit);
      if (mark > 54 ? column & 3 : mark > 38 && column & 1) continue;
      const top = Math.round((probe.y + slip * grade) / groove) * groove;
      context.fillRect(column * unit, top - unit, unit, groove);
      if (rider.art !== 6) context.fillRect(column * unit, top, unit, groove);
    }
  }

  function lift(time) {
    const run = width + margin * 2;
    const gap = unit * 4;
    const tick = Math.round(unit * 1.5);
    context.fillStyle = '#051413';
    context.fill(cable.path);
    context.fillStyle = '#c5c2c0';
    for (let x = ((time * pace * run) % gap) - gap; x < width; x += gap) {
      let left = Math.round(x);
      const end = left + tick;
      while (left < end) {
        const column = Math.floor(left / unit);
        const next = Math.min(end, (column + 1) * unit);
        if (column >= 0 && column < columns) context.fillRect(left, cable.tops[column] + 1, next - left, gauge - 2);
        left = next;
      }
    }
    for (let index = 0; index < chairs.length; index++) {
      const chair = chairs[index];
      const sprite = chairArt[chair.art];
      if (!sprite) continue;
      // A shared mean speed with a slow per-chair surge varies the pace without chairs ever meeting.
      const surge = 0.012 * Math.sin(time * 0.17 + chair.phase);
      const x = wrap(index / chairs.length + time * pace + surge) * run - margin;
      pose(sprite, x, cableY(x), chair.sway * Math.sin(time * chair.beat + chair.phase), -Math.ceil(gauge / 2) - 1);
    }
  }

  function spray(rider, time) {
    const beat = (rider.phase + time * rider.turn) / Math.PI - 0.5;
    const turn = Math.floor(beat);
    const since = ((beat - turn) * Math.PI) / rider.turn;
    for (let flake = 0; flake < 10; flake++) {
      const age = since - flake * 0.03;
      if (age < 0 || age > 0.6) continue;
      place(rider, time - age, probe);
      const kick = 40 + noise(rider.art * 7 + flake, turn) * 100;
      const toss = 120 + noise(flake, turn + rider.art * 3) * 120;
      const size = Math.round(unit * (age < 0.25 ? 1 : age < 0.45 ? 0.75 : 0.5));
      const x = Math.round(probe.x + rider.sprite.width * 0.3 + kick * ratio * age);
      const y = Math.round(probe.y - size - (toss * age - 300 * age * age) * ratio);
      if (y > probe.y) continue;
      // A lit chunk is invisible on lit snow, so each one is a cool chunk with a lit corner.
      context.fillStyle = cool;
      context.fillRect(x, y, size, size);
      context.fillStyle = lit;
      context.fillRect(x, y, size >> 1, size >> 1);
    }
  }

  function nearer(a, b) {
    return a.depth - b.depth;
  }

  function ski(time) {
    for (let index = 0; index < riders.length; index++) place(riders[index], time, riders[index]);
    queue.sort(nearer);
    for (let index = 0; index < queue.length; index++) {
      const rider = queue[index];
      if (!rider.sprite) continue;
      const reach = rider.sprite.width * 0.36;
      context.fillStyle = cool;
      for (let cell = 0; cell * unit < reach * 2; cell++) {
        context.fillRect(Math.round(rider.x - reach) + cell * unit, Math.round(rider.y) - (cell & 1) * unit, unit, unit);
      }
      pose(rider.sprite, rider.x, rider.y, rider.tilt, Math.round(2 * ratio) - rider.sprite.height);
      spray(rider, time);
    }
  }

  function paint(time) {
    context.imageSmoothingEnabled = false;
    context.drawImage(backdrop, 0, 0, columns * unit, rows * unit);
    context.fillStyle = cool;
    for (let index = 0; index < riders.length; index++) carve(riders[index], time);
    forest(groves[0], time);
    forest(groves[1], time);
    lift(time);
    ski(time);
    forest(groves[2], time);
  }

  function resize() {
    const box = stage.getBoundingClientRect();
    ratio = Math.min(devicePixelRatio || 1, 1.5);
    width = canvas.width = Math.max(1, Math.round(box.width * ratio));
    height = canvas.height = Math.max(1, Math.round(box.height * ratio));
    unit = Math.max(3, Math.round(4 * ratio));
    columns = Math.ceil(width / unit);
    rows = Math.ceil(height / unit);
    margin = Math.round(height * 0.2);
    grade = (0.18 * height) / width;
    gauge = Math.max(4, Math.round(3.4 * ratio));
    drawBackdrop();
    stringCable();
    plant();
    cut();
    paint(reduced.matches || finished ? 2.4 : 0);
  }

  function loop(now) {
    if (!onscreen || finished) return;
    if (!origin) origin = now;
    const elapsed = (now - origin) / 1000;
    paint(elapsed);
    if (elapsed > 14) {
      finished = true;
      return;
    }
    frame = requestAnimationFrame(loop);
  }

  function run() {
    cancelAnimationFrame(frame);
    if (reduced.matches) {
      finished = true;
      paint(2.4);
      return;
    }
    if (onscreen && !finished) frame = requestAnimationFrame(loop);
  }

  // Sized before anything can paint: cached sprites may resolve ahead of the first observer callback.
  resize();
  new ResizeObserver(resize).observe(stage);
  const slope = stage.parentElement;
  let open = false;
  let armed = false;
  let extra = 0;

  function atBottom() {
    return innerHeight + scrollY >= document.documentElement.scrollHeight - 24;
  }

  function show() {
    if (open) return;
    open = true;
    slope.classList.add('is-open');
    onscreen = true;
    run();
    requestAnimationFrame(() => {
      const height = slope.offsetHeight;
      const top = slope.getBoundingClientRect().top + scrollY - innerHeight + height;
      scrollTo({ top: Math.max(0, top), behavior: 'auto' });
    });
  }

  function pull(delta) {
    if (open || delta <= 0) return;
    if (!atBottom()) {
      extra = 0;
      return;
    }
    if (!armed) {
      armed = true;
      return;
    }
    extra += delta;
    if (extra >= 28) show();
  }

  addEventListener('wheel', event => pull(event.deltaY), { passive: true });
  let touchY = 0;
  addEventListener('touchstart', event => {
    touchY = event.touches[0].clientY;
  }, { passive: true });
  addEventListener('touchmove', event => {
    const y = event.touches[0].clientY;
    const delta = touchY - y;
    touchY = y;
    pull(delta);
  }, { passive: true });
  new IntersectionObserver(entries => {
    const visible = entries[entries.length - 1].isIntersecting;
    onscreen = visible && open;
    if (onscreen) run();
  }).observe(slope);
  Promise.all(names.map(load)).then(images => {
    art = images;
    cut();
    run();
    reduced.addEventListener('change', run);
  });
}
