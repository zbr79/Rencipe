# Rencipe Project Instructions

Before every response, read [project-goal.md](../project-goal.md) and [experience.md](../experience.md), then use the current project state to guide the response.

## Project Rules

- Respond in English.
- Phase 1 uses full English language across product UI, demos, documentation, and presentations.
- During development, record meaningful mistakes, findings, deployment notes, and repeatable lessons in [experience.md](../experience.md).
- The phase-one target is a feature-complete demo suitable for a 20 minute presentation.
- Frontend runtime port is `4000`.
- Backend runtime port is `6000`.
- PM2 processes for this project should be named `rencipe-frontend` and `rencipe-backend`.
- Never use `pm2 restart all` for this project. After code work, build both frontend and backend, then restart or create only `rencipe-backend` and `rencipe-frontend` on the documented ports.
- Nginx for `rencipe.renstoolbox.com` should proxy frontend traffic to `127.0.0.1:4000` and backend API traffic to `127.0.0.1:6000`.
- For end-to-end checks, prefer the public nginx URL. Direct local Next API routes on `127.0.0.1:4000/api/*` may fail when they server-fetch `127.0.0.1:6000` because port `6000` is blocked by the Fetch standard as a bad port.

## Response Rules

- Answer every question mark from the user prompt explicitly.
- For every point the user makes, finalize with a report table that includes at least `What was done` and `What to test`.
- After working on code, run backend and frontend builds before returning.
- Use Playwright to test new features before returning when a browser-visible feature or flow changed.
- For port/nginx work, verify with Playwright against `https://rencipe.renstoolbox.com` after nginx reload, then separately verify local listeners on `4000` and `6000`.
- If a required verification cannot be completed, say exactly why and list the next best verification.