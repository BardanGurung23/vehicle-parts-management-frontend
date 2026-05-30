import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementType,
} from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Package,
  CalendarCheck,
  Building2,
  FileText,
  BarChart3,
  ShoppingCart,
  ClipboardList,
  Star,
  Truck,
  LogOut,
  Menu,
  UserPlus,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  CircleUser,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "../auth";
import { ThemeToggle } from "../../shared/components/ThemeToggle";

/* ============================================================================
 * Route metadata
 *
 * Header copy per route. Add new entries here when routes are added so the
 * layout can show a contextual title + description.
 * ========================================================================= */
const routeMeta: Record<string, { title: string; description?: string }> = {
  "/app": { title: "Dashboard", description: "Operational overview" },
  "/app/staff": { title: "Staff", description: "Accounts and roles" },
  "/app/parts": { title: "Parts", description: "Inventory and pricing" },
  "/app/vendors": { title: "Vendors", description: "Suppliers and contacts" },
  "/app/purchase-invoices": {
    title: "Purchase invoices",
    description: "Stock receipts",
  },
  "/app/reports/financial": {
    title: "Financial reports",
    description: "Revenue and spend",
  },
  "/app/reports/customers": {
    title: "Customer reports",
    description: "Loyalty and balances",
  },
  "/app/appointments": { title: "Appointments", description: "Service queue" },
  "/app/book-appointment": { title: "Book appointment" },
  "/app/my-appointments": { title: "My appointments" },
  "/app/shop": { title: "Shop parts" },
  "/app/my-sales": { title: "My purchases" },
  "/app/request-part": { title: "Request a part" },
  "/app/my-part-requests": { title: "My part requests" },
  "/app/part-requests": { title: "Part requests" },
  "/app/my-reviews": { title: "My reviews" },
  "/app/customers/register": { title: "Register customer" },
  "/app/register-customer": { title: "Register customer" },
  "/app/customers/search": { title: "Customers", description: "Directory" },
  "/app/profile": { title: "Profile" },
  "/app/profile/vehicles": { title: "My vehicles" },
};

function getRouteMeta(pathname: string) {
  const exact = routeMeta[pathname];
  if (exact) return exact;
  if (
    pathname.startsWith("/app/customers/") &&
    !pathname.includes("/register") &&
    !pathname.includes("/search")
  ) {
    return { title: "Customer details", description: "Profile and history" };
  }
  return routeMeta["/app"];
}

/* ============================================================================
 * Navigation model
 * ========================================================================= */
type NavItem = {
  label: string;
  to: string;
  icon: ElementType;
  show: boolean;
  end?: boolean;
};
type NavGroup = { label: string; items: NavItem[] };

/* ============================================================================
 * Layout constants
 * ========================================================================= */
const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED = 64;
const HEADER_HEIGHT = 56;

/* ============================================================================
 * AppLayout
 * ========================================================================= */
