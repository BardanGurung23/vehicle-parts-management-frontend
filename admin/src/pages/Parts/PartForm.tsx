import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Input from "@/components/Input";
import Button from "@/components/Button";
import {
  useCreatePartMutation,
  useUpdatePartMutation,
  useGetPartCategoriesQuery,
  Part,
} from "@/redux/services/parts";
import { toast } from "react-toastify";

const schema = z.object({
  partNumber: z.string().min(1, "Part number is required"),
  partName: z.string().min(1, "Part name is required"),
  description: z.string().optional(),
  unitPrice: z.coerce.number().min(0, "Must be >= 0"),
  costPrice: z.coerce.number().min(0, "Must be >= 0"),
  stockQuantity: z.coerce.number().int().min(0, "Must be >= 0"),
  reorderLevel: z.coerce.number().int().min(0, "Must be >= 0"),
  partCategoryId: z.coerce.number().optional().nullable(),
});

type FormType = z.infer<typeof schema>;

type Props = {
  editPart: Part | null;
  onClose: () => void;
};

export default function PartForm({ editPart, onClose }: Readonly<Props>) {
  const isEdit = editPart !== null;
  const { data: categories = [] } = useGetPartCategoriesQuery();
  const [createPart, { isLoading: creating }] = useCreatePartMutation();
  const [updatePart, { isLoading: updating }] = useUpdatePartMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormType>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (isEdit) {
      reset({
        partNumber: editPart.partNumber,
        partName: editPart.partName,
        description: editPart.description ?? "",
        unitPrice: editPart.unitPrice,
        costPrice: editPart.costPrice,
        stockQuantity: editPart.stockQuantity,
        reorderLevel: editPart.reorderLevel,
        partCategoryId: editPart.partCategoryId ?? null,
      });
    } else {
      reset({ reorderLevel: 10, stockQuantity: 0, unitPrice: 0, costPrice: 0 });
    }
  }, [editPart]);

  const onSubmit = async (data: FormType) => {
    try {
      if (isEdit) {
        await updatePart({
          partId: editPart.partId,
          body: {
            partName: data.partName,
            description: data.description,
            unitPrice: data.unitPrice,
            costPrice: data.costPrice,
            stockQuantity: data.stockQuantity,
            reorderLevel: data.reorderLevel,
            partCategoryId: data.partCategoryId ?? null,
          },
        }).unwrap();
        toast.success("Part updated successfully");
      } else {
        await createPart({
          partNumber: data.partNumber,
          partName: data.partName,
          description: data.description,
          unitPrice: data.unitPrice,
          costPrice: data.costPrice,
          stockQuantity: data.stockQuantity,
          reorderLevel: data.reorderLevel,
          partCategoryId: data.partCategoryId ?? null,
        }).unwrap();
        toast.success("Part created successfully");
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.title ?? err?.data?.message ?? "Operation failed");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-16 space-y-4">
      <h2 className="text-lg font-semibold">{isEdit ? "Edit Part" : "Add New Part"}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Part Number"
          placeholder="e.g. PT-001"
          disabled={isEdit}
          {...register("partNumber")}
          error={errors.partNumber?.message}
        />
        <Input
          label="Part Name"
          placeholder="e.g. Brake Pad"
          {...register("partName")}
          error={errors.partName?.message}
        />
        <Input
          label="Unit Price"
          type="number"
          step="0.01"
          placeholder="0.00"
          {...register("unitPrice")}
          error={errors.unitPrice?.message}
        />
        <Input
          label="Cost Price"
          type="number"
          step="0.01"
          placeholder="0.00"
          {...register("costPrice")}
          error={errors.costPrice?.message}
        />
        <Input
          label="Stock Quantity"
          type="number"
          placeholder="0"
          {...register("stockQuantity")}
          error={errors.stockQuantity?.message}
        />
        <Input
          label="Reorder Level"
          type="number"
          placeholder="10"
          {...register("reorderLevel")}
          error={errors.reorderLevel?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <select
          {...register("partCategoryId")}
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.partCategoryId} value={c.partCategoryId}>
              {c.categoryName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          {...register("description")}
          rows={3}
          placeholder="Optional description..."
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <Button type="submit" className="submit-button" disabled={creating || updating}>
        {creating || updating ? "Saving..." : isEdit ? "Update Part" : "Create Part"}
      </Button>
    </form>
  );
}
