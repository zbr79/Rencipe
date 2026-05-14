# Project Goal

## Phase 1

Build a focused set of Rencipe features and prepare a polished demo that can support a 20 minute presentation.

Phase 1 uses full English language for the product experience, documentation, and presentation material.

Design priority for Phase 1 is phone UI first, with desktop layouts treated as an expansion of the same clean, focused experience.

### Demo Requirements

- Submit PowerPoint slides for a project presentation within 20 minutes.
- Submit a recorded video presentation, such as an MP4 recorded with Zoom or another screen recording tool.
- Demo the project and project outcomes; in-person clarification is only needed if outcomes are unclear.
- Start the presentation with brief background, motivation, problem, significance, goals, and objectives.
- Present approaches used, solutions, results, and whether project goals were achieved.
- Keep every slide consistent with the project problem, goals, and results.
- Prefer pictures, diagrams, screenshots, and visual walkthroughs over lengthy text.
- Do not read directly from slides; keep the key message clear.
- Conclude with success criteria.

### Phase 1 Feature Status

Existing features to include in the demo:
- Live deployment with registered domain, Nginx, SSL/TLS, and PM2.
- Backend-backed login with demo users, JWT session checks, a polished sign-in page, and a client-side gate that blocks app access until signed in.
- Recipe visibility rules: public recipes are visible to signed-in users, while admin-private draft recipes are visible only to admin.
- Recipe browsing, recipe detail, recipe creation, recipe editing, deletion, and image upload.
- Auto-save draft flow for incomplete recipe creation.
- Favorites or saved recipes.
- Saved recipes as the recipe collection surface; shopping cart and checkout flows are removed from Phase 1.
- Live recipe search with history and recommendations, separated from the category browsing page.
- Category browsing with category shortcuts, filter chips, and recipe grid browsing.
- Plans with people, number of days, breakfast/lunch/dinner meal types, day-by-day meal slots, multiple recipes per meal, direct recipe selection, and generated ingredient lists.
- Plans as the combined planning surface for deciding what to eat across a week or custom date range.

Features that need work before the Phase 1 demo:
- Full English UI pass across visible pages and flows is complete for the current source scan, excluding intentional pinyin maps and the unused Chinese locale file.
- Verify scaled meal-plan ingredient totals in the UI after checklist-style checkbox controls were removed from meal-plan ingredient views.
- Minimal backend auth/JWT flow is implemented for Phase 1 with `admin/admin` and `testuser1/testuser1` demo accounts.
- Add or explicitly defer keto-focused dietary features; current report says this is still in progress.
- Responsive design pass now covers the app shell, home feed, recipe library, recipe detail, search, saved, create, drafts, plans, scheduled plans, settings, and profile list surfaces.
- English demo recipe data is seeded: 37 recipes, including normal recipes and meal-plan component recipes with stable image URLs. Existing meal-plan and weekly-plan names were also translated to English.
- Prepare a tight 20-minute walkthrough script.

### Phase 1 Work Queue

1. Continue polishing deep detail flows: meal-plan detail, scheduled meal-plan detail, recipe edit, and any live demo edge states found during rehearsal.
2. Keep the English UI scan clean as new UI is added.
3. Verify meal-plan ingredient lists and direct recipe-add plans during rehearsal.
4. Extend demo seed data beyond recipes if needed: saved recipes, plans, and weekly plans.
5. Rehearse the backend auth/JWT demo path: admin can see private recipes; testuser1 cannot find admin-private recipes in search.
6. Decide and document the keto scope: add a small visible feature or mark it as future work.
7. Test desktop and mobile responsive layouts for the demo paths.
8. Finish report sections that are marked incomplete or not started: problem statement, significance, proposed approaches, results, non-functional requirements, use cases, architecture, implementation, testing, summary, and appendix.
