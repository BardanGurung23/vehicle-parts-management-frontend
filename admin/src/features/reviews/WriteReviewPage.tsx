import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { useAuth } from "../../app/auth";
import { api, ApiError } from "../../app/api";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { Field } from "../../shared/components/Field";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import { toast } from "sonner";
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
    } catch { /* no review exists, proceed */ }
    finally { setLoading(false); }
  }, [token, appointmentId, navigate]);

  useEffect(() => { loadAppointment(); }, [loadAppointment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !appointmentId) return;
    if (rating === 0) { setErrorMessage("Please select a rating (1-5 stars)."); return; }
    try {
      setErrorMessage(null); setSuccessMessage(null); setSubmitting(true);
      const payload: CreateReviewRequest = { appointmentId: Number(appointmentId), rating, comment: comment.trim() || undefined };
      await api.createReview(token, payload);
      setSuccessMessage("Review submitted successfully!");
      toast.success("Review submitted successfully!");
      setTimeout(() => navigate("/app/my-reviews"), 1500);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to submit review.";
      setErrorMessage(message); toast.error(message);
    } finally { setSubmitting(false); }
  };

  if (loading) {
    return <PageShell><div className="space-y-4"><div className="h-8 rounded-md bg-surface-container-high animate-shimmer" /><div className="h-48 rounded-xl border border-outline-variant/20 animate-shimmer" /></div></PageShell>;
  }

  return (
    <PageShell maxWidth="sm">
      <PageHeader eyebrow="Review" title="Write a Review" description={`Share your feedback for appointment #${appointmentId}`} />

      {errorMessage ? <AlertBox tone="error" message={errorMessage} dismissible /> : null}
      {successMessage ? <AlertBox tone="success" message={successMessage} dismissible /> : null}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Rating" required htmlFor="rating">
            <div className="flex gap-1" id="rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button"
                  className="cursor-pointer bg-transparent border-none p-0.5 transition-colors"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  aria-label={`${star} star${star === 1 ? "" : "s"}`}
                >
                  <Star className={`w-8 h-8 transition-colors ${star <= (hoverRating || rating) ? "text-warning-500 fill-warning-500" : "text-border"}`} />
                </button>
              ))}
            </div>
          </Field>

          <Field label="Comment (Optional)" htmlFor="review-comment">
            <textarea id="review-comment" className="input" rows={4}
              placeholder="Share your experience with this service..."
              value={comment} onChange={(e) => setComment(e.target.value)} />
          </Field>

          <ActionButton type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Review"}
          </ActionButton>
        </form>
      </Card>
    </PageShell>
  );
}
