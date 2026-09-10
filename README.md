# Rencipe

Rencipe is a full-stack recipe application for discovering, saving, rating, and organizing recipes. It includes a responsive desktop and mobile interface, guest browsing, authenticated accounts, recipe editing, meal planning, and admin-controlled image focal points.

This repository is a portfolio/demo project. The application is deployed with a Next.js frontend, an Express backend, MongoDB, Cloudinary image uploads, and PM2.

## Highlights

- Responsive recipe discovery with search, browse filters, slideshow, and recipe cards
- Guest browsing plus authenticated user accounts
- Saved recipes, ratings, comments, drafts, and meal planning
- Admin-only recipe image focus editor with separate crops for:
  - Recipe cards
  - Home slideshow
  - Recipe detail images
- Public About, Legal, and Contact pages

## Architecture

```text
Browser
  │
  ▼
Next.js frontend (:4000)
  │  /api/* proxy routes
  ▼
Express backend (:6000 locally, :6100 in deploy.sh)
  │
  ├── MongoDB
  └── Cloudinary
```

## Requirements

- Node.js 20 or newer
- npm
- MongoDB connection string
- Cloudinary account for image uploads (optional for read-only browsing)

## Local setup

Install dependencies:

```bash
cd backend
npm ci

cd ../frontend
npm ci
```

Create environment files from the examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Set real values in the copied files. Never commit `.env` or `.env.local`.

Start the backend:

```bash
cd backend
npm run dev
```

In a second terminal, start the frontend:

```bash
cd frontend
npm run dev
```

Open `http://localhost:4000`.

## Environment variables

Backend variables are documented in `backend/.env.example`. The important values are:

- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — signing secret for authentication tokens
- `PORT` — backend port, normally `6000` locally
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — image upload configuration

Frontend variables are documented in `frontend/.env.example`:

- `NEXT_PUBLIC_BACKEND_URL` — backend base URL, normally `http://localhost:6000`

## Validation

Build both applications:

```bash
cd backend
npm run build

cd ../frontend
npm run build
```

Run the backend test suite:

```bash
cd backend
npm test
```

Run frontend lint:

```bash
cd frontend
npm run lint
```

The lint command currently completes with non-blocking recommendations for image optimization, hook dependency review, and unused values.

Run the complete browser suite:

```bash
cd frontend
npm run test:e2e
```

The Playwright suite covers responsive layouts from phone through desktop widths, public navigation and search, recipe details, comments and ratings, the kitchen converter, admin image-focus editing, accessibility checks, and visual regression snapshots.

## Continuous integration

GitHub Actions runs on every branch push and pull request. It installs dependencies, runs backend tests and builds, then runs frontend linting, the production build, and the Playwright browser suite.

## Deployment

`deploy.sh` builds both applications and reloads the `rencipe-backend` and `rencipe-frontend` PM2 processes. It expects the production environment to provide the backend secrets and PM2 installation.

```bash
./deploy.sh
```

## Project structure

```text
backend/
  src/server.ts             Express entry point
  src/routes/               HTTP route definitions
  src/controllers/          Request and database logic
  src/models/               Mongoose schemas
  scripts/                  Data maintenance and seed scripts

frontend/
  src/app/                  Next.js routes and UI
  src/hooks/                Shared React hooks
  src/lib/                  Frontend infrastructure
```

## Current scope

The application is suitable for demonstrating full-stack product development, responsive UI work, automated testing, and CI. Before production use, it should still receive rate limiting, tighter CORS configuration, guest-account cleanup, database backup procedures, and image licensing review.
