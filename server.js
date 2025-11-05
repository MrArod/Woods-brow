import express from 'express';
import session from 'express-session';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.set('trust proxy', true);
app.use(express.static('.'));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change-me',
    resave: false,
    saveUninitialized: true,
  })
);

const hasGoogleConfig =
  Boolean(process.env.GOOGLE_CLIENT_ID) && Boolean(process.env.GOOGLE_CLIENT_SECRET);

function getRedirectUri(req) {
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI;
  }

  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = forwardedProto ? forwardedProto.split(',')[0] : req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');

  return `${protocol}://${host}/auth/callback`;
}

function getOAuthClient(req) {
  if (!hasGoogleConfig) {
    throw new Error('Google OAuth environment variables are not configured');
  }

  const redirectUri = getRedirectUri(req);

  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
}

app.get('/auth', (req, res) => {
  if (!hasGoogleConfig) {
    return res.status(500).send('Google Calendar integration is not configured.');
  }

  const oauth2Client = getOAuthClient(req);
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
    prompt: 'consent',
  });
  res.redirect(url);
});

app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('Missing authorization code');
  }
  try {
    if (!hasGoogleConfig) {
      throw new Error('Google OAuth environment variables are not configured');
    }

    const oauth2Client = getOAuthClient(req);
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    req.session.tokens = tokens;
    return req.session.save(err => {
      if (err) {
        console.error('Failed to persist session tokens', err);
        return res.status(500).send('Authentication failed');
      }
      res.redirect('/booking.html?connected=1');
    });
  } catch (err) {
    console.error('OAuth callback failed', err);
    res.status(500).send('Authentication failed');
  }
});

app.get('/events', async (req, res) => {
  if (!req.session.tokens) return res.status(401).send('Unauthorized');
  if (!hasGoogleConfig) {
    return res.status(500).send('Google Calendar integration is not configured.');
  }
  const oauth2Client = getOAuthClient(req);
  oauth2Client.setCredentials(req.session.tokens);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  try {
    const events = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });
    res.send(events.data.items);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post('/events', async (req, res) => {
  if (!req.session.tokens) return res.status(401).send('Unauthorized');
  if (!hasGoogleConfig) {
    return res.status(500).send('Google Calendar integration is not configured.');
  }
  const oauth2Client = getOAuthClient(req);
  oauth2Client.setCredentials(req.session.tokens);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  try {
    const result = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: req.body,
    });
    res.send(result.data);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
