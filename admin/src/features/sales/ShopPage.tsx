import { useState, type FormEvent } from "react";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import type { CustomerSearchInput, CustomerSearchResult } from "../../app/types";
import { useGetPartsQuery } from "../../redux/services/parts";
import { useCreateSaleMutation } from "../../redux/services/sales";
import { toast } from "react-toastify";

interface CartItem {
  partId: number;
  partName: string;
  unitPrice: number;
  quantity: number;
}

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

export function ShopPage() {
  const { user, token } = useAuth();
  const { data: parts = [], isLoading: partsLoading } = useGetPartsQuery();
  const [createSale, { isLoading: isCreating }] = useCreateSaleMutation();
  const isEmployee = user?.role === "Admin" || user?.role === "Staff";

  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");
  const inStockParts = parts.filter((part) => part.stockQuantity > 0);
  const [searchValues, setSearchValues] = useState<SearchFormState>({
    customerId: "",
    phoneNumber: "",
    vehicleNumber: "",
    name: "",
  });
  const [customerResults, setCustomerResults] = useState<CustomerSearchResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);
  const [customerSearchError, setCustomerSearchError] = useState<string | null>(null);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [hasSearchRun, setHasSearchRun] = useState(false);

  const addToCart = (partId: number, partName: string, unitPrice: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.partId === partId);
      if (existing) {
        return prev.map((i) =>
          i.partId === partId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { partId, partName, unitPrice, quantity: 1 }];
    });
  };

  const updateQuantity = (partId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.partId !== partId));
    } else {
      setCart((prev) =>
        prev.map((i) => (i.partId === partId ? { ...i, quantity } : i))
      );
    }
  };

  const removeFromCart = (partId: number) => {
    setCart((prev) => prev.filter((i) => i.partId !== partId));
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  const handleCustomerSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      return;
    }

    const { payload, error } = buildCustomerSearchPayload(searchValues);
    if (!payload) {
      setCustomerSearchError(error);
      setCustomerResults([]);
      setHasSearchRun(false);
      return;
    }

    try {
      setIsSearchingCustomers(true);
      setCustomerSearchError(null);
      const results = await api.searchCustomers(token, payload);
      setCustomerResults(results);
      setHasSearchRun(true);

      if (selectedCustomer && results.every((customer) => customer.customerId !== selectedCustomer.customerId)) {
        setSelectedCustomer(null);
      }
    } catch (error) {
      setCustomerSearchError(
        error instanceof ApiError ? error.message : "Could not search customers right now.",
      );
      setCustomerResults([]);
      setHasSearchRun(true);
    } finally {
      setIsSearchingCustomers(false);
    }
  };

  const resetCustomerSearch = () => {
    setSearchValues({
      customerId: "",
      phoneNumber: "",
      vehicleNumber: "",
      name: "",
    });
    setCustomerResults([]);
    setCustomerSearchError(null);
    setSelectedCustomer(null);
    setHasSearchRun(false);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    if (isEmployee && !selectedCustomer) {
      toast.error("Select a customer before checkout.");
      return;
    }

    try {
      await createSale({
        customerId: isEmployee ? selectedCustomer?.customerId : undefined,
        items: cart.map((i) => ({ partId: i.partId, quantity: i.quantity })),
        notes: notes || undefined,
      }).unwrap();

      toast.success("Purchase completed successfully!");
      setCart([]);
      setNotes("");
    } catch {
      toast.error("Failed to complete purchase. Please try again.");
    }
  };

  if (partsLoading) return <p className="p-4">Loading parts...</p>;

  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Parts List */}
      <div className="lg:col-span-2">
        <h1 className="text-2xl font-bold mb-4">Shop Parts</h1>
        {inStockParts.length === 0 ? (
          <div className="border rounded-lg p-6 bg-white">
            <p className="text-gray-600">
              No parts are currently in stock. Check back later or ask staff for availability.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inStockParts.map((part) => (
              <div key={part.partId} className="border rounded-lg p-4">
                <h3 className="font-semibold">{part.partName}</h3>
                <p className="text-sm text-gray-600">{part.partNumber}</p>
                <p className="text-sm">In stock: {part.stockQuantity}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-bold">${part.unitPrice.toFixed(2)}</span>
                  <button
                    type="button"
                    className="button button--primary text-sm"
                    onClick={() =>
                      addToCart(part.partId, part.partName, part.unitPrice)
                    }
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart */}
      <div className="border rounded-lg p-4 h-fit">
        <h2 className="text-xl font-bold mb-4">Cart</h2>

        {isEmployee && (
          <div className="border rounded-lg p-4 mb-4 bg-white">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Select customer</h3>
              <p className="text-sm text-gray-600">
                Staff and admin purchases must be assigned to a customer profile.
              </p>
            </div>

            {selectedCustomer && (
              <div className="border rounded-md p-3 mb-4 bg-gray-50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{selectedCustomer.fullName}</p>
                    <p className="text-sm text-gray-600">
                      Customer #{selectedCustomer.customerId}
                    </p>
                    <p className="text-sm text-gray-600">{selectedCustomer.phoneNumber}</p>
                  </div>
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => setSelectedCustomer(null)}
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {customerSearchError ? (
              <p className="text-sm text-red-600 mb-3">{customerSearchError}</p>
            ) : null}

            <form className="space-y-3" onSubmit={handleCustomerSearch}>
              <input
                className="w-full border rounded p-2"
                type="text"
                inputMode="numeric"
                placeholder="Customer ID"
                value={searchValues.customerId}
                onChange={(event) =>
                  setSearchValues((current) => ({ ...current, customerId: event.target.value }))
                }
              />
              <input
                className="w-full border rounded p-2"
                type="text"
                placeholder="Phone number"
                value={searchValues.phoneNumber}
                onChange={(event) =>
                  setSearchValues((current) => ({ ...current, phoneNumber: event.target.value }))
                }
              />
              <input
                className="w-full border rounded p-2"
                type="text"
                placeholder="Vehicle number"
                value={searchValues.vehicleNumber}
                onChange={(event) =>
                  setSearchValues((current) => ({ ...current, vehicleNumber: event.target.value }))
                }
              />
              <input
                className="w-full border rounded p-2"
                type="text"
                placeholder="Customer name"
                value={searchValues.name}
                onChange={(event) =>
                  setSearchValues((current) => ({ ...current, name: event.target.value }))
                }
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={isSearchingCustomers}
                >
                  {isSearchingCustomers ? "Searching..." : "Search customers"}
                </button>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={resetCustomerSearch}
                >
                  Reset
                </button>
              </div>
            </form>

            {hasSearchRun && customerResults.length === 0 ? (
              <p className="text-sm text-gray-600 mt-3">No customer matched the filters you entered.</p>
            ) : null}

            {customerResults.length > 0 ? (
              <div className="mt-4 space-y-2">
                {customerResults.map((customer) => (
                  <div key={customer.customerId} className="border rounded-md p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{customer.fullName}</p>
                        <p className="text-sm text-gray-600">
                          Customer #{customer.customerId} · {customer.phoneNumber}
                        </p>
                        <p className="text-sm text-gray-600">
                          {customer.vehicleCount} vehicle{customer.vehicleCount === 1 ? "" : "s"}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="button button--secondary"
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        {selectedCustomer?.customerId === customer.customerId ? "Selected" : "Select"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {cart.length === 0 ? (
          <p className="text-gray-500">Your cart is empty.</p>
        ) : (
          <>
            <ul className="space-y-2 mb-4">
              {cart.map((item) => (
                <li
                  key={item.partId}
                  className="flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{item.partName}</p>
                    <p className="text-sm text-gray-600">
                      ${item.unitPrice.toFixed(2)} x {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item.partId, Number(e.target.value))
                      }
                      className="w-16 border rounded p-1 text-center"
                    />
                    <button
                      type="button"
                      className="text-red-600 text-sm"
                      onClick={() => removeFromCart(item.partId)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t pt-2 mb-4">
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Notes (Optional)
              </label>
              <textarea
                className="w-full border rounded p-2"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this purchase..."
              />
            </div>

            <button
              type="button"
              className="button button--primary w-full"
              disabled={isCreating}
              onClick={handleCheckout}
            >
              {isCreating ? "Processing..." : "Checkout"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
