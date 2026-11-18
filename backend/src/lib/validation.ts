import { z } from "zod";
import { HttpError } from "./httpError.js";

/** Validate untrusted input; a mistake becomes a 400 listing every problem field. */
export function parse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw HttpError.badRequest(
      "Please check the highlighted details.",
      result.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      "VALIDATION_ERROR",
    );
  }
  return result.data;
}

/** States and union territories — same list as the storefront's checkout. */
export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

const text = (max: number, message: string) => z.string().trim().min(1, message).max(max);

/** Keep the 10 digits: drops spaces, dashes and a +91 / 91 / 0 prefix. */
export function normalizePhone(raw: string): string {
  return raw.replace(/[\s()-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, "");
}

export const addressSchema = z.object({
  firstName: text(60, "Please enter your first name."),
  lastName: text(60, "Please enter your last name."),
  country: z.literal("India").default("India"),
  line1: text(200, "Please enter your address."),
  line2: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((value) => value || undefined),
  city: text(80, "Please enter your city."),
  state: z.enum(INDIAN_STATES, { error: "Please select a state." }),
  pin: z.string().trim().regex(/^[1-9]\d{5}$/, "Please enter a valid 6-digit PIN code."),
  phone: z
    .string()
    .transform(normalizePhone)
    .refine((phone) => /^\d{10}$/.test(phone), "Please enter a valid 10-digit phone number."),
});

export const emailSchema = z
  .email("Please enter a valid email address.")
  .max(254)
  .transform((email) => email.toLowerCase());

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single dashes only.");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/** `/regex/`-safe version of what a visitor typed into a search box. */
export const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
