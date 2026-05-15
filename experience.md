# Experience Log

Record mistakes, findings, deployment notes, and lessons learned during development.

## 2026-05-15

- When rewriting DOCX report bodies with python-docx, preserve the final Word `sectPr` body element and avoid assuming the template has a `Table Grid` style. For Google Docs import, avoid Word automatic list numbering when it renders poorly; stable literal bullet paragraphs with hanging indents import more predictably. Add explicit table borders through `w:tblBorders`, and use blue mainly on changed section headings/placeholders instead of coloring the whole report body.
- For product turn-in cleanup, remove runtime placeholder-image mutation paths instead of hiding them: delete public population routes, remove app-startup data mutation, and let recipe surfaces use real stored images or existing no-image icon states.
- After adding ignore rules for delivery cleanup, remember that already tracked files still appear until they are deleted and committed. Backend `dist/` can also retain stale compiled files after source deletion unless the build output is cleaned, but ignored `dist/` files should not be treated as source-delivery findings.
- New reusable meals should start as draft-backed editor state, not as saved `MealPlan` documents with placeholder names. Promote a meal only after required fields are complete, and keep incomplete meal work in Drafts with `draftType: "meal"`.
- Meal edit screens should not include a separate saved/exit button that navigates to a fixed list URL. Use the shared history-aware BackButton for leaving detail/edit views.
- Account language checks must use the backend-backed session, not only localStorage overrides, because AuthGate refresh can replace local-only language changes. Runtime UI translation also needs leaf-element text handling for React split text such as `Recipes (1)`.

## 2026-05-14

- Saved recipe rows that support swipe actions should make the main row itself the link. Nesting the link inside a swipe row can make normal taps feel unreliable on mobile and desktop QA.
- Recipe detail views should increment through the backend with `timestamps: false`; otherwise every read can move `updatedAt` and accidentally affect newest-style ordering.
- Reusable meals can stay in the `MealPlan` collection as `kind: "meal"`; add sharing fields there instead of creating a parallel Meal model.
- Comments for recipes and meals should use one target-type/comment model with denormalized display names, while delete permissions are checked against the live authenticated user role.
- The integrated browser can stay constrained to a phone-width viewport; use a headless Playwright run with an explicit desktop viewport when verifying PC-specific layout changes.
- Live route audits should include data-quality checks, not just HTTP status. A route can load while still showing non-English records or placeholder names that hurt demo polish.
- Keep local Next API proxy behavior aligned with backend behavior even when public nginx bypasses the proxy. Draft listing is a good example: backend supports author-level list fetches, so local proxy routes should too.
- Recent-viewed recipe history should use both age and count limits. For the current phone-first demo, 90 days plus a 50-item cap keeps the list useful without storing stale browsing noise.
- Desktop swipe rows need pointer-drag handling on the row itself, including link rows, so PC QA can reveal hidden actions without touch hardware.
- Account language filters should run at the recipe API boundary and again on client-owned cached recipe surfaces such as saved and recently viewed lists, otherwise Project Mode can leak older local records.
- Desktop swipe rows should avoid making the draggable surface a real anchor. Mouse dragging an anchor can trigger browser link dragging or URL previews before app swipe logic wins.
- Recipe language display/filtering should let current CJK text override stored language fields. Otherwise older records saved as English can stay mislabeled after Chinese text is added.
- Full-screen create/account modals must stack above the mobile bottom nav or close on route changes, so bottom-nav taps cannot leave an old modal open on the next page.
- Native select/dropdown controls are not a good fit for Rencipe UI. Use custom app-styled menus so option sizing, color, and typography stay controlled.
- Do not use blur effects for overlays, headers, or modal backdrops. Use plain dimmed gray/black backgrounds for open modal states.
- When removing old planning data, preserve reusable Meals and never delete records where `kind` is `meal`.

## 2026-05-11

