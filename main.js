const revealEls = document.querySelectorAll('.card, .service, .ph');
const onScroll = () => {
  const trigger = window.innerHeight * 0.9;
  revealEls.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < trigger) el.classList.add('show', 'reveal');
  });
};
document.addEventListener('scroll', onScroll);
document.addEventListener('DOMContentLoaded', onScroll);
