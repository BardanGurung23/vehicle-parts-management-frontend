import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Search, X, ArrowRight } from "lucide-react";
import { api, ApiError } from "../../../app/api";
import { AlertBox } from "../../../shared/components/AlertBox";
import { EmptyState } from "../../../shared/components/EmptyState";
import { ActionButton } from "../../../shared/components/ActionButton";
import { Card } from "../../../shared/components/Card";
import { Badge } from "../../../shared/components/Badge";
import { Field } from "../../../shared/components/Field";
import type {
  CustomerSearchInput,
  CustomerSearchResult,
} from "../../../app/types";

/* ----------------------------------------------------------------------------
 * Customer quick-find panel for the admin dashboard. Filters by ID, phone,
 * vehicle number, or name. Results link directly to customer detail.
 * ------------------------------------------------------------------------- */

type SearchFormState = {
  customerId: string;
  phoneNumber: string;
  vehicleNumber: string;
  name: string;
};

type RtqErrorShape = { data?: unknown; error?: unknown };

function asMessage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  if (!error || typeof error !== "object") return fallback;
  const payload = error as RtqErrorShape;
  const body = payload.data;
  if (body && typeof body === "object") {
    const details = body as { detail?: unknown; message?: unknown; title?: unknown };
    return (
      asMessage(details.detail) ??
      asMessage(details.message) ??
      asMessage(details.title) ??
      fallback
    );
  }
  return asMessage(payload.error) ?? fallback;
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
    return { payload: null, error: "Provide at least one search field." };
  }

  const payload: CustomerSearchInput = {};
  if (customerIdValue) {
    const parsedCustomerId = Number(customerIdValue);
    if (!Number.isInteger(parsedCustomerId) || parsedCustomerId <= 0) {
      return { payload: null, error: "Customer ID must be a positive whole number." };
    }
    payload.customerId = parsedCustomerId;
  }
  if (phoneNumber) payload.phoneNumber = phoneNumber;
  if (vehicleNumber) payload.vehicleNumber = vehicleNumber;
  if (name) payload.name = name;
  return { payload, error: null };
}

const pluralize = (label: string, count: number) =>
  `${new Intl.NumberFormat("en-US").format(count)} ${label}${count === 1 ? "" : "s"}`;

type CustomerLookupPanelProps = { token: string | null };

export function CustomerLookupPanel({ token }: CustomerLookupPanelProps) {
  const [searchValues, setSearchValues] = useState<SearchFormState>({
    customerId: "",
    phoneNumber: "",
    vehicleNumber: "",
    name: "",
  });
  const [customerResults, setCustomerResults] = useState<CustomerSearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearchRun, setHasSearchRun] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    const { payload, error } = buildCustomerSearchPayload(searchValues);
    if (!payload) {
      setSearchError(error);
      setCustomerResults([]);
      setHasSearchRun(false);
      return;
    }
    try {
      setIsSearching(true);
      setSearchError(null);
      const results = await api.searchCustomers(token, payload);
      setCustomerResults(results);
      setHasSearchRun(true);
    } catch (requestError) {
      setSearchError(extractErrorMessage(requestError, "Could not search customers."));
      setCustomerResults([]);
      setHasSearchRun(true);
    } finally {
      setIsSearching(false);
    }
  };

  const resetSearch = () => {
    setSearchValues({ customerId: "", phoneNumber: "", vehicleNumber: "", name: "" });
    setCustomerResults([]);
    setSearchError(null);
    setHasSearchRun(false);
  };

  return (
    <Card
      id="dashboard-customer-lookup"
      header={
        <div>
          <h3 className="text-[15px] font-semibold text-[var(--md-sys-color-on-surface)]">
            Quick find
          </h3>
          <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">
            Look up a customer by ID, phone, vehicle, or name.
          </p>
        </div>
      }
    >
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label="Customer ID" htmlFor="search-id">
            <input
              id="search-id"
              type="number"
              min="1"
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
              placeholder="+1 555…"
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
              placeholder="John Doe"
              value={searchValues.name}
              onChange={(e) =>
                setSearchValues((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </Field>
        </div>

        <div className="flex items-center gap-2">
          <ActionButton
            type="submit"
            icon={Search}
            isLoading={isSearching}
            disabled={isSearching}
          >
            {isSearching ? "Searching" : "Search"}
          </ActionButton>
          <ActionButton type="button" tone="secondary" icon={X} onClick={resetSearch}>
            Clear
          </ActionButton>
        </div>
      </form>

      {searchError ? (
        <div className="mt-4">
          <AlertBox tone="error" message={searchError} dismissible />
        </div>
      ) : null}

      {hasSearchRun && !searchError && customerResults.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            embedded
            icon={Search}
            title="No matches"
            description="Try a different ID, phone, vehicle, or name."
          />
        </div>
      ) : null}

      {customerResults.length > 0 ? (
        <ul className="mt-4 -mx-1 divide-y divide-[var(--md-sys-color-outline-variant)] border-t border-[var(--md-sys-color-outline-variant)]">
          {customerResults.map((customer) => (
            <li key={customer.customerId}>
              <Link
                to={`/app/customers/${customer.customerId}`}
                className="flex items-center justify-between gap-3 py-3 px-1 rounded-md hover:bg-[var(--md-sys-color-surface-container-low)] transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">
                      {customer.fullName}
                    </p>
                    <Badge variant={customer.userId ? "success" : "neutral"} dot>
                      {customer.userId ? "Portal" : "Profile"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-[12px] text-[var(--md-sys-color-on-surface-variant)] truncate">
                    #{customer.customerId} · {customer.phoneNumber}
                    {customer.email ? ` · ${customer.email}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-[12px] text-[var(--md-sys-color-on-surface-variant)]">
                  <span className="tabular">{pluralize("vehicle", customer.vehicleCount)}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
