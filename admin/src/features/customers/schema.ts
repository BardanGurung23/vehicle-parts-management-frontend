import { z } from "zod";
import {
  fullNameSchema,
  optionalEmailSchema,
  phoneNumberSchema,
  requiredVehicleNumberSchema,
  vehicleModelSchema,
} from "../../shared/validation/member4Validation";

export const createCustomerSchema = z.object({
  fullName: fullNameSchema,
  phoneNumber: phoneNumberSchema,
  email: optionalEmailSchema,
  address: z.string().max(500, "Address is too long.").optional(),
  vehicleNumber: requiredVehicleNumberSchema,
  vehicleModel: vehicleModelSchema,
});
