"use client";

import { useState, type ComponentProps, type FormEvent } from "react";
import { saveDetails } from "@/lib/account";
import { ApiError } from "@/lib/api";
import { updateCustomer, useSession } from "@/lib/auth";
import { validateEmail } from "@/lib/checkout";
import { TextField } from "@/components/checkout/Fields";
import { errorBox, primaryButton, sectionHeading, successBox } from "./ui";

type Errors = Record<string, string>;
const MIN_PASSWORD = 8;

// /my-account/account-details — name and email, plus an optional password
// change. Changing the email or the password asks for the current password.
export function DetailsView() {
  const session = useSession();
  const [values, setValues] = useState(() => ({
    firstName: session?.customer.firstName ?? "",
    lastName: session?.customer.lastName ?? "",
    email: session?.customer.email ?? "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  }));
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!session) return null;
  const { token, customer } = session;

  const set = (field: keyof typeof values) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => Object.fromEntries(Object.entries(current).filter(([key]) => key !== field)));
    setSaved(false);
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    setFormError("");

    const found: Errors = {};
    if (!values.firstName.trim()) found.firstName = "Please enter your first name.";
    if (!values.lastName.trim()) found.lastName = "Please enter your last name.";
    const emailError = validateEmail(values.email);
    if (emailError) found.email = emailError;
    const emailChanged = values.email.trim().toLowerCase() !== customer.email;
    const wantsNewPassword = values.newPassword !== "" || values.confirmPassword !== "";
    if (wantsNewPassword) {
      if (values.newPassword.length < MIN_PASSWORD) found.newPassword = `Use at least ${MIN_PASSWORD} characters.`;
      else if (values.confirmPassword !== values.newPassword) found.confirmPassword = "The two passwords don't match.";
    }
    if ((emailChanged || wantsNewPassword) && !values.currentPassword) {
      found.currentPassword = "Enter your current password to change your email or password.";
    }
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      document.getElementById(`details-${first}`)?.focus();
      return;
    }

    setBusy(true);
    try {
      const updated = await saveDetails(token, {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        ...(emailChanged && { email: values.email.trim() }),
        ...((emailChanged || wantsNewPassword) && { currentPassword: values.currentPassword }),
        ...(wantsNewPassword && { newPassword: values.newPassword }),
      });
      updateCustomer(updated);
      setValues((current) => ({ ...current, email: updated.email, currentPassword: "", newPassword: "", confirmPassword: "" }));
      setSaved(true);
    } catch (error) {
      if (error instanceof ApiError) {
        const fieldNames = ["firstName", "lastName", "email", "currentPassword", "newPassword"];
        const known = Object.fromEntries(Object.entries(error.fields).filter(([key]) => fieldNames.includes(key)));
        setErrors(known);
        if (error.code === "EMAIL_TAKEN") setErrors({ email: error.message });
        else if (Object.keys(known).length === 0) setFormError(error.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  const field = (name: keyof typeof values, label: string, extra: Partial<ComponentProps<typeof TextField>> = {}) => (
    <TextField id={`details-${name}`} label={label} value={values[name]} error={errors[name]} onChange={set(name)} {...extra} />
  );

  return (
    <>
      <h2 className={sectionHeading}>Account details</h2>
      <form noValidate onSubmit={submit} className="mt-6 max-w-[560px] space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {field("firstName", "First name", { autoComplete: "given-name" })}
          {field("lastName", "Last name", { autoComplete: "family-name" })}
        </div>
        {field("email", "Email address", { type: "email", inputMode: "email", autoComplete: "email" })}

        <fieldset className="space-y-4 border-t border-[#eee] pt-6">
          <legend className="mb-4 font-serif text-[20px] leading-snug text-[#222]">Password change</legend>
          <p className="-mt-2 text-[14px] text-[#777]">Leave the new password blank to keep your current one.</p>
          {field("currentPassword", "Current password", { type: "password", autoComplete: "current-password" })}
          {field("newPassword", "New password", { type: "password", autoComplete: "new-password" })}
          {field("confirmPassword", "Confirm new password", { type: "password", autoComplete: "new-password" })}
        </fieldset>

        {formError && (
          <p role="alert" className={errorBox}>
            {formError}
          </p>
        )}
        {saved && (
          <p role="status" className={successBox}>
            Account details changed successfully.
          </p>
        )}

        <button type="submit" disabled={busy} className={primaryButton}>
          {busy ? "Saving…" : "Save changes"}
        </button>
      </form>
    </>
  );
}
