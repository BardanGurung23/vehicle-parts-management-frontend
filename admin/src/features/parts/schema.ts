import { z } from "zod";

export const Partsschema = z.object({
  partNumber: z.string().min(1, "Part number is required"),
  partName: z.string().min(1, "Part name is required"),
  description: z.string().optional(),
  imageUrl: z
    .string()
    .trim()
    .max(500, "Must be 500 characters or fewer")
    .optional(),
  unitPrice: z.coerce.number().min(0, "Must be >= 0"),
  costPrice: z.coerce.number().min(0, "Must be >= 0"),
  stockQuantity: z.coerce.number().int().min(0, "Must be >= 0"),
  reorderLevel: z.coerce.number().int().min(0, "Must be >= 0"),
  partCategoryId: z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined
        ? null
        : Number(value),
    z.number().int().positive().nullable(),
  ),
});
