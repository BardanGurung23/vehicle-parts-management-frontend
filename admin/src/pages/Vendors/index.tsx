import { useMemo, useState } from "react";
import { Plus, Edit3, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";
import {
  useGetAllVendorsQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
} from "../../redux/services/vendors";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { DataTable, type Column } from "../../shared/components/DataTable";
import { Field } from "../../shared/components/Field";
import { ActionButton } from "../../shared/components/ActionButton";
import { SkeletonCard } from "../../shared/components/Skeleton";
import { Modal, ConfirmDialog } from "../../shared/components/Modal";
import { Toolbar } from "../../shared/components/Toolbar";
import { SearchInput } from "../../shared/components/SearchInput";
import { EmptyState } from "../../shared/components/EmptyState";
import { FormSection } from "../../shared/components/FormSection";
import type { Vendor, CreateVendorRequest } from "../../app/types";

const defaultForm: CreateVendorRequest = {
  vendorName: "",
  contactPerson: "",
  phoneNumber: "",
  email: "",
  address: "",
};

export default function Vendors() {
  const { data: vendors = [], isLoading, refetch } = useGetAllVendorsQuery();
  const [createVendor, { isLoading: creating }] = useCreateVendorMutation();
  const [updateVendor, { isLoading: updating }] = useUpdateVendorMutation();
  const [deleteVendor, { isLoading: deleting }] = useDeleteVendorMutation();

  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<CreateVendorRequest>(defaultForm);
  const [confirmDeleteVendor, setConfirmDeleteVendor] = useState<Vendor | null>(null);

  const [search, setSearch] = useState("");

  const filteredVendors = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter((vendor) => {
      const haystack = [
        vendor.vendorName,
        vendor.contactPerson ?? "",
        vendor.phoneNumber ?? "",
        vendor.email ?? "",
        vendor.address ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [vendors, search]);

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingVendor(null);
    setForm(defaultForm);
  };

  const openCreate = () => {
    setEditingVendor(null);
    setForm(defaultForm);
    setIsFormOpen(true);
  };

  const openEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setForm({
      vendorName: vendor.vendorName,
      contactPerson: vendor.contactPerson || "",
      phoneNumber: vendor.phoneNumber || "",
      email: vendor.email || "",
      address: vendor.address || "",
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (editingVendor) {
        await updateVendor({ id: editingVendor.vendorId, body: form }).unwrap();
        toast.success("Vendor updated");
      } else {
        await createVendor(form).unwrap();
        toast.success("Vendor created");
      }
      closeForm();
      refetch();
    } catch {
      toast.error("Could not save the vendor.");
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteVendor) return;
    try {
      await deleteVendor(confirmDeleteVendor.vendorId).unwrap();
      toast.success("Vendor deleted");
      refetch();
    } catch {
      toast.error("Could not delete the vendor.");
    } finally {
      setConfirmDeleteVendor(null);
    }
  };

  const columns: Column<Vendor>[] = [
    {
      key: "name",
      header: "Vendor",
      cell: (row) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--md-sys-color-on-surface)] truncate">
            {row.vendorName}
          </p>
          <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] truncate">
            {row.contactPerson || "No contact recorded"}
          </p>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      cell: (row) => (
        <span className="text-[var(--md-sys-color-on-surface)] tabular">
          {row.phoneNumber || "—"}
        </span>
      ),
      width: "160px",
    },
    {
      key: "email",
      header: "Email",
      cell: (row) => (
        <span className="text-[var(--md-sys-color-on-surface)] truncate block">
          {row.email || "—"}
        </span>
      ),
    },
    {
      key: "address",
      header: "Address",
      cell: (row) => (
        <span className="text-[var(--md-sys-color-on-surface-variant)] truncate block">
          {row.address || "—"}
        </span>
      ),
    },
    {
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
            aria-label={`Edit ${row.vendorName}`}
          >
            Edit
          </ActionButton>
          <ActionButton
            tone="ghost"
            size="sm"
            icon={Trash2}
            onClick={() => setConfirmDeleteVendor(row)}
            aria-label={`Delete ${row.vendorName}`}
          >
            <span className="sr-only">Delete</span>
          </ActionButton>
        </div>
      ),
    },
  ];

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
        title="Vendors"
        description={`${vendors.length} supplier${vendors.length === 1 ? "" : "s"}`}
        actions={
          <ActionButton icon={Plus} onClick={openCreate}>
            New vendor
          </ActionButton>
        }
      />

      <Card bodyless>
        <div className="px-5 py-3 border-b border-[var(--md-sys-color-outline-variant)]">
          <Toolbar
            leading={
              <div className="w-full sm:w-72">
                <SearchInput
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search vendors"
                  onClear={() => setSearch("")}
                  size="sm"
                />
              </div>
            }
          />
        </div>
        {filteredVendors.length === 0 ? (
          <div className="p-5">
            <EmptyState
              embedded
              icon={Building2}
              title={vendors.length === 0 ? "No vendors yet" : "No matches"}
              description={
                vendors.length === 0
                  ? "Add your first supplier to start recording purchases."
                  : "Try a different search term."
              }
              action={
                vendors.length === 0 ? (
                  <ActionButton icon={Plus} onClick={openCreate}>Add a vendor</ActionButton>
                ) : null
              }
            />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredVendors}
            keyExtractor={(row) => row.vendorId}
            caption="Vendors"
          />
        )}
      </Card>

      <Modal
        open={isFormOpen}
        onClose={closeForm}
        size="md"
        title={editingVendor ? "Edit vendor" : "New vendor"}
        description={
          editingVendor
            ? "Update supplier contact details."
            : "Record a supplier so you can attach purchase invoices."
        }
        footer={
          <>
            <ActionButton tone="secondary" onClick={closeForm} disabled={creating || updating}>
              Cancel
            </ActionButton>
            <ActionButton
              type="submit"
              form="vendor-form"
              isLoading={creating || updating}
            >
              {editingVendor ? "Save changes" : "Create vendor"}
            </ActionButton>
          </>
        }
      >
        <form id="vendor-form" onSubmit={handleSubmit} className="space-y-5">
          <FormSection title="Vendor details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Field label="Name" required htmlFor="vendor-name">
                  <input
                    id="vendor-name"
                    type="text"
                    required
                    placeholder="Acme Auto Parts"
                    value={form.vendorName}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, vendorName: e.target.value }))
                    }
                  />
                </Field>
              </div>
              <Field label="Contact person" htmlFor="vendor-contact">
                <input
                  id="vendor-contact"
                  type="text"
                  placeholder="Optional"
                  value={form.contactPerson}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, contactPerson: e.target.value }))
                  }
                />
              </Field>
              <Field label="Phone" htmlFor="vendor-phone">
                <input
                  id="vendor-phone"
                  type="tel"
                  placeholder="+1 555 123 4567"
                  value={form.phoneNumber}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, phoneNumber: e.target.value }))
                  }
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Email" htmlFor="vendor-email">
                  <input
                    id="vendor-email"
                    type="email"
                    placeholder="parts@acme.com"
                    value={form.email}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Address" htmlFor="vendor-address">
                  <textarea
                    id="vendor-address"
                    rows={3}
                    placeholder="Optional"
                    value={form.address}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, address: e.target.value }))
                    }
                  />
                </Field>
              </div>
            </div>
          </FormSection>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmDeleteVendor !== null}
        onClose={() => setConfirmDeleteVendor(null)}
        onConfirm={handleDelete}
        title="Delete this vendor?"
        message={
          confirmDeleteVendor
            ? `“${confirmDeleteVendor.vendorName}” will be removed. Existing purchase invoices keep their snapshot.`
            : ""
        }
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        tone="danger"
        isLoading={deleting}
      />
    </PageShell>
  );
}
