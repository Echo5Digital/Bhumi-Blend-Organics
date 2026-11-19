// Shared bits for the /checkout page: the address shape, its validation, the
// list of Indian states, the rupee formatter and the calls that place and cancel
// an order. No state lives here and nothing is stored in the browser — the page
// keeps the form in memory, and the order itself is recorded by the backend.

import { api } from "@/lib/api";

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

/** What the backend needs to place an order (POST /api/orders). */
export type OrderInput = {
  items: { slug: string; qty: number }[];
  email: string;
  shipping: Address;
  billingSameAsShipping: boolean;
  billing?: Address;
  note?: string;
  couponCode?: string;
};

/** What the Razorpay popup needs. The backend sends none (null) while Razorpay isn't set up. */
export type PaymentParams = { keyId?: string; razorpayOrderId?: string; amountPaise: number; currency: string };

/** An order the backend has recorded, as the pay step shows it. */
export type PlacedOrder = {
  number: number;
  /** "November 19, 2026" */
  date: string;
  total: number;
  /** The secret that lets this browser cancel the order (sent as `X-Order-Token`). */
  accessToken: string;
  /** What the Razorpay popup needs; null while online payment isn't set up. */
  payment: PaymentParams | null;
};

/**
 * Place the order with the backend, which prices the cart itself (so what is charged can't be
 * tampered with) and numbers it. It needs the logged-in shopper's token (there is no guest
 * checkout): the order is saved in their account, and with a missing or expired token the
 * backend answers 401 and records nothing.
 */
export async function placeOrder(input: OrderInput, token: string): Promise<PlacedOrder> {
  const response = await api<{
    order: { number: number; createdAt: string; total: number };
    accessToken: string;
    payment: PaymentParams | null;
  }>("/orders", { method: "POST", body: input, token });
  return {
    number: response.order.number,
    date: new Date(response.order.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    total: response.order.total,
    accessToken: response.accessToken,
    payment: response.payment,
  };
}

/**
 * "Pay Now" while online payment isn't set up: nothing can be paid yet, so this is the moment the
 * order counts as placed. The backend tells the shop owner (the "New order" email).
 */
export async function confirmOrder(order: PlacedOrder): Promise<void> {
  await api(`/orders/${order.number}/confirm`, { method: "POST", headers: { "X-Order-Token": order.accessToken } });
}

/** The pay step's "Cancel": marks the order cancelled (only possible before it is paid). */
export async function cancelOrder(order: PlacedOrder): Promise<void> {
  await api(`/orders/${order.number}/cancel`, { method: "POST", headers: { "X-Order-Token": order.accessToken } });
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
