# Woods Brows

A minimal, luxe website for Woods Brows — showcasing services like microblading, facials, brow lamination, and PMU.

Live at: https://yourusername.github.io/woods-brows-site/

## Development

This project now includes a small Node/Express server to handle Google OAuth and Calendar API calls. To run locally:

1. Create a `.env` file based on `.env.example` and provide your Google OAuth credentials.
2. Install dependencies and start the server:

   ```bash
   npm install
   npm start
   ```

The site will be available at `http://localhost:3000/`.

### Pages

- `index.html` – landing page with overview of services
- `booking.html` – Google Calendar booking interface
- `microblading.html`, `facials.html`, `brow-lamination.html`, `pmu.html` – individual service details
