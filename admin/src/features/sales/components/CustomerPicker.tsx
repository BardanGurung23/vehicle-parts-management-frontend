import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Search, X, ChevronDown, Check, User } from "lucide-react";
import { api, ApiError } from "../../../app/api";
import type {
  CustomerSearchInput,
  CustomerSearchResult,
} from "../../../app/types";
import { ActionButton } from "../../../shared/components/ActionButton";
import { Badge } from "../../../shared/components/Badge";
import { EmptyState } from "../../../shared/components/EmptyState";

/**
 * CustomerPicker — combobox-style dropdown for selecting a customer.
 *
 * Trigger: when no customer is selected, the trigger is a full-width
 * "Select customer" pill. When one is selected, the trigger becomes a
 * compact summary chip with an embedded dropdown chevron and a clear (×)
 * button.
 *
 * Panel: anchored below the trigger, contains a single search input that
 * filters by name, ID, phone, or email. The list is virtualized only via
 * scroll (no external lib) and limited to ~`maxRows` visible rows so the
 * popover stays compact in the cart sidebar.
 *
 * Accessibility:
 *   - Trigger has `aria-haspopup="listbox"` and `aria-expanded`.
 *   - Panel uses `role="listbox"` with `role="option"` rows.
 *   - Arrow keys move the active option; Enter selects; Escape closes.
 *   - Focus is trapped inside the panel while open and restored on close.
 *
 * Documentation: /doc/admin-design-system.md#customer-picker
 */

type CustomerPickerProps = {
  token: string;
  customers: CustomerSearchResult[];
  isLoading?: boolean;
  selected: CustomerSearchResult | null;
  onChange: (customer: CustomerSearchResult | null) => void;
  /** Optional override for the in-memory list, e.g. once a server search returns. */
  onSearchResults?: (results: CustomerSearchResult[]) => void;
  /** Maximum number of result rows visible at once before scrolling. */
  maxRows?: number;
};

function asMessage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractError(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message;
  if (!error || typeof error !== "object") return fallback;
  const payload = error as { data?: { detail?: unknown; title?: unknown; message?: unknown } };
  const body = payload.data;
  if (body) {
    return (
      asMessage(body.detail) ??
      asMessage(body.message) ??
      asMessage(body.title) ??
      fallback
    );
  }
  return fallback;
}

function buildPayload(query: string): CustomerSearchInput | null {
  const trimmed = query.trim();
  if (!trimmed) return null;
  const payload: CustomerSearchInput = {};
  if (/^\d+$/.test(trimmed)) {
    payload.customerId = Number(trimmed);
    return payload;
  }
  if (/[a-zA-Z]/.test(trimmed)) {
    payload.name = trimmed;
    return payload;
  }
  // assume vehicle / phone-style strings
  if (/[A-Z]/i.test(trimmed) && /\s/.test(trimmed)) {
    payload.vehicleNumber = trimmed;
  } else {
    payload.phoneNumber = trimmed;
  }
  return payload;
}

