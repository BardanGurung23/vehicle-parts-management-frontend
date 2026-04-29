import { useGetMyPartRequestsQuery } from "../../redux/services/partRequests";
import { Link } from "react-router-dom";

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Ordered: "bg-blue-100 text-blue-800",
  Available: "bg-green-100 text-green-800",
};

export function MyPartRequestsPage() {
  const { data: requests = [], isLoading, error } = useGetMyPartRequestsQuery();

  if (isLoading) return <p className="p-4">Loading your part requests...</p>;
  if (error) return <p className="p-4 text-red-600">Failed to load requests.</p>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">My Part Requests</h1>
        <Link to="/app/request-part" className="button button--primary">
          Request New Part
        </Link>
      </div>

      {requests.length === 0 ? (
        <p className="text-gray-500">
          You haven't requested any parts yet.{" "}
          <Link to="/app/request-part" className="text-blue-600 underline">
            Request a part
          </Link>
        </p>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.requestId} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">{req.requestedPartName}</h3>
                  {req.vehicleNumber && (
                    <p className="text-sm text-gray-600">
                      Vehicle: {req.vehicleNumber}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    Requested: {new Date(req.requestedAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    statusColors[req.status] || "bg-gray-100"
                  }`}
                >
                  {req.status}
                </span>
              </div>

              {req.requestDetails && (
                <p className="text-sm text-gray-600 mb-2">{req.requestDetails}</p>
              )}

              {req.resolvedAt && (
                <p className="text-sm text-green-600">
                  Resolved: {new Date(req.resolvedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
