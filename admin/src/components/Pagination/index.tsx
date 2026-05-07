import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";

export default function Pagination({ media, handlePageChange }) {
  return (
    <div className="mt-auto w-[90rem] flex justify-between font-[400] text-[14px] text-on-surface-variant py-[1rem] px-[0.5rem]">
      <div>Show: {media.data.limit ?? 0} Entries</div>
      <div className="font-[500] text-on-surface text-[0.75rem] flex gap-[0.25rem]">
        <button
          className="rounded-full bg-surface-container-low border border-outline-variant flex justify-center items-center py-[0.5rem] px-[0.75rem] cursor-pointer hover:bg-surface-container transition-colors"
          onClick={() => handlePageChange(media.data.page - 1)}
        >
          <MdKeyboardArrowLeft />
        </button>

        {Array.from({ length: media.data.totalPages }).map((_, index) => {
          const pageNumber = index + 1;
          const isCurrentPage = media.data.page === pageNumber;
          const isNextPage = media.data.page + 1 === pageNumber;

          if (isCurrentPage || isNextPage) {
            return (
              <button
                key={index}
                onClick={() => handlePageChange(pageNumber)}
                className={`rounded-full flex justify-center items-center py-[0.5rem] px-[0.75rem] cursor-pointer transition-colors ${
                  isCurrentPage
                    ? "bg-primary text-primary-on"
                    : "bg-surface-container-low border border-outline-variant hover:bg-surface-container"
                }`}
              >
                {pageNumber}
              </button>
            );
          }

          if (pageNumber === media.data.page + 2) {
            return (
              <div
                key="ellipsis"
                className="text-on-surface-variant opacity-50 flex justify-center items-center py-[0.5rem] px-[0.75rem] cursor-pointer"
              >
                ...
              </div>
            );
          }

          return null;
        })}

        <button
          className="rounded-full bg-surface-container-low border border-outline-variant flex justify-center items-center py-[0.5rem] px-[0.75rem] cursor-pointer hover:bg-surface-container transition-colors"
          onClick={() => handlePageChange(media.data.page + 1)}
        >
          <MdKeyboardArrowRight />
        </button>
      </div>

      <div className="flex gap-[1.5rem]">
        <p>
          Page {media.data.page ?? 0} of {media.data.totalPages ?? 0}
        </p>
        <p>Total Data: {media.data.total ?? 0}</p>
      </div>
    </div>
  );
}
