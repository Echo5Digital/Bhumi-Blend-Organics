import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import type { Env } from "../../config/env.js";
import { HttpError } from "../../lib/httpError.js";
import { parse } from "../../lib/validation.js";
import { requireAdmin, signAdminToken } from "../../middleware/auth.js";
import { createLimiter } from "../../middleware/rateLimit.js";
import { AdminUser } from "../../models/AdminUser.js";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(254),
  password: z.string().min(1).max(200),
});

// A real-looking hash to compare against when the email is unknown, so "no such
// admin" and "wrong password" take the same time and can't be told apart.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export function adminAuthRoutes(env: Env): Router {
  const router = Router();
  const loginLimiter = createLimiter(env, { windowMinutes: 15, max: 10, message: "Too many login attempts. Please wait a few minutes." });

  router.post("/login", loginLimiter, async (req, res) => {
    const { email, password } = parse(loginSchema, req.body);
    const admin = await AdminUser.findOne({ email }).select("+passwordHash");
    const ok = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
    if (!admin || !admin.isActive || !ok) {
      throw HttpError.unauthorized("Wrong email or password.", "INVALID_CREDENTIALS");
    }
    admin.lastLoginAt = new Date();
    await admin.save();
    res.json({
      token: signAdminToken(env, String(admin._id)),
      admin: { id: String(admin._id), email: admin.email, name: admin.name },
    });
  });

  router.get("/me", requireAdmin(env), (_req, res) => {
    res.json({ admin: res.locals.admin });
  });

  return router;
}
