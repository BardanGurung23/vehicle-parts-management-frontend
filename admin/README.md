## Current Frontend Scope

This frontend is intentionally limited to three workflows only:

1. Customer self-registration
2. Shared login for customer, staff, and admin users
3. Admin-only staff registration and role assignment

## Active App Structure

The current working frontend lives in these folders:

- `src/app`
- `src/features`
- `src/shared`

The old dashboard template is not part of the active TypeScript program for this MVP and should be treated as legacy template code, not as the source of truth for new work.

## Environment

- `VITE_BACKEND_BASE_URL` defaults to `http://localhost:5154`
- Frontend dev server defaults to port `7001`

## Technologies Used

- [React](https://react.dev/)
- [React Router](https://reactrouter.com/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
