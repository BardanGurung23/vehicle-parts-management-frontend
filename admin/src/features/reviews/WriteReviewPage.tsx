import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/auth";
import { api, ApiError } from "../../app/api";
import { Field } from "../../shared/components/Field";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import { toast } from "react-toastify";
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
  const [appointmentInfo, setAppointmentInfo] = useState<{ serviceType: string; appointmentId: number } | null>(null);

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
      setAppointmentInfo({ serviceType: "Service", appointmentId: Number(appointmentId) });
    } catch {
      setAppointmentInfo({ serviceType: "Service", appointmentId: Number(appointmentId) });
    } finally {
      setLoading(false);
    }
  }, [token, appointmentId, navigate]);

  useEffect(() => {
    loadAppointment();
  }, [loadAppointment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !appointmentId) return;

    if (rating === 0) {
      setErrorMessage("Please select a rating (1-5 stars).");
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
      setSuccessMessage("Review submitted successfully!");
      toast.success("Review submitted successfully!");

      setTimeout(() => {
        navigate("/app/my-reviews");
      }, 1500);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to submit review.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="loading-screen">Loading...</p>;
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel auth-panel--wide">
        <div className="section-header">
          <h1>Write a Review</h1>
          <p>Share your feedback for appointment #{appointmentId}</p>
        </div>

        {errorMessage ? <AlertBox tone="error" message={errorMessage} /> : null}
        {successMessage ? <AlertBox tone="success" message={successMessage} /> : null}

        <form className="form-grid form-grid--two-columns" onSubmit={handleSubmit}>
          <div className="form-grid__full-width">
            <Field label="Rating">
              <div className="flex gap-1 text-2xl">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="cursor-pointer bg-transparent border-none p-0"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <span className={star <= (hoverRating || rating) ? "text-yellow-500" : "text-gray-300"}>
                      ★
                    </span>
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <div className="form-grid__full-width">
            <Field label="Comment (Optional)">
              <textarea
                className="input input--textarea"
                rows={4}
                placeholder="Share your experience with this service..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </Field>
          </div>

          <div className="form-grid__full-width">
            <ActionButton type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Review"}
            </ActionButton>
          </div>
        </form>
      </section>
    </main>
  );
}
