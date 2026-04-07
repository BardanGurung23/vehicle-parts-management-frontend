import { z } from "zod";

export const RoleSchema = z.object({
  title: z.string().min(1, "Title is Required"),
  description: z.string().min(1, "Description is Required"),
  // roleType: z.string().min(1, "Role Type is Required"),
});
