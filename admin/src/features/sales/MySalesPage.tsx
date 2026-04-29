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
                  <h2 className="font-semibold">Sale #{sale.saleId}</h2>
                  <p className="text-sm text-gray-600">
                    {new Date(sale.saleDate).toLocaleDateString()}
                  </p>
                  {sale.vehicleNumber && (
                    <p className="text-sm text-gray-600">Vehicle: {sale.vehicleNumber}</p>
                  )}
                </div>
                <span className="text-lg font-bold">${sale.totalAmount.toFixed(2)}</span>
              </div>

              {sale.notes && (
                <p className="text-sm text-gray-600 mb-2">Notes: {sale.notes}</p>
              )}

              <div className="mt-2">
                <h3 className="text-sm font-semibold mb-1">Items:</h3>
                <ul className="space-y-1">
                  {sale.items.map((item, idx) => (
                    <li key={idx} className="text-sm flex justify-between">
                      <span>
                        {item.partName} x {item.quantity}
                      </span>
                      <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
