"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import type { Product } from "@/data/products";
import { ApiError, api } from "@/lib/api";
import { useCart } from "@/lib/cart";
import {
  ADDRESS_FIELDS,
  createPlaceholderOrder,
  emptyAddress,
  formatAddress,
  validateAddress,
  validateEmail,
  type Address,
  type AddressErrors,
} from "@/lib/checkout";
import { useHydrated } from "@/lib/persistent-store";
import { AddressFields } from "./AddressFields";
import { Checkbox, OptionCard, TextField } from "./Fields";
import { OrderSummary, type AppliedCoupon, type SummaryRow } from "./OrderSummary";
import { PayStep, type PlacedOrder } from "./PayStep";

type FormState = {
  email: string;
  shipping: Address;
  billingSame: boolean;
  billing: Address;
  addNote: boolean;
  note: string;
};

const initialForm: FormState = {
  email: "",
  shipping: emptyAddress,
  billingSame: true,
  billing: emptyAddress,
  addNote: false,
  note: "",
};

const sectionHeading = "mb-4 font-system text-[20px] leading-7 font-medium text-[#1e1e1e]";

function focusLater(id: string) {
  // After React has put the (possibly just re-opened) form on screen.
  window.requestAnimationFrame(() => document.getElementById(id)?.focus());
}

