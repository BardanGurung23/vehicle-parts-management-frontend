import { useState, useEffect, useCallback } from "react";
import { Star } from "lucide-react";
import { useAuth } from "../../app/auth";
import { api, ApiError } from "../../app/api";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { EmptyState } from "../../shared/components/EmptyState";
import { SkeletonCard } from "../../shared/components/Skeleton";
import { AlertBox } from "../../shared/components/AlertBox";
import { ActionButton } from "../../shared/components/ActionButton";
import type { ServiceReview } from "../../app/types";

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
      setReviews(await api.getMyReviews(token));
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not load your reviews.",
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  if (loading) {
    return (
      <PageShell>
        <SkeletonCard />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="My reviews"
        description={`${reviews.length} submitted`}
      />

      {error ? (
        <AlertBox
          tone="error"
          message={error}
          dismissible
          action={
            <ActionButton tone="secondary" size="sm" onClick={loadReviews}>
              Retry
            </ActionButton>
          }
        />
      ) : null}

      {reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No reviews yet"
          description="Reviews are available once an appointment is completed."
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.reviewId}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                      Review #{review.reviewId}
                    </h3>
                    <span className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating
                              ? "text-[var(--warning-500)] fill-[var(--warning-500)]"
                              : "text-[var(--md-sys-color-outline-variant)]"
                          }`}
                        />
                      ))}
                    </span>
                  </div>
                  <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] tabular">
                    Appointment #{review.appointmentId}
                  </p>
                </div>
              </div>
              {review.comment ? (
                <p className="text-sm text-[var(--md-sys-color-on-surface)] mt-3 leading-6">
                  “{review.comment}”
                </p>
              ) : null}
              <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] mt-2 tabular">
                Submitted {formatDate(review.createdAt)}
              </p>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
