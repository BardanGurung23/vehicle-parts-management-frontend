import type React from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface SortableRowProps {
  product: any[];
  index: number;
}

export function SortableRow({ product, index }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product[0] });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
    position: isDragging ? "relative" : "static",
  } as React.CSSProperties;

  return (
    <tr ref={setNodeRef} style={style} className="text-sm text-gray-700">
      <td
        className={`px-2 py-3 ${index % 2 === 0 ? "bg-white" : "bg-[#f2f6fa]"}`}
      >
        <div
          className={`cursor-grab active:cursor-grabbing flex items-center justify-center w-6 h-6 hover:bg-gray-100 rounded ${index % 2 === 0 ? "bg-white" : "bg-[#f2f6fa]"}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical
            size={16}
            className={`${index % 2 === 0 ? "bg-white" : "bg-[#f2f6fa]"}`}
          />
        </div>
      </td>
      {product.slice(1).map((item) => (
        <td
          className={`px-4 py-3 whitespace-nowrap text-start ${index % 2 === 0 ? "bg-white" : "bg-[#f2f6fa]"}`}
        >
          {item}
        </td>
      ))}
    </tr>
  );
}
