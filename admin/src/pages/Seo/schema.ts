import { z } from "zod";

export const SeoFormSchema = z.object({
  title: z.string().min(1, "Title is Required"),
  author: z.string().min(1, "Author is Required"),
  description: z.string().min(1, "Description is Required"),
  pageName: z.string().min(1, "Page is Required"),
  og_title: z.string().min(1, "OG Title is Required"),
  og_description: z.string().min(1, "OG Description is Required"),
  keywords: z.array(z.string().optional()),
});
