import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Search, X, UserPlus, ArrowRight } from "lucide-react";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import type {
  CustomerSearchInput,
  CustomerSearchResult,
} from "../../app/types";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Badge } from "../../shared/components/Badge";
import { Card } from "../../shared/components/Card";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import { EmptyState } from "../../shared/components/EmptyState";
import { Field } from "../../shared/components/Field";
import { Toolbar } from "../../shared/components/Toolbar";
import { StatCard } from "../../shared/components/StatCard";

type AccountFilter = "all" | "registered" | "staff-created";

type SearchFormState = {
  customerId: string;
  phoneNumber: string;
  vehicleNumber: string;
  name: string;
};

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
    const parsed = Number(customerIdValue);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return {
        payload: null,
        error: "Customer ID must be a positive whole number.",
      };
    }
    payload.customerId = parsed;
  }
  if (phoneNumber) payload.phoneNumber = phoneNumber;
  if (vehicleNumber) payload.vehicleNumber = vehicleNumber;
  if (name) payload.name = name;
  return { payload, error: null };
}

export function CustomerSearchPage() {
  const { token } = useAuth();
  const [searchValues, setSearchValues] = useState<SearchFormState>({
    customerId: "",
    phoneNumber: "",
    vehicleNumber: "",
    name: "",
  });
  const [customerResults, setCustomerResults] = useState<CustomerSearchResult[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);
  const [hasSearchRun, setHasSearchRun] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDirectory, setIsLoadingDirectory] = useState(true);
  const [accountFilter, setAccountFilter] = useState<AccountFilter>("all");

  const registeredCount = customerResults.filter((c) => Boolean(c.userId)).length;
  const staffCreatedCount = customerResults.length - registeredCount;

  const visibleCustomerResults = useMemo(() => {
    if (accountFilter === "registered") {
      return customerResults.filter((c) => Boolean(c.userId));
    }
    if (accountFilter === "staff-created") {
      return customerResults.filter((c) => !c.userId);
    }
    return customerResults;
  }, [accountFilter, customerResults]);

  useEffect(() => {
    let isActive = true;
    if (!token) {
      setIsLoadingDirectory(false);
      return () => {
        isActive = false;
      };
    }

    void api
      .getCustomers(token)
      .then((results) => {
        if (!isActive) return;
        setCustomerResults(results);
        setPageError(null);
        setHasSearchRun(false);
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        setPageError(
          error instanceof ApiError
            ? error.message
            : "Could not load the customer directory.",
        );
        setCustomerResults([]);
      })
      .finally(() => {
        if (isActive) setIsLoadingDirectory(false);
      });

    return () => {
      isActive = false;
    };
  }, [token]);

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    const { payload, error } = buildCustomerSearchPayload(searchValues);
    if (!payload) {
      setPageError(error);
      setCustomerResults([]);
      setHasSearchRun(false);
      return;
    }
    try {
      setIsSearching(true);
      setPageError(null);
      const results = await api.searchCustomers(token, payload);
      setCustomerResults(results);
      setHasSearchRun(true);
    } catch (error) {
      setPageError(
        error instanceof ApiError
          ? error.message
          : "Could not search customers right now.",
      );
      setCustomerResults([]);
      setHasSearchRun(true);
    } finally {
      setIsSearching(false);
    }
  };

  const resetSearch = () => {
    setSearchValues({ customerId: "", phoneNumber: "", vehicleNumber: "", name: "" });
    setPageError(null);
    setHasSearchRun(false);
    setAccountFilter("all");
    if (!token) {
      setCustomerResults([]);
      return;
    }
    void api
      .getCustomers(token)
      .then((results) => setCustomerResults(results))
      .catch((error: unknown) => {
        setPageError(
          error instanceof ApiError
            ? error.message
            : "Could not load the customer directory.",
        );
        setCustomerResults([]);
      });
  };

  return (
    <PageShell>
      <PageHeader
        title="Browse Customers"
        description="Search by ID, phone, vehicle, or name."
        actions={
          <Link to="/app/customers/register">
            <ActionButton icon={UserPlus}>Register customer</ActionButton>
          </Link>
        }
      />

      {pageError ? <AlertBox tone="error" message={pageError} dismissible /> : null}

      {/* Filters */}
      <Card
        header={
          <div>
            <h3 className="text-[15px] font-semibold text-[var(--md-sys-color-on-surface)]">
              Lookup
            </h3>
            <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">
              Combine fields to narrow the directory.
            </p>
          </div>
        }
      >
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Field label="Customer ID" htmlFor="search-id">
              <input
                id="search-id"
                type="text"
                inputMode="numeric"
                placeholder="123"
                value={searchValues.customerId}
                onChange={(e) =>
                  setSearchValues((prev) => ({ ...prev, customerId: e.target.value }))
                }
              />
            </Field>
            <Field label="Phone" htmlFor="search-phone">
              <input
                id="search-phone"
                type="text"
                placeholder="+1 555 123 4567"
                value={searchValues.phoneNumber}
                onChange={(e) =>
                  setSearchValues((prev) => ({ ...prev, phoneNumber: e.target.value }))
                }
              />
            </Field>
            <Field label="Vehicle" htmlFor="search-vehicle">
              <input
                id="search-vehicle"
                type="text"
                placeholder="ABC 123"
                value={searchValues.vehicleNumber}
                onChange={(e) =>
                  setSearchValues((prev) => ({ ...prev, vehicleNumber: e.target.value }))
                }
              />
            </Field>
            <Field label="Name" htmlFor="search-name">
              <input
                id="search-name"
                type="text"
                placeholder="Aarav Shrestha"
                value={searchValues.name}
                onChange={(e) =>
                  setSearchValues((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </Field>
          </div>
          <Toolbar
            leading={
              <>
                <ActionButton type="submit" icon={Search} disabled={isSearching}>
                  {isSearching ? "Searching" : "Search"}
                </ActionButton>
                <ActionButton type="button" tone="secondary" icon={X} onClick={resetSearch}>
                  Reset
                </ActionButton>
              </>
            }
          />
        </form>
      </Card>

      {/* Results */}
      {!isLoadingDirectory && customerResults.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard label="Shown" value={String(visibleCustomerResults.length)} note="After current filter" accent />
          <StatCard label="Portal accounts" value={String(registeredCount)} note="Self-registered" />
          <StatCard label="Staff-created" value={String(staffCreatedCount)} note="Created by staff" />
        </div>
      ) : null}

      <Card bodyless>
        <div className="px-5 py-3 border-b border-[var(--md-sys-color-outline-variant)]">
          <Toolbar
            caption={
              isLoadingDirectory
                ? "Loading directory…"
                : hasSearchRun
                  ? `${visibleCustomerResults.length} result${visibleCustomerResults.length === 1 ? "" : "s"}`
                  : `${visibleCustomerResults.length} customer${visibleCustomerResults.length === 1 ? "" : "s"}`
            }
            leading={
              <div className="flex flex-wrap gap-2">
                <ActionButton
                  size="sm"
                  tone={accountFilter === "all" ? "primary" : "secondary"}
                  onClick={() => setAccountFilter("all")}
                >
                  All accounts
                </ActionButton>
                <ActionButton
                  size="sm"
                  tone={accountFilter === "registered" ? "primary" : "secondary"}
                  onClick={() => setAccountFilter("registered")}
                >
                  Registered accounts
                </ActionButton>
                <ActionButton
                  size="sm"
                  tone={accountFilter === "staff-created" ? "primary" : "secondary"}
                  onClick={() => setAccountFilter("staff-created")}
                >
                  Staff-created profiles
                </ActionButton>
              </div>
            }
          />
        </div>

        {isLoadingDirectory ? (
          <p className="p-5 text-sm text-[var(--md-sys-color-on-surface-variant)]">
            Loading directory…
          </p>
        ) : hasSearchRun && customerResults.length === 0 ? (
          <div className="p-5">
            <EmptyState
              embedded
              icon={Search}
              title="No matches"
              description="Try a different ID, phone, vehicle, or name."
            />
          </div>
        ) : visibleCustomerResults.length > 0 ? (
          <ul className="divide-y divide-[var(--md-sys-color-outline-variant)]">
            {visibleCustomerResults.map((customer) => (
              <li key={customer.customerId}>
                <Link
                  to={`/app/customers/${customer.customerId}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-[var(--md-sys-color-surface-container-low)] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">
                        {customer.fullName}
                      </p>
                      <Badge variant={customer.userId ? "success" : "neutral"} dot>
                        {customer.userId ? "Portal account" : "Staff-created profile"}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-[12px] text-[var(--md-sys-color-on-surface-variant)] truncate">
                      {customer.phoneNumber}
                      {customer.email ? ` · ${customer.email}` : ""}
                      {" · "}
                      {customer.vehicleCount} vehicle{customer.vehicleCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <ArrowRight
                    className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)] shrink-0"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        ) : customerResults.length === 0 ? (
          <div className="p-5">
            <EmptyState
              embedded
              icon={Search}
              title="No customers yet"
              description="Customer records will appear here once they are registered."
            />
          </div>
        ) : (
          <div className="p-5">
            <EmptyState
              embedded
              icon={Search}
              title="No matches for this filter"
              description="Try a different account type."
            />
          </div>
        )}
      </Card>
    </PageShell>
  );
}
