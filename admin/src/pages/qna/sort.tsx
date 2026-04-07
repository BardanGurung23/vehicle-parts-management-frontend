import DragableTable from "@/components/Table/dragableTable";
import { useListAllQnaQuery } from "@/redux/services/qna";
import { MdEditSquare } from "react-icons/md";
import DeleteModal from "@/components/DeleteModal";
import { checkAccess } from "@/utils/accessHelper";
import { useState } from "react";

export default function Sort() {
  const accessList = checkAccess("Layout");

  const [query, setQuery] = useState({ page: 1, limit: 10 });

  const [open, setOpen] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [editId, setEditId] = useState<number | null>(null);

  const {
    data: allQna,
    isSuccess: success,
    refetch,
  } = useListAllQnaQuery(query);

  const handleNewUser = (id: number | null) => {
    setEditId(id);
    setIsOpen(true);
  };

  const handleDeleteTrigger = (id: number) => {};

  const handleDelete = () => {};

  const tableData =
    success && allQna?.data?.data
      ? allQna?.data?.data.map(({ id, question, pathName, order }) => [
          order,
          id,
          question,
          pathName,
          <div
            key={id}
            className="flex items-center justify-center cursor-pointer gap-[0.5rem]"
          >
            {accessList.includes("view") && (
              <MdEditSquare
                size={18}
                className="text-[#0090DD]"
                onClick={() => handleNewUser(id)}
              />
            )}
            {accessList.includes("view") && (
              <DeleteModal
                open={open}
                setOpen={setOpen}
                handleDeleteTrigger={() => handleDeleteTrigger(id)}
                handleConfirmDelete={handleDelete}
              />
            )}
          </div>,
        ])
      : [];

  return <>{success && <DragableTable tableData={tableData} />}</>;
}
