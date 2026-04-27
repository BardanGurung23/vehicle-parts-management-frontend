import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import type {
  CustomerDetail,
  CustomerSearchInput,
  CustomerSearchResult,
  StaffUser,
} from "../../app/types";
import { useGetPartsQuery } from "../../redux/services/parts";
import { AlertBox } from "../../shared/components/AlertBox";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-US");

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

type SearchFormState = {
  customerId: string;
  phoneNumber: string;
  vehicleNumber: string;
  name: string;
};

type MetricCard = {
  label: string;
  value: string;
  note: string;
};

type HeroStat = {
  label: string;
  value: string;
};

type StatusSegment = {
  label: string;
  count: number;
  description: string;
  color: string;
};

type BreakdownItem = {
  label: string;
  value: number;
  helper: string;
};

type RtqErrorShape = {
  data?: unknown;
  error?: unknown;
};

function asMessage(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (!error || typeof error !== "object") {
    return fallback;
  }

  const payload = error as RtqErrorShape;
  const body = payload.data;

  if (body && typeof body === "object") {
    const details = body as {
      detail?: unknown;
      title?: unknown;
      message?: unknown;
    };

    return (
      asMessage(details.detail) ??
      asMessage(details.message) ??
      asMessage(details.title) ??
      fallback
    );
  }

  return asMessage(payload.error) ?? fallback;
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function pluralize(label: string, count: number) {
  return `${formatNumber(count)} ${label}${count === 1 ? "" : "s"}`;
}

function buildCustomerSearchPayload(values: SearchFormState): {
  payload: CustomerSearchInput | null;
  error: string | null;
} {
  const customerIdValue = values.customerId.trim();
  const phoneNumber = values.phoneNumber.trim();
  const vehicleNumber = values.vehicleNumber.trim();
  const name = values.name.trim();

  if (!customerIdValue && !phoneNumber && !vehicleNumber && !name) {
    return {
      payload: null,
      error: "Provide at least one search field to look up a customer.",
    };
  }

  const payload: CustomerSearchInput = {};

  if (customerIdValue) {
    const parsedCustomerId = Number(customerIdValue);

    if (!Number.isInteger(parsedCustomerId) || parsedCustomerId <= 0) {
      return {
        payload: null,
        error: "Customer ID must be a positive whole number.",
      };
    }

    payload.customerId = parsedCustomerId;
  }

  if (phoneNumber) {
    payload.phoneNumber = phoneNumber;
  }

  if (vehicleNumber) {
    payload.vehicleNumber = vehicleNumber;
  }

  if (name) {
    payload.name = name;
  }

  return { payload, error: null };
}

function buildDonutStyle(segments: StatusSegment[]): CSSProperties {
  const total = segments.reduce((sum, segment) => sum + segment.count, 0);

  if (total === 0) {
    return {
      background: "conic-gradient(#e5e7eb 0deg 360deg)",
    };
  }

  let currentAngle = 0;
  const stops = segments.map((segment) => {
    const nextAngle = currentAngle + (segment.count / total) * 360;
    const stop = `${segment.color} ${currentAngle}deg ${nextAngle}deg`;
    currentAngle = nextAngle;
    return stop;
  });

  return {
    background: `conic-gradient(${stops.join(", ")})`,
  };
}

function KpiCard({ label, value, note }: MetricCard) {
  return (
    <article className="card dashboard-kpi-card">
      <p className="dashboard-kpi-card__label">{label}</p>
      <strong className="dashboard-kpi-card__value">{value}</strong>
      <p className="dashboard-kpi-card__note">{note}</p>
    </article>
  );
}

function BreakdownList({ items, accentClass }: { items: BreakdownItem[]; accentClass: string }) {
  const maxValue = items.reduce((largest, item) => Math.max(largest, item.value), 0);

  return (
    <div className="dashboard-bar-list">
      {items.map((item) => {
        const width = maxValue > 0 ? `${(item.value / maxValue) * 100}%` : "0%";

        return (
          <div key={item.label} className="dashboard-bar-item">
            <div className="dashboard-bar-item__meta">
              <span>{item.label}</span>
              <strong>{formatNumber(item.value)}</strong>
            </div>
            <div className="dashboard-bar-track" aria-hidden="true">
              <span className={`dashboard-bar-fill ${accentClass}`} style={{ width }} />
            </div>
            <p className="dashboard-bar-item__helper">{item.helper}</p>
          </div>
        );
      })}
    </div>
  );
}

export function DashboardPage() {
  const { user, token, isAdmin } = useAuth();
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [isStaffLoading, setIsStaffLoading] = useState(false);
  const [customerProfile, setCustomerProfile] = useState<CustomerDetail | null>(null);
  const [customerProfileError, setCustomerProfileError] = useState<string | null>(null);
  const [isCustomerProfileLoading, setIsCustomerProfileLoading] = useState(false);
  const [searchValues, setSearchValues] = useState<SearchFormState>({
    customerId: "",
    phoneNumber: "",
    vehicleNumber: "",
    name: "",
  });
  const [customerResults, setCustomerResults] = useState<CustomerSearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearchRun, setHasSearchRun] = useState(false);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);

  const role = user?.role ?? "";
  const isCustomer = role === "Customer";
  const canViewInventory = role === "Admin" || role === "Staff";
  const canSearchCustomers = canViewInventory;
  const canViewStaff = isAdmin;
  const canManagePartsPage = isAdmin;
  const {
    data: parts = [],
    isLoading: isPartsLoading,
    error: partsError,
  } = useGetPartsQuery(undefined, {
    skip: !canViewInventory,
  });

  useEffect(() => {
    if (!canViewStaff || !token) {
      setStaffUsers([]);
      setStaffError(null);
      setIsStaffLoading(false);
      return;
    }

    let isActive = true;
    setIsStaffLoading(true);

    void api
      .getStaffUsers(token)
      .then((response) => {
        if (!isActive) {
          return;
        }

        setStaffUsers(response);
        setStaffError(null);
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        setStaffError(extractErrorMessage(error, "Could not load the staff snapshot."));
      })
      .finally(() => {
        if (isActive) {
          setIsStaffLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [canViewStaff, token]);

  useEffect(() => {
    if (!isCustomer || !token) {
      setCustomerProfile(null);
      setCustomerProfileError(null);
      setIsCustomerProfileLoading(false);
      return;
    }

    let isActive = true;
    setIsCustomerProfileLoading(true);

    void api
      .getCurrentCustomer(token)
      .then((response) => {
        if (!isActive) {
          return;
        }

        setCustomerProfile(response);
        setCustomerProfileError(null);
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        setCustomerProfileError(extractErrorMessage(error, "Could not load your customer profile."));
      })
      .finally(() => {
        if (isActive) {
          setIsCustomerProfileLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [isCustomer, token]);

  const partsErrorMessage =
    canViewInventory && partsError
      ? extractErrorMessage(partsError, "Could not load the inventory snapshot.")
      : null;

  const outOfStockCount = useMemo(
    () => parts.filter((part) => part.stockQuantity === 0).length,
    [parts],
  );

  const reorderSoonCount = useMemo(
    () => parts.filter((part) => part.stockQuantity > 0 && part.stockQuantity <= part.reorderLevel).length,
    [parts],
  );

  const healthyStockCount = useMemo(
    () => parts.filter((part) => part.stockQuantity > part.reorderLevel).length,
    [parts],
  );

  const totalUnitsOnHand = useMemo(
    () => parts.reduce((total, part) => total + part.stockQuantity, 0),
    [parts],
  );

  const inventoryCost = useMemo(
    () => parts.reduce((total, part) => total + part.costPrice * part.stockQuantity, 0),
    [parts],
  );

  const lowStockWatchlist = useMemo(() => {
    const lowStockParts = parts.filter((part) => part.stockQuantity <= part.reorderLevel);

    return [...lowStockParts]
      .sort((left, right) => {
        const leftGap = left.reorderLevel - left.stockQuantity;
        const rightGap = right.reorderLevel - right.stockQuantity;

        if (rightGap !== leftGap) {
          return rightGap - leftGap;
        }

        return left.partName.localeCompare(right.partName);
      })
      .slice(0, 5);
  }, [parts]);

  const latestParts = useMemo(
    () =>
      [...parts]
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
        .slice(0, 5),
    [parts],
  );

  const inventorySegments = useMemo<StatusSegment[]>(
    () => [
      {
        label: "Healthy",
        count: healthyStockCount,
        description: "Stock sits above its reorder threshold.",
        color: "#0f766e",
      },
      {
        label: "Reorder soon",
        count: reorderSoonCount,
        description: "Still available, but already at the reorder line.",
        color: "#d97706",
      },
      {
        label: "Out of stock",
        count: outOfStockCount,
        description: "Requires immediate replenishment.",
        color: "#b91c1c",
      },
    ],
    [healthyStockCount, reorderSoonCount, outOfStockCount],
  );

  const categoryBreakdown = useMemo<BreakdownItem[]>(() => {
    const groupedCategories = new Map<string, number>();

    parts.forEach((part) => {
      const categoryName = part.categoryName?.trim() || "Uncategorized";
      groupedCategories.set(categoryName, (groupedCategories.get(categoryName) ?? 0) + 1);
    });

    return [...groupedCategories.entries()]
      .map(([label, value]) => ({
        label,
        value,
        helper: pluralize("part", value),
      }))
      .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label))
      .slice(0, 5);
  }, [parts]);

  const staffRoleBreakdown = useMemo<BreakdownItem[]>(() => {
    const groupedRoles = new Map<string, number>();

    staffUsers.forEach((staffUser) => {
      groupedRoles.set(staffUser.role, (groupedRoles.get(staffUser.role) ?? 0) + 1);
    });

    return [...groupedRoles.entries()]
      .map(([label, value]) => ({
        label,
        value,
        helper: pluralize("account", value),
      }))
      .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label));
  }, [staffUsers]);

  const activeStaffCount = useMemo(
    () => staffUsers.filter((staffUser) => staffUser.isActive).length,
    [staffUsers],
  );

  const recentStaff = useMemo(
    () =>
      [...staffUsers]
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
        .slice(0, 4),
    [staffUsers],
  );

  const heroStats = useMemo<HeroStat[]>(() => {
    if (isCustomer) {
      return [
        {
          label: "Customer ID",
          value: customerProfile ? `#${customerProfile.customerId}` : "Waiting...",
        },
        {
          label: "Vehicles",
          value: customerProfile ? formatNumber(customerProfile.vehicles.length) : "Waiting...",
        },
        {
          label: "Status",
          value: user?.isActive ? "Active" : "Inactive",
        },
      ];
    }

    if (isAdmin) {
      return [
        {
          label: "Low-stock items",
          value: isPartsLoading ? "Loading..." : formatNumber(lowStockWatchlist.length),
        },
        {
          label: "Active staff",
          value: isStaffLoading ? "Loading..." : `${formatNumber(activeStaffCount)}/${formatNumber(staffUsers.length)}`,
        },
        {
          label: "Customer lookup",
          value: "Enabled",
        },
      ];
    }

    return [
      {
        label: "Units on hand",
        value: isPartsLoading ? "Loading..." : formatNumber(totalUnitsOnHand),
      },
      {
        label: "Low-stock items",
        value: isPartsLoading ? "Loading..." : formatNumber(lowStockWatchlist.length),
      },
      {
        label: "Customer lookup",
        value: "Enabled",
      },
    ];
  }, [
    activeStaffCount,
    customerProfile,
    isAdmin,
    isCustomer,
    isPartsLoading,
    isStaffLoading,
    lowStockWatchlist.length,
    staffUsers.length,
    totalUnitsOnHand,
    user?.isActive,
  ]);

  const metricCards = useMemo<MetricCard[]>(() => {
    if (isCustomer) {
      return [
        {
          label: "Vehicles linked",
          value: customerProfile ? formatNumber(customerProfile.vehicles.length) : "Waiting...",
          note: customerProfile
            ? customerProfile.vehicles.length === 0
              ? "No vehicles linked yet."
              : "Vehicle records attached to your account."
            : "Loading your vehicle record.",
        },
        {
          label: "Registered on",
          value: customerProfile ? formatDate(customerProfile.registeredAt) : "Waiting...",
          note: "The date your customer profile was created.",
        },
        {
          label: "Account status",
          value: user?.isActive ? "Active" : "Inactive",
          note: "Session access is linked to the user account state.",
        },
      ];
    }

    const cards: MetricCard[] = [
      {
        label: "Tracked SKUs",
        value: isPartsLoading ? "Loading..." : formatNumber(parts.length),
        note: "Distinct parts currently represented in inventory.",
      },
      {
        label: "Low-stock items",
        value: isPartsLoading ? "Loading..." : formatNumber(lowStockWatchlist.length),
        note: "Parts already at or below their reorder level.",
      },
      {
        label: "Out of stock",
        value: isPartsLoading ? "Loading..." : formatNumber(outOfStockCount),
        note: "Parts with no sellable stock left.",
      },
      {
        label: "Inventory value",
        value: isPartsLoading ? "Loading..." : formatCurrency(inventoryCost),
        note: "Cost basis of stock currently on hand.",
      },
    ];

    if (isAdmin) {
      cards.push(
        {
          label: "Staff accounts",
          value: isStaffLoading ? "Loading..." : formatNumber(staffUsers.length),
          note: "Admin and staff users available in the system.",
        },
        {
          label: "Active staff",
          value: isStaffLoading ? "Loading..." : formatNumber(activeStaffCount),
          note: "Staff accounts currently marked active.",
        },
      );
    }

    return cards;
  }, [
    activeStaffCount,
    customerProfile,
    inventoryCost,
    isAdmin,
    isCustomer,
    isPartsLoading,
    isStaffLoading,
    lowStockWatchlist.length,
    outOfStockCount,
    parts.length,
    staffUsers.length,
    user?.isActive,
  ]);

  const inventoryDonutStyle = useMemo(() => buildDonutStyle(inventorySegments), [inventorySegments]);

  const dashboardSummaryCopy = isCustomer
    ? "Your dashboard now surfaces the account and vehicle information already available in the current customer backend."
    : isAdmin
      ? "This view pulls together live inventory health, staff coverage, and customer lookup so admin work starts from one place."
      : "This view keeps inventory pressure and customer lookup visible without sending staff through admin-only screens.";

  const heroEyebrow = isCustomer ? "Customer profile" : isAdmin ? "Operations overview" : "Staff workspace";
  const heroTitle = isCustomer
    ? `${user?.fullName}, here is your profile snapshot.`
    : `${user?.fullName}, here is today’s operational picture.`;
  const scopeLabel = isCustomer
    ? "Profile and vehicle access"
    : isAdmin
      ? "Inventory, staffing, and customer lookup"
      : "Inventory and customer lookup";

  const handleCustomerSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      return;
    }

    const { payload, error } = buildCustomerSearchPayload(searchValues);

    if (!payload) {
      setSearchError(error);
      setCustomerResults([]);
      setHasSearchRun(false);
      return;
    }

    try {
      setIsSearchingCustomers(true);
      setSearchError(null);
      const results = await api.searchCustomers(token, payload);
      setCustomerResults(results);
      setHasSearchRun(true);
    } catch (requestError) {
      setSearchError(extractErrorMessage(requestError, "Could not search customers right now."));
      setCustomerResults([]);
      setHasSearchRun(true);
    } finally {
      setIsSearchingCustomers(false);
    }
  };

  const resetSearch = () => {
    setSearchValues({
      customerId: "",
      phoneNumber: "",
      vehicleNumber: "",
      name: "",
    });
    setCustomerResults([]);
    setSearchError(null);
    setHasSearchRun(false);
  };

  return (
    <section className="page-stack">
      {partsErrorMessage ? <AlertBox tone="error" message={partsErrorMessage} /> : null}
      {staffError ? <AlertBox tone="error" message={staffError} /> : null}

      <header className="card dashboard-hero">
        <div className="dashboard-hero__copy">
          <p className="eyebrow">{heroEyebrow}</p>
          <h2>{heroTitle}</h2>
          <p className="card__copy">{dashboardSummaryCopy}</p>
          <div className="dashboard-hero__actions">
            {isAdmin ? (
              <>
                <Link className="button" to="/app/staff">
                  Manage staff
                </Link>
                <Link className="button button--secondary" to="/app/parts">
                  Open parts workspace
                </Link>
              </>
            ) : null}
            {canSearchCustomers ? (
              <a className="button button--secondary" href="#dashboard-customer-lookup">
                Jump to customer lookup
              </a>
            ) : null}
          </div>
        </div>

        <dl className="dashboard-stats">
          {heroStats.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <section className={`dashboard-kpi-grid dashboard-kpi-grid--${isCustomer ? "customer" : "ops"}`}>
        {metricCards.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </section>

      {isCustomer ? (
        <div className="dashboard-board">
          <article className="card dashboard-panel dashboard-panel--wide">
            <div className="card__header">
              <h3>Account details</h3>
              <p className="card__copy">The customer profile and linked vehicles available from the current backend.</p>
            </div>

            {customerProfileError ? <AlertBox tone="error" message={customerProfileError} /> : null}

            {isCustomerProfileLoading ? (
              <p className="dashboard-card-placeholder">Loading your profile snapshot...</p>
            ) : customerProfile ? (
              <dl className="detail-list">
                <div>
                  <dt>Email</dt>
                  <dd>{customerProfile.email ?? user?.email ?? "Not provided"}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{customerProfile.phoneNumber}</dd>
                </div>
                <div>
                  <dt>Address</dt>
                  <dd>{customerProfile.address ?? "No address saved yet"}</dd>
                </div>
                <div>
                  <dt>Registered</dt>
                  <dd>{formatDate(customerProfile.registeredAt)}</dd>
                </div>
              </dl>
            ) : (
              <p className="dashboard-card-placeholder">Your customer profile has not been loaded yet.</p>
            )}
          </article>

          <article className="card dashboard-panel">
            <div className="card__header">
              <h3>Vehicles</h3>
              <p className="card__copy">Vehicles currently attached to your account.</p>
            </div>

            {isCustomerProfileLoading ? (
              <p className="dashboard-card-placeholder">Loading vehicle records...</p>
            ) : customerProfile?.vehicles.length ? (
              <div className="dashboard-vehicle-list">
                {customerProfile.vehicles.map((vehicle) => (
                  <article key={vehicle.vehicleId} className="dashboard-vehicle-card">
                    <div className="dashboard-vehicle-card__top">
                      <strong>{vehicle.vehicleNumber}</strong>
                      <span className="status-pill">Vehicle #{vehicle.vehicleId}</span>
                    </div>
                    <p>{vehicle.model ?? "Model not recorded yet"}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-state">No vehicles are linked to this account yet.</p>
            )}
          </article>

          <article className="card dashboard-panel">
            <div className="card__header">
              <h3>Session overview</h3>
              <p className="card__copy">What the current customer-facing application can surface today.</p>
            </div>

            <dl className="detail-list">
              <div>
                <dt>Role</dt>
                <dd>{user?.role}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{user?.isActive ? "Active" : "Inactive"}</dd>
              </div>
              <div>
                <dt>Scope</dt>
                <dd>{scopeLabel}</dd>
              </div>
            </dl>
          </article>
        </div>
      ) : (
        <div className="dashboard-board">
          <article className="card dashboard-panel dashboard-panel--wide">
            <div className="card__header">
              <h3>Inventory health</h3>
              <p className="card__copy">A single view of stock pressure, reorder exposure, and the busiest categories.</p>
            </div>

            {isPartsLoading ? (
              <p className="dashboard-card-placeholder">Loading inventory health...</p>
            ) : parts.length === 0 ? (
              <p className="empty-state">No parts are tracked yet. Create a part entry to unlock the inventory view.</p>
            ) : (
              <div className="dashboard-health-layout">
                <div className="dashboard-donut-block">
                  <div className="dashboard-donut" style={inventoryDonutStyle} aria-hidden="true">
                    <div className="dashboard-donut__center">
                      <strong>{formatNumber(parts.length)}</strong>
                      <span>tracked parts</span>
                    </div>
                  </div>

                  <div className="dashboard-legend">
                    {inventorySegments.map((segment) => (
                      <div key={segment.label} className="dashboard-legend__item">
                        <span
                          className="dashboard-legend__swatch"
                          style={{ backgroundColor: segment.color }}
                          aria-hidden="true"
                        />
                        <div>
                          <strong>{segment.label}</strong>
                          <p>{segment.description}</p>
                        </div>
                        <span>{formatNumber(segment.count)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="dashboard-health-breakdown">
                  <div>
                    <p className="eyebrow">By category</p>
                    {categoryBreakdown.length > 0 ? (
                      <BreakdownList items={categoryBreakdown} accentClass="dashboard-bar-fill--teal" />
                    ) : (
                      <p className="dashboard-card-placeholder">No categories are available yet.</p>
                    )}
                  </div>

                  <div className="dashboard-meta-grid">
                    <div>
                      <span>Total units on hand</span>
                      <strong>{formatNumber(totalUnitsOnHand)}</strong>
                    </div>
                    <div>
                      <span>Inventory cost basis</span>
                      <strong>{formatCurrency(inventoryCost)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </article>

          {isAdmin ? (
            <article className="card dashboard-panel">
              <div className="card__header">
                <h3>Team mix</h3>
                <p className="card__copy">Role coverage and the latest staff onboarding activity.</p>
              </div>

              {isStaffLoading ? (
                <p className="dashboard-card-placeholder">Loading staff mix...</p>
              ) : staffUsers.length === 0 ? (
                <p className="empty-state">No staff accounts are available yet.</p>
              ) : (
                <>
                  <BreakdownList items={staffRoleBreakdown} accentClass="dashboard-bar-fill--slate" />

                  <div className="dashboard-list">
                    {recentStaff.map((staffUser) => (
                      <article key={staffUser.userId} className="dashboard-list__item">
                        <div className="dashboard-list__row">
                          <strong>{staffUser.fullName}</strong>
                          <span className={staffUser.isActive ? "status-pill status-pill--success" : "status-pill status-pill--muted"}>
                            {staffUser.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p>{staffUser.role}</p>
                        <small>Created {formatDate(staffUser.createdAt)}</small>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </article>
          ) : (
            <article className="card dashboard-panel">
              <div className="card__header">
                <h3>Account details</h3>
                <p className="card__copy">Your current session and access footprint.</p>
              </div>

              <dl className="detail-list">
                <div>
                  <dt>Email</dt>
                  <dd>{user?.email}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{user?.phoneNumber}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{user?.isActive ? "Active" : "Inactive"}</dd>
                </div>
                <div>
                  <dt>Scope</dt>
                  <dd>{scopeLabel}</dd>
                </div>
              </dl>
            </article>
          )}

          <article className="card dashboard-panel" id="dashboard-low-stock">
            <div className="card__header">
              <h3>Low-stock watchlist</h3>
              <p className="card__copy">The parts that need attention first, ranked by reorder gap.</p>
            </div>

            {isPartsLoading ? (
              <p className="dashboard-card-placeholder">Loading watchlist...</p>
            ) : lowStockWatchlist.length === 0 ? (
              <p className="empty-state">Everything currently sits above its reorder threshold.</p>
            ) : (
              <div className="dashboard-watchlist">
                {lowStockWatchlist.map((part) => {
                  const shortage = Math.max(part.reorderLevel - part.stockQuantity, 0);

                  return (
                    <article key={part.partId} className="dashboard-watchlist__item">
                      <div className="dashboard-watchlist__top">
                        <div className="dashboard-watchlist__title">
                          <h4>{part.partName}</h4>
                          <p>{part.partNumber}</p>
                        </div>

                        <span
                          className={
                            part.stockQuantity === 0
                              ? "status-pill status-pill--danger"
                              : "status-pill"
                          }
                        >
                          {part.stockQuantity === 0 ? "Out of stock" : "Reorder soon"}
                        </span>
                      </div>

                      <div className="dashboard-watchlist__meta">
                        <span>On hand: {formatNumber(part.stockQuantity)}</span>
                        <span>Reorder: {formatNumber(part.reorderLevel)}</span>
                        <span>Gap: {formatNumber(shortage)}</span>
                        <span>{part.categoryName ?? "Uncategorized"}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </article>

          <article className="card dashboard-panel">
            <div className="card__header">
              <h3>Latest catalogue updates</h3>
              <p className="card__copy">Recently added parts, useful when stock is still being built out.</p>
            </div>

            {isPartsLoading ? (
              <p className="dashboard-card-placeholder">Loading recent parts...</p>
            ) : latestParts.length === 0 ? (
              <p className="empty-state">No parts have been created yet.</p>
            ) : (
              <div className="dashboard-list">
                {latestParts.map((part) => (
                  <article key={part.partId} className="dashboard-list__item">
                    <div className="dashboard-list__row">
                      <strong>{part.partName}</strong>
                      <span className="status-pill">{part.categoryName ?? "Uncategorized"}</span>
                    </div>
                    <p>{part.partNumber}</p>
                    <small>Added {formatDate(part.createdAt)}</small>
                  </article>
                ))}
              </div>
            )}
          </article>

          <article className="card dashboard-panel">
            <div className="card__header">
              <h3>Quick actions</h3>
              <p className="card__copy">Shortcuts to the screens that are already active in the current app.</p>
            </div>

            <div className="dashboard-quick-actions">
              {isAdmin ? (
                <>
                  <Link className="button" to="/app/staff">
                    Open staff management
                  </Link>
                  {canManagePartsPage ? (
                    <Link className="button button--secondary" to="/app/parts">
                      Open parts management
                    </Link>
                  ) : null}
                </>
              ) : null}
              <a className="button button--secondary" href="#dashboard-customer-lookup">
                Use customer lookup
              </a>
              {!isAdmin ? (
                <p className="dashboard-quick-note">Inventory visibility is live here even though the dedicated parts workspace is still admin-only in the current router.</p>
              ) : null}
            </div>
          </article>

          {canSearchCustomers ? (
            <article className="card dashboard-panel dashboard-panel--wide" id="dashboard-customer-lookup">
              <div className="card__header">
                <h3>Customer quick find</h3>
                <p className="card__copy">Search the backend-ready customer index by name, phone, vehicle number, or customer ID.</p>
              </div>

              <form className="dashboard-search-form" onSubmit={handleCustomerSearch}>
                <div className="dashboard-search-grid">
                  <label>
                    <span className="field__label">Customer ID</span>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      value={searchValues.customerId}
                      onChange={(event) =>
                        setSearchValues((current) => ({
                          ...current,
                          customerId: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label>
                    <span className="field__label">Phone number</span>
                    <input
                      className="input"
                      type="text"
                      value={searchValues.phoneNumber}
                      onChange={(event) =>
                        setSearchValues((current) => ({
                          ...current,
                          phoneNumber: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label>
                    <span className="field__label">Vehicle number</span>
                    <input
                      className="input"
                      type="text"
                      value={searchValues.vehicleNumber}
                      onChange={(event) =>
                        setSearchValues((current) => ({
                          ...current,
                          vehicleNumber: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label>
                    <span className="field__label">Customer name</span>
                    <input
                      className="input"
                      type="text"
                      value={searchValues.name}
                      onChange={(event) =>
                        setSearchValues((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>

                <div className="dashboard-search-actions">
                  <button className="button" type="submit" disabled={isSearchingCustomers}>
                    {isSearchingCustomers ? "Searching..." : "Search customers"}
                  </button>
                  <button className="button button--secondary" type="button" onClick={resetSearch}>
                    Clear search
                  </button>
                </div>
              </form>

              {searchError ? <AlertBox tone="error" message={searchError} /> : null}

              {hasSearchRun && !searchError && customerResults.length === 0 ? (
                <p className="empty-state">No matching customers were found for the current search.</p>
              ) : null}

              {customerResults.length > 0 ? (
                <div className="dashboard-results">
                  {customerResults.map((customer) => (
                    <article key={customer.customerId} className="dashboard-result-card">
                      <div className="dashboard-result-card__top">
                        <div>
                          <h4>{customer.fullName}</h4>
                          <p>
                            #{customer.customerId} · {customer.phoneNumber}
                            {customer.email ? ` · ${customer.email}` : ""}
                          </p>
                        </div>

                        <span className="status-pill">{pluralize("vehicle", customer.vehicleCount)}</span>
                      </div>

                      {customer.vehicles.length > 0 ? (
                        <ul className="dashboard-chip-list">
                          {customer.vehicles.map((vehicle) => (
                            <li key={vehicle.vehicleId} className="dashboard-chip">
                              {vehicle.vehicleNumber}
                              {vehicle.model ? ` · ${vehicle.model}` : ""}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="dashboard-card-placeholder">No vehicles are attached to this customer yet.</p>
                      )}
                    </article>
                  ))}
                </div>
              ) : null}
            </article>
          ) : null}
        </div>
      )}
    </section>
  );
}