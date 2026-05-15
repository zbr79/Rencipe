# Rencipe Feature Documentation

Date: 2026-05-14  
Audience: demo presenter, developer, reviewer, and future maintainer

## Product Overview

Rencipe is a recipe workspace for collecting recipes, creating new recipes, saving favorites, building reusable meals, and planning what to cook across multiple days. The current product is designed phone-first, with desktop layouts acting as wider versions of the same workflow.

The product supports a live deployed demo at `https://rencipe.renstoolbox.com` with frontend and backend processes managed separately.

## Demo Accounts

| Account | Role | Purpose |
|---|---|---|
| `admin/admin` | Admin | Full demo account with access to admin-private recipes and management flows. |
| `testuser1/testuser1` | Normal user | Permission comparison account. It should not see admin-private recipes. |

## Navigation Model

### Phone Navigation

The phone experience is centered around the bottom navigation:

- Home
- Browse
- Create
- Saved
- Settings

The top bar contains the Rencipe brand and search entry.

### Desktop Navigation

Desktop keeps the same product areas but uses wider, constrained content surfaces. Browse, recipe detail, and meal detail now intentionally resemble expanded phone layouts instead of wide dashboard pages.

## Page Reference

| Page | Route | Purpose |
|---|---|---|
| Login | `/login` | Sign in with a demo account. |
| Home | `/` | Main signed-in recipe discovery surface. |
| Browse | `/browse` | Browse recipes and reusable meals by visibility, category, content type, and sort. |
| Search | `/search` | Search route/entry point. Current desktop behavior should be verified if direct route use matters. |
| Saved | `/saved` | View saved recipes and saved meals. |
| My Work | `/my-work` | Personal work surface for authored content. |
| Drafts | `/drafts` | View and resume recipe drafts. |
| Create | `/create` | Create recipes, meals, and plans through the creation entry flow. |
| Plans | `/meal-plans` | List meal plans and reusable meals. |
| Plan Detail | `/meal-plans/:id` | Edit a plan or reusable meal, manage recipes, and view ingredients. |
| Weekly Plans | `/weekly-plans` | Weekly planning surface. Needs seeded demo content. |
| Weekly Plan Create | `/weekly-plans/create` | Create weekly plans. |
| Weekly Plan Detail | `/weekly-plans/:id` | Manage a weekly plan. |
| Recipe Detail | `/recipes/:id` | Read recipe, save it, rate it, and comment. |
| Recipe Edit | `/edit/:id` | Edit an existing recipe. |
| Settings | `/settings` | App/account settings entry. |
| Account | `/settings/account` | Account profile and account management rows. |
| Account Switch | `/settings/account/switch` | Switch accounts or sign out all accounts. |

## Feature Guide

### Authentication

Users sign in from `/login`. A local session is written after successful authentication, and protected app routes depend on that session. Admin users can see admin-private recipes. Normal users only see public recipes plus their own private recipes.

Key behaviors:

- Demo login credentials.
- Session verification through `/api/auth/me`.
- Role-aware recipe visibility.
- Multi-account storage for account switching.
- Sign out all from account switch.

### Recipe Browsing

Browse supports a category-first discovery workflow.

Controls:

- Public and Private visibility tabs.
- Category shortcut rail.
- Content type select: All, Recipes, Meals.
- Popular/Newest sort.
- Save and unsave controls on cards.

Expected demo path:

1. Sign in as admin.
2. Open Browse.
3. Switch between Public and Private.
4. Filter to Meals.
5. Save or unsave a meal.
6. Open a recipe or meal detail page.

### Search

Search is available from the top-bar search entry. It is intended for direct text lookup, history, and recommendations. Browse remains the category-based discovery route.

Known documentation note:

- Confirm whether `/search` should stay as a direct page route on every viewport or only behave as an overlay entry from the top bar.

### Recipe Detail

Recipe detail pages show:

- Cover image.
- Title.
- Rating summary.
- View count.
- Visible tags.
- Ingredients grouped by main ingredients and seasonings.
- Steps.
- Tips when present.
- Save action.
- Edit action for users with permission.
- Rating submission.
- Comment section.

Rating behavior:

- Stars start empty for the current session.
- Selecting a star submits immediately.
- After success, stars lock and the right side of the rating header says `Thank you for rating`.

Comment behavior:

- One top-level comment per user per recipe.
- Users can upvote comments.
- Users can delete their own comments.
- Admin can delete comments.
- Replies to comments are not supported in the current UI.

### Recipe Creation And Drafts

Recipe creation supports draft-based work-in-progress behavior.

Recipe fields include:

- Title/name.
- Description.
- Cover image.
- Main ingredients.
- Seasonings.
- Steps.
- Step images.
- Servings.
- Tags.
- Tips.
- Public/private visibility.
- Original/shared origin fields.

Draft behavior:

