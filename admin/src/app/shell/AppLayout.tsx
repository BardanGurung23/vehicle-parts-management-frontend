import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Wrench,
  Users,
  Package,
  CalendarCheck,
  Building2,
  FileText,
  BarChart3,
  ShoppingCart,
  ClipboardList,
  Star,
  UserCircle,
  Truck,
  LogOut,
  Menu,
  UserPlus,
  Search,
} from "lucide-react";
import { useAuth } from "../auth";
import { NavPopUp } from "../../components/NavPopUp";

const routeMeta: Record<string, { title: string; description: string }> = {
  "/app": {
    title: "Dashboard",
    description: "Monitor operations at a glance.",
  },
  "/app/staff": {
    title: "Staff Management",
    description: "Create and manage staff accounts.",
  },
  "/app/parts": {
    title: "Parts Management",
    description: "Manage inventory, pricing and stock levels.",
  },
  "/app/vendors": {
    title: "Vendors",
    description: "Manage supplier records and vendor contact details.",
  },
  "/app/purchase-invoices": {
    title: "Purchase Invoices",
    description: "Record vendor stock receipts and increase inventory.",
  },
  "/app/reports/financial": {
    title: "Financial Reports",
    description: "Review revenue, discounts, purchase spend, and gross profit.",
  },
  "/app/reports/customers": {
    title: "Customer Reports",
    description:
      "Review regular customers, high spenders, and pending credit accounts.",
  },
  "/app/appointments": {
    title: "Appointments",
    description: "Review scheduled appointments and update service status.",
  },
  "/app/book-appointment": {
    title: "Book Appointment",
    description: "Schedule a service for your vehicle.",
  },
  "/app/my-appointments": {
    title: "My Appointments",
    description: "View your booked service appointments and their status.",
  },
  "/app/shop": {
    title: "Shop Parts",
    description: "Browse and purchase vehicle parts.",
  },
  "/app/my-sales": {
    title: "My Purchases",
    description: "View your past purchases and service history.",
  },
  "/app/request-part": {
    title: "Request Part",
    description: "Request parts not available in our inventory.",
  },
  "/app/my-part-requests": {
    title: "My Part Requests",
    description: "Track the status of your part requests.",
  },
  "/app/part-requests": {
    title: "Part Requests",
    description: "Manage customer part requests and update their status.",
  },
  "/app/my-reviews": {
    title: "My Reviews",
    description: "View and manage your reviews.",
  },
  "/app/customers/register": {
    title: "Customer Registration",
    description:
      "Create staff-managed customer records with an initial vehicle.",
  },
  "/app/register-customer": {
    title: "Customer Registration",
    description:
      "Create staff-managed customer records with an initial vehicle.",
  },
  "/app/customers/search": {
    title: "Customer Search",
    description:
      "Search customer records by ID, phone, vehicle number, or name.",
  },
  "/app/profile": {
    title: "My Profile",
    description: "Review your customer profile and linked vehicles.",
  },
  "/app/profile/vehicles": {
    title: "My Vehicles",
    description: "Add and remove vehicles linked to your account.",
  },
};

function getRouteMeta(pathname: string): {
  title: string;
  description: string;
} {
  const exact = routeMeta[pathname];
  if (exact) return exact;
  if (
    pathname.startsWith("/app/customers/") &&
    !pathname.includes("/register") &&
    !pathname.includes("/search")
  ) {
    return {
      title: "Customer Details",
      description: "Review customer profiles, vehicles, and service history.",
    };
  }
  return { title: "Dashboard", description: "Monitor operations at a glance." };
}

type NavItem = {
  label: string;
  to: string;
  icon: React.ElementType;
  show: boolean;
};
type NavGroup = { label: string; items: NavItem[] };

