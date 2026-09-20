import { z } from 'zod';
import { emailSchema, optionalText, text, uuidSchema } from './common';

/** Password policy: length first, then variety. Never logged, never echoed. */
export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be 128 characters or fewer')
  .refine((v) => /[a-z]/.test(v), 'Password must contain a lowercase letter')
  .refine((v) => /[A-Z]/.test(v), 'Password must contain an uppercase letter')
  .refine((v) => /[0-9]/.test(v), 'Password must contain a number')
  .refine((v) => /[^A-Za-z0-9]/.test(v), 'Password must contain a symbol');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(128),
  rememberDevice: z.boolean().optional().default(false),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(20).max(256),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required').max(128),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((v) => v.password !== v.currentPassword, {
    message: 'The new password must differ from the current one',
    path: ['password'],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const adminUserCreateSchema = z.object({
  email: emailSchema,
  name: text(120, 'Name'),
  jobTitle: optionalText(120),
  roleIds: z.array(uuidSchema).min(1, 'Assign at least one role'),
  /** Omit to create an INVITED account with no usable password. */
  password: passwordSchema.optional(),
  mustChangePassword: z.boolean().default(true),
});
export type AdminUserCreateInput = z.infer<typeof adminUserCreateSchema>;

export const adminUserUpdateSchema = z.object({
  name: text(120, 'Name').optional(),
  jobTitle: optionalText(120),
  status: z.enum(['INVITED', 'ACTIVE', 'SUSPENDED', 'DISABLED']).optional(),
  roleIds: z.array(uuidSchema).min(1).optional(),
});
export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;

export const roleUpsertSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(48)
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and hyphens'),
  name: text(80, 'Role name'),
  description: optionalText(300),
  permissionKeys: z.array(z.string().min(3).max(64)).default([]),
});
export type RoleUpsertInput = z.infer<typeof roleUpsertSchema>;

/**
 * Password strength indicator for the admin UI. Purely advisory - the schema
 * above is what actually enforces the policy.
 */
export function passwordStrength(password: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  let score = 0;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
  if (/(.)\1{2,}/.test(password)) score = Math.max(0, score - 1);

  const clamped = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
  const labels = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'] as const;
  return { score: clamped, label: labels[clamped] };
}
