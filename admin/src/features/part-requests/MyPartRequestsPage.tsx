import { Link } from "react-router-dom";
import { Plus, ClipboardList } from "lucide-react";
import { useGetMyPartRequestsQuery } from "../../redux/services/partRequests";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { Badge } from "../../shared/components/Badge";
import { ActionButton } from "../../shared/components/ActionButton";
import { EmptyState } from "../../shared/components/EmptyState";
import { SkeletonCard } from "../../shared/components/Skeleton";

const badgeVariant = (status: string) => {
  switch (status) {
    case "Pending": return "warning";
    case "Ordered": return "info";
    case "Available": return "success";
    default: return "neutral";
  }
};

export function MyPartRequestsPage() {
  const { data: requests = [], isLoading, error } = useGetMyPartRequestsQuery();

  if (isLoading) return <PageShell><SkeletonCard /></PageShell>;
  if (error) return <PageShell><div className="bg-danger-50 border border-danger-100 text-danger-700 rounded-lg p-3 text-sm">Failed to load requests.</div></PageShell>;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Requests"
        title="My Part Requests"
        description="Track the status of your part requests."
        actions={
          <Link to="/app/request-part">
            <ActionButton icon={Plus}>Request New Part</ActionButton>
          </Link>
        }
      />

      {requests.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No requests yet"
          description="You haven't requested any parts yet."
          action={
            <Link to="/app/request-part" className="text-sm text-primary font-medium hover:text-accent-700 underline">
              Request a part
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
                    <h3 className="text-sm font-semibold text-on-surface">{req.requestedPartName}</h3>
                    <Badge variant={badgeVariant(req.status)}>{req.status}</Badge>
                  </div>
                  {req.vehicleNumber && <p className="text-xs text-on-surface-variant">Vehicle: {req.vehicleNumber}</p>}
                  <p className="text-xs text-on-surface-variant">Requested: {new Date(req.requestedAt).toLocaleDateString()}</p>
                </div>
              </div>
              {req.requestDetails && (
                <p className="text-xs text-on-surface-variant mt-2">{req.requestDetails}</p>
              )}
              {req.resolvedAt && (
                <p className="text-xs text-success-600 mt-2">Resolved: {new Date(req.resolvedAt).toLocaleDateString()}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
