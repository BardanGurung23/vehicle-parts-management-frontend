import { useEffect, useState } from "react";
import { useGetCurrentCustomerQuery, useUpdateProfileMutation } from "../../redux/services/customers";
import { toast } from "react-toastify";

export function ProfilePage() {
  const { data: customer, isLoading, error } = useGetCurrentCustomerQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (customer) {
      setFullName(customer.fullName);
      setPhoneNumber(customer.phoneNumber);
      setAddress(customer.address || "");
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateProfile({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        address: address.trim() || undefined,
      }).unwrap();

      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile. Please try again.");
    }
  };

  if (isLoading) return <p className="p-4">Loading profile...</p>;
  if (error || !customer) return <p className="p-4 text-red-600">Failed to load profile.</p>;

  return (
    <div className="p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium">{customer.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Customer Since</p>
            <p className="font-medium">
              {new Date(customer.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-xl font-bold mb-4">Edit Profile</h2>

        <div>
          <label className="block text-sm font-medium mb-1">
            Full Name *
          </label>
          <input
            type="text"
            required
            className="w-full border rounded p-2"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            required
            className="w-full border rounded p-2"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Address (Optional)
          </label>
          <textarea
            className="w-full border rounded p-2"
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your address..."
          />
        </div>

        <button
          type="submit"
          className="button button--primary"
          disabled={isUpdating}
        >
          {isUpdating ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
