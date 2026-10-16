/**
 * Gallery motion: reveals, hero parallax, raking light and — on wide screens
 * with a fine pointer — the horizontal walk through the Hall of Works.
 * Nothing here runs when the visitor prefers reduced motion; the CSS layout is
 * the complete static fallback.
 */
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

async function init() {
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
  gsap.registerPlugin(ScrollTrigger);

  // Hero: the vault drifts slower than the page.
  gsap.to('.hero__vault', {
    yPercent: 30,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  const mm = gsap.matchMedia();

  // Horizontal walk.
  mm.add('(min-width: 64rem) and (pointer: fine)', () => {
    const hall = document.querySelector<HTMLElement>('[data-hall]');
    const track = hall?.querySelector<HTMLElement>('[data-hall-track]');
    if (!hall || !track) return;

    hall.classList.add('is-walkable');
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

    const walk = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: hall,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });

    // Slow parallax inside each canvas as it passes.
    track.querySelectorAll<HTMLElement>('.work').forEach((work) => {
      const canvas = work.querySelector('.canvas');
      if (!canvas) return;
      gsap.fromTo(
        canvas,
        { xPercent: -4, scale: 1.1 },
        {
          xPercent: 4,
          ease: 'none',
          scrollTrigger: { trigger: work, containerAnimation: walk, start: 'left right', end: 'right left', scrub: true },
        },
      );
    });

    // Keyboard users: bring a focused painting into view (transforms don't scroll).
    const onFocus = (event: FocusEvent) => {
      const work = (event.target as HTMLElement).closest<HTMLElement>('.work');
      const st = walk.scrollTrigger;
      if (!work || !st || distance() === 0) return;
      const centre = work.offsetLeft + work.offsetWidth / 2 - window.innerWidth / 2;
      const progress = gsap.utils.clamp(0, 1, centre / distance());
      window.scrollTo({ top: st.start + progress * (st.end - st.start), behavior: 'instant' });
    };
    track.addEventListener('focusin', onFocus);

    return () => {
      track.removeEventListener('focusin', onFocus);
      hall.classList.remove('is-walkable');
    };
  });

  // Reveals for everything that is not on the moving wall.
  mm.add('(max-width: 63.99rem), (pointer: coarse)', () => {
    gsap.utils.toArray<HTMLElement>('.hall [data-reveal]').forEach((el) => {
      gsap.from(el, { autoAlpha: 0, y: 32, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
  });
  gsap.utils.toArray<HTMLElement>('.crafts [data-reveal]').forEach((el, i) => {
    gsap.from(el, {
      autoAlpha: 0,
      y: 32,
      duration: 1,
      delay: (i % 4) * 0.08,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
    });
  });

  // Raking light follows the pointer across a painting.
  if (window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll<HTMLElement>('.work__link').forEach((link) => {
      const light = link.querySelector<HTMLElement>('.frame__light');
      if (!light) return;
      link.addEventListener('pointermove', (e) => {
        const r = light.getBoundingClientRect();
        light.style.setProperty('--lx', `${((e.clientX - r.left) / r.width) * 100}%`);
        light.style.setProperty('--ly', `${((e.clientY - r.top) / r.height) * 100}%`);
      });
    });
  }
}

if (!reduced.matches) {
  void init();
}
