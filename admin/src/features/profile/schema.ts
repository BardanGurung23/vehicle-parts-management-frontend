import { z } from "zod";
import {
  fullNameSchema,
  phoneNumberSchema,
  requiredEmailSchema,
  requiredVehicleNumberSchema,
  vehicleModelSchema,
} from "../../shared/validation/member4Validation";

export const ProfileSchema = z.object({
  fullName: fullNameSchema,
  email: requiredEmailSchema,
  phoneNumber: phoneNumberSchema,
  address: z.string().max(500, "Address is too long.").optional(),
});

export const vehicleSchema = z.object({
  vehicleNumber: requiredVehicleNumberSchema,
  vehicleModel: vehicleModelSchema,
  mileage: z
    .string()
    .trim()
    .refine((value) => {
      if (value.length === 0) return true;
      const mileage = Number(value);
      return Number.isInteger(mileage) && mileage >= 0 && mileage <= 2_000_000;
    }, "Mileage must be between 0 and 2,000,000 km."),
  manufactureYear: z
    .string()
    .trim()
    .refine(
      (value) => {
        if (value.length === 0) return true;
        const year = Number(value);
        return (
          Number.isInteger(year) &&
          year >= 1950 &&
          year <= new Date().getFullYear() + 1
        );
      },
      `Manufacture year must be between 1950 and ${new Date().getFullYear() + 1}.`,
    ),
  lastServiceDate: z
    .string()
    .trim()
    .refine((value) => {
      if (value.length === 0) return true;
      const timestamp = new Date(`${value}T00:00:00.000Z`).getTime();
      return Number.isFinite(timestamp) && timestamp <= Date.now() + 86_400_000;
    }, "Last service date cannot be in the future."),
});
