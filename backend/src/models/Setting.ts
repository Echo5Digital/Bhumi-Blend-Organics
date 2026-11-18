import { Schema, model, type InferSchemaType } from "mongoose";

// The shop's own settings, edited in the admin (Settings → General). One row
// only; `getSettings()` fills in defaults so the rest of the code never has to
// handle "not saved yet".
const settingSchema = new Schema(
  {
    _id: { type: String, default: "general" },
    storeName: { type: String, trim: true, default: "Bhumi Blend Organics" },
    /** Where the business is (shown to the admin; used later for tax / shipping). */
    address: {
      line1: { type: String, trim: true, default: "" },
      line2: { type: String, trim: true, default: "" },
      city: { type: String, trim: true, default: "" },
      state: { type: String, trim: true, default: "" },
      pin: { type: String, trim: true, default: "" },
      country: { type: String, trim: true, default: "India" },
    },
    contactEmail: { type: String, trim: true, default: "" },
    contactPhone: { type: String, trim: true, default: "" },
    /** When off, coupon codes are refused at checkout. */
    couponsEnabled: { type: Boolean, default: true },
    /** A product with this many left (or fewer) counts as "low in stock". */
    lowStockThreshold: { type: Number, min: 0, default: 2 },
  },
  { timestamps: true },
);

export type SettingRecord = InferSchemaType<typeof settingSchema>;
export const Setting = model("Setting", settingSchema);

export type Settings = {
  storeName: string;
  address: { line1: string; line2: string; city: string; state: string; pin: string; country: string };
  contactEmail: string;
  contactPhone: string;
  couponsEnabled: boolean;
  lowStockThreshold: number;
};

export const DEFAULT_SETTINGS: Settings = {
  storeName: "Bhumi Blend Organics",
  address: { line1: "", line2: "", city: "", state: "", pin: "", country: "India" },
  contactEmail: "",
  contactPhone: "",
  couponsEnabled: true,
  lowStockThreshold: 2,
};

/** The saved settings, with the default for anything never saved. */
export async function getSettings(): Promise<Settings> {
  const saved = await Setting.findById("general").lean();
  const d = DEFAULT_SETTINGS;
  return {
    storeName: saved?.storeName ?? d.storeName,
    address: {
      line1: saved?.address?.line1 ?? d.address.line1,
      line2: saved?.address?.line2 ?? d.address.line2,
      city: saved?.address?.city ?? d.address.city,
      state: saved?.address?.state ?? d.address.state,
      pin: saved?.address?.pin ?? d.address.pin,
      country: saved?.address?.country ?? d.address.country,
    },
    contactEmail: saved?.contactEmail ?? d.contactEmail,
    contactPhone: saved?.contactPhone ?? d.contactPhone,
    couponsEnabled: saved?.couponsEnabled ?? d.couponsEnabled,
    lowStockThreshold: saved?.lowStockThreshold ?? d.lowStockThreshold,
  };
}