- Phase 1 is complete. Current work is Phase 2 improvement work on top of the Phase 1 baseline.
- For linked homepage hero slides, use pointer-event swipe handling instead of touch-only handlers and pause autoplay after manual movement. That keeps finger swipes working on the carousel while avoiding the feeling that the app fights the user immediately after a manual slide.
- For a home carousel that feels native, apply the live drag offset to the track transform while the pointer is down and disable the transition during that drag. If the offset is only used after release, the slide feels like it snaps late instead of following the finger.
- Home carousel release logic should use a width-based swipe threshold plus peak-drag fallback. If the user drags far enough toward the next slide and then pulls back toward the start before release, treat that as a canceled flip instead of forcing the page change.
- Demo seed recipes can share nearly identical `createdAt` timestamps because they are bulk inserted in one run. For a visible `Newest` sort, use `createdAt` first and then a stable fallback such as the recipe ObjectId instead of letting equal timestamps fall back to unrelated backend order.
- Homepage slide indicators should keep a constant width across active and inactive states. Stretching the active marker makes the dot row visibly shift on each slide change.
- Edit forms need an explicit cover-image add/change control even when the current recipe has no cover. A hidden file input plus a clickable existing image is too implicit and leaves no visible entry point for cover editing.
- The shared floating action panel should sit flush to the mobile viewport edge with no right-side inner gutter. Keep the action stack's right edge square, remove right padding in the opened stack, and center the toggle ear against the action column instead of bottom-aligning it.
- The newer floating action pattern works better as a bottom-right FAB: collapse multi-action panels into one anchored circular primary action, put a small chevron toggle on the top-left edge, and expand leftward into a rounded pill so the primary action stays in place while secondary actions are revealed.
- That FAB-plus-pill pattern was still one step too decorative for the current product direction. The cleaner version is a simple bottom-right action row with no outer shell and no expand/collapse state, so each page shows its full relevant button set immediately.
- When the always-visible action row sits over busy content, give the row its own light edge-anchored tray background instead of reverting to a full floating shell. A thin bordered, softly blurred tray keeps the controls readable while still feeling lighter than the earlier panel.
- Favorites should update in place from shared saved-state context. Do not refresh or navigate after save/unsave; flip the local state immediately and use toast feedback for save success, unsave success, and failures.
- Create-flow actions should also use the shared toast system instead of local inline banners. Manual draft save, create validation errors, and create success read more consistently as standard toasts while the separate draft autosave timestamp stays visible on its own.
- For edit surfaces that move to live persistence, keep a separate session-start snapshot for revert instead of treating the latest autosaved server state as the revert target. Autosave can update the live document continuously, while revert should still restore the original version the user opened.
- Phase 2 work reports no longer need the old demo-readiness status section.
- Account settings should not insert a redundant "Edit Profile" hub page. From Settings, the Account page itself should expose direct rows for profile fields, with any deeper editing routes attached to those rows instead of a separate intermediate layer.
- Avatar upload needs the full auth contract wired together: user schema, auth middleware/JWT payload, `/auth/me`, and frontend session typing. If one layer misses `avatarUrl`, the photo appears to save and then disappears on the next session refresh.
- When search moves from a route/page strip into a top-bar overlay, remove the old page-level search entry points in the layout and category page at the same time. Keep the overlay fixed below the top bar and above the bottom nav, and use the first matched recipe image as the right-side preview for history rows.
- Do not mount a fixed overlay inside the sticky top bar when that header uses blur or filter effects. The fixed child can inherit the header as its containing block and collapse to header height instead of covering the page; render the overlay as a sibling or portal instead.
- In client components, helper `const` functions used by derived render-time values still need to be declared before those values. The type checker may stay quiet, but the page can still fail at runtime from temporal-dead-zone ordering.
- The App Router layout needs explicit viewport metadata (`width=device-width`, `initial-scale=1`) for reliable phone-first rendering. Without it, mobile browsers can fall back to a wide layout viewport and make otherwise-correct responsive CSS look broken.
- Do not use native browser `alert()` or `confirm()` in Rencipe. Always use the shared app-level confirmation modal provider so warning/confirm flows stay consistent in styling, mobile layout, and intent colors.
- When adding recipe metadata fields, wire them through draft autosave and draft reload in the same round. Otherwise users can fill the new fields, reload the create page, and silently lose that data.
- Recipe publish visibility must be wired through create/edit UI, the recipe controller, and draft autosave together. If one layer is missed, the checkbox either saves nothing or resets after reload.
- For save success that does not require a user choice, use a toast instead of a confirm modal. Reserve the confirm modal for real decisions such as delete or publish warnings.
- Recipe updates must preserve the existing cover image when the client does not send an `image` field. Treating missing image input as `undefined` clears the stored cover and can make the UI fall back to unrelated placeholder imagery after publish/save.
- The create-page cover image entry should open the file picker directly instead of a separate staging modal, and its top cover section should reuse the same edge alignment and border rhythm as the rest of the form. Mixing a boxed upload prompt with border-bottom sections makes the page feel uneven on mobile.
- For editable cover images, do not stack two controls for the same action. A clickable image plus a separate `Change cover` button feels redundant; one dark corner camera badge with a small helper line reads cleaner on recipe photos.
- Cooking steps should default to instructions first with no step image shown. A compact Add image button works better than a large empty upload tile, and step-image inputs should reset their value after each selection so replacing with the same file still fires `change`.
- Freeform recipe text fields like `tips` need to be wired through the full path in one round: create/edit form state, draft autosave/load, recipe schema/controller, and detail-page rendering. If one layer is skipped, the field appears to work locally but disappears after save or reload.
- Recipe create and edit should share one page-level composer, while recipe detail stays separate. The duplicated work lives in the editor orchestration layer, not the read-only detail surface, so merge the editor routes and keep detail mode independent.
- Create-page required-field feedback works best as one composer-level validation map: toast the missing field list once, then keep title, description, cover image, main ingredients, and steps highlighted live in red until each requirement is satisfied.
- Once the dedicated profile hub is removed, make login land on home unconditionally and redirect stale `/profile` URLs there too. Leaving old `next=/profile` behavior in the auth gate keeps reviving a page the product no longer wants.
- If a swipeable hero carousel captures pointer input on its container, do not rely on the nested anchor alone for navigation. On pointer release, hit-test the element under the finger and programmatically route to the slide href when the gesture stayed under the swipe threshold.
- Recipe edit autosave reads better with an end-of-page completion row than with a floating status badge. Keep one muted status button for the current save state and one green `已保存` action that only becomes clickable once the current edit session is fully saved.
- Edit-mode tag chips and the tag entry box should stay separate states. Show existing tags only as removable chips; do not prefill the tag input with the current tag list on load or revert.
- Saved-state affordances should use one icon language across lightweight surfaces. For home cards and the bottom nav saved entry, replace legacy bookmark icons with the same pink heart treatment used by the floating recipe-action panel.
- Keep recipe-card save buttons visually distinct from the saved state itself: use the same heart icon language on home and browse grids, but let the unsaved state read as a smaller blue-white button and switch to pink only once the recipe is actually saved.
- On compact recipe cards, shrinking only the heart glyph is not enough. If the save control still feels heavy, reduce the full circular button size as well so the footer stays light on phone layouts.
- Keep only one recipe-browsing surface in the product. The canonical browsing route is `/browse`; remove the old `/recipes` list page and the old `/categories` page instead of maintaining parallel browse surfaces or aliases.
- Treat the bottom-bar Saved tab like every other nav item for color. Keep the heart icon language if needed, but use the standard gray inactive state and the standard blue active state instead of a dedicated pink saved-tab style.
- In the mobile bottom bar, active state should not enlarge the icon. Keep the same icon size between inactive and active states, and use color/background changes alone so selection feels steady instead of jumpy.
- Product copy should present the current reusable-meal feature as `Meals`, `Meal`, `New Meal`, and `Creating Meal...`; avoid reviving old meal-plan wording in visible UI.
- Keep route-tree cleanup separate from compatibility redirects. Empty folders like old `/categories` or cart API shells should be removed, while legacy pages that only `redirect()` can stay briefly when they protect stale links.
- For desktop carousel dragging, apply a mouse-specific drag multiplier while keeping touch movement direct; this preserves phone-like swipe feel without making mobile overshoot.

