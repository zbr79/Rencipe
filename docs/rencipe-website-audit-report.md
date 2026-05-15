# Rencipe Website Audit Report

Date: 2026-05-14  
Environment: `https://rencipe.renstoolbox.com`  
Audit account: `admin/admin`  
Secondary auth check: `testuser1/testuser1`  
Audit mode: Non-destructive browser and API review

## Executive Summary

Rencipe is currently a working recipe and planning web app with a live production deployment, signed-in access, recipe browsing, search, saved items, reusable meals, plans, drafts, comments, ratings, and account settings. The latest route crawl found the main website routes loading successfully on both phone and desktop viewports, with no detected horizontal overflow, broken images, native number inputs, visible bad render tokens, or route-level HTTP failures in the checked pages.

The app is in good shape for a product walkthrough, but it is not yet fully presentation-clean. The biggest remaining weaknesses are not basic uptime problems. They are demo data quality, report/demo completeness, a small number of route/API consistency risks, and some feature-scope gaps that should either be finished or explicitly described as future work.

## Audit Scope

The audit covered these areas:

| Area | Coverage |
|---|---|
| Public deployment | HTTPS domain, live frontend, live backend API through nginx |
| Authentication | Login with admin and normal demo user, session-protected app access |
| Core pages | Home, Browse, Search, Saved, My Work, Drafts, Create, Plans, Weekly Plans, Settings |
| Detail pages | Recipe detail, recipe edit, plan detail, reusable meal detail |
| Account pages | Account, profile/account routes, account switch/sign-out area |
| API checks | Recipes, recipe detail, public meals, owned plans, favorites, drafts, weekly plans |
| Responsive check | Phone viewport `390x844`, desktop viewport `1280x900` |
| Quality scan | HTTP status, visible Chinese text, horizontal overflow, bad render tokens, broken images, native number inputs, obvious offscreen controls |

## Live Audit Results

### Inventory Observed

| Item | Result |
|---|---:|
| Recipes returned by live API | 30 |
| Admin-private recipe visible to admin | Yes |
| Admin-private recipe visible to normal user | No |
| Owned plans returned for admin | 16 |
| Public reusable meals | 1 |
| Weekly plans returned for admin | 0 |
| Main route checks performed | 36 page checks |
| User-facing route groups checked | 17 |

### Route Health Matrix

| Route Group | Phone | Desktop | Notes |
|---|---|---|---|
| Login | Pass | Pass | Full-screen sign-in loads correctly. |
| Home | Pass | Pass | Loads, but visible demo data still includes a Chinese recipe title. |
| Browse | Pass | Pass | Desktop is now constrained to a phone-like width. |
| Search | Pass | Pass with redirect | Desktop audit landed on `/`; confirm whether `/search` should remain a standalone route or only an overlay behavior. |
| Saved | Pass | Pass | Saved recipes/meals route loads. |
| My Work | Pass | Pass | Route loads. |
| Drafts | Pass | Pass | Route loads, but draft API/proxy behavior should be cleaned up. |
| Create | Pass | Pass | Route loads. Submit/publish flow was not mutated in this audit. |
| Plans | Pass | Pass | Route loads. |
| Weekly Plans | Pass | Pass | Route loads, but no weekly-plan demo records were returned. |
| Settings | Pass | Pass | Route loads. |
| Account | Pass | Pass | Route loads. |
| Account Profile | Pass | Redirect on desktop | Desktop landed on `/settings/account`; document or simplify route behavior. |
| Switch Account | Pass | Pass | Route loads. |
| Recipe Detail | Pass | Pass | Route loads. Rating/comment behavior was verified in the previous live pass. |
| Recipe Edit | Pass | Pass | Route loads. Save/edit mutation was not performed in this audit. |
| Plan Detail | Pass | Pass | Route loads. |
| Meal Detail | Pass | Pass | Route loads and uses the updated phone-like desktop layout. |

### API Health Matrix

| API Path | Status | Result |
|---|---:|---|
| `/api/recipes?limit=5` | 200 | Pass |
| `/api/recipes/:id` | 200 | Pass |
| `/api/meal-plans?kind=meal&visibility=public` | 200 | Pass |
| `/api/meal-plans?userId=:id` | 200 | Pass |
| `/api/favorites?userId=:id` | 200 | Pass |
| `/api/weekly-plans?userId=:id` | 200 | Pass |
| `/api/drafts?...` | Needs review | Public/backend and local Next proxy expectations are inconsistent. |

## Full Feature Inventory

### Authentication And Account

- Backend-backed login with demo credentials.
- JWT-style local session handling through frontend utilities.
- Admin and normal-user role behavior.
- Account settings surface.
- Profile field editing routes.
- Account switch page and all-account sign-out behavior.
- Profile/avatar infrastructure in code.

### Home Experience

- Signed-in home feed.
- Recipe image carousel/featured browsing surface.
- Recipe cards linking to detail pages.
- Bottom navigation for phone workflows.
- Top bar with global search entry.

### Browse And Search

- Category browsing page.
- Public/private visibility tabs.
- Category shortcuts such as All, Chinese, Cantonese, Spicy, Korean.
- Sort controls for popular/newest behavior.
- Content filter for All, Recipes, and Meals.
- Local storage persistence for the Browse content filter.
- Search route/overlay with history and recommendations in the codebase.

### Recipes

- Recipe list API and detail API.
- Recipe detail page with image, title, views, tags, ingredients, steps, and tips.
- Recipe creation page.
- Recipe edit page.
- Recipe image upload and step image upload routes.
- Public/private visibility support.
- Auto-save draft support for recipe creation.
- Draft list/delete support.
- Save/unsave recipes.
- Rating submission with post-submit lock.
- Recipe comments with one comment per user and upvotes.
- Admin/owner delete permissions for comments.

