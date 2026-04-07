import { PaginationType } from "@/types/commonTypes";
import { useState } from "react";

export default function usePagination(initialState: {
  page: number;
  limit: number;
}) {
  const [query, setQuery] = useState(initialState);

  const handlePagination = (pagination: PaginationType) => {
    if (pagination.limit !== query.limit) {
      // check if the page exists or not
      const pageExists =
        Math.ceil(pagination.total / pagination.limit) >= pagination.page;
      const totalPage = Math.ceil(pagination.total / pagination.limit);
      if (pageExists) {
        setQuery((prev) => ({
          ...prev,
          page: pagination.page,
          limit: pagination.limit,
        }));
      } else {
        setQuery((prev) => ({
          ...prev,
          page: totalPage,
          limit: pagination.limit,
        }));
      }
    } else {
      setQuery((prev) => ({
        ...prev,
        ...pagination,
      }));
    }
  };

  return { query, handlePagination };
}
