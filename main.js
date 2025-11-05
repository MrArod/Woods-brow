let revealTargets = [];
let bookingStatusEl;

const onScroll = () => {
  const trigger = window.innerHeight * 0.9;
  revealTargets.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (!el.classList.contains('reveal') && rect.top < trigger) {
      el.classList.add('reveal');
    }
  });
};

document.addEventListener('DOMContentLoaded', () => {
  revealTargets = Array.from(document.querySelectorAll('.reveal-on-scroll'));
  onScroll();
  document.addEventListener('scroll', onScroll, { passive: true });

  bookingStatusEl = document.getElementById('booking-status');
  const bookingForm = document.getElementById('booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', handleBookingSubmit);
  }
});

async function handleBookingSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  if (bookingStatusEl) {
    bookingStatusEl.textContent = 'Sending your request…';
    bookingStatusEl.classList.remove('error', 'success');
  }

  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const message = error.error || 'We were unable to send your request. Please try again.';
      throw new Error(message);
    }

    form.reset();
    if (bookingStatusEl) {
      bookingStatusEl.textContent = 'Request received. We will reach out shortly to confirm your appointment.';
      bookingStatusEl.classList.add('success');
    }
  } catch (err) {
    console.error('Failed to submit booking', err);
    if (bookingStatusEl) {
      bookingStatusEl.textContent = err.message || 'We were unable to send your request. Please try again.';
      bookingStatusEl.classList.add('error');
    }
  }
}
