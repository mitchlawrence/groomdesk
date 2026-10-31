import { z } from "zod";

const username = z
  .string()
  .trim()
  .min(3)
  .max(30)
  .regex(
    /^[A-Za-z0-9._-]+$/,
    "Use letters, numbers, dots, dashes or underscores",
  );
const fullName = z.string().trim().min(1).max(100);
const phone = z
  .string()
  .trim()
  .max(30)
  .transform((value) => (value === "" ? null : value))
  .nullable();
const password = z.string().min(10, "Use at least 10 characters").max(128);
const id = z.number().int().positive();

export const createUserSchema = z.strictObject({
  username,
  fullName,
  phone: phone.optional(),
  password,
  roleId: id,
});

export const updateUserSchema = z
  .strictObject({
    fullName: fullName.optional(),
    phone: phone.optional(),
    roleId: id.optional(),
    confirm: z.boolean().optional(),
  })
  .refine(
    (v) =>
      v.fullName !== undefined ||
      v.phone !== undefined ||
      v.roleId !== undefined,
    {
      message: "Nothing to update",
    },
  );

export const confirmSchema = z.strictObject({
  confirm: z.boolean().optional(),
});

export const resetPasswordSchema = z.strictObject({ password });

export const updateProfileSchema = z
  .strictObject({ username: username.optional(), phone: phone.optional() })
  .refine((v) => v.username !== undefined || v.phone !== undefined, {
    message: "Nothing to update",
  });

export const changePasswordSchema = z
  .strictObject({
    currentPassword: z.string().min(1).max(200),
    newPassword: password,
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: "New password must be different",
    path: ["newPassword"],
  });
