import { useState } from "react";
import { MdEditSquare } from "react-icons/md";
import { useGetStaffQuery, StaffUser } from "@/redux/services/staff";
import Drawer from "@/components/Drawer";
import StaffForm from "./StaffForm";
import Spinner from "@/components/Spinner";

export default function Staff() {
  const { data: staffList = [], isLoading } = useGetStaffQuery();
  const [isOpen, setIsOpen] = useState(false);
  const [editUser, setEditUser] = useState<StaffUser | null>(null);

  const handleAddNew = () => {
    setEditUser(null);
    setIsOpen(true);
  };

  const handleEdit = (user: StaffUser) => {
    setEditUser(user);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditUser(null);
  };

  if (isLoading) {
    return <Spinner className="flex justify-center items-center h-full" />;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Staff Management</h1>
          <p className="text-sm text-gray-500">Manage staff accounts and their roles</p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition"
        >
          + Add Staff
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Full Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {staffList.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400">
                  No staff members found. Add one to get started.
                </td>
              </tr>
            ) : (
              staffList.map((user, index) => (
                <tr key={user.userId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                  <td className="px-4 py-3 font-medium">{user.fullName}</td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3 text-gray-600">{user.phoneNumber}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === "Admin"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleEdit(user)} title="Edit Role">
                      <MdEditSquare size={18} className="text-blue-500 hover:text-blue-700 cursor-pointer" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Drawer isOpen={isOpen} setIsOpen={setIsOpen} width="w-full lg:w-[40%]">
        <StaffForm editUser={editUser} onClose={handleClose} />
      </Drawer>
    </>
  );
}
