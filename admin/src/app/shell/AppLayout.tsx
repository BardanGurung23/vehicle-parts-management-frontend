import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth";

export function AppLayout() {
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const canViewParts = user?.role === "Admin" || user?.role === "Staff";
  const canManageCustomers = user?.role === "Admin" || user?.role === "Staff";
  const isCustomer = user?.role === "Customer";

  const isStaffPage = location.pathname.startsWith("/app/staff");
  const isPartsPage = location.pathname.startsWith("/app/parts");
  const isAppointmentsPage = location.pathname.startsWith("/app/appointments");
  const isVendorsPage = location.pathname.startsWith("/app/vendors");
  const isPurchaseInvoicesPage = location.pathname.startsWith("/app/purchase-invoices");
  const isFinancialReportsPage = location.pathname.startsWith("/app/reports/financial");
  const isBookAppointmentPage = location.pathname.startsWith("/app/book-appointment");
  const isMyAppointmentsPage = location.pathname.startsWith("/app/my-appointments");
  const isMySalesPage = location.pathname.startsWith("/app/my-sales");
  const isShopPage = location.pathname.startsWith("/app/shop");
  const isRequestPartPage = location.pathname.startsWith("/app/request-part");
  const isMyPartRequestsPage = location.pathname.startsWith("/app/my-part-requests");
  const isPartRequestsPage = location.pathname.startsWith("/app/part-requests");
  const isCustomersPage = location.pathname === "/app/customers";
  const isCustomerRegisterPage = location.pathname === "/app/customers/register" || location.pathname === "/app/register-customer";
  const isCustomerSearchPage = location.pathname === "/app/customers/search";
  const isProfilePage = location.pathname === "/app/profile";
  const isVehiclesPage = location.pathname === "/app/profile/vehicles";
  const isCustomerDetailPage = location.pathname.startsWith("/app/customers/")
    && !isCustomerRegisterPage
    && !isCustomerSearchPage;
  const headerTitle = (() => {
    if (isStaffPage) return "Staff management";
    if (isPartsPage) return "Parts management";
    if (isAppointmentsPage) return "Appointments management";
    if (isVendorsPage) return "Vendors";
    if (isPurchaseInvoicesPage) return "Purchase Invoices";
    if (isFinancialReportsPage) return "Financial Reports";
    if (isBookAppointmentPage) return "Book Appointment";
    if (isMyAppointmentsPage) return "My Appointments";
    if (isMySalesPage) return "My Purchases";
    if (isShopPage) return "Shop Parts";
    if (isRequestPartPage) return "Request Part";
    if (isMyPartRequestsPage) return "My Part Requests";
    if (isPartRequestsPage) return "Part Requests";
    if (isCustomerRegisterPage) return "Customer Registration";
    if (isCustomerSearchPage) return "Customer Search";
    if (isCustomersPage) return "Customers";
    if (isCustomerDetailPage) return "Customer Details";
    if (isVehiclesPage) return "My Vehicles";
    if (isProfilePage) return "My Profile";
    return "Dashboard";
  })();

  const headerCopy = (() => {
    if (isStaffPage) return "Create staff accounts and update role assignments.";
    if (isPartsPage) return "Manage inventory, pricing and stock levels.";
    if (isAppointmentsPage) return "Review scheduled appointments and update their service status.";
    if (isVendorsPage) return "Manage supplier records and keep vendor contact details current.";
    if (isPurchaseInvoicesPage) return "Record vendor stock receipts and increase inventory from purchase invoices.";
    if (isFinancialReportsPage) return "Review revenue, discounts, purchase spend, and gross profit across reporting windows.";
    if (isBookAppointmentPage) return "Schedule a service for your vehicle.";
    if (isMyAppointmentsPage) return "View your booked service appointments and their status.";
    if (isMySalesPage) return "View your past purchases and service history.";
    if (isShopPage) return "Browse and purchase vehicle parts.";
    if (isRequestPartPage) return "Request parts that are not available in our inventory.";
    if (isMyPartRequestsPage) return "Track the status of your part requests.";
    if (isPartRequestsPage) return "Manage customer part requests and update their status.";
    if (isCustomerRegisterPage) return "Create staff-managed customer records with an initial vehicle.";
    if (isCustomerSearchPage) return "Search customer records by ID, phone number, vehicle number, or name.";
    if (isCustomersPage || isCustomerDetailPage) return "Review customer profiles, vehicles, and service history.";
    if (isVehiclesPage) return "Add and remove the vehicles linked to your customer account.";
    if (user?.role === "Customer") return "Review your customer profile and linked vehicles.";
    return "Monitor inventory health, staffing coverage, and customer lookup from one board.";
  })();

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
          {isCustomer && (
            <>
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
            </>
          )}
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
          {isCustomer && (
            <>
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
            </>
          )}
          {isCustomer && (
            <>
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
                to="/app/profile/vehicles"
                className={({ isActive }) =>
                  isActive
                    ? "shell__nav-link shell__nav-link--active"
                    : "shell__nav-link"
                }
              >
                Manage Vehicles
              </NavLink>
            </>
          )}
          {isCustomer && (
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
          )}
          {canManageCustomers && (
            <>
              <NavLink
                to="/app/customers/register"
                className={({ isActive }) =>
                  isActive
                    ? "shell__nav-link shell__nav-link--active"
                    : "shell__nav-link"
                }
              >
                Customer Register
              </NavLink>
              <NavLink
                to="/app/customers/search"
                className={({ isActive }) =>
                  isActive
                    ? "shell__nav-link shell__nav-link--active"
                    : "shell__nav-link"
                }
              >
                Customer Search
              </NavLink>
            </>
          )}
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
          {canViewParts && (
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
              to="/app/purchase-invoices"
              className={({ isActive }) =>
                isActive
                  ? "shell__nav-link shell__nav-link--active"
                  : "shell__nav-link"
              }
            >
              Purchase Invoices
            </NavLink>
          )}

          {isAdmin && (
            <NavLink
              to="/app/reports/financial"
              className={({ isActive }) =>
                isActive
                  ? "shell__nav-link shell__nav-link--active"
                  : "shell__nav-link"
              }
            >
              Financial Reports
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
