import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, ApiError, resolveBackendAssetUrl } from "../../app/api";
import { useAuth } from "../../app/auth";
import type { Part, PartCategory } from "../../app/types";
import { Field } from "../../shared/components/Field";
import { ActionButton } from "../../shared/components/ActionButton";
import { toast } from "sonner";
import { Partsschema } from "./schema";

type FormType = z.infer<typeof Partsschema>;

const defaultValues: FormType = {
  partNumber: "",
  partName: "",
  description: "",
  imageUrl: "",
  unitPrice: 0,
  costPrice: 0,
  stockQuantity: 0,
  reorderLevel: 10,
  partCategoryId: null,
};

type Props = {
  editPart: Part | null;
  onClose: () => void;
  categories: PartCategory[];
  onSaved: (part: Part) => void;
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
  const payload = data as {
    detail?: unknown;
    title?: unknown;
    message?: unknown;
  };
  return (
    asMessage(payload.detail) ??
    asMessage(payload.message) ??
    asMessage(payload.title) ??
    fallback
  );
}

export default function PartForm({
  editPart,
  onClose,
  categories,
  onSaved,
}: Readonly<Props>) {
  const { token } = useAuth();
  const isEdit = editPart !== null;
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormType>({ resolver: zodResolver(Partsschema) });
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState<
    string | null
  >(null);

  const isSaving = isSubmitting;
  const imageUrlValue = watch("imageUrl") ?? "";
  const normalizedImageUrlValue = imageUrlValue.trim();

  useEffect(() => {
    if (!selectedImageFile) {
      setSelectedImagePreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedImageFile);
    setSelectedImagePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedImageFile]);

  useEffect(() => {
    if (isEdit) {
      reset({
        partNumber: editPart.partNumber,
        partName: editPart.partName,
        description: editPart.description ?? "",
        imageUrl: editPart.imageUrl ?? "",
        unitPrice: editPart.unitPrice,
        costPrice: editPart.costPrice,
        stockQuantity: editPart.stockQuantity,
        reorderLevel: editPart.reorderLevel,
        partCategoryId: editPart.partCategoryId ?? null,
      });
      setSelectedImageFile(null);
      setRemoveImage(false);
      return;
    }
    reset(defaultValues);
    setSelectedImageFile(null);
    setRemoveImage(false);
  }, [editPart, isEdit, reset]);

  const imageUrlField = register("imageUrl", {
    onChange: () => {
      setRemoveImage(false);
    },
  });

  const previewImageUrl =
    selectedImagePreviewUrl ??
    (normalizedImageUrlValue
      ? resolveBackendAssetUrl(normalizedImageUrlValue)
      : null) ??
    (isEdit && !removeImage ? resolveBackendAssetUrl(editPart.imageUrl) : null);

  const imageSummary = selectedImageFile
    ? `Selected upload: ${selectedImageFile.name}`
    : normalizedImageUrlValue
      ? `URL fallback: ${normalizedImageUrlValue}`
      : isEdit && !removeImage && editPart.imageUrl
        ? `Current image: ${editPart.imageUrl}`
        : "No image selected.";

  const onSubmit = async (data: FormType) => {
    if (!token) {
      toast.error("Your session expired. Sign in again.");
      return;
    }

    try {
      if (isEdit) {
        const updated = await api.updatePart(token, editPart.partId, {
          partName: data.partName,
          description: data.description,
          imageUrl: data.imageUrl,
          imageFile: selectedImageFile,
          removeImage,
          unitPrice: data.unitPrice,
          costPrice: data.costPrice,
          stockQuantity: data.stockQuantity,
          reorderLevel: data.reorderLevel,
          partCategoryId: data.partCategoryId ?? null,
        });
        onSaved(updated);
        toast.success("Part updated successfully");
      } else {
        const created = await api.createPart(token, {
          partNumber: data.partNumber,
          partName: data.partName,
          description: data.description,
          imageUrl: data.imageUrl,
          imageFile: selectedImageFile,
          unitPrice: data.unitPrice,
          costPrice: data.costPrice,
          stockQuantity: data.stockQuantity,
          reorderLevel: data.reorderLevel,
          partCategoryId: data.partCategoryId ?? null,
        });
        onSaved(created);
        toast.success("Part created successfully");
      }
      onClose();
    } catch (error: unknown) {
      const message =
        error instanceof ApiError
          ? error.message
          : getMutationErrorMessage(error, "Operation failed");
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Part number"
          error={errors.partNumber?.message}
          required
          htmlFor="partNumber"
        >
          <input
            id="partNumber"
            className="input"
            placeholder="PT-001"
            disabled={isEdit}
            {...register("partNumber")}
          />
        </Field>
        <Field
          label="Part name"
          error={errors.partName?.message}
          required
          htmlFor="partName"
        >
          <input
            id="partName"
            className="input"
            placeholder="Brake Pad"
            {...register("partName")}
          />
        </Field>
        <Field
          label="Unit price"
          error={errors.unitPrice?.message}
          required
          htmlFor="unitPrice"
        >
          <input
            id="unitPrice"
            className="input"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            {...register("unitPrice")}
          />
        </Field>
        <Field
          label="Cost price"
          error={errors.costPrice?.message}
          required
          htmlFor="costPrice"
        >
          <input
            id="costPrice"
            className="input"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            {...register("costPrice")}
          />
        </Field>
        <Field
          label="Stock quantity"
          error={errors.stockQuantity?.message}
          required
          htmlFor="stockQuantity"
        >
          <input
            id="stockQuantity"
            className="input"
            type="number"
            min="0"
            placeholder="0"
            {...register("stockQuantity")}
          />
        </Field>
        <Field
          label="Reorder level"
          error={errors.reorderLevel?.message}
          required
          htmlFor="reorderLevel"
        >
          <input
            id="reorderLevel"
            className="input"
            type="number"
            min="0"
            placeholder="10"
            {...register("reorderLevel")}
          />
        </Field>
        <div className="col-span-2">
          <Field
            label="Category"
            error={errors.partCategoryId?.message}
            htmlFor="partCategoryId"
            hint="Leave uncategorized if needed."
          >
            <select
              id="partCategoryId"
              className="input"
              {...register("partCategoryId")}
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.partCategoryId} value={c.partCategoryId}>
                  {c.categoryName}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="col-span-2">
          <Field
            label="Description"
            error={errors.description?.message}
            htmlFor="description"
            hint="Optional context for staff."
          >
            <textarea
              id="description"
              className="input"
              rows={4}
              placeholder="Add supplier notes, fitment guidance..."
              {...register("description")}
            />
          </Field>
        </div>
        <div className="col-span-2">
          <Field
            label="Part image"
            error={errors.imageUrl?.message}
            htmlFor="imageFile"
            hint="Upload JPG, PNG, or WebP. Uploaded files override the URL fallback."
          >
            <div className="space-y-3">
              {previewImageUrl ? (
                <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-surface-container-low">
                  <img
                    src={previewImageUrl}
                    alt={
                      isEdit ? editPart.partName : "Selected part image preview"
                    }
                    className="h-40 w-full object-cover"
                  />
                </div>
              ) : null}
              <input
                id="imageFile"
                className="input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setSelectedImageFile(file);
                  if (file) {
                    setRemoveImage(false);
                  }
                }}
              />
              <p className="text-xs text-on-surface-variant">{imageSummary}</p>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <Field
                  label="Image URL fallback"
                  error={errors.imageUrl?.message}
                  htmlFor="imageUrl"
                  hint="Optional backend-served or external image URL."
                >
                  <input
                    id="imageUrl"
                    className="input"
                    placeholder="/catalog/brake-pad.svg"
                    {...imageUrlField}
                  />
                </Field>
                {isEdit &&
                (editPart.imageUrl ||
                  selectedImageFile ||
                  normalizedImageUrlValue) ? (
                  <ActionButton
                    type="button"
                    tone="secondary"
                    onClick={() => {
                      setSelectedImageFile(null);
                      setRemoveImage(true);
                      reset({
                        ...watch(),
                        imageUrl: "",
                      });
                    }}
                  >
                    Remove image
                  </ActionButton>
                ) : null}
              </div>
            </div>
          </Field>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <ActionButton type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : isEdit ? "Save changes" : "Create part"}
        </ActionButton>
        <ActionButton
          type="button"
          tone="secondary"
          onClick={isEdit ? onClose : () => reset(defaultValues)}
          disabled={isSaving}
        >
          {isEdit ? "Cancel edit" : "Reset fields"}
        </ActionButton>
      </div>
    </form>
  );
}
