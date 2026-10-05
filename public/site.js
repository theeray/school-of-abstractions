/* Link the prepared story to Saige's documented responses. */
'use strict';
document.addEventListener('click', async event => {
  const button = event.target.closest('[data-saige-question]');
  if (!button) return;
  await customElements.whenDefined('saige-guide');
  const guide = document.querySelector('saige-guide');
  if (!guide) return;
  document.querySelector('#talk').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  await guide.ask(button.dataset.saigeQuestion, button.dataset.saigeTopic);
  guide.input.focus({preventScroll: true});
});
