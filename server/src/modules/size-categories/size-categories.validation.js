import { z } from "zod";
import { atLeastOne } from "../../utils/zod-helpers.js";

const name = z.string().trim().min(1).max(50);
const description = z.string().trim().max(200);
const sortOrder = z.number().int().min(0).max(1000);

export const createSizeSchema = z.strictObject({
  name,
  description: description.optional(),
  sortOrder: sortOrder.optional(),
});

export const updateSizeSchema = z
  .strictObject({
    name: name.optional(),
    description: description.optional(),
    sortOrder: sortOrder.optional(),
    isActive: z.boolean().optional(),
  })
  .refine(atLeastOne, "Nothing to update");
