import bcrypt from "bcryptjs";
import { AdminUser } from "../../src/models/AdminUser.js";

export const MIN_PASSWORD_LENGTH = 10;

/** Create an admin, or (if the email already exists) update its name and password. */
export async function upsertAdmin({ email, name, password }: { email: string; name: string; password: string }) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`The password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await AdminUser.findOne({ email: email.toLowerCase() });
  if (existing) {
    existing.name = name;
    existing.passwordHash = passwordHash;
    existing.isActive = true;
    await existing.save();
    return { created: false, id: String(existing._id) };
  }
  const admin = await AdminUser.create({ email, name, passwordHash });
  return { created: true, id: String(admin._id) };
}