export function CustomerPicker({
  token,
  customers,
  isLoading,
  selected,
  onChange,
  onSearchResults,
  maxRows = 6,
}: CustomerPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const optionRefs = useRef<Array<HTMLLIElement | null>>([]);

  // Local filter on the directory cache (keeps the panel snappy without
  // a server round-trip).
  const localFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const haystack = [
        c.fullName,
        String(c.customerId),
        c.phoneNumber,
        c.email ?? "",
        ...c.vehicles.map((v) => v.vehicleNumber),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [customers, query]);

  /* -------- open / close handling -------- */
  const close = () => {
    setOpen(false);
    setSearchError(null);
    setActiveIndex(0);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setSearchError(null);
        setActiveIndex(0);
      }
    };
    const onKey = (event: KeyboardEvent | globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey as EventListener);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Focus the search input when opening the panel.
  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  // Keep the active option clamped within the visible list.
  useEffect(() => {
    setActiveIndex((idx) => {
      if (localFiltered.length === 0) return 0;
      if (idx >= localFiltered.length) return localFiltered.length - 1;
      return idx;
    });
  }, [localFiltered]);

  // Scroll the highlighted option into view.
  useEffect(() => {
    if (!open) return;
    const node = optionRefs.current[activeIndex];
    if (node && typeof node.scrollIntoView === "function") {
      node.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, open]);

  /* -------- server search (only on Enter when no local match) -------- */
  const performServerSearch = async (raw: string) => {
    const payload = buildPayload(raw);
    if (!payload) return;
    try {
      setIsSearching(true);
      setSearchError(null);
      const results = await api.searchCustomers(token, payload);
      if (results.length > 0) {
        onSearchResults?.(results);
      } else {
        setSearchError("No customers matched this query.");
      }
    } catch (err) {
      setSearchError(extractError(err, "Could not search customers."));
    } finally {
      setIsSearching(false);
    }
  };

  const onFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (localFiltered.length > 0) {
      const customer = localFiltered[activeIndex] ?? localFiltered[0];
      if (customer) {
        onChange(customer);
        close();
      }
      return;
    }
    void performServerSearch(query);
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (localFiltered.length === 0) return;
      setActiveIndex((idx) => Math.min(idx + 1, localFiltered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (localFiltered.length === 0) return;
      setActiveIndex((idx) => Math.max(idx - 1, 0));
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(Math.max(localFiltered.length - 1, 0));
    }
  };

  /* -------- render -------- */
  return (
    <div ref={wrapperRef} className="relative">
      {selected ? (
        <div className="rounded-md border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={open}
                className="w-full text-left flex items-center gap-2 group"
              >
                <span className="grid place-items-center w-7 h-7 rounded-full bg-[var(--brand-50)] text-[var(--brand-700)] border border-[var(--brand-100)] text-[10px] font-semibold tabular shrink-0">
                  {selected.fullName
                    .split(" ")
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join("")
                    .toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-[var(--md-sys-color-on-surface)] truncate">
                      {selected.fullName}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)] transition-transform ${
                        open ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </span>
                  <span className="block text-[11px] text-[var(--md-sys-color-on-surface-variant)] tabular truncate">
                    #{selected.customerId} · {selected.phoneNumber}
                  </span>
                </span>
              </button>
            </div>
            <button
              type="button"
              aria-label="Clear customer"
              onClick={() => onChange(null)}
              className="p-1 -mr-0.5 rounded-md text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="w-full inline-flex items-center justify-between gap-2 h-9 px-3 rounded-md border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-sm text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-low)] hover:border-[var(--md-sys-color-outline)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]"
        >
          <span className="flex items-center gap-2 min-w-0">
            <Search className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" aria-hidden="true" />
            <span className="text-[var(--md-sys-color-on-surface-variant)]">
              Select customer
            </span>
          </span>
          <ChevronDown
            className={`w-4 h-4 text-[var(--md-sys-color-on-surface-variant)] transition-transform ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>
      )}

      {open ? (
        <div
          className="absolute left-0 right-0 z-40 mt-2 rounded-md border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] shadow-level3 origin-top animate-scaleIn overflow-hidden"
        >
          <form
            onSubmit={onFormSubmit}
            className="flex items-center gap-2 px-3 py-2 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]"
          >
            <Search
              className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)] shrink-0"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Search by name, ID, phone, or vehicle"
              className="flex-1 h-7 min-h-0 px-0 border-0 bg-transparent text-sm text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)] focus:ring-0 focus:border-0 focus:outline-none"
              role="combobox"
              aria-controls="customer-picker-listbox"
              aria-autocomplete="list"
              aria-expanded
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="p-1 rounded-md text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </form>

          {searchError ? (
            <div className="px-3 py-2 text-[12px] text-[var(--danger-700)] bg-[var(--danger-50)] border-b border-[var(--danger-100)]">
              {searchError}
            </div>
          ) : null}

          {isLoading ? (
            <p className="px-4 py-6 text-sm text-[var(--md-sys-color-on-surface-variant)] text-center">
              Loading directory…
            </p>
          ) : localFiltered.length === 0 ? (
            <div className="p-4">
              <EmptyState
                embedded
                icon={User}
                title="No matches"
                description={
                  query
                    ? "Press Enter to search the server."
                    : "No customers in the directory yet."
                }
                action={
                  query ? (
                    <ActionButton
                      tone="secondary"
                      size="sm"
                      isLoading={isSearching}
                      onClick={() => void performServerSearch(query)}
                    >
                      Search server
                    </ActionButton>
                  ) : null
                }
              />
            </div>
          ) : (
            <ul
              id="customer-picker-listbox"
              ref={listboxRef}
              role="listbox"
              aria-label="Customers"
              className="max-h-[calc(var(--row-height)*var(--max-rows))] overflow-y-auto py-1"
              style={
                {
                  ["--row-height" as string]: "56px",
                  ["--max-rows" as string]: String(maxRows),
                } as React.CSSProperties
              }
            >
              {localFiltered.map((c, idx) => {
                const isActive = idx === activeIndex;
                const isSelected = selected?.customerId === c.customerId;
                return (
                  <li
                    key={c.customerId}
                    ref={(el) => {
                      optionRefs.current[idx] = el;
                    }}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onChange(c);
                        close();
                      }}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={[
                        "w-full flex items-center justify-between gap-3 px-3 py-2 text-left transition-colors",
                        isActive
                          ? "bg-[var(--brand-50)]"
                          : "hover:bg-[var(--md-sys-color-surface-container-low)]",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="grid place-items-center w-7 h-7 rounded-full bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] text-[10px] font-semibold tabular shrink-0">
                          {c.fullName
                            .split(" ")
                            .slice(0, 2)
                            .map((p) => p[0])
                            .join("")
                            .toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[13px] font-medium text-[var(--md-sys-color-on-surface)] truncate">
                              {c.fullName}
                            </p>
                            <Badge
                              variant={c.userId ? "success" : "neutral"}
                              dot
                            >
                              {c.userId ? "Portal" : "Profile"}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] tabular truncate">
                            #{c.customerId} · {c.phoneNumber}
                          </p>
                        </div>
                      </div>
                      {isSelected ? (
                        <Check
                          className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0"
                          aria-hidden="true"
                        />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
