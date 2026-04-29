import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../app/auth";
import { api, ApiError } from "../../app/api";
import { toast } from "react-toastify";
import type { ServiceReview } from "../../app/types";

function renderStars(rating: number) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function MyReviewsPage() {
  const { token } = useAuth();
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getMyReviews(token);
      setReviews(data);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to load reviews.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  if (loading) {
    return <p className="loading-screen">Loading your reviews...</p>;
  }

  return (
    <main className="page-stack">
      <section className="bg-white rounded-lg p-6 flex flex-col gap-[15px]">
        <div className="flex flex-col gap-2">
          <p className="eyebrow">My Reviews</p>
          <h2>Your Service Reviews</h2>
          <p className="card__copy">
            View all reviews you have submitted for completed appointments.
          </p>
        </div>

        {error && (
          <div className="alert alert--error">
            <p>
              {error}{" "}
              <button onClick={loadReviews} className="text-blue-600 underline">
                Retry
              </button>
            </p>
          </div>
        )}

        {reviews.length === 0 ? (
          <p className="empty-state">
            You haven't submitted any reviews yet. Reviews can be added for
            completed appointments.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {reviews.map((review) => (
              <article key={review.reviewId} className="card parts-item-card">
                <div className="parts-item-card__top">
                  <div className="parts-item-card__identity">
                    <div className="parts-item-card__title-row">
                      <h3>Review #{review.reviewId}</h3>
                      <span className="text-yellow-500 text-lg">
                        {renderStars(review.rating)}
                      </span>
                    </div>
                    <p className="parts-item-card__subtitle">
                      Appointment #{review.appointmentId}
                    </p>
                  </div>
                </div>

                {review.comment && (
                  <p className="parts-item-card__description">
                    "{review.comment}"
                  </p>
                )}

                <p className="text-sm text-gray-500 mt-2">
                  Submitted on {formatDate(review.createdAt)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
