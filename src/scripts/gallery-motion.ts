/**
 * The Edition's motion. Every page is complete without this file; it only adds
 * the cinematic layer, and it never runs under prefers-reduced-motion.
 *
 * - Lenis smooth scroll on fine pointers (touch keeps native scrolling)
 * - Frontispiece: the camera flies through the gilded frame into the painting
 * - Chapters: one pinned stage; each painted chapter is wiped in with a
 *   brushstroke while its layers drift at different depths
 * - Chapter rail, pointer parallax, gentle reveals
 */
type Gsap = typeof import('gsap').gsap;
type ScrollTriggerT = typeof import('gsap/ScrollTrigger').ScrollTrigger;
type LenisT = InstanceType<typeof import('lenis').default>;

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(pointer: fine)').matches;

const depthOf = (el: Element) => Number((el as HTMLElement).dataset.depth ?? 0);
const layersIn = (root: Element) => [...root.querySelectorAll<HTMLElement>('.scene__layer')];

/** Scroll positions to jump to for in-page anchors that live inside pinned sequences. */
const anchorTargets = new Map<Element, () => number>();

function scrollToY(y: number, lenis?: LenisT, immediate = false) {
  if (lenis) lenis.scrollTo(y, { immediate, duration: 1.6 });
  else window.scrollTo({ top: y, behavior: immediate ? 'instant' : 'smooth' });
}

function frontispiece(gsap: Gsap) {
  const root = document.querySelector<HTMLElement>('[data-frontis]');
  const frame = root?.querySelector<HTMLElement>('[data-frontis-frame]');
  const sight = frame?.querySelector<HTMLElement>('.frame__sight');
  if (!root || !frame || !sight) return;

  root.classList.add('is-cinematic');
  const title = root.querySelector('[data-frontis-title]');
  const intro = root.querySelector('[data-frontis-intro]');
  const cue = root.querySelector('[data-frontis-cue]');

  // How far the frame must grow for the painting alone to fill the screen.
  const fill = () => Math.max(window.innerWidth / sight.offsetWidth, window.innerHeight / sight.offsetHeight) * 1.04;

  gsap.set(intro, { opacity: 0, y: 40 });
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: root, start: 'top top', end: '+=190%', pin: true, scrub: 1, invalidateOnRefresh: true },
  });
  tl.to(cue, { opacity: 0, duration: 0.1 }, 0)
    .to(title, { yPercent: -70, opacity: 0, duration: 0.4, ease: 'power2.in' }, 0)
    .to(frame, { scale: fill, top: '50%', duration: 1, ease: 'power2.inOut' }, 0.05);
  for (const layer of layersIn(frame)) {
    const d = depthOf(layer);
    tl.fromTo(layer, { scale: 1, yPercent: 0 }, { scale: 1 + 0.14 * d, yPercent: -2.5 * d, duration: 1.3 }, 0);
  }
  tl.to(intro, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 1).to({}, { duration: 0.4 });
}

function chapters(gsap: Gsap, ScrollTrigger: ScrollTriggerT, lenis?: LenisT) {
  const root = document.querySelector<HTMLElement>('[data-chapters]');
  const list = root ? [...root.querySelectorAll<HTMLElement>('[data-chapter]')] : [];
  if (!root || list.length === 0) return;

  root.classList.add('is-sequenced');
  const SPAN = 3; // timeline units per chapter
  const seq = gsap.timeline({ defaults: { ease: 'none' } });
  const shownAt: number[] = [];

  list.forEach((chapter, i) => {
    const at = i * SPAN;
    chapter.style.zIndex = String(i + 1);
    const lines = [...chapter.querySelectorAll('[data-chapter-line]')];
    const plaque = chapter.querySelector('[data-chapter-plaque]');

    if (i > 0) {
      chapter.classList.add('is-wiped');
      seq.fromTo(chapter, { '--wipe': '100%' }, { '--wipe': '0%', duration: 1.3, ease: 'power2.inOut' }, at - 0.3);
    }
    for (const layer of layersIn(chapter)) {
      const d = depthOf(layer);
      seq.fromTo(
        layer,
        { scale: 1.12 + 0.1 * d, xPercent: 3.5 * d, yPercent: 1.5 * d },
        { scale: 1.02 + 0.03 * d, xPercent: -3.5 * d, yPercent: -1.5 * d, duration: SPAN + 1 },
        at - 0.3,
      );
    }
    const textIn = i === 0 ? 0 : at + 0.8;
    shownAt.push(textIn + 0.6);
    if (i > 0) {
      seq.fromTo(lines, { opacity: 0, y: 44 }, { opacity: 1, y: 0, stagger: 0.07, duration: 0.6, ease: 'power3.out' }, textIn);
      seq.fromTo(plaque, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, textIn + 0.3);
    }
    if (i < list.length - 1) {
      seq.to([...lines, plaque], { opacity: 0, y: -28, stagger: 0.02, duration: 0.45, ease: 'power2.in' }, at + SPAN - 0.75);
    }
  });

  const rail = document.querySelector<HTMLElement>('[data-rail]');
  const railLinks = rail ? [...rail.querySelectorAll<HTMLAnchorElement>('[data-rail-link]')] : [];
  const railBar = rail?.querySelector<HTMLElement>('[data-rail-progress]');
  rail?.classList.add('is-ready');

  let active = -1;
  const setActive = (index: number) => {
    if (index === active) return;
    active = index;
    railLinks.forEach((a, i) => (i === index ? a.setAttribute('aria-current', 'step') : a.removeAttribute('aria-current')));
    list.forEach((c, i) => (c.style.pointerEvents = i === index ? 'auto' : 'none'));
  };

  const st = ScrollTrigger.create({
    animation: seq,
    trigger: root,
    start: 'top top',
    end: () => `+=${list.length * window.innerHeight * 1.6}`,
    pin: true,
    scrub: 1,
    invalidateOnRefresh: true,
    onToggle: (self) => rail?.classList.toggle('is-visible', self.isActive),
    onUpdate: (self) => {
      const t = self.progress * seq.duration();
      setActive(Math.min(list.length - 1, Math.max(0, Math.floor((t + 0.6) / SPAN))));
      if (railBar) railBar.style.transform = `scaleX(${self.progress})`;
    },
  });
  setActive(0);

  // Anchors (#chapter-x) and keyboard focus land on the moment a chapter is fully shown.
  const yFor = (i: number) => st.start + (shownAt[i]! / seq.duration()) * (st.end - st.start);
  list.forEach((chapter, i) => anchorTargets.set(chapter, () => yFor(i)));
  root.addEventListener('focusin', (event) => {
    const i = list.findIndex((c) => c.contains(event.target as Node));
    if (i >= 0 && i !== active) scrollToY(yFor(i), lenis, true);
  });
}

