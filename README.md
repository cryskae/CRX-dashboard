# CRX Project Dashboard

CRX Project Dashboard is a single-project construction dashboard inspired by the structure and feel of [thegrandeonsandkey.solutions](https://thegrandeonsandkey.solutions/), rebuilt as a working CRX-branded app with persistent data, photo uploads, admin tools, and Railway-ready deployment.

## What is included

- One-page dashboard with anchored top navigation
- Overview cards, project teams, key dates, and staging details
- Scope breakdown by work area
- Schedule and timeline section
- Filterable photo gallery with categories
- Overall and area-by-area progress tracking
- Field notes log
- Admin login and update tools for:
  - progress updates
  - field notes
  - photo uploads
  - project update posts
  - deleting notes, photos, and updates
- File-backed persistence for dashboard content and uploaded images
- Railway deployment config and health check

## Tech stack

- Node.js
- Express
- Express Session
- Multer
- Vanilla HTML, CSS, and JavaScript

## Project structure

```text
.
├── public/
│   ├── app.js
│   ├── index.html
│   ├── styles.css
│   └── assets/gallery/
├── storage/
│   └── uploads/
├── package.json
├── railway.json
└── server.js
```

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create your environment file

```bash
cp .env.example .env
```

Recommended local values:

```env
PORT=3000
HOST=127.0.0.1
ADMIN_PASSWORD=crx-admin
SESSION_SECRET=replace-this-with-a-long-random-value
DATA_DIR=./storage
```

### 3. Start the app

```bash
npm start
```

### 4. Open the dashboard

Visit:

```text
http://localhost:3000
```

## Default behavior

- If `storage/data.json` does not exist, the app creates it automatically with seeded CRX project content.
- Uploaded images are stored in `storage/uploads/`.
- All admin updates, notes, progress changes, and uploads persist to the `DATA_DIR` directory.

## Admin access

The default admin password is controlled by:

```env
ADMIN_PASSWORD
```

The seeded `.env.example` uses:

```env
crx-admin
```

Change that before deploying.

## API endpoints

### Public

- `GET /api/dashboard` - full dashboard payload for the frontend
- `GET /api/health` - Railway and runtime health check

### Admin

- `POST /api/admin/login`
- `POST /api/admin/logout`
- `POST /api/admin/updates`
- `DELETE /api/admin/updates/:id`
- `POST /api/admin/photos`
- `DELETE /api/admin/photos/:id`
- `POST /api/admin/progress`
- `POST /api/admin/notes`
- `PUT /api/admin/notes/:id`
- `DELETE /api/admin/notes/:id`

## Railway deployment

### 1. Push this repo to GitHub

Railway will build from your repository.

### 2. Create a new Railway project

Choose the GitHub repo and let Railway detect the Node app.

### 3. Add environment variables

Set these in Railway:

```env
PORT=3000
HOST=0.0.0.0
ADMIN_PASSWORD=your-real-admin-password
SESSION_SECRET=your-long-random-secret
DATA_DIR=/data
```

### 4. Mount a persistent volume

To keep project data and uploaded photos between deploys:

- create a Railway volume
- mount it at `/data`
- keep `DATA_DIR=/data`

Without a volume, Railway restarts and redeploys will lose runtime data.

### 5. Deploy

`railway.json` already defines:

- `npm start` as the start command
- `/api/health` as the health check path

## Notes on persistence

This app intentionally uses file-backed persistence so it runs locally with minimal setup and can still persist on Railway when attached to a volume.

If you want to swap it to Postgres later, the cleanest place to replace is:

- `readDb()` in [server.js](/Users/crystalcombs/Documents/Playground/crx-project-dashboard-fixed/server.js:252)
- `writeDb()` in [server.js](/Users/crystalcombs/Documents/Playground/crx-project-dashboard-fixed/server.js:272)

## What was rebuilt

The original repo only contained a minimal Express stub with a `GET /projects` and `POST /projects` endpoint. It did not include the actual dashboard UI, section navigation, upload handling, admin authentication, persistent gallery management, progress management, or Railway deployment guidance.

This rebuild replaces that broken base with:

- a full single-project CRX dashboard
- a persistent storage layer
- a working upload pipeline
- an authenticated admin panel
- a deploy-ready Railway configuration
- complete setup and deployment documentation

## Verification completed

The rebuilt app was checked with:

- syntax validation for `server.js` and `public/app.js`
- dependency installation with no remaining audit issues
- local startup verification
- `GET /api/health`
- `GET /api/dashboard`
- authenticated admin write tests for notes, photo upload, and progress updates
