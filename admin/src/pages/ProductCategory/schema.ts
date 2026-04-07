import { z } from "zod";

export const ProductCategorySchema = z.object({
  name: z.string().min(1, "Name is Required"),
  imageUrl: z.union([
    z.string().min(1, "Image Url is Required"),
    z.array(z.string().min(1, "Each Image Url must be a valid string")),
  ]),
  imageUrlSecondary: z.union([
    z.string().min(1, "Image Url is Required"),
    z.array(z.string().min(1, "Each Image Url must be a valid string")),
  ]),
  description: z.string().optional(),
});
