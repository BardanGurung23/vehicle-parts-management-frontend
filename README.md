# Frontend Overview

The active frontend application lives in `frontend/admin`.

This folder-level `frontend/` package is not the app runtime. The shipped UI is the Vite + React admin/customer app under `frontend/admin`, with the active router defined in `frontend/admin/src/app/router.tsx`.

## Current Status

This README reflects the latest roadmap update in `doc/progress.md` from `2026-05-14`.

Implemented in the active frontend:

- Router-based application shell with protected, public-only, admin-only, employee-only, and customer-only route guards.
- Login and session restore using `/api/auth/login` and `/api/auth/me`.
- Customer self-registration using `/api/customers/register`, including optional initial vehicle capture during signup.
- Role-aware dashboard backed by `/api/dashboard/summary`.
- Staff customer registration, customer search, and dedicated customer detail pages.
- Staff customer detail now includes consolidated purchase and service history.
- Admin staff management, vendors, appointments, part-request management, purchase invoices, and financial reports pages.
- Staff/admin customer reports at `/app/reports/customers`.
- Customer profile editing, vehicle add/edit/remove management, appointment booking, part requests, reviews, shop, and purchase-history flows.
- Active parts workspace at `/app/parts`, with admin write access, staff read-only access, and direct API-client data access.
- Frontend test suite using Vitest and Testing Library.

Still incomplete or needing cleanup:

- Legacy code still exists in `frontend/admin/src/App.tsx`, `frontend/admin/src/layout`, `frontend/admin/src/pages`, and parts of `frontend/admin/src/redux` even though the router-based shell is the live runtime.
- Some remaining active pages still need migration away from the older Redux service layer.
- Live browser verification is still not documented yet for `/app/purchase-invoices`, `/app/reports/financial`, `/app/reports/customers`, and the updated dashboard alert/customer-history flows.
- Live SMTP-backed email verification is still pending on the backend side.

## Active Runtime Structure

Primary runtime paths:

- `frontend/admin/src/app`
- `frontend/admin/src/features`
- `frontend/admin/src/shared`

Important implementation note:

- The active route tree is in `frontend/admin/src/app/router.tsx`.
- Some admin pages still render from older `src/pages` modules, but they are mounted through the new router.
- Because `frontend/admin/tsconfig.app.json` includes the whole `src` tree, unused legacy files can still affect TypeScript builds.

## Active Routes By Role

Public routes:

- `/`
- `/register`

Authenticated shared routes:

- `/app`
- `/app/shop`

Customer routes:

- `/app/book-appointment`
- `/app/my-appointments`
- `/app/add-vehicle`
- `/app/my-vehicles`
- `/app/my-reviews`
- `/app/write-review/:appointmentId`
- `/app/my-sales`
- `/app/request-part`
- `/app/my-part-requests`
- `/app/profile`
- `/app/profile/vehicles`

Employee routes:

- `/app/customers/register`
- `/app/customers/search`
- `/app/customers/:customerId`
- `/app/parts`
- `/app/reports/customers`

Admin-only routes:

- `/app/staff`
- `/app/appointments`
- `/app/vendors`
- `/app/purchase-invoices`
- `/app/reports/financial`
- `/app/register-customer`
- `/app/customers`
- `/app/part-requests`

## Local Development

Install frontend dependencies:

```bash
npm --prefix frontend/admin install
```

Start the backend API:

```bash
dotnet run --project backend/Vpims.API --configuration Debug
```

Start the frontend dev server:

```bash
npm --prefix frontend/admin run start
```

Build the frontend:

```bash
npm --prefix frontend/admin run build
```

Lint the frontend:

```bash
npm --prefix frontend/admin run lint
```

Run frontend tests:

```bash
pnpm --dir frontend/admin test:run
```

## Default Local URLs

| Service | Default URL |
| --- | --- |
| Backend API | `http://localhost:5154` |
| Frontend admin app | `http://localhost:5173` |

Notes:

- The Vite dev server uses `VITE_PORT` when provided; otherwise it defaults to `5173`.
- API requests use `VITE_BACKEND_BASE_URL` when provided; otherwise they default to `http://localhost:5154`.

## Backend Dependency And Demo Data

Start the backend before opening the frontend.

In Development, the API startup path is documented as:

- auto-resetting mismatched local databases,
- applying the committed EF Core baseline migration,
- seeding the canonical demo dataset.

The seeded canonical demo accounts use the `demo.*@autonix.local` pattern, and the documented default password is `DemoPass123!`.

## Verification Snapshot

Latest documented verification from `doc/progress.md`:

- `npm --prefix frontend/admin run build` succeeds.
- Latest browser smoke and retest passes covered admin login, dashboard rendering, customer detail navigation, parts workspace access, appointment booking, customer vehicle add-and-refresh behavior, purchase-history totals, vendors page copy, appointments page copy, and appointments action-column visibility.
- `pnpm --dir frontend/admin test:run` succeeds.

## Highest-Priority Frontend Follow-Up

- Add broader regression coverage for the remaining active admin and customer flows.
- Continue migrating the remaining active flows using Redux services into the newer feature-oriented API layer.
- Clean up or retire inactive legacy frontend code to reduce maintenance drift.
