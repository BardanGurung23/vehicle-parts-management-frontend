import { z } from "zod";
import {
  fullNameSchema,
  optionalVehicleNumberSchema,
  phoneNumberSchema,
  requiredEmailSchema,
  vehicleModelSchema,
} from "../../shared/validation/member4Validation";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address.").trim(),
  password: z.string().min(8, "Password must be at least 8 characters.").trim(),
});

export const registerSchema = z
  .object({
    fullName: fullNameSchema,
    email: requiredEmailSchema,
    phoneNumber: phoneNumberSchema,
    address: z.string().max(500, "Address is too long.").optional(),
    vehicleNumber: optionalVehicleNumberSchema,
    vehicleModel: vehicleModelSchema,
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your password."),
  })
  .refine((values) => values.vehicleNumber || !values.vehicleModel?.trim(), {
    path: ["vehicleNumber"],
    message: "Vehicle number is required when providing vehicle details.",
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });
