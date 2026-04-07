import PageHeader from "@/components/PageHeader";
import { checkAccess } from "@/utils/accessHelper";
import { useState } from "react";
import { ViewType } from "../Users";
import { MdEditSquare } from "react-icons/md";
import DeleteModal from "@/components/DeleteModal";
import { handleError, handleResponse } from "@/utils/responseHandler";
import Table from "@/components/Table";
import { PaginationType } from "@/types/commonTypes";
import { useNavigate } from "react-router-dom";
import {
  TESTIMONIAL_ADD_ROUTE,
  TESTIMONIAL_LIST_ROUTE,
} from "@/routes/routeNames";
import {
  useDeleteTechnologyMutation,
  useListAllTechnologiesQuery,
} from "@/redux/services/technologies";
import { IMAGE_BASE_URL } from "@/constants";
import {
  useDeleteTestimonialMutation,
  useListAllTestimonialsQuery,
} from "@/redux/services/testimonial";
// import Card1 from "@/components/GridView/card1";

const tableHeaders = ["Author Name", "message", "Actions"];

export default function Testimonial() {
  const navigate = useNavigate();
  const accessList = checkAccess("Testimonial");

  //   utils function and states
  const [editId, setEditId] = useState<number | null>(null);

  //   for query
  const [query, setQuery] = useState({ page: 1, limit: 10 });

  //   for delete operation
  const [open, setOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [viewType, setViewType] = useState<ViewType>("list");

  const [deleteTestimonial] = useDeleteTestimonialMutation();

  //   api calls
  const {
    data: allTestimonials,
    isSuccess: success,
    refetch,
  } = useListAllTestimonialsQuery(query);

  // functions
  const handleDeleteTrigger = (id: number) => {
    setDeleteId(id);
    setOpen(true);
  };

  const handleDelete = async () => {
    try {
      const response = await deleteTestimonial(deleteId).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => {
          navigate(`${TESTIMONIAL_LIST_ROUTE}`);
        },
      });
    } catch (error) {
      handleError({ error });
    } finally {
      setOpen(false);
    }
  };

  //   functions

  const handleNavigation = (id: number | null) => {
    if (id === null) {
      navigate(TESTIMONIAL_ADD_ROUTE);
    } else {
      navigate(`${TESTIMONIAL_ADD_ROUTE}${id}`);
    }
  };

  const handleReload = () => {
    refetch();
  };

  const toggleViewType = (type: ViewType) => {
    setViewType(type);
  };

  const pagination = {
    page: allTestimonials?.data?.page ?? 1,
    limit: allTestimonials?.data?.limit ?? 10,
    total: allTestimonials?.data?.total ?? 0,
    totalPages: allTestimonials?.data?.totalPages ?? 0,
  };

  const handlePagination = (pagination: PaginationType) => {
    setQuery((prev) => ({
      ...prev,
      ...pagination,
    }));
    refetch();
  };

  const tableData =
    success && allTestimonials?.data?.data
      ? allTestimonials.data?.data.map(({ id, name, description }) => [
          name,
          description,
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
        ])
      : [];

  return (
    <>
      <PageHeader
        hasAddButton={accessList.includes("add")}
        newButtonText={"Add New Testimonial"}
        handleNewButton={() => handleNavigation(null)}
        handleReloadButton={handleReload}
        toggleViewType={toggleViewType}
        hasSubText
        subText={"Add Comprehensive Testimonial Information in Each Section"}
        hasViewType
        viewType={viewType}
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
      {/* <Drawer isOpen={isOpen} setIsOpen={setIsOpen} width="w-full lg:w-[50%]">
        <AddUserForm editId={editId} isOpen={isOpen} setIsOpen={setIsOpen} />
      </Drawer> */}
    </>
  );
}
