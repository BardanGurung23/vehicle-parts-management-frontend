import React from "react";

export default function PageFilterWrapper({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-6 mb-6 border border-outline-variant bg-surface-container-low rounded-lg shadow-level1">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
        </div>

        {children}
      </div>
    </div>
  );
}