### Saved Items

- Saved Recipes tab.
- Saved Meals tab.
- Swipe-style delete/unsave controls.
- Account-aware saved state through shared context.

### Reusable Meals

- Meals stored as `MealPlan` records with `kind: "meal"`.
- Public/private meal visibility.
- Save/unsave meals.
- Browse meals alongside recipes.
- Meal detail page with direct recipe list.
- Meal comments.
- Meal view counts.

### Plans

- Plan list page.
- Plan detail editor.
- People count.
- Number of days.
- Breakfast/lunch/dinner meal type selection.
- Day-by-day meal slots.
- Multiple recipes per meal slot.
- Direct recipe picker.
- Saved recipe picker.
- Ingredient aggregation.
- Ingredient mode tabs.
- Trash/restore backend support.

### Weekly Plans

- Weekly plan list route.
- Weekly plan creation route.
- Weekly plan detail route.
- Backend weekly-plan routes for list/detail/settings/meals.
- Current demo data appears empty for this area.

### Deployment And Backend

- Live custom domain with HTTPS.
- Nginx proxy setup.
- PM2 processes for frontend and backend.
- Express backend with MongoDB/Mongoose models.
- Cloudinary utility support for uploaded images.
- Backend route groups for auth, recipes, drafts, favorites, meal plans, weekly plans, images, and comments.

## What Is Still Missing Or Not Good

### High Priority

1. **Visible demo data is not fully English.**  
   The live home surface still shows `莫氏鸡煲`. Phase 1 requires English product UI, demos, docs, and presentation material. This should be renamed or removed from demo-visible records.

2. **Demo data has placeholder names.**  
   Public reusable meals include `N123`, and at least one owned plan is named `New Plan`. These names make the app feel unfinished during a presentation.

3. **Weekly plans have no visible demo content.**  
   The weekly-plan feature exists, but the live audit returned zero weekly plans for the admin account. If Weekly Plans is part of the demo, seed at least one polished example. If it is not part of the demo, reduce its prominence.

4. **Draft API/proxy behavior is inconsistent.**  
   The backend supports listing drafts with `authorId` and no draft id. The local Next route in `frontend/src/app/api/drafts/route.ts` requires both `authorId` and `id` for `GET`, which does not match the Drafts page list behavior. Production nginx may bypass this route, but local/dev behavior is still a future trap.

5. **Final presentation/report assets are still not complete in the repo.**  
   The app now has this audit and docs, but the project still needs the final 20-minute slide deck, recorded walkthrough, success criteria slide, and final report sections if those are required for submission.

### Medium Priority

6. **Keto/dietary scope is unresolved.**  
   The project goal still says keto-focused dietary features need to be added or explicitly deferred. The current app supports recipe tags, but there is not a clear keto workflow.

7. **Search route behavior should be clarified.**  
   The desktop audit of `/search` landed on `/`. If search is intentionally an overlay, update docs/navigation expectations. If users should be able to open `/search` directly, keep the route stable.

8. **Some account profile routes redirect differently by viewport/state.**  
   `/settings/account/profile` redirected to `/settings/account` in the desktop audit. This may be intentional, but the route model feels a little too complex for a demo.

9. **Public reusable meal inventory is thin.**  
   One public meal is enough to prove the feature works, but not enough to make Browse feel rich when filtering to Meals.

10. **Automated tests are not formalized.**  
    The audit used ad hoc Playwright checks. The repo does not expose a durable `test:e2e` or route-health script in `package.json`.

### Lower Priority

11. **Accessibility labels can repeat recipe names.**  
    Some recipe links read like `Title Title` because the image alt text and heading both contribute to the accessible name. This is not visually harmful, but it is worth cleaning up.

12. **Some console fetch errors appear during rapid automated navigation.**  
    Many were likely navigation-aborted requests rather than user-facing failures, but the app should avoid noisy console errors where possible.

13. **Data count differs from older project notes.**  
    The audit observed 30 recipes, while older project notes mention 37 seeded recipes. Update the notes or reseed the intended dataset.

## Recommendations

### Before The Next Demo

1. Rename or remove visible non-English demo recipes.
2. Rename placeholder records such as `N123` and `New Plan`.
3. Seed one strong weekly plan and at least three reusable meals.
4. Decide whether keto is a visible Phase 1 feature or a future-work item.
5. Fix the local Next draft API route so draft listing works consistently everywhere.
6. Add a one-command route audit script to the repo so this check is repeatable.
7. Prepare the final slide deck and recorded walkthrough using the feature inventory in this report.

### After The Demo

1. Add durable Playwright coverage for login, browse, recipe detail, create/edit, drafts, saved, meals, plans, comments, and settings.
2. Add a data-health script for English-only demo records and placeholder-name detection.
3. Simplify or document redirecting routes such as `/search` and `/settings/account/profile`.
4. Add richer role and permission tests for admin/private content.
5. Expand seeded example data so Browse, Meals, Plans, and Weekly Plans all feel populated.

## Overall Assessment

Rencipe is functionally presentable. The core product is live, navigable, and broad enough for a 20-minute walkthrough. The remaining risk is polish: demo data still exposes unfinished labels, the weekly-plan feature has no seed story, and a few route/API seams should be cleaned up before the final presentation. If those are addressed, the project can read as a coherent recipe-to-meal-planning product instead of a set of individually working screens.
