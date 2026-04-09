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
            <h3>What I've completed</h3>
            <p className="card__copy">Summary of what I've implemented so far.</p>
          </div>

          <ul className="plain-list">
            <li>Implemented customer self-registration.</li>
            <li>Added staff onboarding and role assignment (Admin / Staff).</li>
            <li>Shared login path for all user roles.</li>
          </ul>
        </article>

        {isAdmin && (
          <article className="card">
            <div className="card__header">
              <h3>Admin actions</h3>
              <p className="card__copy">Staff onboarding and role assignment are handled from one place.</p>
            </div>

            <Link className="button button--secondary dashboard-link" to="/app/staff">
              Open staff management
            </Link>
          </article>
        )}
      </div>
    </section>
  );
}