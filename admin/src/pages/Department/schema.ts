import { z } from "zod";

export const DepartmentSchema = z.object({
  name: z.string().min(1, "Name is Required"),
  color: z.string().min(6, "Color is Required"),
});
