import DeleteModal from "@/components/DeleteModal";
import Drawer from "@/components/Drawer";
import PageHeader from "@/components/PageHeader";
import PageTitle from "@/components/PageTitle";
import Table from "@/components/Table";
import { CONTACT_URL } from "@/constants/apiUrlConstants";
import usePagination from "@/hooks/usePagination";
import { useDeleteApiMutation, useGetApiQuery } from "@/redux/services/crudApi";
import { checkAccess } from "@/utils/accessHelper";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { useState } from "react";
import { FaEye } from "react-icons/fa";
import ViewContact from "./ViewContact";
import Spinner from "@/components/Spinner";

interface ContactResponseType {
  id: number;
  full_name: string;
  email: string;
}

export default function Contact() {
  const accessList = checkAccess("Contact");

  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });

  const [open, setOpen] = useState<boolean>(false);
  const [deleteId, setDeletedId] = useState<number | null>(null);

  const [openDrawer, setOpenDrawer] = useState<boolean>(false);
  const [drawerId, setOpenDrawerId] = useState<number | null>(null);

  const {
    data: allContact,
    isSuccess: success,
    isLoading: loading,
    refetch,
  } = useGetApiQuery({ url: `${CONTACT_URL}list`, ...query });
  const [deleteBanner] = useDeleteApiMutation();

  const handleReload = () => {
    refetch();
  };

  const handleDrawerOpen = (id: number) => {
    setOpenDrawerId(id);
    setOpenDrawer(true);
  };

  const handleDeleteTrigger = (id: number) => {
    setDeletedId(id);
    setOpen(true);
  };

  const handleDelete = async () => {
    try {
      const response = await deleteBanner(`${CONTACT_URL}${deleteId}`).unwrap();
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
    page: allContact?.data?.page,
    limit: allContact?.data?.limit,
    total: allContact?.data?.total,
    totalPages: allContact?.data?.totalPages,
  };

  const tableHeaders = [
    "Name",
    "Email",
    // "Subject",
    accessList.includes("delete") && "Actions",
  ];

  const tableData =
    success && allContact?.data?.data
      ? allContact?.data?.data.map(
          ({ id, full_name, email }: ContactResponseType) => [
            full_name,
            email,
            <div
              key={id}
              className="flex items-center justify-center cursor-pointer gap-[0.5rem]"
            >
              <FaEye
                size={18}
                className="text-[#0090DD]"
                onClick={() => handleDrawerOpen(id)}
              />
              {accessList.includes("delete") && (
                <DeleteModal
                  open={open}
                  setOpen={setOpen}
                  handleDeleteTrigger={() => handleDeleteTrigger(id)}
                  handleConfirmDelete={handleDelete}
                />
              )}
            </div>,
          ],
        )
      : [];

  if (loading) {
    return <Spinner className="flex justify-center items-center h-full" />;
  }

  return (
    <>
      <PageTitle title="Contact" />
      <PageHeader
        hasAddButton={false}
        newButtonText="Add New Blog"
        handleNewButton={() => {}}
        handleReloadButton={handleReload}
        hasSubText={false}
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
        <p>You don't have Permission to view this table</p>
      )}
      <Drawer
        isOpen={openDrawer}
        setIsOpen={setOpenDrawer}
        width="w-full lg:w-[30%]"
      >
        <ViewContact id={drawerId} />
      </Drawer>
    </>
  );
}
