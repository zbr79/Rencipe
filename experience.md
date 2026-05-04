# Experience Log

Record mistakes, findings, deployment notes, and lessons learned during development.

## 2026-05-04

- After using `cd` inside the persistent VS Code terminal, the next sync command starts from that changed directory. Use absolute paths for follow-up build commands to avoid accidental `cd frontend` failures from inside `backend/`.
- Loading Google Material Symbols once in `layout.tsx` plus mapping both existing Material Symbol classes in `globals.css` is the lowest-risk way to refresh app icons without rewriting every icon span at once.
- Public Playwright checks confirmed recipe rating can be implemented as an incremental average/count endpoint for the Phase 1 demo; this does not yet prevent the same user from rating more than once.
- In the VS Code Playwright code tool, `Buffer` may be unavailable and file paths may resolve to a local Windows-style path. For upload-flow tests, creating a browser-side `File` with `canvas.toBlob()` and dispatching a `change` event reliably exercises React file inputs.

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
- Visible source UI was translated to English and verified with `rg` excluding intentional pinyin maps and the unused Chinese locale file.
- Existing Mongo recipe data was translated to English and verified with a direct Mongoose check: 37 recipes, zero Chinese characters in selected recipe fields.
- Added `backend/scripts/seed-demo-data.js` and `npm run seed:demo`; the script is idempotent for demo recipes and translated existing records once.
- `source.unsplash.com` generated URLs produced broken images in Playwright. Stable `images.unsplash.com` URLs fixed the demo image issue; final database check showed zero `source.unsplash.com` recipe images.
- Frontend UI polish now covers the app shell, home dashboard, recipe library, recipe detail, search, saved, cart, create, drafts, meal plans, weekly plans, settings, and profile list surfaces. Deep detail flows still need rehearsal-driven polish.
- Existing meal-plan and weekly-plan names also needed translation because public route checks can surface Chinese from database records even when source UI scans are clean.
- Final public Playwright checks against `https://rencipe.renstoolbox.com` confirmed English main demo routes, 37 recipe cards, loaded recipe images, visible mobile bottom nav, and no horizontal overflow.
- Mechanical translation cleanup also needs a rough-English artifact scan for strings like joined words, missing spaces, or placeholder fragments; a Chinese-character scan alone will not catch those.
- Draft autosave must keep a stable draft id after the first save. Otherwise each autosave can create a duplicate draft, and deleting after publish can target the wrong scope.
- Draft deletion should require a specific draft id. A delete endpoint that treats missing id as delete-all is unsafe for a create-flow cleanup helper.
- Recipe creation should let users start without a cover image, but publishing needs an explicit final cover-image check so the validation happens at the right moment.
- The desired Phase 1 UI direction is clean and light: white or pale-gray surfaces, thin borders, subtle selected states, and small accent colors instead of heavy black filled controls.
- Product language should present reusable plans and scheduled plans under the single visible “Meal Plans” concept, even if existing internal route names still include weekly-plan terminology.
- Public nginx strips the `/api/` prefix before proxying to the backend. API calls that rely on path params need backend-compatible public routes too; draft updates now support body-id `PUT /drafts` as well as `PUT /drafts/:id`.
- Homepage empty hero space reads better as an automatic recipe image carousel using real recipe photos, with stable slide dimensions for phone-first layouts.
- The component concept should stay as a recipe eligibility property (`component`) instead of a visible browsing category or public tag; legacy `Component` tags should be hidden in UI tag displays.
- Health tags are currently implemented as normal recipe tags through a dedicated Health Tag selector, keeping the data model simple until a fuller property/tag system is needed.
- The referenced `baizhan-v2` login uses a simple client login form posting to auth routes; Rencipe now has a polished demo login page, but real JWT/account enforcement remains a Phase 1 scope decision.
- The home slideshow reads cleaner for demos when it shows only the active recipe name over real food imagery; search moved toward a grocery-style browse page with live filtering, history, recommendations, and category chips while keeping Phase 1 labels in English.
- Search and category browsing should remain separate routes: `/search` is for live text search, history, and recommendations, while `/categories` is the Browse destination for category shortcuts and recipe grids.
- The frontend meal-plan recipe API existed before the backend route/model support. Cart checkout needs backend `recipes` storage plus `POST /meal-plans/:id/recipes`, otherwise created plans cannot retain cart recipes.
- Ingredient shopping views should be plain lists for the Phase 1 demo. Checkbox-style “checklist” UI created extra mental overhead and should not appear in cart checkout flows.
- The `baizhan-v2` auth reference maps well to Rencipe as a client-side `AuthGate`: check one demo session, redirect unauthenticated users to `/login`, and block protected UI until the session state is known. Real JWT/cookie auth remains a future backend scope decision.
- Backend auth is now implemented with JWT demo users: `admin/admin` and `testuser1/testuser1`. Recipe list/detail APIs use optional auth so admin sees all recipes, normal users see public recipes plus their own private recipes, and anonymous users only receive public recipes.
- AuthGate session verification must ignore stale async results after route changes. A navigation-aborted `/api/auth/me` request can otherwise clear a valid local JWT session and redirect the user back to login.
- The auth demo data setup is repeatable with `npm run setup:auth-demo`: it creates the demo users, marks existing recipes public, and upserts two admin-private recipes for Playwright visibility checks.
- PowerPoint tooling on this VM has no `python-pptx`, pip, LibreOffice, or Pandoc. Updating `.pptx` files can be done with Python stdlib/OpenXML; browser screenshots can be saved by posting base64 PNG data from Playwright to a small local receiver, converting the Playwright screenshot buffer in-page before posting.
- Avoid using `scrollIntoView` for auto-advancing the home carousel. It can move the whole page back toward the slideshow during interval updates; a transform-based carousel keeps the page scroll position stable.
- For public Playwright checks, `waitUntil: "networkidle"` can hang on Rencipe route changes because app fetches and aborted prefetches keep the page noisy. Prefer `domcontentloaded` plus a short UI settle wait for route-level visual verification.
- Account-owned UI data must resolve the signed-in JWT session user id, not a fixed demo ObjectId. Otherwise favorites, cart, drafts, published recipes, and meal-plan lists can appear shared even when the backend schemas have `User` references.
- iOS Safari zooms focused inputs when the computed font size is below 16px. Keep form controls at 16px on mobile instead of disabling user zoom; scoped input polish may need higher-specificity selectors because the global `input[type=...]` rule is specific.
- Meal Plans should read as day-by-day eating plans, not meal-prep combinations. Keep visible UI centered on Day N, meal type, recipe add/remove, and ingredient lists; hide protein/vegetable/side/rice/portion concepts from the planner surface.
- For presentation screenshots, verify final PNG dimensions and file sizes before embedding them in the deck. In this VS Code browser environment, a local upload receiver plus explicit PNG checks is more reliable than assuming a screenshot path write succeeded.
- Search/category recommendation chips should be generated from the currently loaded recipe tags. Hardcoded browse tags drift quickly when the demo database is replaced for a presentation theme.
- Current Phase 1 product direction removes shopping cart entirely. Use saved recipes and direct Meal Plan recipe selection; do not reintroduce cart CTAs, routes, providers, or checkout language in visible UI.
- Recipe ownership needs both backend enforcement and frontend entry gating. Keep backend mutation routes returning 403 for non-owners, and make edit pages block non-owners before rendering the editor.
- Demo login credentials for later testing: username/password `admin`/`admin` and username/password `testuser1`/`testuser1`.
- In this VS Code browser, `page.screenshot({ path })` can report success without updating workspace files. For deck refreshes, return base64 screenshots from Playwright and decode them into `frontend/demo-screenshots/` before replacing PPTX media.
- The final presentation deck should be actual slides to present from, not a demo plan. Avoid visible time boxes, presenter scripts, and "Demo Flow" wording; use short topic slides plus current screenshots.