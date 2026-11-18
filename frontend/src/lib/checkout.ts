// Shared bits for the /checkout page: the address shape, its validation, the
// list of Indian states and the rupee formatter. No state lives here and
// nothing is stored — the page keeps the form in memory (there is no account
// or backend yet, so there is nowhere safe to keep a visitor's address).

export const rupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
});

/** States and union territories, in the order a shopper expects to scan them. */
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

export type Address = {
  firstName: string;
  lastName: string;
  country: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pin: string;
  phone: string;
};

/** An address as the backend returns it: `line2` is left out when it was empty. */
export type StoredAddress = Omit<Address, "line2"> & { line2?: string };

/** A stored address ready to put in the form (every field a string). */
export const toAddress = (stored: StoredAddress): Address => ({ ...stored, line2: stored.line2 ?? "" });

export const emptyAddress: Address = {
  firstName: "",
  lastName: "",
  country: "India",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pin: "",
  phone: "",
};

/** The address fields in the order they appear on the page (used to focus the first mistake). */
export const ADDRESS_FIELDS = [
  "firstName",
  "lastName",
  "line1",
  "line2",
  "city",
  "state",
  "pin",
  "phone",
] as const satisfies readonly (keyof Address)[];

export type AddressErrors = Partial<Record<keyof Address, string>>;

export function validateEmail(email: string): string | undefined {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ? undefined
    : "Please enter a valid email address.";
}

export function validateAddress(address: Address): AddressErrors {
  const errors: AddressErrors = {};
  if (!address.firstName.trim()) errors.firstName = "Please enter your first name.";
  if (!address.lastName.trim()) errors.lastName = "Please enter your last name.";
  if (!address.line1.trim()) errors.line1 = "Please enter your address.";
  if (!address.city.trim()) errors.city = "Please enter your city.";
  if (!(INDIAN_STATES as readonly string[]).includes(address.state)) {
    errors.state = "Please select a state.";
  }
  if (!/^[1-9]\d{5}$/.test(address.pin.trim())) {
    errors.pin = "Please enter a valid 6-digit PIN code.";
  }
  // Allow spaces, dashes and a +91 / 0 prefix; what is left must be 10 digits.
  const phoneDigits = address.phone.replace(/[\s()-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, "");
  if (!/^\d{10}$/.test(phoneDigits)) errors.phone = "Please enter a valid 10-digit phone number.";
  return errors;
}

/**
 * The order shown on the pay step. Placeholder: there is no backend to number
 * or record orders yet, so the number is made up in the browser. Swap this for
 * the real "create order" call when the backend exists.
 */
export function createPlaceholderOrder(total: number) {
  return {
    number: String(Math.floor(10000 + Math.random() * 90000)),
    date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    total,
  };
}

/** "line 1, line 2, City 682001, Kerala, India, 9876543210" — the one-line summary on the address card. */
export function formatAddress(address: StoredAddress): string {
  return [
    address.line1.trim(),
    (address.line2 ?? "").trim(),
    `${address.city.trim()} ${address.pin.trim()}`.trim(),
    address.state,
    address.country,
    address.phone.trim(),
  ]
    .filter(Boolean)
    .join(", ");
}
