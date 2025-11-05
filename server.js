import express from 'express';
import dotenv from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
app.use(express.static('.'));
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');
const bookingsPath = path.join(dataDir, 'bookings.json');

async function ensureBookingsFile() {
  try {
    await fs.access(bookingsPath);
  } catch (err) {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(bookingsPath, '[]', 'utf8');
  }
}

async function readBookings() {
  await ensureBookingsFile();
  const content = await fs.readFile(bookingsPath, 'utf8');
  try {
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function writeBookings(bookings) {
  await fs.writeFile(bookingsPath, JSON.stringify(bookings, null, 2));
}

app.post('/api/bookings', async (req, res) => {
  const { name, email, phone, service, date, time, notes } = req.body;

  if (!name || !email || !service || !date || !time) {
    return res.status(400).json({
      error: 'Name, email, service, date, and time are required.'
    });
  }

  const booking = {
    id: Date.now().toString(36),
    name,
    email,
    phone: phone || '',
    service,
    date,
    time,
    notes: notes || '',
    createdAt: new Date().toISOString()
  };

  try {
    const bookings = await readBookings();
    bookings.push(booking);
    await writeBookings(bookings);
    res.status(201).json({ message: 'Booking request received.', booking });
  } catch (err) {
    console.error('Failed to save booking', err);
    res.status(500).json({ error: 'Unable to save booking. Please try again later.' });
  }
});

app.get('/api/bookings', async (_req, res) => {
  try {
    const bookings = await readBookings();
    res.json(bookings);
  } catch (err) {
    console.error('Failed to load bookings', err);
    res.status(500).json({ error: 'Unable to load bookings.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
