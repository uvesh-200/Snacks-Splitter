import { z } from "zod";

export const biscuitBuddyFormSchema = z.object({
  total_money: z.coerce.number().min(1, "Total money must be greater than 0"),
  date: z.date(),
  teamMembers: z.array(z.object({
    name: z.string().min(1, "Name is required"),
    showAdvancedPayment: z.boolean().default(false),
    advancedPayment: z.coerce.number().min(0).optional(),
  })).min(1, "At least one team member is required"),
});