- Drafts can be saved while recipe creation is incomplete.
- Drafts can be resumed from `/drafts`.
- Draft deletion should require a specific draft id.

Implementation note:

- The backend draft list endpoint supports listing by `authorId` without a draft id.
- The local Next draft proxy should be aligned with that behavior.

### Recipe Editing

Recipe editing uses the shared recipe composer flow. Edits should preserve existing cover images unless the user intentionally replaces them. Revert behavior should return the edit session to the version opened at the start of the session.

### Saved Recipes And Meals

The Saved page has two tabs:

- Recipes
- Meals

Saved rows support compact phone-style list presentation and swipe delete/unsave behavior. Save state is shared through the frontend saved context so cards and lists can update without a full page refresh.

### Reusable Meals

Reusable meals are stored in the meal-plan collection with `kind: "meal"`. They are simpler than full plans and represent a reusable group of recipes for a meal.

Meal features:

- People count.
- Direct recipe list.
- Public/private visibility.
- Save/unsave.
- Browse listing.
- Detail page.
- Comments.
- View counts.

Demo note:

- The live app currently has only one public reusable meal, and its name is not demo-polished. Add more named examples before presenting Meals as a major feature.

### Meal Plans

Meal plans are the main planning feature for deciding what to eat across multiple days.

Plan features:

- Plan name.
- People count.
- Number of days.
- Meal types: breakfast, lunch, dinner.
- Day cards.
- Meal slots.
- Add/remove recipes per slot.
- Recipe picker tabs.
- Saved recipe source.
- Ingredient aggregation.
- Ingredient grouping by recipe.
- Trash/restore support in the backend.

Demo path:

1. Open Plans.
2. Create or open a plan.
3. Set people and days.
4. Add recipes to a day/meal slot.
5. Show the generated ingredient list.

### Weekly Plans

Weekly planning routes and backend support exist, but the current live admin data returned zero weekly plans. Treat this as a feature that needs demo data before being shown.

Recommended demo decision:

- Seed one polished weekly plan if this feature is included.
- Otherwise, keep the demo centered on regular Plans.

### Account And Settings

Settings supports:

- Account entry page.
- Profile/account field routes.
- Account switch page.
- Sign out all accounts.
- Profile metadata such as display name, email, phone, and avatar infrastructure.

Recommended demo path:

1. Open Settings.
2. Open Account.
3. Show account rows.
4. Open Switch Account.
5. Explain multi-account behavior and sign-out-all.

## Backend And Data Model Summary

Backend route groups:

- Auth routes.
- Recipe routes.
- Draft routes.
- Favorite routes.
- Meal-plan routes.
- Weekly-plan routes.
- Image routes.
- Comment routes.

Core models:

- User.
- Recipe.
- Draft.
- Favorite.
- MealPlan.
- WeeklyPlan.
- Comment.

Deployment expectations:

- Frontend port: `4000`.
- Backend port: `6000`.
- PM2 process names: `rencipe-frontend` and `rencipe-backend`.
- Public URL: `https://rencipe.renstoolbox.com`.
- Nginx proxies frontend traffic to `127.0.0.1:4000` and backend API traffic to `127.0.0.1:6000`.

## Demo Walkthrough Outline

Use this order for a clean 20-minute presentation:

1. Introduce the problem: people save recipes in many places but struggle to turn them into meals and plans.
2. Sign in with the admin demo account.
3. Show Home and Browse.
4. Filter Browse by category and content type.
5. Open a recipe detail page.
6. Save, rate, and comment on a recipe.
7. Open Saved and show saved recipes/meals.
8. Open a reusable meal and explain Meals versus Plans.
9. Open a plan and show recipe slots plus ingredient aggregation.
10. Show Create and Drafts as the recipe authoring workflow.
11. Show Settings and account switching.
12. End with deployment, backend, and next steps.

## Known Limitations

- Demo data still needs cleanup for English-only presentation quality.
- Weekly Plans needs seeded data or should be deferred in the presentation.
- Keto/dietary scope needs a product decision.
- The local Next draft proxy should be aligned with backend draft listing behavior.
- Automated browser checks should be committed as repeatable scripts.
- Direct route behavior for Search and Account Profile should be documented or simplified.

## Suggested Acceptance Checklist

Before final submission, confirm:

- No visible Chinese text in live demo data.
- No placeholder names such as `N123` or generic `New Plan` in demo-critical records.
- At least one strong plan and one strong weekly plan exist if those routes are shown.
- At least three polished reusable meals exist if the Meals filter is shown.
- Admin can see private recipes.
- Normal user cannot see admin-private recipes.
- Saved Recipes and Saved Meals both contain useful demo records.
- Create, autosave draft, resume draft, publish recipe, and edit recipe all work in a rehearsal.
- Rating locks after submit.
- Comments allow one top-level comment per user.
- Desktop and phone layouts have no horizontal overflow.
- Backend and frontend builds pass.
- PM2 processes are online on the documented ports.
