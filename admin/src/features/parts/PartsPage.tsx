import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Edit3, Package, AlertTriangle, Layers, Coins } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError, resolveBackendAssetUrl } from "../../app/api";
import { useAuth } from "../../app/auth";
import type { Part, PartCategory } from "../../app/types";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { StatCard } from "../../shared/components/StatCard";
import { Badge } from "../../shared/components/Badge";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import { SkeletonCard } from "../../shared/components/Skeleton";
import { Modal, ConfirmDialog } from "../../shared/components/Modal";
import { Toolbar } from "../../shared/components/Toolbar";
import { SearchInput } from "../../shared/components/SearchInput";
import { Segmented } from "../../shared/components/Segmented";
import { DataTable, type Column } from "../../shared/components/DataTable";
import { EmptyState } from "../../shared/components/EmptyState";
import PartForm from "./PartForm";

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const numberFormatter = new Intl.NumberFormat("en-US");
const formatCurrency = (value: number) => currencyFormatter.format(value);
const formatNumber = (value: number) => numberFormatter.format(value);

function asMessage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
function getMutationErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return asMessage(error.message) ?? fallback;
  if (!error || typeof error !== "object") return fallback;
  const data = (error as { data?: unknown }).data;
  if (!data || typeof data !== "object") return fallback;
  const payload = data as { detail?: unknown; title?: unknown; message?: unknown };
  return asMessage(payload.detail) ?? asMessage(payload.message) ?? asMessage(payload.title) ?? fallback;
}

type StockFilter = "all" | "healthy" | "reorder" | "out";

