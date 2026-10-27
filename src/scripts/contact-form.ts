/**
 * Progressive enhancement for the Formspree form: without JS the form posts
 * normally and Formspree shows its own confirmation page.
 *
 * Success means Formspree answered `ok: true`, not just HTTP 200. Its error text
 * (an unconfirmed form, a domain restriction, reCAPTCHA) is shown as-is, so a
 * misconfigured form is visible on the page rather than silently swallowed.
 */
const TIMEOUT_MS = 20_000;

interface FormspreeReply {
  ok?: boolean;
  error?: string;
  errors?: { message?: string }[];
}

const reasonOf = (reply: FormspreeReply | undefined, status: number) =>
  reply?.errors?.map((e) => e.message).filter(Boolean).join(' ') || reply?.error || `HTTP ${status}`;

export function initContactForm() {
  const form = document.querySelector<HTMLFormElement>('[data-contact-form]');
  const status = form?.querySelector<HTMLElement>('[data-form-status]');
  if (!form || !status) return;

  const show = (state: '' | 'ok' | 'error', text: string) => {
    status.dataset.state = state;
    status.textContent = text;
    status.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    button?.setAttribute('disabled', '');
    show('', 'Sending…');
    const timer = new AbortController();
    const timeout = setTimeout(() => timer.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
        signal: timer.signal,
      });
      const reply = (await res.json().catch(() => undefined)) as FormspreeReply | undefined;
      if (!res.ok || reply?.ok !== true) throw new Error(reasonOf(reply, res.status));
      form.reset();
      show('ok', 'Thank you — your letter is on its way. I will reply by email.');
    } catch (err) {
      const reason = (timer.signal.aborted ? 'no reply from the form service' : err instanceof Error ? err.message : String(err)).replace(/\.$/, '');
      console.error('Contact form:', reason);
      show('error', `The letter could not be sent (${reason}). Please email me directly using the link below.`);
    } finally {
      clearTimeout(timeout);
      button?.removeAttribute('disabled');
    }
  });
}
