import { z } from "zod";

export const ProductVariantSchema = z.object({
  name: z.string().min(1, "Name is Required"),
  description: z.string().min(1, "Description is Required"),
  quantity: z.number().int().positive(),
  price: z.number(),
  productId: z.string().min(1, "Product is Required"),
  media: z.union([
    z.string().min(1, "Image Url is Required"),
    z.array(z.string().min(1, "Each Image Url must be a valid string")),
  ]),
});
