import { useGetMySalesQuery } from "../../redux/services/sales";

export function MySalesPage() {
  const { data: sales = [], isLoading, error } = useGetMySalesQuery();

  if (isLoading) return <p className="p-4">Loading purchase history...</p>;
  if (error) return <p className="p-4 text-red-600">Failed to load purchase history.</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">My Purchase History</h1>

      {sales.length === 0 ? (
        <p className="text-gray-500">No purchases found.</p>
      ) : (
        <div className="space-y-4">
          {sales.map((sale) => (
            <div key={sale.saleId} className="border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="font-semibold">{sale.invoiceNumber || `Sale #${sale.saleId}`}</h2>
                  <p className="text-sm text-gray-600">
                    {new Date(sale.saleDate).toLocaleDateString()}
                  </p>
                  {sale.vehicleNumber && (
                    <p className="text-sm text-gray-600">Vehicle: {sale.vehicleNumber}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total</p>
                  <span className="text-lg font-bold">${sale.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {sale.notes && (
                <p className="text-sm text-gray-600 mb-2">Notes: {sale.notes}</p>
              )}

              <div className="mt-2">
                <h3 className="text-sm font-semibold mb-1">
                  {sale.discountAmount > 0 ? "Items (before discount):" : "Items:"}
                </h3>
                <ul className="space-y-1">
                  {sale.items.map((item, idx) => (
                    <li key={idx} className="text-sm flex justify-between">
                      <span>
                        {item.partName} x {item.quantity}
                      </span>
                      <span>${item.subtotal.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <dl className="mt-3 space-y-1 border-t pt-3 text-sm text-gray-700">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd>${sale.subtotal.toFixed(2)}</dd>
                </div>
                {sale.discountAmount > 0 ? (
                  <div className="flex justify-between text-green-700">
                    <dt>Discount</dt>
                    <dd>- ${sale.discountAmount.toFixed(2)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between font-semibold text-gray-900">
                  <dt>Total paid</dt>
                  <dd>${sale.totalAmount.toFixed(2)}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
