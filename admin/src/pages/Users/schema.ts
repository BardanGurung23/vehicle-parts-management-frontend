import { z } from "zod";

// A regex pattern for validating a basic email format
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Password validation pattern (at least 8 characters, one number, one special character, one uppercase letter)
const passwordRegex =
  /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/;

export const UserSchema = z.object({
  username: z.string().min(1, "Username is Required").trim(),
  email: z
    .string()
    .min(1, "Email is Required")
    .regex(emailRegex, "Please enter a valid email address")
    .trim(),
  firstName: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  lastName: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  mobileNo: z.string().min(1, "Mobile Number is Required").trim(),
  roleId: z.string().min(1, "Role is Required").trim(),
  gender: z.string().min(1, "Gender is Required").trim(),
  mobilePrefix: z.string().min(1, "Mobile Prefix is Required").trim(),
  password: z.string().min(1, "Password is Required").trim(),
  // password: z
  //   .string()
  //   .min(8, "Password must be at least 8 characters long")
  //   .regex(
  //     passwordRegex,
  //     "Password must include at least one uppercase letter, one number, and one special character"
  //   )
  //   .min(1, "Password is Required"),
  // isActive: z.boolean().default(true), // Assuming a boolean value for active status
});

// You can add the password confirmation schema if necessary for the "security" tab:
export const SecuritySchema = z
  .object({
    newPassword: z
      .string()
      .trim()
      .min(8, "Password must be at least 8 characters long")
      .max(32, "Password must not exceed 32 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().trim(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"], // This will mark the error on the confirmPassword field
  });
