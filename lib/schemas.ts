import { z } from "zod";

export const waitlistSchema = z
  .object({
    dropId: z.uuid().nullish(),
    contact: z
      .string()
      .trim()
      .min(5, "Add an email or phone number so we can reach you.")
      .max(120)
      .refine(
        (v) => /.+@.+\..+/.test(v) || v.replace(/\D/g, "").length >= 7,
        "That doesn't look like an email or phone number.",
      ),
    website: z.string().max(200).optional().default(""), // honeypot
  })
  .strict();

export const checkoutSchema = z
  .object({
    idempotencyKey: z.uuid(),
    dropId: z.uuid(),
    windowId: z.uuid(),
    package: z.enum(["three", "half", "dozen"]),
    name: z.string().trim().min(1, "Please add your name.").max(80),
    phone: z
      .string()
      .trim()
      .refine(
        (v) => v.replace(/\D/g, "").length >= 7,
        "Please add a phone number we can text.",
      ),
    email: z.email("Please add a valid email.").max(120),
    sourceToken: z.string().min(8).max(512),
    verificationToken: z.string().max(512).optional(),
    website: z.string().max(200).optional().default(""), // honeypot
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.email().max(120),
    password: z.string().min(8).max(200),
  })
  .strict();

export const forgotSchema = z
  .object({
    email: z.email().max(120),
    website: z.string().max(200).optional().default(""), // honeypot
  })
  .strict();
