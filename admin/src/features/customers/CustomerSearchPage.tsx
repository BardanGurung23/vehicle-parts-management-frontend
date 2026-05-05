import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Search, X, UserPlus, ArrowRight } from "lucide-react";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import type { CustomerSearchInput, CustomerSearchResult } from "../../app/types";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import { EmptyState } from "../../shared/components/EmptyState";

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
    return { payload: null, error: "Provide at least one search field to look up a customer." };
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
      setPageError(error instanceof ApiError ? error.message : "Could not search customers right now.");
      setCustomerResults([]);
      setHasSearchRun(true);
    } finally {
      setIsSearching(false);
    }
  };

  const resetSearch = () => {
    setSearchValues({ customerId: "", phoneNumber: "", vehicleNumber: "", name: "" });
    setCustomerResults([]);
    setPageError(null);
    setHasSearchRun(false);
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Feature 10"
        title="Search Customers"
        description="Search by customer ID, phone number, vehicle number, or full name."
        actions={
          <Link to="/app/customers/register">
            <ActionButton icon={UserPlus}>Register customer</ActionButton>
          </Link>
        }
      />

      {pageError ? <AlertBox tone="error" message={pageError} dismissible /> : null}

      <Card
        header={
          <div>
            <h3 className="text-base font-semibold text-on-surface">Lookup filters</h3>
            <p className="text-sm text-on-surface-variant">Provide any combination of fields.</p>
          </div>
        }
      >
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="search-id" className="block text-xs font-medium text-on-surface-variant mb-1">Customer ID</label>
              <input id="search-id" className="input" type="text" inputMode="numeric" placeholder="1"
                value={searchValues.customerId}
                onChange={(e) => setSearchValues((prev) => ({ ...prev, customerId: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="search-phone" className="block text-xs font-medium text-on-surface-variant mb-1">Phone number</label>
              <input id="search-phone" className="input" type="text" placeholder="+9779800000000"
                value={searchValues.phoneNumber}
                onChange={(e) => setSearchValues((prev) => ({ ...prev, phoneNumber: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="search-vehicle" className="block text-xs font-medium text-on-surface-variant mb-1">Vehicle number</label>
              <input id="search-vehicle" className="input" type="text" placeholder="BA 1 PA 1234"
                value={searchValues.vehicleNumber}
                onChange={(e) => setSearchValues((prev) => ({ ...prev, vehicleNumber: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="search-name" className="block text-xs font-medium text-on-surface-variant mb-1">Customer name</label>
              <input id="search-name" className="input" type="text" placeholder="Aarav Shrestha"
                value={searchValues.name}
                onChange={(e) => setSearchValues((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ActionButton type="submit" icon={Search} disabled={isSearching}>
              {isSearching ? "Searching..." : "Search customers"}
            </ActionButton>
            <ActionButton type="button" tone="secondary" icon={X} onClick={resetSearch}>Reset</ActionButton>
          </div>
        </form>
      </Card>

      <Card
        header={
          <div>
            <h3 className="text-base font-semibold text-on-surface">Results</h3>
            <p className="text-sm text-on-surface-variant">
              {hasSearchRun
                ? `${customerResults.length} customer result${customerResults.length === 1 ? "" : "s"} returned.`
                : "Run a search to review matching customer records."}
            </p>
          </div>
        }
      >
        {hasSearchRun && customerResults.length === 0 ? (
          <EmptyState icon={Search} title="No results" description="No customer matched the filters you entered." />
        ) : customerResults.length > 0 ? (
          <div className="space-y-3">
            {customerResults.map((customer) => (
              <div key={customer.customerId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg ring-1 ring-white/[0.06] bg-surface-container-low/50">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-on-surface">{customer.fullName}</p>
                  <p className="text-xs text-on-surface-variant">{customer.email ?? "No email recorded"}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-on-surface-variant">
                    <span>{customer.phoneNumber}</span>
                    <span>{customer.vehicleCount} vehicle{customer.vehicleCount === 1 ? "" : "s"}</span>
                  </div>
                </div>
                <Link to={`/app/customers/${customer.customerId}`} className="shrink-0">
                  <ActionButton size="sm" icon={ArrowRight}>View details</ActionButton>
                </Link>
              </div>
            ))}
          </div>
        ) : null}
      </Card>
    </PageShell>
  );
}
