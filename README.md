# Frontend Overview

The active frontend runtime lives in `frontend/admin` and uses the router-based shell under `frontend/admin/src/app`.

## Local Commands

| Task | Command |
| --- | --- |
| Start the admin app | `npm --prefix frontend/admin run start` |
| Build the admin app | `npm --prefix frontend/admin run build` |

## Backend Dependency

Start the backend API before opening the frontend. In Development, the API now auto-resets mismatched local databases, applies the committed EF Core baseline migration, and seeds the canonical `demo.*@autonix.local` accounts.

All canonical demo accounts use `DemoPass123!`.

## Active Runtime Notes

- The live runtime uses `frontend/admin/src/app/router.tsx` and `frontend/admin/src/app/shell/AppLayout.tsx`.
- Legacy code under `frontend/admin/src/App.tsx`, `frontend/admin/src/layout`, `frontend/admin/src/pages`, and parts of `frontend/admin/src/redux` still exists, but it is not the primary route tree.
- The main follow-up after the database reset is to finish cleanup of the remaining frontend-only bugs and legacy surfaces.##HELLO
