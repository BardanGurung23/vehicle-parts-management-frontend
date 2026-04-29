import { useState } from "react";
import { useGetAllPartRequestsQuery, useUpdatePartRequestStatusMutation } from "../../redux/services/partRequests";
import { toast } from "react-toastify";

const statusOptions = ["Pending", "Ordered", "Available"];

export function PartRequestsPage() {
  const { data: requests = [], isLoading, error } = useGetAllPartRequestsQuery();
  const [updateStatus] = useUpdatePartRequestStatusMutation();

  const handleStatusChange = async (requestId: number, newStatus: string) => {
    try {
      await updateStatus({ requestId, status: newStatus }).unwrap();
      toast.success("Status updated successfully!");
    } catch {
      toast.error("Failed to update status.");
    }
  };

  if (isLoading) return <p className="p-4">Loading part requests...</p>;
  if (error) return <p className="p-4 text-red-600">Failed to load requests.</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Part Requests</h1>

      {requests.length === 0 ? (
        <p className="text-gray-500">No part requests yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="p-3 border">ID</th>
                <th className="p-3 border">Customer</th>
                <th className="p-3 border">Part Name</th>
                <th className="p-3 border">Vehicle</th>
                <th className="p-3 border">Details</th>
                <th className="p-3 border">Status</th>
                <th className="p-3 border">Requested</th>
                <th className="p-3 border">Resolved</th>
                <th className="p-3 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.requestId} className="hover:bg-gray-50">
                  <td className="p-3 border">{req.requestId}</td>
                  <td className="p-3 border">{req.customerName}</td>
                  <td className="p-3 border">{req.requestedPartName}</td>
                  <td className="p-3 border">{req.vehicleNumber || "-"}</td>
                  <td className="p-3 border text-sm">{req.requestDetails || "-"}</td>
                  <td className="p-3 border">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        req.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : req.status === "Ordered"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="p-3 border text-sm">
                    {new Date(req.requestedAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 border text-sm">
                    {req.resolvedAt
                      ? new Date(req.resolvedAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="p-3 border">
                    <select
                      className="border rounded p-1 text-sm"
                      value={req.status}
                      onChange={(e) =>
                        handleStatusChange(req.requestId, e.target.value)
                      }
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
