import Drawer from "@/components/Drawer";
import PageHeader from "@/components/PageHeader";
import Table from "@/components/Table";
import useTranslation from "@/locale/useTranslation";
import { useDeleteSeoMutation, useListAllSeoQuery } from "@/redux/services/seo";
import { checkAccess } from "@/utils/accessHelper";
import { useState } from "react";
import AddEditSeoForm from "./AddEditSeoForm";
import { MdEditSquare } from "react-icons/md";
import DeleteModal from "@/components/DeleteModal";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { PaginationType } from "@/types/commonTypes";
import { ViewType } from "../Users";
import Spinner from "@/components/Spinner";

type ListViewProps = {
  title: string;
  id: number;
  handleNewUser: (id: number) => void;
  pageName: string;
  og_title: string;
};

export default function Seo() {
  const translate = useTranslation();
  const accessList = checkAccess("SEO");

  // query state
  const [query, setQuery] = useState({ page: 1, limit: 10 });

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [viewType, setViewType] = useState<ViewType>("list");

  //   for delete operations
  const [open, setOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const {
    data: allSeo,
    isSuccess: success,
    isLoading: loading,
    refetch,
  } = useListAllSeoQuery(query);
  const [deleteSeo] = useDeleteSeoMutation();

  const handleNewUser = (id: number | null) => {
    setEditId(id);
    setIsOpen(true);
  };

  const handleReload = () => {
    refetch();
  };

  const toggleViewType = (type: ViewType) => {
    setViewType(type);
  };

  const handleDeleteTrigger = (id: number) => {
    setDeleteId(id);
    setOpen(true);
  };

  const handleDelete = async () => {
    try {
      const response = await deleteSeo(deleteId).unwrap();
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
    page: allSeo?.data?.page,
    limit: allSeo?.data?.limit,
    total: allSeo?.data?.total,
    totalPages: allSeo?.data?.totalPages,
  };

  const handlePagination = (pagination: PaginationType) => {
    setQuery((prev) => ({
      ...prev,
      ...pagination,
    }));
    refetch();
  };

  const tableHeaders = [
    "Page",
    "Page Title",
    "OG Title",
    (accessList.includes("edit") || accessList.includes("delete")) && "Actions",
  ];

  const tableData =
    success && allSeo?.data?.data
      ? allSeo?.data?.data.map(({ id, pageName, title, og_title }) => [
          pageName,
          title,
          og_title,
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

  if (loading) {
    return <Spinner className="flex justify-center items-center h-full" />;
  }

  return (
    <>
      <PageHeader
        hasViewType
        viewType={viewType}
        toggleViewType={toggleViewType}
        hasAddButton={accessList.includes("add")}
        newButtonText={translate("Add New SEO")}
        handleNewButton={() => handleNewUser(null)}
        handleReloadButton={handleReload}
        hasSubText
        subText={translate("Add Comprehensive SEO Information in Each Section")}
      />
      {accessList.includes("view") ? (
        <div>
          {viewType === "list" ? (
            <Table
              isSN
              headers={tableHeaders}
              data={tableData}
              pagination={pagination}
              handlePagination={handlePagination}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 justify-between gap-x-[1.125rem] gap-y-[2.25rem]">
              {allSeo?.data?.data.map(({ id, pageName, title, og_title }) => (
                <ListView
                  key={id}
                  handleNewUser={handleNewUser}
                  id={id}
                  title={title}
                  pageName={pageName}
                  og_title={og_title}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>Has no Permission to View SEO</div>
      )}
      <Drawer isOpen={isOpen} setIsOpen={setIsOpen} width="w-[100%] md:w-[50%]">
        {isOpen && (
          <AddEditSeoForm
            editId={editId}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
          />
        )}
      </Drawer>
    </>
  );
}

function ListView({
  title,
  handleNewUser,
  id,
  pageName,
  og_title,
}: ListViewProps) {
  return (
    <button
      key={id}
      onClick={() => handleNewUser(id)}
      className="text-start space-y-[1rem] p-[0.75rem] bg-white min-w-[20rem] rounded-[0.75rem] cursor-pointer"
    >
      <h2>{title}</h2>
      <p>{pageName}</p>
      <p>{og_title}</p>
    </button>
  );
}
