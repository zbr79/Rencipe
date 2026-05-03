# Project Goal

## Phase 1

Build a focused set of Rencipe features and prepare a polished demo that can support a 20 minute presentation.

Phase 1 uses full English language for the product experience, documentation, and presentation material.

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
- Recipe browsing, recipe detail, recipe creation, recipe editing, deletion, and image upload.
- Auto-save draft flow for incomplete recipe creation.
- Favorites or saved recipes.
- Shopping cart for selected recipes.
- Meal plans with people, per-person portion modifiers, number of days, meal types, combinations, and generated ingredient lists.
- Weekly meal scheduler with editable meal slots.

Features that need work before the Phase 1 demo:
- Finish the full English UI pass across visible pages and flows.
- Stabilize meal-plan ingredient checklist behavior and verify scaled ingredient totals in the UI.
- Decide whether to implement a minimal login/JWT/account flow or explicitly present it as not achieved in Phase 1.
- Add or explicitly defer keto-focused dietary features; current report says this is still in progress.
- Run a responsive design pass for the main demo routes.
- Prepare seeded demo data and a tight 20-minute walkthrough script.

### Phase 1 Work Queue

1. Polish core demo route flow: home, recipes, recipe detail, create recipe, drafts, saved, cart, meal plans, weekly plans.
2. Replace remaining Chinese UI strings with English for Phase 1.
3. Fix and verify meal-plan ingredient checklist persistence and scaled totals.
4. Create reliable demo seed data: component recipes, normal recipes, saved recipes, cart items, meal plans, weekly plans.
5. Decide and document the auth/JWT scope: implement minimum viable account flow or mark it as future work.
6. Decide and document the keto scope: add a small visible feature or mark it as future work.
7. Test desktop and mobile responsive layouts for the demo paths.
8. Finish report sections that are marked incomplete or not started: problem statement, significance, proposed approaches, results, non-functional requirements, use cases, architecture, implementation, testing, summary, and appendix.