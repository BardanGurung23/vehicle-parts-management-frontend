import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import Table from "@/components/Table";
import {
  useDeleteDepartmentMutation,
  useListAllDepartmentsQuery,
} from "@/redux/services/department";
import { MdEditSquare } from "react-icons/md";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { checkAccess } from "@/utils/accessHelper";
import useTranslation from "@/locale/useTranslation";
import { useState } from "react";
import DeleteModal from "@/components/DeleteModal";
import { DEPARTMENT_ADD_ROUTE } from "@/routes/routeNames";
import { PaginationType } from "@/types/commonTypes";

export default function Department() {
  const translate = useTranslation();
  const navigate = useNavigate();
  const accessList = checkAccess("Department");

  // query state
  const [query, setQuery] = useState({ page: 1, limit: 10 });

  // delete State
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [open, setOpen] = useState<boolean>(false);

  const {
    data: allDepartments,
    isSuccess: success,
    refetch,
  } = useListAllDepartmentsQuery(query);
  const [deleteDepartment] = useDeleteDepartmentMutation();

  const handleAddEditButton = (id: number | null) => {
    if (id === null) {
      navigate(DEPARTMENT_ADD_ROUTE);
    } else {
      navigate(`${DEPARTMENT_ADD_ROUTE}${id}`);
    }
  };

  const handleDeleteTrigger = (id: number) => {
    setDeleteId(id);
    setOpen(true);
  };

  const handleReload = () => {
    refetch();
  };

  const handleDelete = async () => {
    try {
      const response = await deleteDepartment(deleteId).unwrap();
      handleResponse({ res: response, onSuccess: () => {} });
    } catch (error) {
      handleError({ error });
    } finally {
      setOpen(false);
    }
  };

  const handleSelect = () => {
    if (selected.length === allDepartments?.data?.data?.length) {
      setSelected([]);
    } else {
      setSelected(
        allDepartments?.data?.data?.map((item: any) => item.id) || [],
      );
    }
  };

  const toggleAll = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleMultipleDelete = () => {};

  const tableHeaders = [
    // <input
    //   key="header-checkbox"
    //   type="checkbox"
    //   checked={selected.length === allDepartments?.data?.data?.length}
    //   onChange={handleSelect}
    //   className="checked-box "
    // />,
    "Color",
    "Department",
    (accessList.includes("edit") || accessList.includes("delete")) && "Actions",
  ];

  const pagination = {
    page: allDepartments?.data?.page,
    limit: allDepartments?.data?.limit,
    total: allDepartments?.data?.total,
    totalPages: allDepartments?.data?.totalPages,
  };

  const handlePagination = (pagination: PaginationType) => {
    setQuery((prev) => ({
      ...prev,
      ...pagination,
    }));
    refetch();
  };

  const tableData =
    success && allDepartments?.data?.data
      ? allDepartments?.data?.data?.map(
          ({
            id,
            name,
            color,
          }: {
            id: number;
            name: string;
            color: string;
            subNameOne: string;
          }) => [
            // <input
            //   key={id}
            //   type="checkbox"
            //   checked={selected.includes(id)}
            //   onChange={() => toggleAll(id)}
            //   className="checked-box"
            // />,
            color ? (
              <span
                style={{
                  color: color,
                  backgroundColor: color,
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  display: "inline-block",
                }}
              ></span>
            ) : (
              ""
            ),
            name,
            <div
              key={id}
              className="flex items-center justify-center cursor-pointer gap-[0.5rem]"
            >
              {accessList.includes("edit") && (
                <MdEditSquare
                  size={18}
                  className="text-[#0090DD]"
                  onClick={() => handleAddEditButton(id)}
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
        newButtonText={translate("Add New Department")}
        handleNewButton={() => handleAddEditButton(null)}
        handleReloadButton={handleReload}
        hasDeleteButton={selected.length > 0}
        handleDeleteButton={handleMultipleDelete}
        hasSubText
        subText={translate("Add Department Information")}
      />
      {accessList.includes("view") && (
        <Table
          headers={tableHeaders}
          data={tableData}
          isSN
          pagination={pagination}
          handlePagination={handlePagination}
        />
      )}
    </>
  );
}
