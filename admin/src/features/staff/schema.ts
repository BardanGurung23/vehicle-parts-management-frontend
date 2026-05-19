import { z } from "zod";

export const staffSchema = z.object({
  fullName: z
    .string()
    .min(3, "Full name must be at least 3 characters.")
    .trim(),
  email: z.string().email("Enter a valid email address.").trim(),
  phoneNumber: z
    .string()
    .min(7, "Phone number must be at least 7 characters.")
    .trim(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  roleId: z.coerce.number().int().min(1, "Choose a role."),
});
