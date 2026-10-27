/**
 * Progressive enhancement for the Formspree form: without JS the form posts
 * normally and Formspree shows its own confirmation page.
 */
export function initContactForm() {
  const form = document.querySelector<HTMLFormElement>('[data-contact-form]');
  const status = form?.querySelector<HTMLElement>('[data-form-status]');
  if (!form || !status) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    button?.setAttribute('disabled', '');
    status.dataset.state = '';
    status.textContent = 'Sending…';
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      status.dataset.state = 'ok';
      status.textContent = 'Thank you — your letter is on its way.';
    } catch {
      status.dataset.state = 'error';
      status.textContent = 'The letter could not be sent. Please use the email link below.';
    } finally {
      button?.removeAttribute('disabled');
    }
  });
}
