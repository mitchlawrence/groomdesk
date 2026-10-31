import { z } from "zod";
import { atLeastOne } from "../../utils/zod-helpers.js";

const name = z.string().trim().min(1).max(50);

export const createStationSchema = z.strictObject({ name });

export const updateStationSchema = z
  .strictObject({ name: name.optional(), isActive: z.boolean().optional() })
  .refine(atLeastOne, "Nothing to update");
