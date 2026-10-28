# Nexora Technology

Nexora is a React website with an Express API and MongoDB database. The original page content and styling are preserved; the projects and team listings are read from MongoDB (with automatic fallback to local seed data if MongoDB is offline), and contact enquiries are handled via the API.

## Requirements

- Node.js 18.x, 20.x, or 22+
- Optional: MongoDB running locally (default: `mongodb://127.0.0.1:27017/nexora`) or a MongoDB Atlas connection string. *The app is fully functional even without MongoDB running!*

## Run locally

1. Install dependencies:

   ```sh
   npm install
   ```

2. (Optional) Check `.env` and set `MONGODB_URI` to your MongoDB connection string if using a remote MongoDB Atlas database.

3. Start the website and API:

   ```sh
   npm run dev
   ```

   Open `http://localhost:5173`. On Windows, double-clicking `Start-Website.bat` automatically starts the development servers and opens your browser.

The API runs on port 5000. `GET /api/health` reports database status. When MongoDB is available, records are stored in MongoDB. If MongoDB is offline, the site seamlessly falls back to local data stores (`projects-data.js`, `team-data.js`, and `server/data/enquiries.json`) so that all pages, filters, modals, and forms work without interruption.

For the contact form, open the site through `Start-Website.bat` or `http://localhost:5000/contact.html`. FormSubmit does not accept pages opened directly as `file://` URLs, and those pages cannot save enquiries through the local MongoDB API.

## Production build

Run `npm run build`, then run `npm start`. Express serves the built React site and its API on port 5000 (`http://localhost:5000`).

## Data

- `projects-data.js` and `team-data.js` contain the master project and team data.
- When MongoDB is connected, `npm run seed` imports the seed data into MongoDB collections. If collections are empty on server launch, they will automatically be populated from these files.
- Contact submissions are stored in MongoDB when connected, or locally in `server/data/enquiries.json` when running in offline mode.

## Email notifications

The contact form first saves enquiries through the API to MongoDB, then sends an email directly from the browser through FormSubmit to `tejas200400@gmail.com`. This restores the previously working delivery path; no Gmail SMTP password is needed. The recipient address must be activated with FormSubmit.
