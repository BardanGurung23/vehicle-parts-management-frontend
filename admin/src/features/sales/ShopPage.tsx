import { useState } from "react";
import { useGetPartsQuery } from "../../redux/services/parts";
import { useCreateSaleMutation } from "../../redux/services/sales";
import { toast } from "react-toastify";

interface CartItem {
  partId: number;
  partName: string;
  unitPrice: number;
  quantity: number;
}

export function ShopPage() {
  const { data: parts = [], isLoading: partsLoading } = useGetPartsQuery();
  const [createSale, { isLoading: isCreating }] = useCreateSaleMutation();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");

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

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    try {
      await createSale({
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {parts
            .filter((p) => p.stockQuantity > 0)
            .map((part) => (
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
      </div>

      {/* Cart */}
      <div className="border rounded-lg p-4 h-fit">
        <h2 className="text-xl font-bold mb-4">Cart</h2>

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