## 2026-05-08

- Phase 1 demo is complete; current work can optimize product UX instead of staying constrained to demo-only polish.
- Do not use native HTML `input type="number"` anywhere in Rencipe. The browser spinner controls are not acceptable for this product; use a custom number-only text input instead.
- Meal plan creation should be a one-step flow. Create a default plan and open the meal-plan editor immediately instead of showing a pre-create modal.
- The bottom-bar `+` button should still open the first Create selector modal. Only the extra meal-plan sub-form step should be removed; selecting Create Meal Plan must jump straight to the editor.
- New Meal creation can reuse the meal-plan editor shell, but the Meal schema itself is now simplified: keep people plus direct recipes only, and do not store days or meal types on meals.
- When schema work is newer than the deployed API, public nginx verification can return misleading 500s from old validation rules. For pre-deploy browser checks, point a local frontend at the local backend instead of assuming the public backend reflects current code.

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
- Backend build blockers fixed during this work: Express route params needed narrowing, and search helper maps had duplicate object keys.
- Frontend build blockers fixed during this work: Next 16 route params needed `Promise` typing, image enrichment needed explicit recipe types, draft types were missing `name`, and a few meal-plan numeric inputs needed `number | ""` state.
- The CPSC 597 demo requirements require PowerPoint slides, a recorded video presentation, and a project/outcomes demo limited to about 20 minutes.
- The presentation should cover background, motivation, problem, significance, goals, objectives, approaches, solutions, results, goal achievement, and success criteria, using visual material instead of long slide text.
- The report draft identifies core Rencipe scope as recipe management, reusable meals, saved items, live deployment, and account/login support.
- Current app inventory showed the strongest Phase 1 gaps were full English UI coverage, auth/JWT/account flow, responsive polish, demo seed data, and meal ingredient checklist verification.
- Meal-plan ingredient totals are currently calculated in the frontend, but the backend ingredient-check PATCH handler should be verified because it updates state without visibly returning a response in the controller.
- Visible source UI was translated to English and verified with source scans.
- Existing Mongo recipe data was translated to English and verified with a direct Mongoose check: 37 recipes, zero Chinese characters in selected recipe fields.
- Local backend seed scripts are workspace-only and ignored from product delivery.
- `source.unsplash.com` generated URLs produced broken images in Playwright. Stable `images.unsplash.com` URLs fixed the demo image issue; final database check showed zero `source.unsplash.com` recipe images.
- Frontend UI polish now covers the app shell, home dashboard, recipe library, recipe detail, search, saved, create, drafts, meals, settings, and profile list surfaces. Deep detail flows still need rehearsal-driven polish.
- Existing meal names also needed data checks because public route checks can surface older database records even when source UI scans are clean.
- Final public Playwright checks against `https://rencipe.renstoolbox.com` confirmed English main demo routes, 37 recipe cards, loaded recipe images, visible mobile bottom nav, and no horizontal overflow.
- Mechanical translation cleanup also needs a rough-English artifact scan for strings like joined words, missing spaces, or placeholder fragments; a Chinese-character scan alone will not catch those.
- Draft autosave must keep a stable draft id after the first save. Otherwise each autosave can create a duplicate draft, and deleting after publish can target the wrong scope.
- Draft deletion should require a specific draft id. A delete endpoint that treats missing id as delete-all is unsafe for a create-flow cleanup helper.
- Recipe creation should let users start without a cover image, but publishing needs an explicit final cover-image check so the validation happens at the right moment.
- The desired Phase 1 UI direction is clean and light: white or pale-gray surfaces, thin borders, subtle selected states, and small accent colors instead of heavy black filled controls.
- Product language should present the current collection feature as reusable Meals.
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
- Old auth demo setup notes are no longer part of product delivery.
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
- Non-home detail/work pages should use a visible title section plus the shared history-aware `BackButton`; verify at least one detail route by navigating from a source page and confirming Back returns to that exact previous route.
- Recipes, reusable meals, and reusable plans now use a seven-day Trash pattern: set `deletedAt`/`trashExpiresAt`, exclude trashed records from normal lists, expose `trash=1` owner lists and restore routes, and rely on Mongo TTL indexes for automatic removal.
- If public UI still shows old route code after source changes, clear stale `.next` output before rebuilding. A failed frontend build can leave PM2 serving the previous bundle even after reload.
- Swipe-to-delete rows need explicit mouse pointer scrolling for desktop QA, not just touch/native horizontal overflow. Verify the row `scrollLeft` changes with a Playwright mouse drag at a phone-width viewport.
- When the desired interaction is a single toggle, implement one button whose label changes state instead of two segmented options. Browse sort should be one `Most Popular`/`Newest` button.
- Account switching should reuse the existing login API with typed credentials; seed every selectable account through the product auth setup script before testing the selector page.
- Never put React hooks after a route-based early return. TopBar returning `null` on `/login` before its `useEffect` caused React hook-count crashes during sign-out navigation.
- Account switching should reuse the login API with a typed password, not hidden demo credentials. The selector can choose a username, but authentication must still fail on an incorrect password.
- AuthGate should clear a session only when `/api/auth/me` returns a real non-OK response. Aborted or failed verification fetches during route changes should keep the current local session and let the next route settle.
- A GitHub-style account switcher should list only sessions already signed in on the current browser. Add Account goes through login, individual Sign Out removes one stored session, and signing out the active account routes to the switcher when other local sessions remain.
- Do not add explanatory descriptions or helper copy to UI unless explicitly requested. Prefer simple self-evident controls and labels.
- Standard back controls should be plain arrow-plus-text buttons, not bordered/pill buttons, except when a true call-to-action is needed in an empty or error state.
- Settings/account pages should use simple unboxed lists and direct action buttons; avoid card-inside-card layouts and extra vertical padding around rows.