import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../app/auth";
import { api, ApiError } from "../../app/api";
import { toast } from "sonner";
import type { Vehicle } from "../../app/types";

export function MyVehiclesPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVehicles = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getMyVehicles(token);
      setVehicles(data);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to load vehicles.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  if (loading) {
    return <p className="loading-screen">Loading your vehicles...</p>;
  }

  return (
    <main className="page-stack">
      <section className="bg-white rounded-lg p-6 flex flex-col gap-[15px]">
        <div className="flex flex-col gap-[15px]">
          <p className="eyebrow">My Vehicles</p>
          <h2>Your Registered Vehicles</h2>
          <p className="card__copy">
            View all vehicles registered under your account.
          </p>
        </div>

        {error && (
          <div className="alert alert--error">
            <p>
              {error}{" "}
              <button
                onClick={loadVehicles}
                className="text-blue-600 underline"
              >
                Retry
              </button>
            </p>
          </div>
        )}

        <div className="mb-4">
          <button
            type="button"
            className="button"
            onClick={() => navigate("/app/add-vehicle")}
          >
            Add New Vehicle
          </button>
        </div>

        {vehicles.length === 0 ? (
          <p className="empty-state">
            No vehicles registered yet.{" "}
            <button
              onClick={() => navigate("/app/add-vehicle")}
              className="text-blue-600 underline"
            >
              Add one now
            </button>
            .
          </p>
        ) : (
          <div className="grid lg:grid-cols-4 md:grid-cols-3 grid-cols-2 gap-3">
            {vehicles.map((vehicle) => (
              <article key={vehicle.vehicleId} className="card parts-item-card">
                <div className="parts-item-card__top">
                  <div className="parts-item-card__identity">
                    <div className="parts-item-card__title-row">
                      <h3>{vehicle.vehicleNumber}</h3>
                    </div>
                    <p className="parts-item-card__subtitle">{vehicle.model}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
