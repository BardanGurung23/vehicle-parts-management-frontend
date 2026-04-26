import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth";

export function AppLayout() {
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();

  const isStaffPage = location.pathname.startsWith("/app/staff");
  const isPartsPage = location.pathname.startsWith("/app/parts");
  const headerTitle = isStaffPage
    ? "Staff management"
    : isPartsPage
      ? "Parts management"
      : "Dashboard";
  const headerCopy = isStaffPage
    ? "Create staff accounts and update role assignments."
    : isPartsPage
      ? "Manage inventory, pricing and stock levels."
    : "Current session and access overview.";

  return (
    <div className="shell">
      <aside className="shell__sidebar">
        <div className="shell__brand-block">
          <h1>Autonix</h1>
          <p>Access Console</p>
        </div>

        <nav className="shell__nav" aria-label="Primary">
          <NavLink
            to="/app"
            end
            className={({ isActive }) =>
              isActive
                ? "shell__nav-link shell__nav-link--active"
                : "shell__nav-link"
            }
          >
            Dashboard
          </NavLink>
          {isAdmin && (
            <NavLink
              to="/app/staff"
              className={({ isActive }) =>
                isActive
                  ? "shell__nav-link shell__nav-link--active"
                  : "shell__nav-link"
              }
            >
              Staff Management
            </NavLink>
          )}
          {isAdmin && (
            <NavLink
              to="/app/parts"
              className={({ isActive }) =>
                isActive
                  ? "shell__nav-link shell__nav-link--active"
                  : "shell__nav-link"
              }
            >
              Parts Management
            </NavLink>
          )}
        </nav>
      </aside>

      <section className="shell__content">
        <header className="shell__header">
          <div className="shell__container shell__header-inner">
            <div className="shell__header-copy">
              <h2>{headerTitle}</h2>
              <p>{headerCopy}</p>
            </div>

            <div className="shell__header-actions">
              <div className="shell__user-block">
                <strong>{user?.fullName}</strong>
                <span>{user?.role}</span>
              </div>

              <button
                type="button"
                className="button button--secondary"
                onClick={logout}
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <main className="shell__stage">
          <div className="shell__container">
            <Outlet />
          </div>
        </main>
      </section>
    </div>
  );
}
