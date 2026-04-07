import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import Table from "@/components/Table";
import {
  useDeleteInterviewMutation,
  useListAllInterviewQuery,
} from "../../redux/services/interview";
import { MdEditSquare } from "react-icons/md";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { checkAccess } from "@/utils/accessHelper";
import useTranslation from "@/locale/useTranslation";
import { useState } from "react";
import DeleteModal from "@/components/DeleteModal";
import { EMPLOYEE_ADD_ROUTE } from "@/routes/routeNames";
import { PaginationType } from "@/types/commonTypes";

export default function Interview() {
  const translate = useTranslation();
  const navigate = useNavigate();
  const accessList = checkAccess("Employee");

  // query state
  const [query, setQuery] = useState({ page: 1, limit: 10 });

  // delete State
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [open, setOpen] = useState<boolean>(false);

  const {
    data: allInterview,
    isSuccess: success,
    refetch,
  } = useListAllInterviewQuery(query);
  const [deleteInterview] = useDeleteInterviewMutation();

  const handleDeleteTrigger = (id: number) => {
    setDeleteId(id);
    setOpen(true);
  };

  const handleNavigation = (id: number | null) => {
    if (id === null) {
      navigate(EMPLOYEE_ADD_ROUTE);
    } else {
      navigate(`${EMPLOYEE_ADD_ROUTE}${id}`);
    }
  };
  const handleReload = () => {
    refetch();
  };

  const handleDelete = async () => {
    try {
      const response = await deleteInterview(deleteId).unwrap();
      handleResponse({ res: response, onSuccess: () => {} });
    } catch (error) {
      handleError({ error });
    } finally {
      setOpen(false);
    }
  };

  const pagination = {
    page: allInterview?.data?.page,
    limit: allInterview?.data?.limit,
    total: allInterview?.data?.total,
    totalPages: allInterview?.data?.totalPages,
  };

  const handlePagination = (pagination: PaginationType) => {
    setQuery((prev) => ({
      ...prev,
      ...pagination,
    }));
    refetch();
  };

  const tableHeaders = [
    "Initials",
    "Designation",
    "Office Location",
    (accessList.includes("edit") || accessList.includes("delete")) && "Actions",
  ];

  const tableData =
    success && allInterview?.data?.data
      ? allInterview?.data?.data?.map(
          ({
            id,
            initials,
            designation,
            office_location,
          }: {
            id: number;
            initials: string;
            designation: string;
            office_location: string;
          }) => [
            initials,
            designation,
            office_location,
            <div
              key={id}
              className="flex items-center justify-center cursor-pointer gap-[0.5rem]"
            >
              {accessList.includes("edit") && (
                <MdEditSquare
                  size={18}
                  className="text-[#0090DD]"
                  onClick={() => handleNavigation(id)}
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
          ],
        )
      : [];

  return (
    <>
      <PageHeader
        hasAddButton={accessList.includes("add")}
        newButtonText={translate("Add New Employee")}
        handleNewButton={() => handleNavigation(null)}
        handleReloadButton={handleReload}
        hasSubText
        subText={translate("Add New Candidate Interview")}
      />
      {accessList.includes("view") && (
        <Table
          isSN
          headers={tableHeaders}
          data={tableData}
          pagination={pagination}
          handlePagination={handlePagination}
        />
      )}
    </>
  );
}
