# Project Goal

## Product Turn-In

Rencipe is now being cleaned for product submission rather than a Phase 1 presentation package. The current goal is to keep the repository focused on the working application, the final report, and the scripts needed to install, build, run, deploy, and seed the product.

The product experience should remain fully English for submission-facing UI, documentation, and report material. Phone UI remains the primary design target, with desktop layouts extending the same flows without creating a separate dashboard-style product.

## Current Product Scope

- Live deployment with registered domain, Nginx, SSL/TLS, and PM2.
- Frontend on port `4000` and backend on port `6000`.
- Backend-backed authentication, JWT session checks, account settings, avatar upload, and account switching.
- Recipe browsing, search, detail, creation, editing, deletion, image upload, autosaved drafts, recently viewed recipes, comments, ratings, and saved recipes.
- Visibility rules for public recipes, private owner recipes, and admin access.
- Reusable meals and planning flows with people, recipe selection, ingredient lists, trash/restore behavior, and public/private sharing.
- Product seed scripts for repeatable recipe/account data when a reviewer needs a working local environment.

## Turn-In Cleanup Rules

- Keep product source, environment templates, final report material, deployment scripts, and meaningful product documentation.
- Remove local verification output, scratch scripts, temporary folders, presentation bundles, duplicated draft reports, default scaffold files, and AI-assistant configuration.
- Do not include real `.env` files, secrets, local logs, build output, or workspace-only agent instructions.
- Keep seed scripts neutral and product-facing; avoid personal accounts, unrelated credentials, or runtime code that silently mutates data for placeholder content.
- After code cleanup, build both backend and frontend before reporting the result.

## Verification Checklist

1. Backend build passes from `backend/`.
2. Frontend build passes from `frontend/`.
3. A source scan finds no AI-assistant configuration files, personal seed credentials, mock-image mutation routes, or local temp artifacts.
4. Browser-visible cleanup is checked on the deployed site or local app when the changed code affects user-facing behavior.