export default function PartsPage() {
  const { isAdmin, token } = useAuth();
  const [parts, setParts] = useState<Part[]>([]);
  const [categories, setCategories] = useState<PartCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [editPart, setEditPart] = useState<Part | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    let isActive = true;

    void Promise.all([api.getParts(token), api.getPartCategories(token)])
      .then(([loadedParts, loadedCategories]) => {
        if (!isActive) return;
        setParts(loadedParts);
        setCategories(loadedCategories);
        setPageError(null);
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        setParts([]);
        setCategories([]);
        setPageError(error instanceof ApiError ? error.message : "Could not load parts.");
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [token]);

  const totalUnitsOnHand = parts.reduce((total, part) => total + part.stockQuantity, 0);
  const lowStockCount = parts.filter((part) => part.stockQuantity <= part.reorderLevel && part.stockQuantity > 0).length;
  const outOfStockCount = parts.filter((part) => part.stockQuantity === 0).length;
  const inventoryCost = parts.reduce((total, part) => total + part.costPrice * part.stockQuantity, 0);

  const filteredParts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return parts.filter((part) => {
      if (q) {
        const haystack = [part.partName, part.partNumber, part.categoryName ?? ""].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (stockFilter === "healthy" && part.stockQuantity <= part.reorderLevel) return false;
      if (stockFilter === "reorder" && !(part.stockQuantity > 0 && part.stockQuantity <= part.reorderLevel)) return false;
      if (stockFilter === "out" && part.stockQuantity !== 0) return false;
      return true;
    });
  }, [parts, search, stockFilter]);

  const openCreate = () => {
    if (!isAdmin) return;
    setEditPart(null);
    setIsFormOpen(true);
  };
  const openEdit = (part: Part) => {
    if (!isAdmin) return;
    setEditPart(part);
    setIsFormOpen(true);
  };
  const closeForm = () => {
    setIsFormOpen(false);
    setEditPart(null);
  };
  const onSavedPart = (savedPart: Part) => {
    setParts((current) => {
      const existingIndex = current.findIndex((part) => part.partId === savedPart.partId);
      if (existingIndex === -1) {
        return [savedPart, ...current].sort((a, b) => a.partName.localeCompare(b.partName));
      }
      const next = [...current];
      next[existingIndex] = savedPart;
      return next.sort((a, b) => a.partName.localeCompare(b.partName));
    });
    closeForm();
  };

  const handleDelete = async () => {
    if (!isAdmin || confirmDeleteId == null) return;
    if (!token) {
      toast.error("Your session expired. Sign in again.");
      return;
    }
    try {
      setDeleting(true);
      await api.deletePart(token, confirmDeleteId);
      setParts((current) => current.filter((p) => p.partId !== confirmDeleteId));
      toast.success("Part deleted");
    } catch (error: unknown) {
      toast.error(getMutationErrorMessage(error, "Failed to delete part"));
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  const columns: Column<Part>[] = useMemo(() => {
    const base: Column<Part>[] = [
      {
        key: "name",
        header: "Part",
        cell: (row) => {
          const partImage = resolveBackendAssetUrl(row.imageUrl);
          return (
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] flex items-center justify-center">
                {partImage ? (
                  <img src={partImage} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <Package className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--md-sys-color-on-surface)] truncate">{row.partName}</p>
                <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] truncate">
                  <span className="font-mono">{row.partNumber}</span>
                  {row.categoryName ? <span> · {row.categoryName}</span> : null}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        key: "status",
        header: "Status",
        cell: (row) => {
          if (row.stockQuantity === 0) return <Badge variant="danger" dot>Out of stock</Badge>;
          if (row.stockQuantity <= row.reorderLevel) return <Badge variant="warning" dot>Reorder soon</Badge>;
          return <Badge variant="success" dot>Healthy</Badge>;
        },
        width: "150px",
      },
      { key: "stock", header: "Stock", align: "right", cell: (row) => <span className="tabular">{formatNumber(row.stockQuantity)}</span>, width: "90px" },
      { key: "reorder", header: "Reorder", align: "right", cell: (row) => <span className="tabular text-[var(--md-sys-color-on-surface-variant)]">{formatNumber(row.reorderLevel)}</span>, width: "100px" },
      { key: "unit", header: "Unit price", align: "right", cell: (row) => <span className="tabular">{formatCurrency(row.unitPrice)}</span>, width: "120px" },
      { key: "cost", header: "Cost price", align: "right", cell: (row) => <span className="tabular text-[var(--md-sys-color-on-surface-variant)]">{formatCurrency(row.costPrice)}</span>, width: "120px" },
    ];

    if (isAdmin) {
      base.push({
        key: "actions",
        header: "",
        align: "right",
        width: "120px",
        cell: (row) => (
          <div className="flex items-center justify-end gap-1">
            <ActionButton
              tone="ghost"
              size="sm"
              icon={Edit3}
              onClick={() => openEdit(row)}
              aria-label={`Edit ${row.partName}`}
            >
              Edit
            </ActionButton>
            <ActionButton
              tone="ghost"
              size="sm"
              icon={Trash2}
              onClick={() => setConfirmDeleteId(row.partId)}
              aria-label={`Delete ${row.partName}`}
            >
              <span className="sr-only">Delete</span>
            </ActionButton>
          </div>
        ),
      });
    }
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const partBeingDeleted = parts.find((p) => p.partId === confirmDeleteId) ?? null;

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
        title="Parts"
        description={isAdmin ? "Manage SKUs, pricing, and stock thresholds." : "Read-only inventory view."}
        actions={
          isAdmin ? (
            <ActionButton icon={Plus} onClick={openCreate}>New part</ActionButton>
          ) : undefined
        }
      />

      {pageError ? <AlertBox tone="error" message={pageError} dismissible /> : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total SKUs" value={formatNumber(parts.length)} note="Distinct parts" icon={Layers} />
        <StatCard label="Reorder soon" value={formatNumber(lowStockCount)} note="At or below threshold" accent icon={AlertTriangle} />
        <StatCard label="Out of stock" value={formatNumber(outOfStockCount)} note="Zero on hand" icon={Package} />
        <StatCard label="Inventory value" value={formatCurrency(inventoryCost)} note="Cost of stock on hand" icon={Coins} />
      </div>

      <Card bodyless>
        <div className="px-5 py-3 border-b border-[var(--md-sys-color-outline-variant)]">
          <Toolbar
            leading={
              <>
                <div className="w-full sm:w-72">
                  <SearchInput
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, number, or category"
                    onClear={() => setSearch("")}
                    size="sm"
                  />
                </div>
                <Segmented
                  size="sm"
                  ariaLabel="Filter by stock status"
                  value={stockFilter}
                  onChange={setStockFilter}
                  options={[
                    { value: "all", label: "All", count: parts.length },
                    { value: "healthy", label: "Healthy" },
                    { value: "reorder", label: "Reorder" },
                    { value: "out", label: "Out" },
                  ]}
                />
              </>
            }
          />
        </div>
        {filteredParts.length === 0 ? (
          <div className="p-5">
            <EmptyState
              embedded
              icon={Package}
              title={parts.length === 0 ? "No parts tracked yet" : "No matches"}
              description={
                parts.length === 0
                  ? isAdmin
                    ? "Add your first SKU to start tracking inventory."
                    : "Parts will appear here once an admin adds them."
                  : "Adjust the filters or search query."
              }
              action={
                isAdmin && parts.length === 0 ? (
                  <ActionButton icon={Plus} onClick={openCreate}>Add a part</ActionButton>
                ) : null
              }
            />
          </div>
        ) : (
          <div className="bg-[var(--md-sys-color-surface)]">
            <DataTable
              columns={columns}
              data={filteredParts}
              keyExtractor={(row) => row.partId}
              caption="Parts inventory"
            />
          </div>
        )}
      </Card>

      {/* Create / edit modal */}
      <Modal
        open={isFormOpen}
        onClose={closeForm}
        size="lg"
        title={editPart ? "Edit part" : "New part"}
        description={
          editPart
            ? "Update pricing, stock, and metadata."
            : "Add an SKU with cost, sale price, and reorder threshold."
        }
      >
        <PartForm
          editPart={editPart}
          onClose={closeForm}
          categories={categories}
          onSaved={onSavedPart}
        />
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete this part?"
        message={
          partBeingDeleted
            ? `“${partBeingDeleted.partName}” will be removed. Linked sales and invoices keep their snapshot.`
            : "This action cannot be undone."
        }
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        tone="danger"
        isLoading={deleting}
      />
    </PageShell>
  );
}
