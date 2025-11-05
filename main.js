let revealTargets = [];
let calendarStatusEl;

function updateCalendarStatus(message, state = 'info') {
  if (!calendarStatusEl) return;
  calendarStatusEl.textContent = message;
  calendarStatusEl.classList.remove('error', 'success');
  if (state !== 'info') {
    calendarStatusEl.classList.add(state);
  }
}

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

  calendarStatusEl = document.getElementById('calendar-status');
  const calendarEl = document.getElementById('calendar');
  if (calendarEl) {
    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      height: 'auto',
      expandRows: true,
      dateClick: async (info) => {
        const start = new Date(info.date);
        const end = new Date(start.getTime() + 30 * 60 * 1000);
        try {
          await createEvent({
            summary: 'Appointment',
            start: start.toISOString(),
            end: end.toISOString()
          });
          calendar.addEvent({ title: 'Appointment', start });
          updateCalendarStatus('Appointment saved to your Google Calendar.', 'success');
        } catch (err) {
          console.error('Failed to create calendar event', err);
        }
      }
    });
    calendar.render();
    updateCalendarStatus('Loading your Google Calendar…');
    loadEvents(calendar);
  }
});

async function loadEvents(calendar) {
  try {
    const res = await fetch('/events');
    if (res.status === 401) {
      updateCalendarStatus('Please sign in with Google to view availability.', 'error');
      return;
    }
    if (!res.ok) {
      updateCalendarStatus('We couldn’t load Google Calendar. Please try again shortly.', 'error');
      return;
    }
    const events = await res.json();
    events.forEach(ev => {
      calendar.addEvent({
        title: ev.summary,
        start: ev.start.dateTime || ev.start.date,
        end: ev.end.dateTime || ev.end.date,
      });
    });
    updateCalendarStatus('Select a date to add your appointment.');
  } catch (err) {
    console.error(err);
    updateCalendarStatus('Something went wrong loading your calendar. Refresh and try again.', 'error');
  }
}

async function createEvent(event) {
  try {
    updateCalendarStatus('Saving your appointment…');
    const res = await fetch('/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    if (res.status === 401) {
      updateCalendarStatus('Please sign in again to book your appointment.', 'error');
      throw new Error('Unauthorized');
    }
    if (!res.ok) {
      updateCalendarStatus('We couldn’t save your appointment. Please try again.', 'error');
      throw new Error('Failed to save event');
    }
  } catch (err) {
    console.error(err);
    if (calendarStatusEl && !calendarStatusEl.classList.contains('error')) {
      updateCalendarStatus('We couldn’t save your appointment. Please try again.', 'error');
    }
    throw err;
  }
}
