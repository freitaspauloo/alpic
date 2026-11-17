const section = document.querySelector('.customers');

if (section) {
  const cell = 8;
  const bayer = [
    0, 32, 8, 40, 2, 34, 10, 42,
    48, 16, 56, 24, 50, 18, 58, 26,
    12, 44, 4, 36, 14, 46, 6, 38,
    60, 28, 52, 20, 62, 30, 54, 22,
    3, 35, 11, 43, 1, 33, 9, 41,
    51, 19, 59, 27, 49, 17, 57, 25,
    15, 47, 7, 39, 13, 45, 5, 37,
    63, 31, 55, 23, 61, 29, 53, 21
  ];
  const tones = [0, 24, 50, 88];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const canvas = document.createElement('canvas');
  canvas.className = 'customers-field';
  canvas.setAttribute('aria-hidden', 'true');
  section.prepend(canvas);
  const context = canvas.getContext('2d');
  let pixels;
  let visible = false;
  let frame = 0;
  let lastPaint = 0;

  function density(across, down, time) {
    const side = Math.abs(across - 0.5) * 2;
    const drift = Math.sin(across * 4 + down * 2.2 + time * 0.04);
    return 0.18 + side * side * 0.16 + drift * 0.05;
  }

  function paint(time) {
    if (!pixels) return;
    const { width, height, data } = pixels;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const threshold = (bayer[(y % 8) * 8 + (x % 8)] + 0.5) / 64;
        const level = Math.max(0, Math.min(3, Math.floor(density(x / width, y / height, time) * 3 + threshold)));
        const index = (y * width + x) * 4;
        data[index] = 79;
        data[index + 1] = 169;
        data[index + 2] = 162;
        data[index + 3] = tones[level];
      }
    }
    context.putImageData(pixels, 0, 0);
  }

  function tick(now) {
    frame = 0;
    if (!visible || document.hidden || reduced.matches) return;
    if (now - lastPaint > 400) {
      paint(now / 1000);
      lastPaint = now;
    }
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    paint(reduced.matches ? 0 : performance.now() / 1000);
    if (visible && !document.hidden && !reduced.matches) frame = requestAnimationFrame(tick);
  }

  new ResizeObserver(() => {
    canvas.width = Math.ceil(section.clientWidth / cell);
    canvas.height = Math.ceil(section.clientHeight / cell);
    canvas.style.width = `${canvas.width * cell}px`;
    canvas.style.height = `${canvas.height * cell}px`;
    pixels = context.createImageData(canvas.width, canvas.height);
    sync();
  }).observe(section);
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    sync();
  }).observe(section);
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
}
