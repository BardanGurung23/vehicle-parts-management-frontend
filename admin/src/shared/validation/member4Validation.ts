import { z } from "zod";

function normalizePhoneNumber(value: string) {
  let normalized = "";

  for (const character of value.trim()) {
    if (/\d/.test(character) || (character === "+" && normalized.length === 0)) {
      normalized += character;
    }
  }

  return normalized;
}

function normalizeVehicleNumber(value: string) {
  return value.trim().toUpperCase().split(/\s+/).filter(Boolean).join(" ");
}

function isValidPhoneNumber(value: string) {
  const normalized = normalizePhoneNumber(value);
  const digitCount = normalized.replace(/\D/g, "").length;

  return digitCount >= 7 && normalized.length <= 20;
}

function isValidRequiredVehicleNumber(value: string) {
  const normalized = normalizeVehicleNumber(value);
  return normalized.length >= 2 && normalized.length <= 30;
}

export const fullNameSchema = z
  .string()
  .trim()
  .min(3, "Full name must be at least 3 characters.")
  .max(150, "Full name is too long.");

export const phoneNumberSchema = z
  .string()
  .trim()
  .refine(isValidPhoneNumber, "Phone number must contain 7 to 20 digits, with an optional leading plus sign.");

export const requiredEmailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .max(150, "Email is too long.");

export const optionalEmailSchema = z
  .string()
  .trim()
  .refine((value) => value.length === 0 || z.string().email().safeParse(value).success, "Enter a valid email address.");

export const requiredVehicleNumberSchema = z
  .string()
  .trim()
  .refine(isValidRequiredVehicleNumber, "Vehicle number must be between 2 and 30 characters.");

export const optionalVehicleNumberSchema = z
  .string()
  .trim()
  .refine((value) => value.length === 0 || isValidRequiredVehicleNumber(value), "Vehicle number must be between 2 and 30 characters.");

export const vehicleModelSchema = z
  .string()
  .trim()
  .max(80, "Vehicle model is too long.")
  .optional();