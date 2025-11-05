let revealTargets = [];

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

  const signinBtn = document.getElementById('signin-btn');
  if (signinBtn) {
    signinBtn.addEventListener('click', () => {
      window.location.href = '/auth';
    });
  }

  const calendarEl = document.getElementById('calendar');
  if (calendarEl) {
    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      height: 'auto',
      expandRows: true,
      dateClick: async (info) => {
        const start = new Date(info.date);
        const end = new Date(start.getTime() + 30 * 60 * 1000);
        await createEvent({
          summary: 'Appointment',
          start: start.toISOString(),
          end: end.toISOString()
        });
        calendar.addEvent({ title: 'Appointment', start });
      }
    });
    calendar.render();
    loadEvents(calendar);
  }
});

async function loadEvents(calendar) {
  try {
    const res = await fetch('/events');
    if (res.ok) {
      const events = await res.json();
      events.forEach(ev => {
        calendar.addEvent({
          title: ev.summary,
          start: ev.start.dateTime || ev.start.date,
          end: ev.end.dateTime || ev.end.date,
        });
      });
    }
  } catch (err) {
    console.error(err);
  }
}

async function createEvent(event) {
  try {
    await fetch('/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
  } catch (err) {
    console.error(err);
  }
}
