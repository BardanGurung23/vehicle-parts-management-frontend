import Drawer from "@/components/Drawer";
import PageHeader from "@/components/PageHeader";
import Table from "@/components/Table";
import useTranslation from "@/locale/useTranslation";
import { checkAccess } from "@/utils/accessHelper";
import { useState } from "react";
import { MdEditSquare } from "react-icons/md";
import DeleteModal from "@/components/DeleteModal";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { PaginationType } from "@/types/commonTypes";
import {
  useDeleteQnaByIdMutation,
  useListAllQnaQuery,
} from "@/redux/services/qna";
import AddEditQnaForm from "./AddEditQnaForm";

export default function Seo() {
  const translate = useTranslation();
  const accessList = checkAccess("FAQ");

  // query state
  const [query, setQuery] = useState({ page: 1, limit: 10 });

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [editId, setEditId] = useState<number | null>(null);

  //   for delete operations
  const [open, setOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const {
    data: allQna,
    isSuccess: success,
    refetch,
  } = useListAllQnaQuery(query);
  const [deleteQna] = useDeleteQnaByIdMutation();

  const handleNewUser = (id: number | null) => {
    setEditId(id);
    setIsOpen(true);
  };

  const handleReload = () => {
    refetch();
  };

  const handleDeleteTrigger = (id: number) => {
    setDeleteId(id);
    setOpen(true);
  };

  const handleDelete = async () => {
    try {
      const response = await deleteQna(deleteId).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => {},
      });
    } catch (error) {
      handleError({ error });
    } finally {
      setOpen(false);
    }
  };

  const pagination = {
    page: allQna?.data?.page ?? 1,
    limit: allQna?.data?.limit ?? 0,
    total: allQna?.data?.total ?? 0,
    totalPages: allQna?.data?.totalPages ?? 0,
  };

  const handlePagination = (pagination: PaginationType) => {
    setQuery((prev) => ({
      ...prev,
      ...pagination,
    }));
    refetch();
  };

  const tableHeaders = [
    "Question",
    "Path Name",
    (accessList.includes("edit") || accessList.includes("delete")) && "Actions",
  ];

  const tableData =
    success && allQna?.data?.data
      ? allQna?.data?.data.map(({ id, question, pathName }) => [
          question,
          pathName,
          <div
            key={id}
            className="flex items-center justify-center cursor-pointer gap-[0.5rem]"
          >
            {accessList.includes("edit") && (
              <MdEditSquare
                size={18}
                className="text-[#0090DD]"
                onClick={() => handleNewUser(id)}
              />
            )}
            {accessList.includes("delete") && (
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

  return (
    <>
      <PageHeader
        hasAddButton={accessList.includes("add")}
        newButtonText={translate("Add New FAQ")}
        handleNewButton={() => handleNewUser(null)}
        handleReloadButton={handleReload}
        hasSubText
        subText={translate("Add Comprehensive FAQ Information in Each Section")}
      />
      {accessList.includes("view") ? (
        <Table
          isSN
          headers={tableHeaders}
          data={tableData}
          pagination={pagination}
          handlePagination={handlePagination}
        />
      ) : (
        <div>Has no Permission to View SEO</div>
      )}
      <Drawer isOpen={isOpen} setIsOpen={setIsOpen} width="w-[100%] md:w-[50%]">
        <AddEditQnaForm editId={editId} isOpen={isOpen} setIsOpen={setIsOpen} />
      </Drawer>
    </>
  );
}
