import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth";

export function AppLayout() {
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();

  const isStaffPage = location.pathname.startsWith("/app/staff");
  const isPartsPage = location.pathname.startsWith("/app/parts");
  const isAppointmentsPage = location.pathname.startsWith("/app/appointments");
  const isBookAppointmentPage = location.pathname.startsWith("/app/book-appointment");
  const isMyAppointmentsPage = location.pathname.startsWith("/app/my-appointments");
  const isMySalesPage = location.pathname.startsWith("/app/my-sales");
  const isShopPage = location.pathname.startsWith("/app/shop");
  const isRequestPartPage = location.pathname.startsWith("/app/request-part");
  const isMyPartRequestsPage = location.pathname.startsWith("/app/my-part-requests");
  const isPartRequestsPage = location.pathname.startsWith("/app/part-requests");
  const isCustomersPage = location.pathname.startsWith("/app/customers");
  const isViewCustomerPage = location.pathname.startsWith("/app/customers/");
  const isProfilePage = location.pathname.startsWith("/app/profile");
  const headerTitle = isStaffPage
    ? "Staff management"
    : isPartsPage
      ? "Parts management"
      : isAppointmentsPage
        ? "Appointments management"
        : isBookAppointmentPage
          ? "Book Appointment"
          : isMyAppointmentsPage
            ? "My Appointments"
            : isMySalesPage
              ? "My Purchases"
              : isShopPage
                ? "Shop Parts"
                : isRequestPartPage
                  ? "Request Part"
                  : isMyPartRequestsPage
                    ? "My Part Requests"
                    : isPartRequestsPage
                      ? "Part Requests"
                      : isCustomersPage
                        ? "Customers"
              : isViewCustomerPage
                ? "Customer Details"
                : isProfilePage
                  ? "My Profile"
                  : "Dashboard";
  const headerCopy = isStaffPage
    ? "Create staff accounts and update role assignments."
    : isPartsPage
      ? "Manage inventory, pricing and stock levels."
      : isBookAppointmentPage
        ? "Schedule a service for your vehicle."
        : isMyAppointmentsPage
          ? "View your booked service appointments and their status."
          : isMySalesPage
            ? "View your past purchases and service history."
            : isShopPage
              ? "Browse and purchase vehicle parts."
              : isRequestPartPage
                ? "Request parts that are not available in our inventory."
                : isMyPartRequestsPage
                  ? "Track the status of your part requests."
                  : isPartRequestsPage
                    ? "Manage customer part requests and update their status."
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
          <NavLink
            to="/app/book-appointment"
            className={({ isActive }) =>
              isActive
                ? "shell__nav-link shell__nav-link--active"
                : "shell__nav-link"
            }
          >
            Book Appointment
          </NavLink>
          <NavLink
            to="/app/my-appointments"
            className={({ isActive }) =>
              isActive
                ? "shell__nav-link shell__nav-link--active"
                : "shell__nav-link"
            }
          >
            My Appointments
          </NavLink>
          <NavLink
            to="/app/my-vehicles"
            className={({ isActive }) =>
              isActive
                ? "shell__nav-link shell__nav-link--active"
                : "shell__nav-link"
            }
          >
            My Vehicles
          </NavLink>
          <NavLink
            to="/app/shop"
            className={({ isActive }) =>
              isActive
                ? "shell__nav-link shell__nav-link--active"
                : "shell__nav-link"
            }
          >
            Shop Parts
          </NavLink>
          <NavLink
            to="/app/request-part"
            className={({ isActive }) =>
              isActive
                ? "shell__nav-link shell__nav-link--active"
                : "shell__nav-link"
            }
          >
            Request Part
          </NavLink>
          <NavLink
            to="/app/my-part-requests"
            className={({ isActive }) =>
              isActive
                ? "shell__nav-link shell__nav-link--active"
                : "shell__nav-link"
            }
          >
            My Requests
          </NavLink>
          <NavLink
            to="/app/my-reviews"
            className={({ isActive }) =>
              isActive
                ? "shell__nav-link shell__nav-link--active"
                : "shell__nav-link"
            }
          >
            My Reviews
          </NavLink>
          <NavLink
            to="/app/profile"
            className={({ isActive }) =>
              isActive
                ? "shell__nav-link shell__nav-link--active"
                : "shell__nav-link"
            }
          >
            Profile
          </NavLink>
          <NavLink
            to="/app/my-sales"
            className={({ isActive }) =>
              isActive
                ? "shell__nav-link shell__nav-link--active"
                : "shell__nav-link"
            }
          >
            My Purchases
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
          {isAdmin && (
            <NavLink
              to="/app/appointments"
              className={({ isActive }) =>
                isActive
                  ? "shell__nav-link shell__nav-link--active"
                  : "shell__nav-link"
              }
            >
              Appointments
            </NavLink>
          )}

          {isAdmin && (
            <NavLink
              to="/app/vendors"
              className={({ isActive }) =>
                isActive
                  ? "shell__nav-link shell__nav-link--active"
                  : "shell__nav-link"
              }
            >
              Vendors
            </NavLink>
          )}

          {isAdmin && (
            <NavLink
              to="/app/part-requests"
              className={({ isActive }) =>
                isActive
                  ? "shell__nav-link shell__nav-link--active"
                  : "shell__nav-link"
              }
            >
              Part Requests
            </NavLink>
          )}

          {isAdmin && (
            <NavLink
              to="/app/customers"
              className={({ isActive }) =>
                isActive
                  ? "shell__nav-link shell__nav-link--active"
                  : "shell__nav-link"
              }
            >
              Customers
            </NavLink>
          )}

          {isAdmin && (
            <NavLink
              to="/app/register-customer"
              className={({ isActive }) =>
                isActive
                  ? "shell__nav-link shell__nav-link--active"
                  : "shell__nav-link"
              }
            >
              Register Customer
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
