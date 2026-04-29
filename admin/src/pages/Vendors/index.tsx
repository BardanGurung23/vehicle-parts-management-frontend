import { useState } from "react";
import PageTitle from "../../components/PageTitle";
import PageHeader from "../../components/PageHeader";
import { useGetAllVendorsQuery, useCreateVendorMutation, useUpdateVendorMutation, useDeleteVendorMutation } from "../../redux/services/vendors";
import Table from "../../components/Table";
import { toast } from "react-toastify";
import type { Vendor, CreateVendorRequest } from "../../app/types";

export default function Vendors() {
  const { data: vendors = [], isLoading, refetch } = useGetAllVendorsQuery();
  const [createVendor] = useCreateVendorMutation();
  const [updateVendor] = useUpdateVendorMutation();
  const [deleteVendor] = useDeleteVendorMutation();
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [form, setForm] = useState<CreateVendorRequest>({
    vendorName: "",
    contactPerson: "",
    phoneNumber: "",
    email: "",
    address: "",
  });

  const resetForm = () => {
    setForm({ vendorName: "", contactPerson: "", phoneNumber: "", email: "", address: "" });
    setEditingVendor(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVendor) {
        await updateVendor({ id: editingVendor.vendorId, body: form }).unwrap();
        toast.success("Vendor updated successfully!");
      } else {
        await createVendor(form).unwrap();
        toast.success("Vendor created successfully!");
      }
      resetForm();
      refetch();
    } catch {
      toast.error("Failed to save vendor.");
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setForm({
      vendorName: vendor.vendorName,
      contactPerson: vendor.contactPerson || "",
      phoneNumber: vendor.phoneNumber || "",
      email: vendor.email || "",
      address: vendor.address || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (vendorId: number) => {
    if (!confirm("Are you sure you want to delete this vendor?")) return;
    try {
      await deleteVendor(vendorId).unwrap();
      toast.success("Vendor deleted successfully!");
      refetch();
    } catch {
      toast.error("Failed to delete vendor.");
    }
  };

  const headers = ["ID", "Vendor Name", "Contact Person", "Phone", "Email", "Address", "Actions"];

  const tableData = vendors.map((v) => [
    v.vendorId,
    v.vendorName,
    v.contactPerson || "-",
    v.phoneNumber || "-",
    v.email || "-",
    v.address || "-",
    <div key={`actions-${v.vendorId}`} className="flex gap-2">
      <button
        type="button"
        className="button button--secondary text-xs"
        onClick={() => handleEdit(v)}
      >
        Edit
      </button>
      <button
        type="button"
        className="button button--danger text-xs"
        onClick={() => handleDelete(v.vendorId)}
      >
        Delete
      </button>
    </div>,
  ]);

  if (isLoading) {
    return <p className="loading-screen">Loading vendors...</p>;
  }

  return (
    <div>
      <PageTitle title="Vendors" />
      <PageHeader
        title="Vendors"
        subtitle={`${vendors.length} vendor${vendors.length !== 1 ? "s" : ""}`}
      />
      <div className="mb-4">
        <button
          type="button"
          className="button"
          onClick={() => { resetForm(); setShowForm(!showForm); }}
        >
          {showForm ? "Cancel" : "Add Vendor"}
        </button>
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="card__header">
            <h3>{editingVendor ? "Edit Vendor" : "Add New Vendor"}</h3>
          </div>
          <form onSubmit={handleSubmit} className="form-grid form-grid--two-columns">
            <div>
              <label className="field__label">Vendor Name *</label>
              <input
                className="input"
                type="text"
                required
                value={form.vendorName}
                onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
              />
            </div>
            <div>
              <label className="field__label">Contact Person</label>
              <input
                className="input"
                type="text"
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
              />
            </div>
            <div>
              <label className="field__label">Phone Number</label>
              <input
                className="input"
                type="text"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="field__label">Email</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="form-grid__full-width">
              <label className="field__label">Address</label>
              <textarea
                className="input input--textarea"
                rows={3}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="form-grid__full-width">
              <button type="submit" className="button">
                {editingVendor ? "Update Vendor" : "Create Vendor"}
              </button>
            </div>
          </form>
        </div>
      )}

      {vendors.length === 0 ? (
        <p className="empty-state">No vendors found. Add one to get started.</p>
      ) : (
        <Table isSN headers={headers} data={tableData} />
      )}
    </div>
  );
}
