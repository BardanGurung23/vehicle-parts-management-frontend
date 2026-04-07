import { z } from "zod";

export const CustomerFilterSchema = z.object({
  username: z.string().optional(),
  email: z.string().optional(),
  userType: z.string().optional(),
  createdAt: z.date().optional(),
});

export type CustomerFilterType = z.infer<typeof CustomerFilterSchema>;
