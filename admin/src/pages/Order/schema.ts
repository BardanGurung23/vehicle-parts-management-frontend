import { z } from "zod";

export const OrderFilterSchema = z.object({
  email: z.string().optional(),
  mobileNo: z.string().optional(),
  orderDate: z.date().optional(),
  deliveryTime: z.date().optional(),
  paymentStatus: z.string().optional(),
  status: z.string().optional(),
});

export type OrderFilterType = z.infer<typeof OrderFilterSchema>;
