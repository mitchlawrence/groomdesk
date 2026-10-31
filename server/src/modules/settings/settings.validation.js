import { z } from "zod";
import { atLeastOne } from "../../utils/zod-helpers.js";

const clock = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM, 24-hour");

export const updateSettingsSchema = z
  .strictObject({
    shopName: z.string().trim().min(1).max(100).optional(),
    openingTime: clock.optional(),
    closingTime: clock.optional(),
    slotMinutes: z
      .union([z.literal(15), z.literal(30), z.literal(60)])
      .optional(),
  })
  .refine(atLeastOne, "Nothing to update");
