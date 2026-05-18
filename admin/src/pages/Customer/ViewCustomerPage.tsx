import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useGetCustomerByIdQuery, useGetCustomerAppointmentsQuery, useGetCustomerSalesQuery } from "../../redux/services/customers";

export function ViewCustomerPage() {
  const { id } = useParams<{ id: string }>();
  const customerId = Number(id);

  const { data: customer, isLoading: customerLoading, error: customerError } = useGetCustomerByIdQuery(customerId, {
    skip: !customerId,
  });

  const { data: appointments = [], isLoading: apptLoading } = useGetCustomerAppointmentsQuery(customerId, {
    skip: !customerId,
  });

  const { data: sales = [], isLoading: salesLoading } = useGetCustomerSalesQuery(customerId, {
    skip: !customerId,
  });

  const [activeTab, setActiveTab] = useState<"details" | "vehicles" | "appointments" | "purchases">("details");

  if (customerLoading) return <p className="p-4">Loading customer details...</p>;
  if (customerError) return <p className="p-4 text-red-600">Failed to load customer.</p>;
  if (!customer) return <p className="p-4">Customer not found.</p>;

  return (
    <div className="p-4 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/app/customers/search" className="text-blue-600 hover:underline">
          ← Back to Customer Search
        </Link>
        <h1 className="text-2xl font-bold">{customer.fullName}</h1>
      </div>

      {/* Customer Summary */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium">{customer.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Phone</p>
            <p className="font-medium">{customer.phoneNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Address</p>
            <p className="font-medium">{customer.address || "-"}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b mb-6">
        {(["details", "vehicles", "appointments", "purchases"] as const).map((tab) => (
          <button
            key={tab}
            className={`pb-2 px-4 capitalize ${
              activeTab === tab
                ? "border-b-2 border-blue-600 text-blue-600 font-medium"
                : "text-gray-600 hover:text-gray-900"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "details" ? "Details" : tab === "vehicles" ? "Vehicles" : tab === "appointments" ? "Appointments" : "Purchases"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "details" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Customer Details</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Full Name</p>
              <p className="font-medium">{customer.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{customer.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone Number</p>
              <p className="font-medium">{customer.phoneNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Address</p>
              <p className="font-medium">{customer.address || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Customer Since</p>
              <p className="font-medium">
                {new Date(customer.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "vehicles" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Vehicles</h2>
          {!customer.vehicles || customer.vehicles.length === 0 ? (
            <p className="text-gray-500">No vehicles registered.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="p-3 border">Vehicle Number</th>
                    <th className="p-3 border">Type</th>
                    <th className="p-3 border">Model</th>
                    <th className="p-3 border">Year</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.vehicles.map((v) => (
                    <tr key={v.vehicleId} className="hover:bg-gray-50">
                      <td className="p-3 border font-medium">{v.vehicleNumber}</td>
                      <td className="p-3 border">{v.vehicleType}</td>
                      <td className="p-3 border">{v.model || "-"}</td>
                      <td className="p-3 border">{v.year || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "appointments" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Appointment History</h2>
          {apptLoading ? (
            <p>Loading appointments...</p>
          ) : appointments.length === 0 ? (
            <p className="text-gray-500">No appointments found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="p-3 border">ID</th>
                    <th className="p-3 border">Vehicle</th>
                    <th className="p-3 border">Service Type</th>
                    <th className="p-3 border">Date</th>
                    <th className="p-3 border">Status</th>
                    <th className="p-3 border">Has Review</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((a) => (
                    <tr key={a.appointmentId} className="hover:bg-gray-50">
                      <td className="p-3 border">{a.appointmentId}</td>
                      <td className="p-3 border">{a.vehicleNumber || "-"}</td>
                      <td className="p-3 border">{a.serviceType}</td>
                      <td className="p-3 border">
                        {new Date(a.appointmentDate).toLocaleDateString()}
                      </td>
                      <td className="p-3 border">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            a.status === "Completed"
                              ? "bg-green-100 text-green-800"
                              : a.status === "Confirmed"
                              ? "bg-blue-100 text-blue-800"
                              : a.status === "Cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="p-3 border text-center">
                        {a.hasReview ? (
                          <span className="text-green-600">Yes</span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "purchases" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Purchase History</h2>
          {salesLoading ? (
            <p>Loading purchases...</p>
          ) : sales.length === 0 ? (
            <p className="text-gray-500">No purchases found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="p-3 border">Sale ID</th>
                    <th className="p-3 border">Vehicle</th>
                    <th className="p-3 border">Date</th>
                    <th className="p-3 border">Items</th>
                    <th className="p-3 border">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s) => (
                    <tr key={s.saleId} className="hover:bg-gray-50">
                      <td className="p-3 border">{s.saleId}</td>
                      <td className="p-3 border">{s.vehicleNumber || "-"}</td>
                      <td className="p-3 border">
                        {new Date(s.saleDate).toLocaleDateString()}
                      </td>
                      <td className="p-3 border">
                        {s.items.map((item, idx) => (
                          <div key={idx} className="text-sm">
                            {item.partName} x {item.quantity}
                          </div>
                        ))}
                      </td>
                      <td className="p-3 border font-medium">
                        ${s.totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
