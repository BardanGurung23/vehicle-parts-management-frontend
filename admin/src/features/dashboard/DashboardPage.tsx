import { Link } from "react-router-dom";
import { useAuth } from "../../app/auth";

export function DashboardPage() {
  const { user, isAdmin } = useAuth();

  return (
    <section className="page-stack">
      <header className="card dashboard-hero">
        <div className="dashboard-hero__copy">
          <p className="eyebrow">Signed in</p>
          <h2>{user?.fullName}</h2>
          <p className="card__copy">
            You are logged in as <strong>{user?.role}</strong>. This console is focused on the active access workflows.
          </p>
        </div>

        <dl className="dashboard-stats">
          <div>
            <dt>Role</dt>
            <dd>{user?.role}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{user?.isActive ? "Active" : "Inactive"}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{user?.phoneNumber}</dd>
          </div>
        </dl>
      </header>

      <div className="dashboard-grid">
        <article className="card">
          <div className="card__header">
            <h3>Account details</h3>
            <p className="card__copy">Basic profile information for this session.</p>
          </div>

          <dl className="detail-list">
            <div>
              <dt>Email</dt>
              <dd>{user?.email}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{user?.phoneNumber}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{user?.isActive ? "Active" : "Inactive"}</dd>
            </div>
          </dl>
        </article>

        <article className="card">
          <div className="card__header">
            <h3>Current scope</h3>
            <p className="card__copy">What is available in the current MVP flow.</p>
          </div>

          <ul className="plain-list">
            <li>Customer accounts can self-register.</li>
            <li>Admins can register staff and assign Admin or Staff roles.</li>
            <li>All users share the same login path.</li>
          </ul>
        </article>

        {isAdmin ? (
          <article className="card">
            <div className="card__header">
              <h3>Admin actions</h3>
              <p className="card__copy">Staff onboarding and role assignment are handled from one place.</p>
            </div>

            <Link className="button button--secondary dashboard-link" to="/app/staff">
              Open staff management
            </Link>
          </article>
        ) : (
          <article className="card">
            <div className="card__header">
              <h3>What happens next</h3>
              <p className="card__copy">
                Your account is active on the shared login flow. Role-specific features can be added on top of this baseline.
              </p>
            </div>
          </article>
        )}
      </div>
    </section>
  );
}