import { useState } from "react";
import { MdEditSquare } from "react-icons/md";
import { FiTrash2 } from "react-icons/fi";
import { useGetPartsQuery, useDeletePartMutation, Part } from "@/redux/services/parts";
import Drawer from "@/components/Drawer";
import PartForm from "./PartForm";
import Spinner from "@/components/Spinner";
import { toast } from "react-toastify";

export default function Parts() {
  const { data: parts = [], isLoading } = useGetPartsQuery();
  const [deletePart, { isLoading: deleting }] = useDeletePartMutation();
  const [isOpen, setIsOpen] = useState(false);
  const [editPart, setEditPart] = useState<Part | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const handleAdd = () => {
    setEditPart(null);
    setIsOpen(true);
  };

  const handleEdit = (part: Part) => {
    setEditPart(part);
    setIsOpen(true);
  };

  const handleDelete = async (partId: number) => {
    try {
      await deletePart(partId).unwrap();
      toast.success("Part deleted");
    } catch (err: any) {
      toast.error(err?.data?.title ?? "Failed to delete part");
    } finally {
      setConfirmDeleteId(null);
    }
  };

  if (isLoading) return <Spinner className="flex justify-center items-center h-full" />;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Parts Management</h1>
          <p className="text-sm text-gray-500">Manage inventory, pricing and stock levels</p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition"
        >
          + Add Part
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Part No.</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-right">Unit Price</th>
              <th className="px-4 py-3 text-right">Cost Price</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-right">Reorder</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {parts.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-10 text-gray-400">
                  No parts found. Add one to get started.
                </td>
              </tr>
            ) : (
              parts.map((part, index) => (
                <tr key={part.partId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{index + 1}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{part.partNumber}</td>
                  <td className="px-4 py-3 font-medium">{part.partName}</td>
                  <td className="px-4 py-3 text-gray-500">{part.categoryName ?? "—"}</td>
                  <td className="px-4 py-3 text-right">${part.unitPrice.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">${part.costPrice.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${part.stockQuantity <= part.reorderLevel ? "text-red-500" : "text-green-600"}`}>
                      {part.stockQuantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">{part.reorderLevel}</td>
                  <td className="px-4 py-3 text-center">
                    {confirmDeleteId === part.partId ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleDelete(part.partId)}
                          disabled={deleting}
                          className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => handleEdit(part)} title="Edit">
                          <MdEditSquare size={18} className="text-blue-500 hover:text-blue-700 cursor-pointer" />
                        </button>
                        <button onClick={() => setConfirmDeleteId(part.partId)} title="Delete">
                          <FiTrash2 size={16} className="text-red-400 hover:text-red-600 cursor-pointer" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Drawer isOpen={isOpen} setIsOpen={setIsOpen} width="w-full lg:w-[45%]">
        <PartForm editPart={editPart} onClose={() => setIsOpen(false)} />
      </Drawer>
    </>
  );
}
