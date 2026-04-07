import DeleteModal from "@/components/DeleteModal";
import PageHeader from "@/components/PageHeader";
import PageTitle from "@/components/PageTitle";
import Spinner from "@/components/Spinner";
import Table from "@/components/Table";
import { BANNER_URL } from "@/constants/apiUrlConstants";
import usePagination from "@/hooks/usePagination";
import { useDeleteApiMutation, useGetApiQuery } from "@/redux/services/crudApi";
import { BANNER_ADD_ROUTE } from "@/routes/routeNames";
import { checkAccess } from "@/utils/accessHelper";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { useState } from "react";
import { MdEditSquare } from "react-icons/md";
import { useNavigate } from "react-router-dom";

export default function Banner() {
  const navigate = useNavigate();
  const accessList = checkAccess("Banner");

  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });

  const [open, setOpen] = useState<boolean>(false);
  const [deleteId, setDeletedId] = useState<number | null>(null);

  const {
    data: allBanner,
    isSuccess: success,
    isLoading: loading,
    refetch,
  } = useGetApiQuery({ url: `${BANNER_URL}list` });
  const [deleteBanner] = useDeleteApiMutation();

  const handleNewUser = (id: string | null) => {
    id === null
      ? navigate(BANNER_ADD_ROUTE)
      : navigate(`${BANNER_ADD_ROUTE}${id}`);
  };

  const handleReload = () => {
    refetch();
  };

  const handleDeleteTrigger = (id: number) => {
    setDeletedId(id);
    setOpen(true);
  };

  const handleDelete = async () => {
    try {
      const response = await deleteBanner(`${BANNER_URL}${deleteId}`).unwrap();
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
    page: allBanner?.data?.page,
    limit: allBanner?.data?.limit,
    total: allBanner?.data?.total,
    totalPages: allBanner?.data?.totalPages,
  };

  const tableHeaders = [
    "Name",
    "slug",
    (accessList.includes("edit") || accessList.includes("delete")) && "Actions",
  ];

  const tableData =
    success && allBanner?.data?.data
      ? allBanner?.data?.data.map(({ id, name, slug }) => [
          name,
          slug,
          <div
            key={id}
            className="flex items-center justify-center cursor-pointer gap-[0.5rem]"
          >
            {accessList.includes("edit") && (
              <MdEditSquare
                size={18}
                className="text-primaryColor"
                onClick={() => handleNewUser(slug)}
              />
            )}
            {/* {accessList.includes("delete") && (
              <DeleteModal
                open={open}
                setOpen={setOpen}
                handleDeleteTrigger={() => handleDeleteTrigger(id)}
                handleConfirmDelete={handleDelete}
              />
            )} */}
          </div>,
        ])
      : [];

  if (loading) {
    return <Spinner className="flex justify-center items-center h-full" />;
  }

  return (
    <>
      <PageTitle title="Banner" />
      <PageHeader
        hasAddButton={false}
        newButtonText="Add New Banner"
        handleNewButton={() => handleNewUser(null)}
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
    </>
  );
}
