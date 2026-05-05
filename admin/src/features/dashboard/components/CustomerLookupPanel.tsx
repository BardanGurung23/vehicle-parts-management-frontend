import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Search, X } from "lucide-react";
import { api, ApiError } from "../../../app/api";
import { AlertBox } from "../../../shared/components/AlertBox";
import { EmptyState } from "../../../shared/components/EmptyState";
import type { CustomerSearchInput, CustomerSearchResult } from "../../../app/types";

type SearchFormState = {
  customerId: string;
  phoneNumber: string;
  vehicleNumber: string;
  name: string;
};

type RtqErrorShape = {
  data?: unknown;
  error?: unknown;
};

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
    return asMessage(details.detail) ?? asMessage(details.message) ?? asMessage(details.title) ?? fallback;
  }
  return asMessage(payload.error) ?? fallback;
}

function buildCustomerSearchPayload(values: SearchFormState): { payload: CustomerSearchInput | null; error: string | null } {
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

const pluralize = (label: string, count: number) => `${new Intl.NumberFormat("en-US").format(count)} ${label}${count === 1 ? "" : "s"}`;

type CustomerLookupPanelProps = {
  token: string | null;
};

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
      setSearchError(extractErrorMessage(requestError, "Could not search customers right now."));
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
    <div className="rounded-xl bg-surface-container-lowest shadow-level1 p-5 space-y-4" id="dashboard-customer-lookup">
      <div>
        <h3 className="text-base font-semibold text-on-surface">Customer Quick Find</h3>
        <p className="text-sm text-on-surface-variant">Search by ID, phone, vehicle, or name.</p>
      </div>

      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label htmlFor="search-id" className="block text-xs font-medium text-on-surface-variant mb-1">Customer ID</label>
            <input
              id="search-id"
              type="number"
              min="1"
              value={searchValues.customerId}
              onChange={(e) => setSearchValues((prev) => ({ ...prev, customerId: e.target.value }))}
              placeholder="#123"
            />
          </div>
          <div>
            <label htmlFor="search-phone" className="block text-xs font-medium text-on-surface-variant mb-1">Phone number</label>
            <input
              id="search-phone"
              type="text"
              value={searchValues.phoneNumber}
              onChange={(e) => setSearchValues((prev) => ({ ...prev, phoneNumber: e.target.value }))}
              placeholder="+1 555-..."
            />
          </div>
          <div>
            <label htmlFor="search-vehicle" className="block text-xs font-medium text-on-surface-variant mb-1">Vehicle number</label>
            <input
              id="search-vehicle"
              type="text"
              value={searchValues.vehicleNumber}
              onChange={(e) => setSearchValues((prev) => ({ ...prev, vehicleNumber: e.target.value }))}
              placeholder="ABC 123"
            />
          </div>
          <div>
            <label htmlFor="search-name" className="block text-xs font-medium text-on-surface-variant mb-1">Customer name</label>
            <input
              id="search-name"
              type="text"
              value={searchValues.name}
              onChange={(e) => setSearchValues((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="John Doe"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSearching}
            className="inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-on text-sm font-semibold rounded-lg hover:bg-primary-fixed-dim transition-colors disabled:opacity-50"
          >
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            {isSearching ? "Searching..." : "Search"}
          </button>
          <button
            type="button"
            onClick={resetSearch}
            className="inline-flex items-center gap-2 h-9 px-4 bg-surface-container-low text-on-surface text-sm font-semibold rounded-lg hover:bg-surface-container transition-colors"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        </div>
      </form>

      {searchError ? <AlertBox tone="error" message={searchError} dismissible /> : null}

      {hasSearchRun && !searchError && customerResults.length === 0 && (
        <EmptyState icon={Search} title="No results" description="No matching customers were found." />
      )}

      {customerResults.length > 0 && (
        <div className="space-y-3">
          {customerResults.map((customer) => (
            <div
              key={customer.customerId}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-surface-container-low/70"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-on-surface">{customer.fullName}</p>
                <p className="text-xs text-on-surface-variant">
                  #{customer.customerId} &middot; {customer.phoneNumber}
                  {customer.email ? ` &middot; ${customer.email}` : ""}
                </p>
                {customer.vehicles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {customer.vehicles.map((v) => (
                      <span
                        key={v.vehicleId}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant"
                      >
                        {v.vehicleNumber}{v.model ? ` (${v.model})` : ""}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-on-surface-variant">{pluralize("vehicle", customer.vehicleCount)}</span>
                <Link
                  to={`/app/customers/${customer.customerId}`}
                  className="text-xs font-semibold text-primary hover:text-accent-700"
                >
                  View profile &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
