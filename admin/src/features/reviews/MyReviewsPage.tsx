import { useState, useEffect, useCallback } from "react";
import { Star } from "lucide-react";
import { useAuth } from "../../app/auth";
import { api, ApiError } from "../../app/api";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { EmptyState } from "../../shared/components/EmptyState";
import type { ServiceReview } from "../../app/types";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export function MyReviewsPage() {
  const { token } = useAuth();
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    if (!token) return;
    try { setLoading(true); setError(null); setReviews(await api.getMyReviews(token)); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Failed to load reviews."); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  if (loading) {
    return (
      <PageShell>
        <div className="space-y-4"><div className="h-8 rounded-md bg-surface-container-high animate-shimmer" /><div className="h-32 rounded-xl border border-outline-variant/20 animate-shimmer" /></div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader eyebrow="My Reviews" title="Your Service Reviews" description="View all reviews you have submitted for completed appointments." />

      {error && (
        <div className="bg-danger-50 border border-danger-100 text-danger-700 rounded-lg p-3 text-sm">
          {error} <button onClick={loadReviews} className="text-primary font-medium underline ml-2">Retry</button>
        </div>
      )}

      {reviews.length === 0 ? (
        <EmptyState icon={Star} title="No reviews yet" description="Reviews can be added for completed appointments." />
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.reviewId}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-on-surface">Review #{review.reviewId}</h3>
                    <span className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`w-4 h-4 ${star <= review.rating ? "text-warning-500 fill-warning-500" : "text-border"}`} />
                      ))}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant">Appointment #{review.appointmentId}</p>
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-on-surface-variant italic mt-2">"{review.comment}"</p>
              )}
              <p className="text-xs text-on-surface-variant mt-2">Submitted on {formatDate(review.createdAt)}</p>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
