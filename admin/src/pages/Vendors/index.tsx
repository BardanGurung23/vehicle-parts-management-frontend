import { useState } from "react";
import { Plus, Edit3, Trash2 } from "lucide-react";
import { useGetAllVendorsQuery, useCreateVendorMutation, useUpdateVendorMutation, useDeleteVendorMutation } from "../../redux/services/vendors";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { DataTable, type Column } from "../../shared/components/DataTable";
import { Field } from "../../shared/components/Field";
import { ActionButton } from "../../shared/components/ActionButton";
import { SkeletonCard } from "../../shared/components/Skeleton";
import { toast } from "react-toastify";
import type { Vendor, CreateVendorRequest } from "../../app/types";

const defaultForm: CreateVendorRequest = { vendorName: "", contactPerson: "", phoneNumber: "", email: "", address: "" };

export default function Vendors() {
  const { data: vendors = [], isLoading, refetch } = useGetAllVendorsQuery();
  const [createVendor] = useCreateVendorMutation();
  const [updateVendor] = useUpdateVendorMutation();
  const [deleteVendor] = useDeleteVendorMutation();
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [form, setForm] = useState<CreateVendorRequest>(defaultForm);

  const resetForm = () => { setForm(defaultForm); setEditingVendor(null); setShowForm(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVendor) { await updateVendor({ id: editingVendor.vendorId, body: form }).unwrap(); toast.success("Vendor updated successfully!"); }
      else { await createVendor(form).unwrap(); toast.success("Vendor created successfully!"); }
      resetForm(); refetch();
    } catch { toast.error("Failed to save vendor."); }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setForm({ vendorName: vendor.vendorName, contactPerson: vendor.contactPerson || "", phoneNumber: vendor.phoneNumber || "", email: vendor.email || "", address: vendor.address || "" });
    setShowForm(true);
  };

  const handleDelete = async (vendorId: number) => {
    try { await deleteVendor(vendorId).unwrap(); toast.success("Vendor deleted successfully!"); refetch(); }
    catch { toast.error("Failed to delete vendor."); }
  };

  type VendorRow = Vendor;

  const columns: Column<VendorRow>[] = [
    { key: "id", header: "ID", cell: (row) => `#${row.vendorId}` },
    { key: "name", header: "Vendor Name", cell: (row) => row.vendorName },
    { key: "contact", header: "Contact Person", cell: (row) => row.contactPerson || "-" },
    { key: "phone", header: "Phone", cell: (row) => row.phoneNumber || "-" },
    { key: "email", header: "Email", cell: (row) => row.email || "-" },
    { key: "address", header: "Address", cell: (row) => row.address || "-" },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <ActionButton size="sm" tone="secondary" icon={Edit3} onClick={() => handleEdit(row)}>Edit</ActionButton>
          <ActionButton size="sm" tone="danger" icon={Trash2} onClick={() => handleDelete(row.vendorId)}>Delete</ActionButton>
        </div>
      ),
    },
  ];

  if (isLoading) return <PageShell><SkeletonCard /></PageShell>;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Management"
        title="Vendors"
        description={`${vendors.length} vendor${vendors.length !== 1 ? "s" : ""}`}
        actions={
          <ActionButton icon={Plus} onClick={() => { resetForm(); setShowForm(!showForm); }}>
            {showForm ? "Cancel" : "Add Vendor"}
          </ActionButton>
        }
      />

      {showForm && (
        <Card
          header={<h3 className="text-base font-semibold text-on-surface">{editingVendor ? "Edit Vendor" : "Add New Vendor"}</h3>}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Vendor Name" required htmlFor="vendor-name">
                <input id="vendor-name" className="input" type="text" required value={form.vendorName}
                  onChange={(e) => setForm((prev) => ({ ...prev, vendorName: e.target.value }))} />
              </Field>
              <Field label="Contact Person" htmlFor="vendor-contact">
                <input id="vendor-contact" className="input" type="text" value={form.contactPerson}
                  onChange={(e) => setForm((prev) => ({ ...prev, contactPerson: e.target.value }))} />
              </Field>
              <Field label="Phone Number" htmlFor="vendor-phone">
                <input id="vendor-phone" className="input" type="text" value={form.phoneNumber}
                  onChange={(e) => setForm((prev) => ({ ...prev, phoneNumber: e.target.value }))} />
              </Field>
              <Field label="Email" htmlFor="vendor-email">
                <input id="vendor-email" className="input" type="email" value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Address" htmlFor="vendor-address">
                  <textarea id="vendor-address" className="input" rows={3} value={form.address}
                    onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} />
                </Field>
              </div>
            </div>
            <ActionButton type="submit">{editingVendor ? "Update Vendor" : "Create Vendor"}</ActionButton>
          </form>
        </Card>
      )}

      <DataTable columns={columns} data={vendors} keyExtractor={(r) => r.vendorId} emptyMessage="No vendors found." />
    </PageShell>
  );
}
