/**
 * Cross-document view transitions: give only the painting being entered (or
 * returned to) the shared `painting` name, so it morphs into the room's canvas.
 * Browsers without the API simply navigate.
 */
type ViewTransitionLike = { finished: Promise<void>; ready: Promise<void> };
type SwapEvent = Event & { viewTransition: ViewTransitionLike | null; activation: { entry: { url: string } } | null };
type RevealEvent = Event & { viewTransition: ViewTransitionLike | null };

const NAME = 'painting';
const slugOf = (url: string | undefined) => (url ? new URL(url).pathname.match(/^\/works\/([^/]+)\/$/)?.[1] : undefined);
const onIndex = () => location.pathname === '/';

const paintingFor = (slug: string) => document.querySelector<HTMLElement>(`[data-painting="${CSS.escape(slug)}"]`);

const nameUntil = (el: HTMLElement, done: Promise<void>) => {
  el.style.viewTransitionName = NAME;
  done.finally(() => {
    el.style.viewTransitionName = '';
  });
};

window.addEventListener('pageswap', (event) => {
  const e = event as SwapEvent;
  if (!e.viewTransition || !onIndex()) return;
  const slug = slugOf(e.activation?.entry.url);
  const el = slug && paintingFor(slug);
  if (el) nameUntil(el, e.viewTransition.finished);
});

window.addEventListener('pagereveal', (event) => {
  const e = event as RevealEvent;
  if (!e.viewTransition || !onIndex()) return;
  const nav = (window as unknown as { navigation?: { activation?: { from?: { url?: string } } } }).navigation;
  const slug = slugOf(nav?.activation?.from?.url);
  const el = slug && paintingFor(slug);
  if (el) nameUntil(el, e.viewTransition.ready);
});