function sceneDrift(gsap: Gsap) {
  // Room heroes and the finale: layers drift with depth as the section passes.
  for (const root of document.querySelectorAll('.room-hero, [data-finale]')) {
    for (const layer of layersIn(root)) {
      const d = depthOf(layer);
      gsap.fromTo(
        layer,
        { yPercent: -3 * d, scale: 1.04 + 0.06 * d },
        { yPercent: 4 * d, scale: 1.02, ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true } },
      );
    }
  }
}

function pointerParallax(gsap: Gsap) {
  const layers = [...document.querySelectorAll<HTMLElement>('.scene__layer')].filter((l) => depthOf(l) > 0);
  if (layers.length === 0) return;
  const movers = layers.map((l) => ({
    d: depthOf(l),
    x: gsap.quickTo(l, 'x', { duration: 1.2, ease: 'power3.out' }),
    y: gsap.quickTo(l, 'y', { duration: 1.2, ease: 'power3.out' }),
  }));
  window.addEventListener(
    'pointermove',
    (e) => {
      const mx = e.clientX / window.innerWidth - 0.5;
      const my = e.clientY / window.innerHeight - 0.5;
      for (const m of movers) {
        m.x(-mx * 26 * m.d);
        m.y(-my * 14 * m.d);
      }
    },
    { passive: true },
  );
}

function reveals(gsap: Gsap) {
  // Opacity only (never visibility), so nothing leaves the tab order.
  for (const el of document.querySelectorAll<HTMLElement>('[data-reveal]')) {
    gsap.from(el, { opacity: 0, y: 36, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
  }
}

function anchors(lenis?: LenisT) {
  document.addEventListener('click', (event) => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"], a[href^="/#"]');
    if (!link || (link.pathname !== location.pathname && link.getAttribute('href')!.startsWith('/'))) return;
    const hash = link.hash;
    const target = hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    if (!target) return;
    event.preventDefault();
    const pinned = anchorTargets.get(target);
    const y = pinned ? pinned() : target.getBoundingClientRect().top + window.scrollY;
    scrollToY(y, lenis);
    history.pushState(null, '', hash);
  });
}

async function init() {
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
  gsap.registerPlugin(ScrollTrigger);

  let lenis: LenisT | undefined;
  if (finePointer) {
    const { default: Lenis } = await import('lenis');
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis!.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  frontispiece(gsap);
  sceneDrift(gsap);
  reveals(gsap);
  anchors(lenis);
  if (finePointer) pointerParallax(gsap);

  // The chapter sequence is the heaviest set-up (pinning measures the whole page),
  // so build it only as the reader approaches — or at once if the URL points into it.
  const root = document.querySelector('[data-chapters]');
  if (!root) return;
  let built = false;
  const build = () => {
    if (built) return;
    built = true;
    io.disconnect();
    chapters(gsap, ScrollTrigger, lenis);
    ScrollTrigger.refresh();
    const target = location.hash.length > 1 ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
    const pinned = target && anchorTargets.get(target);
    if (pinned) scrollToY(pinned(), lenis, true);
  };
  const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && build(), { rootMargin: '150% 0px' });
  io.observe(root);
  if (location.hash.startsWith('#chapter-')) build();
  // In-page links into the sequence must work before it exists.
  document.addEventListener('click', (e) => (e.target as Element).closest('a[href*="#chapter-"], a[href="#contents"]') && build(), { capture: true });
}

if (!reduced.matches) {
  void init();
}
