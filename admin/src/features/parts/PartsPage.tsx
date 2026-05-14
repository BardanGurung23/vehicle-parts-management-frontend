import { useEffect, useState } from "react";
import { api, ApiError } from "../../app/api";
import { Plus, Trash2, Edit3 } from "lucide-react";
import { useAuth } from "../../app/auth";
import type { Part, PartCategory } from "../../app/types";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { StatCard } from "../../shared/components/StatCard";
import { Badge } from "../../shared/components/Badge";
import { ActionButton } from "../../shared/components/ActionButton";
import { SkeletonCard } from "../../shared/components/Skeleton";
import PartForm from "./PartForm";
import { toast } from "react-toastify";

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const numberFormatter = new Intl.NumberFormat("en-US");
function formatCurrency(value: number) { return currencyFormatter.format(value); }
function formatNumber(value: number) { return numberFormatter.format(value); }
function asMessage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
function getMutationErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== "object") return fallback;
  const data = (error as { data?: unknown }).data;
  if (!data || typeof data !== "object") return fallback;
  const payload = data as { detail?: unknown; title?: unknown; message?: unknown };
  return asMessage(payload.detail) ?? asMessage(payload.message) ?? asMessage(payload.title) ?? fallback;
}

export default function PartsPage() {
  const { isAdmin, token } = useAuth();
  const [parts, setParts] = useState<Part[]>([]);
  const [categories, setCategories] = useState<PartCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [editPart, setEditPart] = useState<Part | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    let isActive = true;

    void Promise.all([api.getParts(token), api.getPartCategories(token)])
      .then(([loadedParts, loadedCategories]) => {
        if (!isActive) {
          return;
        }

        setParts(loadedParts);
        setCategories(loadedCategories);
        setPageError(null);
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        setParts([]);
        setCategories([]);
        setPageError(error instanceof ApiError ? error.message : "Could not load parts.");
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [token]);

  const totalUnitsOnHand = parts.reduce((total, part) => total + part.stockQuantity, 0);
  const lowStockCount = parts.filter((part) => part.stockQuantity <= part.reorderLevel).length;
  const inventoryCost = parts.reduce((total, part) => total + part.costPrice * part.stockQuantity, 0);

  const handleCreateMode = () => { if (!isAdmin) return; setEditPart(null); setConfirmDeleteId(null); };
  const handleEdit = (part: Part) => { if (!isAdmin) return; setEditPart(part); setConfirmDeleteId(null); };

  const handleDelete = async (partId: number) => {
    if (!isAdmin) return;
    if (!token) {
      toast.error("Your session expired. Sign in again.");
      return;
    }

    try {
      setDeleting(true);
      await api.deletePart(token, partId);
      setParts((current) => current.filter((part) => part.partId !== partId));
      if (editPart?.partId === partId) setEditPart(null);
      toast.success("Part deleted");
    } catch (error: unknown) {
      toast.error(getMutationErrorMessage(error, "Failed to delete part"));
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  const handleSavedPart = (savedPart: Part) => {
    setParts((current) => {
      const existingIndex = current.findIndex((part) => part.partId === savedPart.partId);

      if (existingIndex === -1) {
        return [savedPart, ...current].sort((left, right) => left.partName.localeCompare(right.partName));
      }

      const next = [...current];
      next[existingIndex] = savedPart;
      return next.sort((left, right) => left.partName.localeCompare(right.partName));
    });
  };

  if (isLoading) {
    return (
      <PageShell>
        <SkeletonCard />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Inventory Workspace"
        title="Parts Management"
        description={isAdmin ? "Create new parts, surface low-stock items, and update pricing." : "Review stock levels, pricing, and low-stock pressure."}
        actions={isAdmin ? (
          <ActionButton icon={Plus} onClick={handleCreateMode}>
            {editPart ? "Create another part" : "New part"}
          </ActionButton>
        ) : undefined}
      />

      {pageError ? <div className="bg-danger-50 border border-danger-100 text-danger-700 rounded-lg p-3 text-sm">{pageError}</div> : null}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total SKUs" value={formatNumber(parts.length)} note="Distinct parts tracked." />
        <StatCard label="Low-stock items" value={formatNumber(lowStockCount)} note="At or below reorder level." accent />
        <StatCard label="Units on hand" value={formatNumber(totalUnitsOnHand)} note="Total sellable stock." />
        <StatCard label="Inventory cost" value={formatCurrency(inventoryCost)} note="Cost basis of stock on hand." />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[20rem_1fr] gap-6 items-start">
        <Card
          header={
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                {isAdmin ? (editPart ? "Edit selected part" : "Create a new part") : "Read-only access"}
              </p>
              <h2 className="text-base font-semibold text-on-surface mt-1">
                {isAdmin ? (editPart ? editPart.partName : "Part setup") : "Inventory overview"}
              </h2>
              <p className="text-sm text-on-surface-variant">
                {isAdmin
                  ? editPart
                    ? "Update stock thresholds, pricing, and descriptions."
                    : "Add a SKU, baseline cost, sale price, and reorder target."
                  : "Staff can review inventory but catalogue changes are admin-only."}
              </p>
            </div>
          }
        >
          {isAdmin ? (
            <PartForm editPart={editPart} onClose={handleCreateMode} categories={categories} onSaved={handleSavedPart} />
          ) : (
            <div className="space-y-3 text-sm text-on-surface-variant">
              <div className="flex gap-3">
                <span className="w-28 text-on-surface-variant shrink-0">Access level</span>
                <span>Read-only inventory access</span>
              </div>
              <div className="flex gap-3">
                <span className="w-28 text-on-surface-variant shrink-0">Available actions</span>
                <span>Review stock, price, category, and reorder info</span>
              </div>
              <div className="flex gap-3">
                <span className="w-28 text-on-surface-variant shrink-0">Restricted actions</span>
                <span>Create, edit, and delete remain admin-only</span>
              </div>
            </div>
          )}
        </Card>

        <Card
          header={
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">Inventory List</p>
              <h2 className="text-base font-semibold text-on-surface mt-1">
                {parts.length === 0 ? "No parts recorded yet" : "Review current parts"}
              </h2>
              <p className="text-sm text-on-surface-variant">
                {parts.length === 0
                  ? "Start with the setup panel to create your first part entry."
                  : `${formatNumber(parts.length)} part${parts.length === 1 ? "" : "s"} tracked.`}
              </p>
            </div>
          }
        >
          {parts.length === 0 ? (
            <p className="text-sm text-on-surface-variant text-center py-8">No parts found yet.</p>
          ) : (
            <div className="space-y-3">
              {parts.map((part) => {
                const isLowStock = part.stockQuantity <= part.reorderLevel;
                const isPendingDelete = confirmDeleteId === part.partId;

                return (
                  <div key={part.partId} className="rounded-lg ring-1 ring-white/[0.06] bg-surface-container-lowest p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-on-surface">{part.partName}</h3>
                          <Badge variant={isLowStock ? (part.stockQuantity === 0 ? "danger" : "warning") : "success"}>
                            {isLowStock ? (part.stockQuantity === 0 ? "Out of stock" : "Reorder soon") : "Healthy"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                          <span className="font-mono">{part.partNumber}</span>
                          <span aria-hidden="true">/</span>
                          <span>{part.categoryName ?? "Uncategorized"}</span>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-2 shrink-0">
                          <ActionButton tone="secondary" size="sm" icon={Edit3} onClick={() => handleEdit(part)}>
                            Edit
                          </ActionButton>
                          <ActionButton tone="danger" size="sm" icon={Trash2} onClick={() => setConfirmDeleteId(part.partId)} disabled={deleting && isPendingDelete}>
                            Delete
                          </ActionButton>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-on-surface-variant">Unit price</span>
                        <p className="font-semibold text-on-surface">{formatCurrency(part.unitPrice)}</p>
                      </div>
                      <div>
                        <span className="text-on-surface-variant">Cost price</span>
                        <p className="font-semibold text-on-surface">{formatCurrency(part.costPrice)}</p>
                      </div>
                      <div>
                        <span className="text-on-surface-variant">Stock</span>
                        <p className="font-semibold text-on-surface">{formatNumber(part.stockQuantity)}</p>
                      </div>
                      <div>
                        <span className="text-on-surface-variant">Reorder level</span>
                        <p className="font-semibold text-on-surface">{formatNumber(part.reorderLevel)}</p>
                      </div>
                    </div>

                    {part.description && (
                      <p className="text-xs text-on-surface-variant">{part.description}</p>
                    )}

                    {isPendingDelete && (
                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
                        <p className="text-xs text-on-surface-variant">Delete {part.partName}? This cannot be undone.</p>
                        <div className="flex items-center gap-2">
                          <ActionButton tone="danger" size="sm" onClick={() => handleDelete(part.partId)} disabled={deleting}>
                            {deleting ? "Deleting..." : "Confirm delete"}
                          </ActionButton>
                          <ActionButton tone="secondary" size="sm" onClick={() => setConfirmDeleteId(null)} disabled={deleting}>
                            Keep
                          </ActionButton>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
