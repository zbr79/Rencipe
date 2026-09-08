# Rencipe PC UI Task List

**Site:** https://rencipe.renstoolbox.com/  
**Scope:** PC UI and guest-facing desktop flows at approximately 1920, 1440, 1366, 1280, 1024px.  
**Source:** External UI checker report combined with the repository guest/desktop audit.  
**Status:** Completion pass implemented, built, smoke-tested, and deployed. No commit or push was performed.

## Priority summary

- **P0:** None found. No hard breakage or data loss was reported.
- **P1:** Fix before calling the PC experience complete.
- **P2:** Fix after P1, or before public/interviewer demonstration if the related flow is shown.
- **P3:** Polish and optional public-site improvements.

## P1 — Fix first

### 1. Desktop guest entry and account claim

- [x] Add a visible **Sign in / Claim account** action to the desktop guest account area and Settings modal.
- [x] Allow guests to reach the existing account-claim page.
- [x] Preserve the intended destination when a protected deep link sends a user to Login.
- **Why:** Guests currently have no desktop path to claim or sign in to an account.
- **Files:** `frontend/src/app/components/AuthGate.tsx`, `DesktopChrome.tsx`, `SettingsModal.tsx`, `settings/account/page.tsx`

### 2. UI-01 — Repair Home hero and converter at 1024px — Complete

- [x] Stack the featured hero above the Kitchen converter at or below the breakpoint where the row becomes cramped.
- [x] Add safe bottom padding so carousel dots never overlap title or description text.
- [x] Reduce or clamp the hero title at narrow PC widths.
- [x] Keep hero and converter heights aligned where they remain side-by-side.
- **Evidence:** `home-1024-top.png`, `home-1280-top.png`

### 3. UI-02 — Prevent Browse filter-chip clipping — Complete

- [x] Make the chip row horizontally scrollable with a visible affordance, or wrap it below approximately 1100px.
- [x] Add right-side content padding so the final chip is reachable.
- [x] Verify Vietnamese and the last category at 1024px and 1280px.
- **Evidence:** `browse-1024-top.png`, `browse-1280-top.png`

### 4. UI-03 — Clear stale Kitchen converter output — Complete

- [x] When From is empty or invalid, clear To or show `—`.
- [x] Add an inline hint such as “Enter an amount.”
- [x] Never leave the previous conversion result visible after the source value is cleared.
- [x] Retest filled conversion, unit changes, clearing, and invalid input.
- **Evidence:** `deep/converter_empty_input_stale_output.png`

### 5. Recently Viewed — finish the overlooked PC page — Complete

- [x] Replace swipe-to-delete rows with the standard PC card/list treatment.
- [x] Add a visible desktop delete action; do not require horizontal swiping.
- [x] Fix the desktop CSS breakpoint targeting `.container` instead of `.page`.
- [x] Add a discoverable “See all” path or clearly decide that the standalone page is intentionally hidden.
- [x] Keep ordering reactive after a recipe is viewed.
- **Files:** `frontend/src/app/recently-viewed/page.tsx`, `page.module.css`

### 6. UI-05 — Make the empty Reviews Post button clearly disabled — Complete

- [x] Use muted styling, reduced emphasis, and a not-allowed cursor while the textarea is empty.
- [x] Keep the enabled state clear once valid text is entered.
- [x] Verify at 1024px and 1280px.
- **Evidence:** `deep/recipe_bottom_reviews_1280.png`, `deep/recipe_bottom_reviews_1024.png`

### 7. UI-06 — Improve the empty Saved page

- [x] Vertically center the empty state in the available PC content area.
- [x] Reduce the large unused region below the dashed panel.
- [x] Keep the Browse CTA prominent; optionally add a small popular-recipes strip.
- **Evidence:** `saved-1024-top.png`

### 8. UI-04 — Make Browse sorting honest

- [x] Implement a real menu containing Most Popular and Most Recent.
- [x] Ensure the selected state and action are obvious.
- **Evidence:** `deep/browse_most_popular_reference.png`, `deep/browse_most_recent_toggle.png`

### 9. UI-08 — Reduce fixed-sidebar pressure below 1100px

- [x] Narrow the desktop sidebar at approximately 1024px.
- [x] Recheck Home hero wrapping, Browse filters, Saved header, and Recipe Detail after the shell change.
- [x] Preserve the 1366–1920px layout.

## P2 — Fix after P1

### 10. UI-07 — Align Home hero and converter bottoms

- [x] Match card heights or align both card bottoms.
- [x] Normalize internal padding and vertical rhythm.

### 11. Meal surface consistency

- [x] Keep Meals in scope for authenticated regular users.
- [x] Remove the non-admin redirect and complete the meal routes.
- [x] Load public meals in Browse.
- **Files:** `AuthGate.tsx`, `BrowsePageClient.tsx`, `meals/page.tsx`, `meals/[id]/page.tsx`

### 12. Guest Login polish

- [x] Remove the prefilled `admin/admin` credentials.
- [x] Replace “please contant admin” with final copy.
- [x] Replace “sign up not open” with a deliberate unavailable-state design or a real guest-claim flow.

### 13. Settings and protected navigation cleanup

- [x] Give `/settings` a real page while retaining the settings modal.
- [x] Fix Settings breadcrumbs that previously linked to a route redirecting Home.
- [x] Preserve `next` when redirecting protected deep links to Login.
- [x] Keep legacy `/search`, `/profile`, and account routes reachable or consistently redirected.

### 14. Correct stale desktop selectors

- [x] Update My Work, Drafts, and Meals CSS selectors to match the current heading markup.
- [x] Leave editor/debug styles intact until route usage is confirmed.
- **Files:** `my-work/page.module.css`, `drafts/drafts.module.css`, `meals/page.module.css`

### 15. Server-side ownership enforcement

- [x] Derive saved and draft ownership from the authenticated token.
- [x] Add consistent auth middleware to saved and draft routes.
- [x] Stop trusting client-provided `userId` and `authorId` for authorization.
- **Why:** This is not a visual issue, but it is a public-demo safety issue.

## P3 — Optional polish

### 16. UI-09 — Use wide Recipe Detail screens better

- [x] Use a two-column ingredients/steps layout above 1280px.
- [x] Preserve readable line length and the 1024px layout.

### 17. UI-10 — Add a light public footer

- [x] Add About, Contact, and Legal links for the public-facing presentation.
- [x] Keep the footer secondary to the app shell.

## Regression checklist

Do not regress these verified behaviors:

- [x] Save hearts fill correctly and labels/tooltips update.
- [x] Keyboard focus rings are visible on recipe cards.
- [x] Filled converter math and unit toggles remain correct.
- [x] Search modal, Settings modal, Surprise Me, categories, and featured-recipe navigation work.
- [x] Recipe Detail remains readable through ingredients, steps, tips, and reviews.
- [x] Home remains solid at 1366–1920px with no overflow.

## Validation gate

Before calling PC redesign complete:

- [x] Run the guest click-through across the desktop breakpoints covered by the responsive shell.
- [x] Test the updated Home, Browse, Saved, Recently Viewed, Recipe Detail, Login, Search, and Settings flows.
- [x] Test empty, loading, error, and populated states where each route exposes them.
- [x] Run `npm run build` for frontend and backend.
- [x] Re-run ESLint and document the baseline: 99 existing errors and 42 warnings remain outside this completion pass.
