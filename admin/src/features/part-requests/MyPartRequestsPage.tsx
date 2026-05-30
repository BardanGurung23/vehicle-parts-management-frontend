import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ClipboardList } from "lucide-react";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import type { PartRequest } from "../../app/types";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { Badge } from "../../shared/components/Badge";
import { ActionButton } from "../../shared/components/ActionButton";
import { EmptyState } from "../../shared/components/EmptyState";
import { SkeletonCard } from "../../shared/components/Skeleton";
import { AlertBox } from "../../shared/components/AlertBox";

const badgeVariant = (status: string) => {
  switch (status) {
    case "Pending":
      return "warning" as const;
    case "Ordered":
    case "Fulfilled":
      return "success" as const;
    case "Available":
      return "info" as const;
    case "Rejected":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
};

export function MyPartRequestsPage() {
  const { token } = useAuth();
  const [requests, setRequests] = useState<PartRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    let isActive = true;
    setIsLoading(true);
    void api
      .getMyPartRequests(token)
      .then((response) => {
        if (!isActive) return;
        setRequests(response);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (!isActive) return;
        setRequests([]);
        setError(
          loadError instanceof ApiError
            ? loadError.message
            : "Could not load your requests.",
        );
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [token]);

  if (isLoading) {
    return (
      <PageShell>
        <SkeletonCard />
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <AlertBox tone="error" message={error} />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="My part requests"
        description="Track the status of every part you have requested."
        actions={
          <Link to="/app/request-part">
            <ActionButton icon={Plus}>New request</ActionButton>
          </Link>
        }
      />

      {requests.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No requests yet"
          description="Need a part we don't carry? Send us a request to start the search."
          action={
            <Link to="/app/request-part">
              <ActionButton icon={Plus}>Request a part</ActionButton>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Card key={req.requestId}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                      {req.requestedPartName}
                    </h3>
                    <Badge variant={badgeVariant(req.status)} dot>
                      {req.status}
                    </Badge>
                  </div>
                  <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] tabular">
                    {req.vehicleNumber ? `${req.vehicleNumber} · ` : ""}
                    Requested {new Date(req.requestedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {req.requestDetails ? (
                <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] mt-3">
                  {req.requestDetails}
                </p>
              ) : null}
              {req.resolvedAt ? (
                <p className="text-[12px] text-[var(--success-700)] mt-2 tabular">
                  Resolved {new Date(req.resolvedAt).toLocaleDateString()}
                </p>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
