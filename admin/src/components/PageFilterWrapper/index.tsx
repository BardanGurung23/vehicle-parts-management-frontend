import React from "react";

export default function PageFilterWrapper({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-6 mb-6 border border-gray-200 bg-white rounded-lg shadow-sm">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          {/* <div className="flex items-center gap-3">
            {activeFilters.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                Clear all
              </Button>
            )}
            <Button onClick={handleSubmit} className="bg-red-600 hover:bg-red-700 text-white px-6">
              Apply Filters
            </Button>
          </div> */}
        </div>

        {children}

        {/* Active filters */}
        {/* {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            <span className="text-sm text-gray-600 font-medium py-1">Active filters:</span>
            {activeFilters.includes("name") && (
              <Badge variant="secondary" className="flex items-center gap-1 bg-red-50 text-red-700 border-red-200">
                Name: {filters.name}
                <X className="h-3 w-3 cursor-pointer hover:text-red-900" onClick={() => removeFilter("name")} />
              </Badge>
            )}
            {activeFilters.includes("email") && (
              <Badge variant="secondary" className="flex items-center gap-1 bg-red-50 text-red-700 border-red-200">
                Email: {filters.email}
                <X className="h-3 w-3 cursor-pointer hover:text-red-900" onClick={() => removeFilter("email")} />
              </Badge>
            )}
            {activeFilters.includes("verified") && (
              <Badge variant="secondary" className="flex items-center gap-1 bg-red-50 text-red-700 border-red-200">
                {filters.verified ? "Verified" : "Not Verified"}
                <X className="h-3 w-3 cursor-pointer hover:text-red-900" onClick={() => removeFilter("verified")} />
              </Badge>
            )}
            {activeFilters.includes("date") && (
              <Badge variant="secondary" className="flex items-center gap-1 bg-red-50 text-red-700 border-red-200">
                Date: {filters.date?.toLocaleDateString()}
                <X className="h-3 w-3 cursor-pointer hover:text-red-900" onClick={() => removeFilter("date")} />
              </Badge>
            )}
          </div>
        )} */}
      </div>
    </div>
  );
}
