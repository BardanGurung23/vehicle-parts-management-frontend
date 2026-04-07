import PageHeader from "@/components/PageHeader";
import Table from "@/components/Table";
import useTranslation from "@/locale/useTranslation";
import { checkAccess } from "@/utils/accessHelper";
import { useState } from "react";
import { MdEditSquare } from "react-icons/md";
import DeleteModal from "@/components/DeleteModal";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { PaginationType } from "@/types/commonTypes";
import { useNavigate } from "react-router-dom";
import { PRODUCT_VARIANT_ADD_ROUTE } from "@/routes/routeNames";

import {
  useDeleteProductVariantByIdMutation,
  useListAllProductVariantQuery,
} from "@/redux/services/productVariant";

export default function ProductVariant() {
  const translate = useTranslation();
  const navigate = useNavigate();
  const accessList = checkAccess("Product Variant");

  // query state
  const [query, setQuery] = useState({ page: 1, limit: 10 });

  //   for delete operations
  const [open, setOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const {
    data: allProductVariant,
    isSuccess: success,
    refetch,
  } = useListAllProductVariantQuery(query);
  const [deleteProductVariant] = useDeleteProductVariantByIdMutation();

  const handleNewUser = (id: number | null) => {
    id === null
      ? navigate(PRODUCT_VARIANT_ADD_ROUTE)
      : navigate(`${PRODUCT_VARIANT_ADD_ROUTE}${id}`);
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
      const response = await deleteProductVariant(deleteId).unwrap();
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
    page: allProductVariant?.data?.page,
    limit: allProductVariant?.data?.limit,
    total: allProductVariant?.data?.total,
    totalPages: allProductVariant?.data?.totalPages,
  };

  const handlePagination = (pagination: PaginationType) => {
    setQuery((prev) => ({
      ...prev,
      ...pagination,
    }));
    refetch();
  };

  const tableHeaders = [
    "Product",
    "Quantity",
    "Price",
    (accessList.includes("edit") || accessList.includes("delete")) && "Actions",
  ];

  const tableData =
    success && allProductVariant?.data?.data
      ? allProductVariant?.data?.data.map(({ id, name, quantity, price }) => [
          name,
          quantity,
          price,
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
        newButtonText={translate("Add New Product Variant")}
        handleNewButton={() => handleNewUser(null)}
        handleReloadButton={handleReload}
        hasSubText
        subText={translate(
          "Add Comprehensive Product Variant Information in Each Section",
        )}
      />
      {accessList.includes("view") ? (
        <div>
          <Table
            isSN
            headers={tableHeaders}
            data={tableData}
            pagination={pagination}
            handlePagination={handlePagination}
          />
        </div>
      ) : (
        <div>Has no Permission to View SEO</div>
      )}
    </>
  );
}
