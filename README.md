# Frontend Overview

The active frontend application lives in `frontend/admin`.

This folder-level `frontend/` package is not the app runtime. The shipped UI is the Vite + React admin/customer app under `frontend/admin`, with the active router defined in `frontend/admin/src/app/router.tsx`.

## Current Status

This README reflects the latest roadmap update in `doc/progress.md` from `2026-05-20`.

Implemented in the active frontend:

- Router-based application shell with protected, public-only, admin-only, employee-only, and customer-only route guards.
- Login and session restore using `/api/auth/login` and `/api/auth/me`.
- Forgot-password request and email-link reset pages using `/api/auth/forgot-password`, `/api/auth/reset-password/validate`, and `/api/auth/reset-password`.
- Customer self-registration using `/api/customers/register`, including optional initial vehicle capture during signup.
- Role-aware dashboard backed by `/api/dashboard/summary`.
- Staff customer registration, customer search, and dedicated customer detail pages.
- Staff customer detail now includes consolidated purchase and service history.
- Admin staff management, vendors, part-request management, purchase invoices, and financial reports pages, plus shared staff/admin appointment management.
- Staff/admin customer reports at `/app/reports/customers`.
- Customer profile editing, vehicle add/edit/remove management, appointment booking, part requests, reviews, shop, and purchase-history flows.
- Active parts workspace at `/app/parts`, with admin write access, staff read-only access, and direct API-client data access.
- Frontend test suite using Vitest and Testing Library.

Still incomplete or needing cleanup:

- Legacy code still exists under `frontend/admin/src/pages` and parts of `frontend/admin/src/redux` even though the router-based shell is the live runtime.
- A few legacy admin pages still mounted through the router continue to use the older Redux service layer.
- Local Mailpit-backed email testing is available on the backend side, but live SMTP-backed verification is still pending.

## Active Runtime Structure

Primary runtime paths:

- `frontend/admin/src/app`
- `frontend/admin/src/features`
- `frontend/admin/src/shared`

Important implementation notes:

- The active route tree is in `frontend/admin/src/app/router.tsx`.
- Active `src/features` routes no longer depend on `src/redux/services`; the remaining Redux-backed runtime is limited to a few legacy admin pages mounted through the new router.
- Some admin pages still render from older `src/pages` modules, but they are mounted through the new router.
- Because `frontend/admin/tsconfig.app.json` includes the whole `src` tree, unused legacy files can still affect TypeScript builds.

## Active Routes By Role

Public routes:

- `/`
- `/register`
- `/forgot-password`
- `/reset-password`

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

- `/app/appointments`
- `/app/customers/register`
- `/app/customers/search`
- `/app/customers/:customerId`
- `/app/parts`
- `/app/reports/customers`

Admin-only routes:

- `/app/staff`
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

Run the guided backend startup first:

```bash
npm run start:backend
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
npm --prefix frontend/admin run test:run
```

Start both backend and frontend together:

```bash
npm run start:all
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

Start the guided backend path before opening the frontend.

In Development, the backend preflight path is documented as:

- verifying PostgreSQL availability and access,
- checking local schema and migration compatibility,
- prompting before destructive resets,
- blocking automatic drops when non-demo local data is detected,
- applying the committed EF Core baseline migration and both demo seed paths.

The seeded canonical demo accounts use the `demo.*@autonix.local` pattern, and the documented default password is `DemoPass123!`.

## Verification Snapshot

Latest documented verification from `doc/progress.md`:

- `npm --prefix frontend/admin run lint` succeeds.
- `npm --prefix frontend/admin run test:run` succeeds with 3/3 tests.
- `npm --prefix frontend/admin run build` succeeds.
- Browser smoke checks passed for admin login, dashboard alerts, customer reports, financial reports, purchase invoices, and customer detail history.

## Highest-Priority Frontend Follow-Up

- Continue retiring legacy admin pages and Redux services in small validated batches.
- Add broader regression coverage for the remaining admin and customer flows that still depend on older page modules.
- Complete live SMTP verification once real mail credentials are available outside the repo.
