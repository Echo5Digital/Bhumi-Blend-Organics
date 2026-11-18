"use client";

import { useState, type FormEvent } from "react";
import { saveAddress } from "@/lib/account";
import { ApiError } from "@/lib/api";
import { updateCustomer, useSession } from "@/lib/auth";
import {
  ADDRESS_FIELDS,
  emptyAddress,
  formatAddress,
  toAddress,
  validateAddress,
  type Address,
  type AddressErrors,
  type StoredAddress,
} from "@/lib/checkout";
import { AddressFields } from "@/components/checkout/AddressFields";
import { errorBox, primaryButton, sectionHeading, secondaryButton, textLink } from "./ui";

type Kind = "shipping" | "billing";
const titles: Record<Kind, string> = { billing: "Billing address", shipping: "Shipping address" };

// One of the two address cards. Shows the saved address (or a "not set up yet"
// line) with Add / Edit, and swaps to the form while editing.
function AddressCard({ kind, saved }: { kind: Kind; saved: StoredAddress | undefined }) {
  const session = useSession();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Address>(emptyAddress);
  const [attempted, setAttempted] = useState(false);
  const [serverErrors, setServerErrors] = useState<AddressErrors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!session) return null;
  const { customer, token } = session;

  const clientErrors = validateAddress(draft);
  const shown: AddressErrors = {};
  for (const field of ADDRESS_FIELDS) {
    const message = serverErrors[field] ?? (attempted ? clientErrors[field] : undefined);
    if (message) shown[field] = message;
  }

  function startEditing() {
    // First time: start from the shopper's name; later: from what's saved.
    setDraft(saved ? toAddress(saved) : { ...emptyAddress, firstName: customer.firstName, lastName: customer.lastName });
    setAttempted(false);
    setServerErrors({});
    setFormError("");
    setEditing(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);
    setFormError("");
    const firstBad = ADDRESS_FIELDS.find((field) => clientErrors[field]);
    if (firstBad) {
      document.getElementById(`${kind}-${firstBad}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      updateCustomer(await saveAddress(token, kind, draft));
      setEditing(false);
    } catch (error) {
      if (error instanceof ApiError) {
        const fields = Object.fromEntries(Object.entries(error.fields).filter(([key]) => (ADDRESS_FIELDS as readonly string[]).includes(key)));
        setServerErrors(fields);
        if (Object.keys(fields).length === 0) setFormError(error.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby={`${kind}-title`}>
      <div className="flex items-baseline justify-between gap-4">
        <h3 id={`${kind}-title`} className="font-serif text-[20px] leading-snug text-[#222]">
          {titles[kind]}
        </h3>
        {!editing && (
          <button type="button" onClick={startEditing} className={`${textLink} text-[14px]`}>
            {saved ? "Edit" : "Add"}
          </button>
        )}
      </div>

      {editing ? (
        <form noValidate onSubmit={submit} className="mt-4 space-y-4">
          <AddressFields
            prefix={kind}
            value={draft}
            errors={shown}
            onChange={(field, value) => {
              setDraft((current) => ({ ...current, [field]: value }));
              setServerErrors((current) => ({ ...current, [field]: undefined }));
            }}
            onBlur={() => {}}
          />
          {formError && (
            <p role="alert" className={errorBox}>
              {formError}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={busy} className={primaryButton}>
              {busy ? "Saving…" : "Save address"}
            </button>
            <button type="button" onClick={() => setEditing(false)} className={secondaryButton}>
              Cancel
            </button>
          </div>
        </form>
      ) : saved ? (
        <address className="mt-3 text-[15px] leading-[1.7] not-italic text-[#444]">
          <span className="font-semibold text-black">
            {saved.firstName} {saved.lastName}
          </span>
          <br />
          {formatAddress(saved)}
        </address>
      ) : (
        <p className="mt-3 text-[#777]">You have not set up this type of address yet.</p>
      )}
    </section>
  );
}

// /my-account/addresses — the saved billing and shipping addresses.
export function AddressesView() {
  const session = useSession();
  if (!session) return null;
  const { addresses } = session.customer;

  return (
    <>
      <h2 className={sectionHeading}>Addresses</h2>
      <p className="mt-3 text-[#555]">These addresses are kept for your next order.</p>
      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-10">
        <AddressCard kind="billing" saved={addresses.billing} />
        <AddressCard kind="shipping" saved={addresses.shipping} />
      </div>
    </>
  );
}
