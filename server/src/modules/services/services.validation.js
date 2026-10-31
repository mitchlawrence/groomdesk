import { z } from "zod";
import { atLeastOne } from "../../utils/zod-helpers.js";

const name = z.string().trim().min(1).max(100);
const description = z.string().trim().max(300);
const category = z.enum(["package", "add_on"]);
const appliesTo = z.enum(["dog", "cat", "all"]);

const price = z
  .number()
  .min(0)
  .max(100000)
  .refine(
    (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-7,
    "At most 2 decimal places",
  );

const priceRow = z.strictObject({
  sizeCategoryId: z.number().int().positive(),
  price,
  durationMinutes: z.number().int().min(5).max(480),
});

const prices = z
  .array(priceRow)
  .min(1)
  .max(20)
  .refine(
    (rows) =>
      new Set(rows.map((row) => row.sizeCategoryId)).size === rows.length,
    "Each size can appear only once",
  );

export const createServiceSchema = z.strictObject({
  name,
  description: description.optional(),
  category,
  appliesTo: appliesTo.optional(),
  prices,
});

export const updateServiceSchema = z
  .strictObject({
    name: name.optional(),
    description: description.optional(),
    category: category.optional(),
    appliesTo: appliesTo.optional(),
    isActive: z.boolean().optional(),
  })
  .refine(atLeastOne, "Nothing to update");

export const setPricesSchema = z.strictObject({ prices });
