export interface PaginationQueryParams {
  page: number;
  limit: number;
}

export interface PaginationType {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
