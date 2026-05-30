import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../app/auth";
import { api, ApiError } from "../../app/api";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { Field } from "../../shared/components/Field";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import { SkeletonCard } from "../../shared/components/Skeleton";
import { FormSection } from "../../shared/components/FormSection";
import type { CreateReviewRequest } from "../../app/types";

export function WriteReviewPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAppointment = useCallback(async () => {
    if (!token || !appointmentId) return;
    try {
      setLoading(true);
      const review = await api.getReviewByAppointment(token, Number(appointmentId));
      if (review) {
        toast.info("This appointment already has a review.");
        navigate("/app/my-reviews");
        return;
      }
    } catch {
      // No existing review — proceed.
    } finally {
      setLoading(false);
    }
  }, [token, appointmentId, navigate]);

  useEffect(() => {
    void loadAppointment();
  }, [loadAppointment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !appointmentId) return;
    if (rating === 0) {
      setErrorMessage("Select a rating between 1 and 5 stars.");
      return;
    }
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      setSubmitting(true);
      const payload: CreateReviewRequest = {
        appointmentId: Number(appointmentId),
        rating,
        comment: comment.trim() || undefined,
      };
      await api.createReview(token, payload);
      setSuccessMessage("Review submitted.");
      toast.success("Review submitted");
      window.setTimeout(() => navigate("/app/my-reviews"), 900);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Could not submit the review.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <SkeletonCard />
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="md">
      <PageHeader
        title="Write a review"
        description={
          appointmentId
            ? `Share your feedback for appointment #${appointmentId}`
            : "Share your feedback for the recent service"
        }
      />

      {errorMessage ? <AlertBox tone="error" message={errorMessage} dismissible /> : null}
      {successMessage ? <AlertBox tone="success" message={successMessage} dismissible /> : null}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormSection title="Your rating">
            <Field label="Rating" required htmlFor="rating">
              <div className="flex gap-1" id="rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] rounded"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    aria-label={`${star} star${star === 1 ? "" : "s"}`}
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        star <= (hoverRating || rating)
                          ? "text-[var(--warning-500)] fill-[var(--warning-500)]"
                          : "text-[var(--md-sys-color-outline-variant)]"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </Field>
          </FormSection>
          <FormSection title="Comment">
            <Field label="What stood out?" htmlFor="review-comment" hint="Optional">
              <textarea
                id="review-comment"
                rows={4}
                placeholder="Share details that future customers will find helpful…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </Field>
          </FormSection>
          <div className="flex justify-end pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
            <ActionButton type="submit" isLoading={submitting} disabled={submitting}>
              Submit review
            </ActionButton>
          </div>
        </form>
      </Card>
    </PageShell>
  );
}