// The /checkout page body, laid out like the live site's checkout: contact,
// shipping address, billing choice, shipping + payment options and an order
// note on the left, the order summary on the right. What is bought is the
// cart (lib/cart.ts) — "Buy It Now" on a product just puts it there first.
//
// The form lives in memory only: there is no account or backend yet, so
// nothing is saved and nothing is sent. "Buy It Now" validates, then shows the
// pay step (PayStep). Like the cart, it only exists in the browser, so the
// server HTML is an empty placeholder until the page is interactive.
export function CheckoutView({
  catalogue,
  sizes,
}: {
  catalogue: Product[];
  /** Pack size per product slug ("100g", "450ml"), shown under the name in the summary. */
  sizes: Record<string, string>;
}) {
  const { lines } = useCart();
  const hydrated = useHydrated();
  const [form, setForm] = useState<FormState>(initialForm);
  // The shipping address collapses to a one-line card (with Edit) once saved.
  const [editingShipping, setEditingShipping] = useState(true);
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const [attempted, setAttempted] = useState(false);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  // A coupon the shopper has applied (checked with the backend, so it follows what the admin set up).
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);

  const bySlug = useMemo(
    () => new Map(catalogue.map((product) => [product.slug, product])),
    [catalogue],
  );
  const rows: SummaryRow[] = lines.flatMap((line) => {
    const product = bySlug.get(line.slug);
    return product ? [{ product, qty: line.qty, size: sizes[line.slug] }] : [];
  });
  const subtotal = rows.reduce((total, row) => total + row.product.price * row.qty, 0);
  const total = Math.max(0, subtotal - (coupon?.discount ?? 0));

  const emailError = validateEmail(form.email);
  const shippingErrors = validateAddress(form.shipping);
  const billingErrors: AddressErrors = form.billingSame ? {} : validateAddress(form.billing);

  // A mistake is only shown once the visitor has left that field or tried to submit.
  const showing = (key: string) => attempted || touched.has(key);
  const visibleErrors = (prefix: "shipping" | "billing", errors: AddressErrors) => {
    const out: AddressErrors = {};
    for (const field of ADDRESS_FIELDS) {
      if (errors[field] && showing(`${prefix}.${field}`)) out[field] = errors[field];
    }
    return out;
  };

  const touch = (...keys: string[]) =>
    setTouched((current) => (keys.every((key) => current.has(key)) ? current : new Set([...current, ...keys])));

  const setAddress = (prefix: "shipping" | "billing") => (field: keyof Address, value: string) =>
    setForm((current) => ({ ...current, [prefix]: { ...current[prefix], [field]: value } }));

  /** Ask the backend whether a code works for this cart. Returns the reason it doesn't, or null once applied. */
  async function applyCoupon(code: string): Promise<string | null> {
    try {
      const result = await api<{ code: string; discount: number }>("/coupons/validate", {
        method: "POST",
        body: { code, items: rows.map((row) => ({ slug: row.product.slug, qty: row.qty })) },
      });
      setCoupon({ code: result.code, discount: result.discount });
      return null;
    } catch (error) {
      return error instanceof ApiError ? error.message : "That coupon couldn't be checked. Please try again.";
    }
  }

  function saveShipping() {
    touch(...ADDRESS_FIELDS.map((field) => `shipping.${field}`));
    const firstBad = ADDRESS_FIELDS.find((field) => shippingErrors[field]);
    if (firstBad) {
      focusLater(`shipping-${firstBad}`);
      return;
    }
    setEditingShipping(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);

    const firstBadShipping = ADDRESS_FIELDS.find((field) => shippingErrors[field]);
    const firstBadBilling = ADDRESS_FIELDS.find((field) => billingErrors[field]);
    const firstBadId = emailError
      ? "checkout-email"
      : firstBadShipping
        ? `shipping-${firstBadShipping}`
        : firstBadBilling
          ? `billing-${firstBadBilling}`
          : null;

    if (firstBadId) {
      if (firstBadShipping) setEditingShipping(true);
      focusLater(firstBadId);
      return;
    }

    setPlaced(createPlaceholderOrder(total));
  }

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1290px] px-6 pt-10 pb-20 md:pt-14 md:pb-28">
        <div className="pb-8 text-center md:pb-10">
          <h1 className="font-system text-[32px] leading-[1.2] font-bold text-brand-gold-dark sm:text-[36px]">
            Secure Checkout
          </h1>
          <p className="mt-3 font-system text-[16px] leading-6 text-[#555]">
            Experience Pure Ayurvedic Care at Home
          </p>
        </div>

        {!hydrated ? (
          <div aria-hidden="true" className="min-h-[480px]" />
        ) : rows.length === 0 ? (
          <div className="mx-auto flex max-w-[420px] flex-col items-center py-6 text-center md:py-10">
            <h2 className="font-system text-[22px] leading-snug font-medium text-[#1e1e1e]">
              Your cart is empty
            </h2>
            <p className="mt-3 font-system text-[15px] leading-7 text-[#555]">
              Add something you love and you can check out from here.
            </p>
            <Link
              href="/shop"
              className="mt-8 inline-flex h-[52px] items-center rounded-[4px] bg-brand-gold px-8 font-system text-[16px] font-medium text-white transition-colors duration-300 hover:bg-brand-gold-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
            >
              Continue shopping
            </Link>
          </div>
        ) : placed ? (
          <PayStep order={placed} onCancel={() => setPlaced(null)} />
        ) : (
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
            <form noValidate onSubmit={handleSubmit}>
              <section aria-labelledby="checkout-contact-title">
                <h2 id="checkout-contact-title" className={sectionHeading}>
                  Contact information
                </h2>
                <TextField
                  id="checkout-email"
                  label="Email address"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={form.email}
                  error={showing("email") ? emailError : undefined}
                  onChange={(email) => setForm((current) => ({ ...current, email }))}
                  onBlur={() => touch("email")}
                />
              </section>

              <section aria-labelledby="checkout-shipping-title" className="mt-7">
                <h2 id="checkout-shipping-title" className={sectionHeading}>
                  Shipping address
                </h2>
                {editingShipping ? (
                  <>
                    <AddressFields
                      prefix="shipping"
                      value={form.shipping}
                      errors={visibleErrors("shipping", shippingErrors)}
                      onChange={setAddress("shipping")}
                      onBlur={(field) => touch(`shipping.${field}`)}
                    />
                    <button
                      type="button"
                      onClick={saveShipping}
                      className="mt-4 h-11 cursor-pointer rounded-[4px] border border-[#1e1e1e] bg-white px-6 font-system text-[14px] font-medium text-[#1e1e1e] transition-colors duration-200 hover:bg-[#1e1e1e] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
                    >
                      Save address
                    </button>
                  </>
                ) : (
                  <div className="flex items-start justify-between gap-4 rounded-[4px] border border-[#dcdcdc] p-4 font-system text-[#1e1e1e]">
                    <div className="min-w-0">
                      <p className="text-[14px] leading-5 font-semibold">
                        {form.shipping.firstName.trim()} {form.shipping.lastName.trim()}
                      </p>
                      <p className="mt-2 text-[14px] leading-5 break-words text-[#444]">
                        {formatAddress(form.shipping)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingShipping(true);
                        focusLater("shipping-firstName");
                      }}
                      className="shrink-0 cursor-pointer text-[14px] leading-5 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
                    >
                      Edit
                    </button>
                  </div>
                )}

                <div className="mt-4">
                  <Checkbox
                    id="checkout-billing-same"
                    checked={form.billingSame}
                    onChange={(billingSame) => setForm((current) => ({ ...current, billingSame }))}
                  >
                    Use same address for billing
                  </Checkbox>
                </div>
              </section>

              {!form.billingSame && (
                <section aria-labelledby="checkout-billing-title" className="mt-7">
                  <h2 id="checkout-billing-title" className={sectionHeading}>
                    Billing address
                  </h2>
                  <AddressFields
                    prefix="billing"
                    value={form.billing}
                    errors={visibleErrors("billing", billingErrors)}
                    onChange={setAddress("billing")}
                    onBlur={(field) => touch(`billing.${field}`)}
                  />
                </section>
              )}

              <fieldset className="mt-7 min-w-0">
                <legend className={sectionHeading}>Shipping options</legend>
                <OptionCard name="shipping-option" value="free" label="Free shipping" trailing="FREE" />
              </fieldset>

              <fieldset className="mt-7 min-w-0">
                <legend className={sectionHeading}>Payment options</legend>
                <OptionCard name="payment-option" value="razorpay" label="Pay by Razorpay">
                  Pay securely by Credit or Debit card or Internet Banking through Razorpay.
                </OptionCard>
              </fieldset>

              <div className="mt-6">
                <Checkbox
                  id="checkout-add-note"
                  checked={form.addNote}
                  onChange={(addNote) => setForm((current) => ({ ...current, addNote }))}
                >
                  Add a note to your order
                </Checkbox>
                {form.addNote && (
                  <textarea
                    value={form.note}
                    rows={3}
                    aria-label="Note to your order"
                    placeholder="Notes about your order, e.g. special notes for delivery."
                    onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                    className="mt-3 w-full resize-y rounded-[4px] border border-[#757575] bg-white p-3 font-system text-[14px] leading-6 text-[#1e1e1e] hover:border-[#1e1e1e] focus:outline-2 focus:outline-brand-gold"
                  />
                )}
              </div>

              <hr className="mt-6 border-t border-[#dcdcdc]" />

              {/* No policy pages exist yet, so these links go nowhere (same as the footer's). */}
              <p className="mt-6 font-system text-[14px] leading-5 text-[#1e1e1e]">
                By proceeding with your purchase you agree to our{" "}
                <a href="#" className="text-[#2b6cb0] hover:underline">
                  Terms and Conditions
                </a>{" "}
                and{" "}
                <a href="#" className="text-[#2b6cb0] hover:underline">
                  Privacy Policy
                </a>
              </p>

              <button
                type="submit"
                className="mt-5 h-[60px] w-full cursor-pointer rounded-[4px] bg-brand-gold font-system text-[18px] font-medium text-white transition-colors duration-300 hover:bg-brand-gold-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
              >
                Buy It Now <span aria-hidden="true">→</span>
              </button>
            </form>

            {/* On phones the summary comes first, so the total is seen before paying. */}
            <OrderSummary
              rows={rows}
              subtotal={subtotal}
              coupon={coupon}
              onApplyCoupon={applyCoupon}
              onRemoveCoupon={() => setCoupon(null)}
              className="order-first lg:sticky lg:top-[150px] lg:order-none"
            />
          </div>
        )}
      </div>
    </section>
  );
}
