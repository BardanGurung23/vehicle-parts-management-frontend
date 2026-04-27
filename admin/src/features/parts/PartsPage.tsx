import { useState } from "react";
import { useGetPartsQuery, useDeletePartMutation, Part } from "@/redux/services/parts";
import { useAuth } from "../../app/auth";
import PartForm from "./PartForm";
import { toast } from "react-toastify";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-US");

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function asMessage(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getMutationErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const data = (error as { data?: unknown }).data;
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const payload = data as { detail?: unknown; title?: unknown; message?: unknown };
  return asMessage(payload.detail) ?? asMessage(payload.message) ?? asMessage(payload.title) ?? fallback;
}

export default function PartsPage() {
  const { isAdmin } = useAuth();
  const { data: parts = [], isLoading } = useGetPartsQuery();
  const [deletePart, { isLoading: deleting }] = useDeletePartMutation();
  const [editPart, setEditPart] = useState<Part | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const totalUnitsOnHand = parts.reduce((total, part) => total + part.stockQuantity, 0);
  const lowStockCount = parts.filter((part) => part.stockQuantity <= part.reorderLevel).length;
  const inventoryCost = parts.reduce(
    (total, part) => total + part.costPrice * part.stockQuantity,
    0,
  );

  const handleCreateMode = () => {
    if (!isAdmin) {
      return;
    }

    setEditPart(null);
    setConfirmDeleteId(null);
  };

  const handleEdit = (part: Part) => {
    if (!isAdmin) {
      return;
    }

    setEditPart(part);
    setConfirmDeleteId(null);
  };

  const handleDelete = async (partId: number) => {
    if (!isAdmin) {
      return;
    }

    try {
      await deletePart(partId).unwrap();
      if (editPart?.partId === partId) {
        setEditPart(null);
      }
      toast.success("Part deleted");
    } catch (error: unknown) {
      toast.error(getMutationErrorMessage(error, "Failed to delete part"));
    } finally {
      setConfirmDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <p>Loading parts management...</p>
      </div>
    );
  }

  return (
    <section className="page-stack">
      <article className="card parts-overview">
        <div className="parts-overview__top">
          <div className="card__header">
            <p className="eyebrow">Inventory Workspace</p>
            <h2>Keep stock, cost, and pricing aligned</h2>
            <p className="card__copy">
              {isAdmin
                ? "Create new parts, surface low-stock items, and update pricing from a single management view."
                : "Review stock levels, pricing, and low-stock pressure from the same inventory workspace."}
            </p>
          </div>

          {isAdmin ? (
            <button type="button" className="button" onClick={handleCreateMode}>
              {editPart ? "Create another part" : "New part"}
            </button>
          ) : null}
        </div>

        <dl className="parts-stats">
          <div>
            <dt>Total SKUs</dt>
            <dd>{formatNumber(parts.length)}</dd>
          </div>
          <div>
            <dt>Low-stock items</dt>
            <dd>{formatNumber(lowStockCount)}</dd>
          </div>
          <div>
            <dt>Units on hand</dt>
            <dd>{formatNumber(totalUnitsOnHand)}</dd>
          </div>
          <div>
            <dt>Inventory cost</dt>
            <dd>{formatCurrency(inventoryCost)}</dd>
          </div>
        </dl>
      </article>

      <div className="parts-layout">
        <article className="card parts-form-card">
          <div className="card__header">
            <p className="eyebrow">{isAdmin ? (editPart ? "Edit selected part" : "Create a new part") : "Read-only access"}</p>
            <h2>{isAdmin ? (editPart ? editPart.partName : "Part setup") : "Inventory overview"}</h2>
            <p className="card__copy">
              {isAdmin
                ? editPart
                  ? "Update stock thresholds, pricing, and descriptions without leaving the inventory list."
                  : "Add a SKU, baseline cost, sale price, and reorder target in one place."
                : "Staff can review inventory here, while catalogue changes stay restricted to admin accounts."}
            </p>
          </div>

          {isAdmin ? (
            <PartForm editPart={editPart} onClose={handleCreateMode} />
          ) : (
            <div className="dashboard-panel__section">
              <dl className="detail-list">
                <div>
                  <dt>Access level</dt>
                  <dd>Read-only inventory access</dd>
                </div>
                <div>
                  <dt>Available actions</dt>
                  <dd>Review stock, price, category, and reorder information</dd>
                </div>
                <div>
                  <dt>Restricted actions</dt>
                  <dd>Create, edit, and delete remain admin-only</dd>
                </div>
              </dl>
            </div>
          )}
        </article>

        <section className="card parts-list-card">
          <div className="parts-list-card__header">
            <div className="card__header">
              <p className="eyebrow">Inventory List</p>
              <h2>{parts.length === 0 ? "No parts recorded yet" : "Review current parts"}</h2>
              <p className="card__copy">
                {parts.length === 0
                  ? "Start with the setup panel to create your first part entry."
                  : `${formatNumber(parts.length)} part${parts.length === 1 ? "" : "s"} currently tracked across the catalog.`}
              </p>
            </div>
          </div>

          {parts.length === 0 ? (
            <p className="empty-state">
              No parts found yet. Create one from the setup panel to start tracking
              stock and reorder levels.
            </p>
          ) : (
            <div className="parts-list">
              {parts.map((part) => {
                const isLowStock = part.stockQuantity <= part.reorderLevel;
                const isPendingDelete = confirmDeleteId === part.partId;

                return (
                  <article key={part.partId} className="parts-item-card">
                    <div className="parts-item-card__top">
                      <div className="parts-item-card__identity">
                        <div className="parts-item-card__title-row">
                          <h3>{part.partName}</h3>
                          <span
                            className={
                              isLowStock
                                ? "status-pill status-pill--danger"
                                : "status-pill status-pill--success"
                            }
                          >
                            {isLowStock
                              ? part.stockQuantity === 0
                                ? "Out of stock"
                                : "Reorder soon"
                              : "Healthy stock"}
                          </span>
                        </div>

                        <p className="parts-item-card__subtitle">
                          <span className="parts-item-card__part-number">{part.partNumber}</span>
                          <span aria-hidden="true">/</span>
                          <span>{part.categoryName ?? "Uncategorized"}</span>
                        </p>
                      </div>

                      {isAdmin ? (
                        <div className="parts-item-card__actions">
                          <button
                            type="button"
                            className="button button--secondary"
                            onClick={() => handleEdit(part)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="button button--danger"
                            onClick={() => setConfirmDeleteId(part.partId)}
                            disabled={deleting && isPendingDelete}
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </div>

                    <dl className="parts-item-card__meta">
                      <div>
                        <dt>Unit price</dt>
                        <dd>{formatCurrency(part.unitPrice)}</dd>
                      </div>
                      <div>
                        <dt>Cost price</dt>
                        <dd>{formatCurrency(part.costPrice)}</dd>
                      </div>
                      <div>
                        <dt>Stock</dt>
                        <dd>{formatNumber(part.stockQuantity)}</dd>
                      </div>
                      <div>
                        <dt>Reorder level</dt>
                        <dd>{formatNumber(part.reorderLevel)}</dd>
                      </div>
                    </dl>

                    {part.description ? (
                      <p className="parts-item-card__description">{part.description}</p>
                    ) : null}

                    {isAdmin && isPendingDelete ? (
                      <div className="parts-item-card__confirm">
                        <p>Delete {part.partName}? This action cannot be undone.</p>
                        <div className="parts-item-card__confirm-actions">
                          <button
                            type="button"
                            className="button button--danger"
                            onClick={() => handleDelete(part.partId)}
                            disabled={deleting}
                          >
                            {deleting ? "Deleting..." : "Confirm delete"}
                          </button>
                          <button
                            type="button"
                            className="button button--secondary"
                            onClick={() => setConfirmDeleteId(null)}
                            disabled={deleting}
                          >
                            Keep part
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}