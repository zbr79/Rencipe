# Experience Log

Record mistakes, findings, deployment notes, and lessons learned during development.

## 2026-05-03

- Existing live PM2 processes were named `backend` and `frontend`, and they were running from `/home/ubuntu/zhenchuan`, not `/home/ubuntu/rencipe`.
- Existing live ports were frontend `3000` and backend `5000`.
- Rencipe should use separate PM2 processes named `rencipe-frontend` and `rencipe-backend` so it can move to frontend `4000` and backend `6000` without disturbing other apps.
- The active rencipe nginx site is `/etc/nginx/sites-available/rencipe`, enabled through `/etc/nginx/sites-enabled/rencipe`.
- Keep an ignored local copy of the original nginx config before editing live nginx files.
- The original rencipe nginx config was copied to `local-nginx/rencipe.original.nginx.conf`, and `local-nginx/` is ignored by git.
- Rencipe nginx was updated to proxy frontend traffic to `127.0.0.1:4000` and backend API traffic to `127.0.0.1:6000`; zhenchuan nginx was intentionally left on `3000`/`5000`.
- PM2 processes `rencipe-backend` and `rencipe-frontend` were created from `/home/ubuntu/rencipe`; the older `backend` and `frontend` processes remain online for the other app.
- Node/Next `fetch()` treats port `6000` as a blocked bad port. Direct local `http://127.0.0.1:4000/api/*` route handlers can fail when they fetch `http://localhost:6000`; public nginx `/api/*` works because nginx proxies directly to the backend.
- Backend build blockers fixed during this work: Express route params needed narrowing, and backend/frontend pinyin maps had duplicate object keys.
- Frontend build blockers fixed during this work: Next 16 route params needed `Promise` typing, image enrichment needed explicit recipe types, draft types were missing `name`, and a few meal-plan numeric inputs needed `number | ""` state.
- The CPSC 597 demo requirements require PowerPoint slides, a recorded video presentation, and a project/outcomes demo limited to about 20 minutes.
- The presentation should cover background, motivation, problem, significance, goals, objectives, approaches, solutions, results, goal achievement, and success criteria, using visual material instead of long slide text.
- The report draft identifies core Rencipe scope as recipe management, meal planning, favorites, shopping cart, live deployment, and planned account/login support; keto dietary features are still in progress.
- Current app inventory shows the strongest Phase 1 gaps are full English UI coverage, auth/JWT/account flow, keto-specific behavior, responsive polish, demo seed data, and meal-plan ingredient checklist verification.
- Meal-plan ingredient totals are currently calculated in the frontend, but the backend ingredient-check PATCH handler should be verified because it updates state without visibly returning a response in the controller.