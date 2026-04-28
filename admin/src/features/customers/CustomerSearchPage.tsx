import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import type { CustomerSearchInput, CustomerSearchResult } from "../../app/types";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import { Field } from "../../shared/components/Field";

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

    if (!token) {
      return;
    }

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
    setSearchValues({
      customerId: "",
      phoneNumber: "",
      vehicleNumber: "",
      name: "",
    });
    setCustomerResults([]);
    setPageError(null);
    setHasSearchRun(false);
  };

  return (
    <section className="page-stack">
      {pageError ? <AlertBox tone="error" message={pageError} /> : null}

      <header className="card dashboard-hero">
        <div className="dashboard-hero__copy">
          <p className="eyebrow">Feature 10</p>
          <h2>Search customers</h2>
          <p className="card__copy">
            Search by customer ID, phone number, vehicle number, or full name and jump straight into the active detail view.
          </p>
        </div>

        <div className="dashboard-hero__actions">
          <Link className="button" to="/app/customers/register">
            Register customer
          </Link>
        </div>
      </header>

      <article className="card dashboard-panel dashboard-panel--wide">
        <div className="card__header">
          <h3>Lookup filters</h3>
          <p className="card__copy">Provide any combination of fields. One matching field is enough to run a search.</p>
        </div>

        <form className="dashboard-search-form form-grid--two-columns" onSubmit={handleSearch}>
          <Field label="Customer ID">
            <input
              className="input"
              type="text"
              inputMode="numeric"
              placeholder="1"
              value={searchValues.customerId}
              onChange={(event) => setSearchValues((current) => ({ ...current, customerId: event.target.value }))}
            />
          </Field>

          <Field label="Phone number">
            <input
              className="input"
              type="text"
              placeholder="+9779800000000"
              value={searchValues.phoneNumber}
              onChange={(event) => setSearchValues((current) => ({ ...current, phoneNumber: event.target.value }))}
            />
          </Field>

          <Field label="Vehicle number">
            <input
              className="input"
              type="text"
              placeholder="BA 1 PA 1234"
              value={searchValues.vehicleNumber}
              onChange={(event) => setSearchValues((current) => ({ ...current, vehicleNumber: event.target.value }))}
            />
          </Field>

          <Field label="Customer name">
            <input
              className="input"
              type="text"
              placeholder="Aarav Shrestha"
              value={searchValues.name}
              onChange={(event) => setSearchValues((current) => ({ ...current, name: event.target.value }))}
            />
          </Field>

          <div className="dashboard-search-actions form-grid__full-width">
            <ActionButton type="submit" disabled={isSearching}>
              {isSearching ? "Searching..." : "Search customers"}
            </ActionButton>

            <ActionButton type="button" tone="secondary" onClick={resetSearch}>
              Reset
            </ActionButton>
          </div>
        </form>
      </article>

      <article className="card dashboard-panel dashboard-panel--wide">
        <div className="card__header">
          <h3>Results</h3>
          <p className="card__copy">
            {hasSearchRun
              ? `${customerResults.length} customer result${customerResults.length === 1 ? "" : "s"} returned.`
              : "Run a search to review matching customer records."}
          </p>
        </div>

        {hasSearchRun && customerResults.length === 0 ? (
          <p className="empty-state">No customer matched the filters you entered.</p>
        ) : customerResults.length > 0 ? (
          <div className="dashboard-results">
            {customerResults.map((customer) => (
              <article key={customer.customerId} className="dashboard-result-card">
                <div className="dashboard-result-card__top">
                  <div>
                    <h4>{customer.fullName}</h4>
                    <p>{customer.email ?? "No email recorded"}</p>
                  </div>

                  <span className="status-pill">Customer #{customer.customerId}</span>
                </div>

                <dl className="detail-list">
                  <div>
                    <dt>Phone</dt>
                    <dd>{customer.phoneNumber}</dd>
                  </div>
                  <div>
                    <dt>Vehicles</dt>
                    <dd>{customer.vehicleCount}</dd>
                  </div>
                </dl>

                <div className="dashboard-hero__actions">
                  <Link className="button" to={`/app/customers/${customer.customerId}`}>
                    View details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </article>
    </section>
  );
}