export function AppLayout() {
  const location = useLocation();
  const MIN_SIDEBAR = 180;
  const MAX_SIDEBAR = 400;
  const COLLAPSED_WIDTH = 72;

  const { user, isAdmin, logout } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem("sidebarWidth");
    return saved ? Number(saved) : 260;
  });
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const widthRef = useRef(sidebarWidth);
  widthRef.current = sidebarWidth;

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.min(MAX_SIDEBAR, Math.max(MIN_SIDEBAR, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      localStorage.setItem("sidebarWidth", String(widthRef.current));
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const role = user?.role ?? "";
  const isCustomer = role === "Customer";
  const canViewParts = role === "Admin" || role === "Staff";
  const canManageCustomers = role === "Admin" || role === "Staff";

  const { title, description } = getRouteMeta(location.pathname);

  const closeDrawer = useCallback(() => {
    setIsMobileDrawerOpen(false);
    hamburgerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isMobileDrawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
      if (e.key === "Tab" && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    drawerRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileDrawerOpen, closeDrawer]);

  useEffect(() => {
    closeDrawer();
  }, [location.pathname, closeDrawer]);

  const navGroups: NavGroup[] = [
    {
      label: "Main",
      items: [
        { label: "Dashboard", to: "/app", icon: LayoutDashboard, show: true },
      ],
    },
    {
      label: "Appointments",
      items: [
        {
          label: "Book Appointment",
          to: "/app/book-appointment",
          icon: CalendarCheck,
          show: isCustomer,
        },
        {
          label: "My Appointments",
          to: "/app/my-appointments",
          icon: CalendarCheck,
          show: isCustomer,
        },
      ],
    },
    {
      label: "Parts",
      items: [
        {
          label: "Shop Parts",
          to: "/app/shop",
          icon: ShoppingCart,
          show: true,
        },
        {
          label: "Request Part",
          to: "/app/request-part",
          icon: ClipboardList,
          show: isCustomer,
        },
        {
          label: "My Requests",
          to: "/app/my-part-requests",
          icon: ClipboardList,
          show: isCustomer,
        },
        {
          label: "My Reviews",
          to: "/app/my-reviews",
          icon: Star,
          show: isCustomer,
        },
        {
          label: "My Purchases",
          to: "/app/my-sales",
          icon: Truck,
          show: isCustomer,
        },
      ],
    },
    // {
    //   label: "Profile",
    //   items: [
    //     {
    //       label: "My Profile",
    //       to: "/app/profile",
    //       icon: UserCircle,
    //       show: isCustomer,
    //     },
    //     {
    //       label: "Manage Vehicles",
    //       to: "/app/profile/vehicles",
    //       icon: Truck,
    //       show: isCustomer,
    //     },
    //   ],
    // },
    {
      label: "Customers",
      items: [
        {
          label: "Register",
          to: "/app/customers/register",
          icon: UserPlus,
          show: canManageCustomers,
        },
        {
          label: "Browse",
          to: "/app/customers/search",
          icon: Search,
          show: canManageCustomers,
        },
      ],
    },
    {
      label: "Management",
      items: [
        { label: "Staff", to: "/app/staff", icon: Users, show: isAdmin },
        { label: "Parts", to: "/app/parts", icon: Package, show: canViewParts },
        {
          label: "Appointments",
          to: "/app/appointments",
          icon: CalendarCheck,
          show: isAdmin,
        },
        {
          label: "Vendors",
          to: "/app/vendors",
          icon: Building2,
          show: isAdmin,
        },
        {
          label: "Purchase Invoices",
          to: "/app/purchase-invoices",
          icon: FileText,
          show: isAdmin,
        },
        {
          label: "Financial Reports",
          to: "/app/reports/financial",
          icon: BarChart3,
          show: isAdmin,
        },
        {
          label: "Customer Reports",
          to: "/app/reports/customers",
          icon: BarChart3,
          show: canManageCustomers,
        },
        {
          label: "Part Requests",
          to: "/app/part-requests",
          icon: ClipboardList,
          show: isAdmin,
        },
      ],
    },
  ];

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  const SidebarNav = ({ collapsed }: { collapsed: boolean }) => (
    <nav
      className="flex-1 overflow-y-auto px-2 py-4 space-y-5"
      aria-label="Main navigation"
    >
      {navGroups
        .filter((g) => g.items.some((i) => i.show))
        .map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-4 mb-2 text-label-small text-on-surface-variant/50 uppercase tracking-widest">
                {group.label}
              </p>
            )}
            <div
              className={`${collapsed ? "flex flex-col items-center gap-1" : "space-y-0.5"}`}
            >
              {group.items
                .filter((i) => i.show)
                .map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/app" || item.to === "/app/profile"}
                    className={({ isActive }) =>
                      `flex items-center transition-all duration-200 ease-emphasized ${
                        collapsed
                          ? "justify-center w-10 h-10 rounded-full"
                          : "gap-3 px-4 py-2.5 rounded-full text-sm font-medium"
                      } ${
                        isActive
                          ? "bg-primary-container text-primary-on-container shadow-level1"
                          : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                      }`
                    }
                    aria-current={({ isActive }) =>
                      isActive ? "page" : undefined
                    }
                  >
                    <item.icon
                      className={`shrink-0 ${collapsed ? "w-5 h-5" : "w-4 h-4"}`}
                    />
                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </NavLink>
                ))}
            </div>
          </div>
        ))}
    </nav>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full" ref={drawerRef} tabIndex={-1}>
      <div
        className={`flex items-center shrink-0 glass ${isSidebarCollapsed ? "justify-center h-16" : "gap-3 px-4 h-16"}`}
      >
        <div className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center shadow-level1 shrink-0">
          <Wrench className="w-4.5 h-4.5 text-primary" />
        </div>
        {!isSidebarCollapsed && (
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-on-surface tracking-tight">
              Autonix
            </h1>
            <p className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider">
              Access Console
            </p>
          </div>
        )}
      </div>

      <SidebarNav collapsed={isSidebarCollapsed} />

      <div
        className={`mx-[7px] mb-3 shrink-0 border border-[#686767] rounded-md ${isSidebarCollapsed ? "p-3 flex flex-col items-center gap-2" : "p-3"}`}
      >
        <div
          className={`flex items-center ${isSidebarCollapsed ? "flex-col gap-2" : "gap-3"}`}
        >
          <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-xs font-bold text-primary-on-container shrink-0 shadow-level1">
            {initials}
          </div>
          {!isSidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-on-surface truncate">
                {user?.fullName}
              </p>
              <p className="text-xs text-on-surface-variant truncate">{role}</p>
            </div>
          )}
          <NavPopUp
            user={user}
            initials={initials}
            isSidebarCollapsed={isSidebarCollapsed}
            role={role}
            logout={logout}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-dim md:flex">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden animate-fadeIn"
          onClick={closeDrawer}
          aria-hidden="true"
          style={{
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        />
      )}

      <aside
        ref={sidebarRef}
        className={`
          fixed top-0 left-0 z-50 h-full glass-heavy shadow-level2
          shrink-0
          md:sticky md:z-auto md:h-screen md:top-0
          ${isMobileDrawerOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          ${isResizing ? "" : "transition-all duration-300 ease-emphasized"}
        `}
        style={{ width: isSidebarCollapsed ? COLLAPSED_WIDTH : sidebarWidth }}
        aria-label="Main navigation"
      >
        {sidebarContent}

        {!isSidebarCollapsed && (
          <div
            className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors"
            onMouseDown={handleResizeStart}
          />
        )}
      </aside>

      <div className="md:flex-1 md:flex md:flex-col md:min-w-0">
        <header className="sticky top-0 z-30 glass shadow-level2" role="banner">
          <div className="flex items-center justify-between gap-4 px-4 h-16">
            <div className="flex items-center gap-3 min-w-0">
              <button
                ref={hamburgerRef}
                type="button"
                className="md:hidden p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
                onClick={() => setIsMobileDrawerOpen(true)}
                aria-expanded={isMobileDrawerOpen}
                aria-controls="mobile-nav"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <button
                type="button"
                className="hidden md:flex p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                aria-label={
                  isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  className={`transition-transform duration-200 ${isSidebarCollapsed ? "rotate-180" : ""}`}
                >
                  <g fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 11c0-3.771 0-5.657 1.172-6.828S6.229 3 10 3h4c3.771 0 5.657 0 6.828 1.172S22 7.229 22 11v2c0 3.771 0 5.657-1.172 6.828S17.771 21 14 21h-4c-3.771 0-5.657 0-6.828-1.172S2 16.771 2 13z" />
                    <path strokeLinecap="round" d="M15 21V3" opacity="0.5" />
                  </g>
                </svg>
              </button>

              <div className="min-w-0">
                <h2 className="text-title-large text-on-surface truncate">
                  {title}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <p className="hidden sm:block text-sm text-on-surface-variant truncate max-w-[240px]">
                {description}
              </p>

              <div className="flex items-center gap-3 pl-3">
                <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-xs font-bold text-on-primary-container">
                  {initials}
                </div>
                <div className="hidden sm:block text-sm">
                  <p className="font-medium text-on-surface">
                    {user?.fullName}
                  </p>
                  <span className="text-xs text-on-surface-variant">
                    {role}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main
          id="main-content"
          role="main"
          className="flex-1 p-4 md:p-6 lg:p-8 page-enter bg-[radial-gradient(ellipse_at_top_right,_rgba(208,188,255,0.03),transparent_50%)]"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
