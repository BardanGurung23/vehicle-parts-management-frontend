import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCreatePartMutation,
  useUpdatePartMutation,
  useGetPartCategoriesQuery,
  Part,
} from "@/redux/services/parts";
import { Field } from "../../shared/components/Field";
import { ActionButton } from "../../shared/components/ActionButton";
import { toast } from "react-toastify";

const schema = z.object({
  partNumber: z.string().min(1, "Part number is required"),
  partName: z.string().min(1, "Part name is required"),
  description: z.string().optional(),
  unitPrice: z.coerce.number().min(0, "Must be >= 0"),
  costPrice: z.coerce.number().min(0, "Must be >= 0"),
  stockQuantity: z.coerce.number().int().min(0, "Must be >= 0"),
  reorderLevel: z.coerce.number().int().min(0, "Must be >= 0"),
  partCategoryId: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? null : Number(value)),
    z.number().int().positive().nullable(),
  ),
});

type FormType = z.infer<typeof schema>;

const defaultValues: FormType = {
  partNumber: "",
  partName: "",
  description: "",
  unitPrice: 0,
  costPrice: 0,
  stockQuantity: 0,
  reorderLevel: 10,
  partCategoryId: null,
};

type Props = {
  editPart: Part | null;
  onClose: () => void;
};

function asMessage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getMutationErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== "object") return fallback;
  const data = (error as { data?: unknown }).data;
  if (!data || typeof data !== "object") return fallback;
  const payload = data as { detail?: unknown; title?: unknown; message?: unknown };
  return asMessage(payload.detail) ?? asMessage(payload.message) ?? asMessage(payload.title) ?? fallback;
}

export default function PartForm({ editPart, onClose }: Readonly<Props>) {
  const isEdit = editPart !== null;
  const { data: categories = [] } = useGetPartCategoriesQuery();
  const [createPart, { isLoading: creating }] = useCreatePartMutation();
  const [updatePart, { isLoading: updating }] = useUpdatePartMutation();
  const isSaving = creating || updating;

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
      return;
    }
    reset(defaultValues);
  }, [editPart, isEdit, reset]);

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
    } catch (error: unknown) {
      toast.error(getMutationErrorMessage(error, "Operation failed"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Part number" error={errors.partNumber?.message} required htmlFor="partNumber">
          <input id="partNumber" className="input" placeholder="PT-001" disabled={isEdit} {...register("partNumber")} />
        </Field>
        <Field label="Part name" error={errors.partName?.message} required htmlFor="partName">
          <input id="partName" className="input" placeholder="Brake Pad" {...register("partName")} />
        </Field>
        <Field label="Unit price" error={errors.unitPrice?.message} required htmlFor="unitPrice">
          <input id="unitPrice" className="input" type="number" step="0.01" min="0" placeholder="0.00" {...register("unitPrice")} />
        </Field>
        <Field label="Cost price" error={errors.costPrice?.message} required htmlFor="costPrice">
          <input id="costPrice" className="input" type="number" step="0.01" min="0" placeholder="0.00" {...register("costPrice")} />
        </Field>
        <Field label="Stock quantity" error={errors.stockQuantity?.message} required htmlFor="stockQuantity">
          <input id="stockQuantity" className="input" type="number" min="0" placeholder="0" {...register("stockQuantity")} />
        </Field>
        <Field label="Reorder level" error={errors.reorderLevel?.message} required htmlFor="reorderLevel">
          <input id="reorderLevel" className="input" type="number" min="0" placeholder="10" {...register("reorderLevel")} />
        </Field>
        <div className="col-span-2">
          <Field label="Category" error={errors.partCategoryId?.message} htmlFor="partCategoryId" hint="Leave uncategorized if needed.">
            <select id="partCategoryId" className="input" {...register("partCategoryId")}>
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.partCategoryId} value={c.partCategoryId}>{c.categoryName}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="col-span-2">
          <Field label="Description" error={errors.description?.message} htmlFor="description" hint="Optional context for staff.">
            <textarea id="description" className="input" rows={4} placeholder="Add supplier notes, fitment guidance..." {...register("description")} />
          </Field>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <ActionButton type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : isEdit ? "Save changes" : "Create part"}
        </ActionButton>
        <ActionButton type="button" tone="secondary" onClick={isEdit ? onClose : () => reset(defaultValues)} disabled={isSaving}>
          {isEdit ? "Cancel edit" : "Reset fields"}
        </ActionButton>
      </div>
    </form>
  );
}
