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
    (value) => {
      if (value === "" || value === null || value === undefined) {
        return null;
      }

      return Number(value);
    },
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
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getMutationErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const data = (error as { data?: unknown }).data;
  if (!data || typeof data !== "object") {
    return fallback;
  }

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

  const resetToDefaults = () => {
    reset(defaultValues);
  };

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

    resetToDefaults();
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

  const handleSecondaryAction = () => {
    if (isEdit) {
      onClose();
      return;
    }

    resetToDefaults();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-grid parts-form">
      <div className="form-grid form-grid--two-columns">
        <div className="field">
          <label className="field__label" htmlFor="partNumber">
            Part number
          </label>
          <input
            id="partNumber"
            className="input"
            placeholder="PT-001"
            disabled={isEdit}
            {...register("partNumber")}
          />
          {errors.partNumber?.message ? (
            <span className="field__error">{errors.partNumber.message}</span>
          ) : isEdit ? (
            <span className="field__hint">
              Part numbers remain fixed once the part has been created.
            </span>
          ) : null}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="partName">
            Part name
          </label>
          <input
            id="partName"
            className="input"
            placeholder="Brake Pad"
            {...register("partName")}
          />
          {errors.partName?.message ? (
            <span className="field__error">{errors.partName.message}</span>
          ) : null}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="unitPrice">
            Unit price
          </label>
          <input
            id="unitPrice"
            className="input"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            {...register("unitPrice")}
          />
          {errors.unitPrice?.message ? (
            <span className="field__error">{errors.unitPrice.message}</span>
          ) : null}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="costPrice">
            Cost price
          </label>
          <input
            id="costPrice"
            className="input"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            {...register("costPrice")}
          />
          {errors.costPrice?.message ? (
            <span className="field__error">{errors.costPrice.message}</span>
          ) : null}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="stockQuantity">
            Stock quantity
          </label>
          <input
            id="stockQuantity"
            className="input"
            type="number"
            min="0"
            placeholder="0"
            {...register("stockQuantity")}
          />
          {errors.stockQuantity?.message ? (
            <span className="field__error">{errors.stockQuantity.message}</span>
          ) : null}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="reorderLevel">
            Reorder level
          </label>
          <input
            id="reorderLevel"
            className="input"
            type="number"
            min="0"
            placeholder="10"
            {...register("reorderLevel")}
          />
          {errors.reorderLevel?.message ? (
            <span className="field__error">{errors.reorderLevel.message}</span>
          ) : null}
        </div>

        <div className="field form-grid__full-width">
          <label className="field__label" htmlFor="partCategoryId">
            Category
          </label>
          <select id="partCategoryId" className="input" {...register("partCategoryId")}>
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.partCategoryId} value={category.partCategoryId}>
                {category.categoryName}
              </option>
            ))}
          </select>
          {errors.partCategoryId?.message ? (
            <span className="field__error">{errors.partCategoryId.message}</span>
          ) : (
            <span className="field__hint">
              Leave uncategorized if the part should stay available across multiple workflows.
            </span>
          )}
        </div>

        <div className="field form-grid__full-width">
          <label className="field__label" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            className="input"
            rows={5}
            placeholder="Add supplier notes, fitment guidance, or internal details."
            {...register("description")}
          />
          <span className="field__hint">
            Optional context helps staff verify the correct part before updating stock.
          </span>
        </div>
      </div>

      <div className="parts-form__actions">
        <button type="submit" className="button" disabled={isSaving}>
          {isSaving ? "Saving..." : isEdit ? "Save changes" : "Create part"}
        </button>
        <button
          type="button"
          className="button button--secondary"
          onClick={handleSecondaryAction}
          disabled={isSaving}
        >
          {isEdit ? "Cancel edit" : "Reset fields"}
        </button>
      </div>
    </form>
  );
}