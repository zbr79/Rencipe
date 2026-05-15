# Rencipe Frontend

Rencipe is a recipe management and meal planning web app. The frontend is built with Next.js and talks to the backend API through the local App Router API proxy routes.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run start
```

Development runs on `http://localhost:4000`.

## Environment

Use `.env.example` as the template for local frontend configuration. Do not commit real `.env` files.

## Product Areas

- Signed-in app shell with top search and bottom navigation.
- Recipe browse, search, detail, create, edit, saved, and drafts flows.
- Reusable meals and plan editing surfaces.
- Account settings, profile fields, avatar upload, and account switching.

For the deployed product environment, the frontend process is expected to run on port `4000`.
