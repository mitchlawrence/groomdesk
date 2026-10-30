import { z } from "zod";

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues.map(
    (i) => `${i.path.join(".")}: ${i.message}`,
  );
  console.error(`Invalid environment configuration:\n${problems.join("\n")}`);
  process.exit(1);
}

export const env = parsed.data;