export function AppLayout() {
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();

  /**
   * Routes that need extra horizontal space (e.g. the storefront with its
   * filter rail + product grid + slide-over cart) collapse the sidebar by
   * default while keeping the user's manual toggle authoritative.
   */
  const isCompactLayoutRoute = useCallback((pathname: string) => {
    return pathname === "/app/shop" || pathname.startsWith("/app/shop/");
  }, []);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (isCompactLayoutRoute(location.pathname)) return true;
    return localStorage.getItem("admin:sidebar-collapsed") === "1";
  });
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // When the user explicitly toggles the sidebar we treat the next value
  // as their preference; route-driven auto-collapse must not override it
  // until they navigate to a different layout zone.
  const lastUserPreferenceRef = useRef<boolean | null>(null);
  const lastRouteWasCompactRef = useRef<boolean>(
    isCompactLayoutRoute(location.pathname),
  );

  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const role = user?.role ?? "";
  const isCustomer = role === "Customer";
  const canViewParts = role === "Admin" || role === "Staff";
  const canManageAppointments = role === "Admin" || role === "Staff";
  const canManageCustomers = role === "Admin" || role === "Staff";

  const { title, description } = getRouteMeta(location.pathname);

  /* -------- collapse persistence -------- */
  const toggleCollapse = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("admin:sidebar-collapsed", next ? "1" : "0");
      lastUserPreferenceRef.current = next;
      return next;
    });
  }, []);

  /* -------- route-driven auto-collapse -------------------------------- */
  // On the storefront we collapse the sidebar so the catalog + filters +
  // cart drawer have room to breathe. When the user leaves we restore
  // their saved preference (or whatever they manually picked while on the
  // compact route).
  useEffect(() => {
    const compactNow = isCompactLayoutRoute(location.pathname);
    const wasCompact = lastRouteWasCompactRef.current;

    if (compactNow && !wasCompact) {
      // Arriving at a compact-layout route: collapse, but remember the
      // current state so we can restore it on the way out.
      setIsSidebarCollapsed((current) => {
        lastUserPreferenceRef.current = current;
        return true;
      });
    } else if (!compactNow && wasCompact) {
      // Leaving the compact-layout route: restore the saved preference
      // unless the user manually overrode it while inside.
      const saved =
        lastUserPreferenceRef.current ??
        (localStorage.getItem("admin:sidebar-collapsed") === "1");
      setIsSidebarCollapsed(saved);
    }

    lastRouteWasCompactRef.current = compactNow;
  }, [isCompactLayoutRoute, location.pathname]);

  /* -------- mobile drawer -------- */
  const closeDrawer = useCallback(() => {
    setIsMobileDrawerOpen(false);
    hamburgerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isMobileDrawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [isMobileDrawerOpen, closeDrawer]);

  // Close drawer on navigation
  useEffect(() => {
    closeDrawer();
  }, [location.pathname, closeDrawer]);

  /* -------- user menu -------- */
  useEffect(() => {
    if (!isUserMenuOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsUserMenuOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [isUserMenuOpen]);

  /* -------- nav model -------- */
  const navGroups: NavGroup[] = useMemo(
    () => [
      {
        label: "Overview",
        items: [
          { label: "Dashboard", to: "/app", icon: LayoutDashboard, show: true, end: true },
        ],
      },
      {
        label: "Service",
        items: [
          { label: "Appointments", to: "/app/appointments", icon: CalendarCheck, show: canManageAppointments },
          { label: "Book", to: "/app/book-appointment", icon: CalendarCheck, show: isCustomer },
          { label: "My appointments", to: "/app/my-appointments", icon: CalendarCheck, show: isCustomer },
        ],
      },
      {
        label: "Customers",
        items: [
          { label: "Browse", to: "/app/customers/search", icon: Search, show: canManageCustomers },
          { label: "Register", to: "/app/customers/register", icon: UserPlus, show: canManageCustomers },
          { label: "Customer reports", to: "/app/reports/customers", icon: BarChart3, show: canManageCustomers },
        ],
      },
      {
        label: "Inventory",
        items: [
          { label: "Parts", to: "/app/parts", icon: Package, show: canViewParts },
          { label: "Vendors", to: "/app/vendors", icon: Building2, show: isAdmin },
          { label: "Purchase invoices", to: "/app/purchase-invoices", icon: FileText, show: isAdmin },
          { label: "Part requests", to: "/app/part-requests", icon: ClipboardList, show: isAdmin },
        ],
      },
      {
        label: "Storefront",
        items: [
          { label: "Shop", to: "/app/shop", icon: ShoppingCart, show: true },
          { label: "My purchases", to: "/app/my-sales", icon: Truck, show: isCustomer },
          { label: "Request a part", to: "/app/request-part", icon: ClipboardList, show: isCustomer },
          { label: "My requests", to: "/app/my-part-requests", icon: ClipboardList, show: isCustomer },
          { label: "My reviews", to: "/app/my-reviews", icon: Star, show: isCustomer },
        ],
      },
      {
        label: "Administration",
        items: [
          { label: "Staff", to: "/app/staff", icon: Users, show: isAdmin },
          { label: "Financial reports", to: "/app/reports/financial", icon: BarChart3, show: isAdmin },
        ],
      },
    ],
    [canManageAppointments, canManageCustomers, canViewParts, isAdmin, isCustomer],
  );

  /* -------- helpers -------- */
  const initials = useMemo(() => {
    if (!user?.fullName) return "?";
    return user.fullName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [user?.fullName]);

  /* ----------------------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-[var(--md-sys-color-background)] flex">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      {/* Mobile drawer scrim */}
      {isMobileDrawerOpen ? (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-[var(--md-sys-color-scrim)] animate-fadeIn"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      ) : null}

      <Sidebar
        groups={navGroups}
        collapsed={isSidebarCollapsed}
        mobileOpen={isMobileDrawerOpen}
        widthCollapsed={SIDEBAR_COLLAPSED}
        widthExpanded={SIDEBAR_WIDTH}
        onCollapseToggle={toggleCollapse}
        onCloseMobile={closeDrawer}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="sticky top-0 z-30 bg-[var(--md-sys-color-surface)] border-b border-[var(--md-sys-color-outline-variant)]"
          style={{ height: HEADER_HEIGHT }}
          role="banner"
        >
          <div className="flex items-center justify-between gap-3 px-4 sm:px-6 h-full">
            <div className="flex items-center gap-3 min-w-0">
              <button
                ref={hamburgerRef}
                type="button"
                className="lg:hidden p-2 -ml-2 rounded-md text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors"
                onClick={() => setIsMobileDrawerOpen(true)}
                aria-expanded={isMobileDrawerOpen}
                aria-controls="primary-nav"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-[15px] font-semibold text-[var(--md-sys-color-on-surface)] tracking-tight truncate leading-tight">
                  {title}
                </h1>
                {description ? (
                  <p className="hidden sm:block text-[12px] text-[var(--md-sys-color-on-surface-variant)] truncate">
                    {description}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                aria-label="Help"
                title="Help"
                className="hidden sm:inline-flex p-2 rounded-md text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors"
              >
                <HelpCircle className="w-4 h-4" aria-hidden="true" />
              </button>
              <ThemeToggle />

              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 ml-1 rounded-md hover:bg-[var(--md-sys-color-surface-container)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]"
                >
                  <Avatar initials={initials} />
                  <span className="hidden md:flex flex-col items-start text-[12px] leading-tight">
                    <span className="font-medium text-[var(--md-sys-color-on-surface)] truncate max-w-[140px]">
                      {user?.fullName ?? "Account"}
                    </span>
                    <span className="text-[var(--md-sys-color-on-surface-variant)]">{role || "User"}</span>
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)] transition-transform hidden sm:block ${
                      isUserMenuOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {isUserMenuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-64 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-md shadow-level3 py-1 origin-top-right animate-scaleIn"
                  >
                    <div className="px-3 py-3 border-b border-[var(--md-sys-color-outline-variant)]">
                      <p className="text-sm font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                        {user?.fullName}
                      </p>
                      <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] truncate">
                        {user?.email}
                      </p>
                      <span className="mt-1.5 inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-[var(--brand-50)] text-[var(--brand-700)]">
                        {role || "User"}
                      </span>
                    </div>
                    {isCustomer ? (
                      <div className="py-1">
                        <UserMenuLink
                          to="/app/profile"
                          icon={CircleUser}
                          label="Profile"
                          onSelect={() => setIsUserMenuOpen(false)}
                        />
                        <UserMenuLink
                          to="/app/profile/vehicles"
                          icon={Truck}
                          label="Vehicles"
                          onSelect={() => setIsUserMenuOpen(false)}
                        />
                      </div>
                    ) : null}
                    <div className="py-1 border-t border-[var(--md-sys-color-outline-variant)]">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)] transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" aria-hidden="true" />
                        Sign out
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <main
          id="main-content"
          role="main"
          className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 page-enter"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/* ============================================================================
 * Sidebar
 * ========================================================================= */
type SidebarProps = {
  groups: NavGroup[];
  collapsed: boolean;
  mobileOpen: boolean;
  widthCollapsed: number;
  widthExpanded: number;
  onCollapseToggle: () => void;
  onCloseMobile: () => void;
};

function Sidebar({
  groups,
  collapsed,
  mobileOpen,
  widthCollapsed,
  widthExpanded,
  onCollapseToggle,
  onCloseMobile,
}: SidebarProps) {
  const visibleGroups = groups.filter((g) => g.items.some((i) => i.show));

  return (
    <aside
      id="primary-nav"
      aria-label="Primary navigation"
      className={[
        "fixed top-0 left-0 z-50 h-screen flex flex-col",
        "bg-[var(--md-sys-color-surface)] border-r border-[var(--md-sys-color-outline-variant)]",
        "transition-[transform,width] duration-200 ease-standard",
        "lg:sticky lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      ].join(" ")}
      style={{ width: collapsed ? widthCollapsed : widthExpanded }}
    >
      {/* Brand */}
      <div
        className={[
          "shrink-0 flex items-center border-b border-[var(--md-sys-color-outline-variant)]",
          collapsed ? "justify-center" : "px-4 gap-2.5",
        ].join(" ")}
        style={{ height: HEADER_HEIGHT }}
      >
        <div className="w-9 h-9 rounded-lg bg-[var(--brand-50)] border border-[var(--brand-100)] flex items-center justify-center shrink-0">
          <GraduationCap className="w-5 h-5 text-[var(--brand-700)]" aria-hidden="true" />
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-[var(--md-sys-color-on-surface)] leading-none">
              Autonix
            </p>
            <p className="text-[10px] font-medium text-[var(--md-sys-color-on-surface-variant)] mt-1 uppercase tracking-wider">
              Admin Console
            </p>
          </div>
        ) : null}
        {!collapsed ? (
          <button
            type="button"
            className="ml-auto lg:hidden p-1 rounded-md text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors"
            onClick={onCloseMobile}
            aria-label="Close navigation"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Main navigation">
        {visibleGroups.map((group, idx) => (
          <NavGroupSection
            key={group.label}
            group={group}
            collapsed={collapsed}
            addTopSpacing={idx > 0}
          />
        ))}
      </nav>

      {/* Collapse toggle (desktop only) */}
      <div className="border-t border-[var(--md-sys-color-outline-variant)] p-2 hidden lg:block">
        <button
          type="button"
          onClick={onCollapseToggle}
          className="w-full flex items-center justify-center gap-2 px-2 py-2 rounded-md text-[12px] font-medium text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] hover:text-[var(--md-sys-color-on-surface)] transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
          {!collapsed ? <span>Collapse</span> : null}
        </button>
      </div>
    </aside>
  );
}

/* ============================================================================
 * NavGroupSection
 * ========================================================================= */
function NavGroupSection({
  group,
  collapsed,
  addTopSpacing,
}: {
  group: NavGroup;
  collapsed: boolean;
  addTopSpacing: boolean;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const visibleItems = group.items.filter((i) => i.show);
  if (visibleItems.length === 0) return null;

  return (
    <div className={addTopSpacing ? "mt-3" : undefined}>
      {!collapsed ? (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          className="w-full flex items-center justify-between px-3 py-1.5 group"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--md-sys-color-on-surface-variant)] group-hover:text-[var(--md-sys-color-on-surface)] transition-colors">
            {group.label}
          </span>
          <ChevronUp
            className={`w-3 h-3 text-[var(--md-sys-color-on-surface-variant)] group-hover:text-[var(--md-sys-color-on-surface)] transition-transform ${
              isOpen ? "" : "rotate-180"
            }`}
            aria-hidden="true"
          />
        </button>
      ) : (
        <div
          className="my-2 mx-2 border-t border-[var(--md-sys-color-outline-variant)]"
          aria-hidden="true"
        />
      )}
      {(isOpen || collapsed) && (
        <div className={collapsed ? "flex flex-col items-center gap-0.5" : "space-y-0.5"}>
          {visibleItems.map((item) => (
            <NavItemLink key={item.to} item={item} collapsed={collapsed} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================================
 * NavItemLink
 * ========================================================================= */
function NavItemLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon = item.icon;
  const end = item.end === true || item.to === "/app" || item.to === "/app/profile";

  return (
    <NavLink
      to={item.to}
      end={end}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        [
          "relative flex items-center transition-colors duration-150",
          collapsed
            ? "justify-center w-10 h-10 rounded-md"
            : "gap-2.5 px-3 h-9 rounded-md text-[13px] font-medium",
          isActive
            ? "bg-[var(--brand-50)] text-[var(--brand-700)]"
            : "text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          {isActive && !collapsed ? (
            <span
              className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r-full bg-[var(--md-sys-color-primary)]"
              aria-hidden="true"
            />
          ) : null}
          <Icon
            className={[
              "shrink-0",
              collapsed ? "w-[18px] h-[18px]" : "w-4 h-4",
              isActive
                ? "text-[var(--md-sys-color-primary)]"
                : "text-[var(--md-sys-color-on-surface-variant)]",
            ].join(" ")}
            aria-hidden="true"
          />
          {!collapsed ? (
            <span className="truncate">{item.label}</span>
          ) : (
            <span className="sr-only">{item.label}</span>
          )}
        </>
      )}
    </NavLink>
  );
}

/* ============================================================================
 * UserMenuLink
 * ========================================================================= */
function UserMenuLink({
  to,
  icon: Icon,
  label,
  onSelect,
}: {
  to: string;
  icon: ElementType;
  label: string;
  onSelect: () => void;
}) {
  return (
    <NavLink
      role="menuitem"
      to={to}
      onClick={onSelect}
      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-low)] transition-colors"
    >
      <Icon className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" aria-hidden="true" />
      {label}
    </NavLink>
  );
}

/* ============================================================================
 * Avatar
 * ========================================================================= */
function Avatar({ initials }: { initials: string }) {
  return (
    <span
      aria-hidden="true"
      className="w-8 h-8 rounded-full bg-[var(--brand-50)] text-[var(--brand-700)] border border-[var(--brand-100)] flex items-center justify-center text-[11px] font-semibold tabular"
    >
      {initials}
    </span>
  );
}
