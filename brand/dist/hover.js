(() => {
  if (!window.gsap) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const play = (target, vars) => {
    if (reduced.matches || !target) return;
    gsap.to(target, { duration: 0.34, ease: 'power2.out', overwrite: 'auto', ...vars });
  };
  const bind = (el, enter, leave) => {
    el.addEventListener('pointerenter', () => play(el, enter));
    el.addEventListener('pointerleave', () => play(el, { duration: 0.5, ...leave }));
  };

  document.querySelectorAll('.button, .signup').forEach(button => {
    bind(button, { y: -3 }, { y: 0 });
  });

  document.querySelectorAll('.customer-card').forEach(card => {
    bind(card, { y: -6, duration: 0.42 }, { y: 0, duration: 0.55 });
  });

  document.querySelectorAll('.footer-columns button').forEach(button => {
    bind(button, { x: 4 }, { x: 0 });
  });
})();
