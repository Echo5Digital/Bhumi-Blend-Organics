"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api";
import { login, resendVerification, startRegistration, verifyRegistration } from "@/lib/auth";
import { validateEmail } from "@/lib/checkout";
import { TextField } from "@/components/checkout/Fields";
import { devNote, errorBox, primaryButton, successBox, textLink } from "./ui";

type Mode = "login" | "register";
type Errors = Record<string, string>;

const MIN_PASSWORD = 8;
const CODE_LENGTH = 6;

// What a visitor sees on /my-account when they aren't logged in: one card with a
// Login / Register switch.
//
// Registering takes two steps. The details go to the backend, which emails a
// 6-digit code; the account is only created when that code is entered. A
// successful login or code stores the session (lib/auth.ts), which makes
// AccountShell swap this card for the dashboard.
export function AuthForms() {
  const [mode, setMode] = useState<Mode>("login");
  const [values, setValues] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  // Registration step 2: set once the backend has emailed a code to this address.
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [notice, setNotice] = useState("");
  // "console" = no SMTP yet (development): the code was printed in the backend's terminal, not emailed.
  const [delivery, setDelivery] = useState<"email" | "console">("email");

  // "Resend code" unlocks when the countdown reaches zero.
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  // Put the cursor in the code box when the code step appears.
  useEffect(() => {
    if (sentTo) document.getElementById("auth-code")?.focus();
  }, [sentTo]);

  const verifying = mode === "register" && sentTo !== null;

  const without = (current: Errors, field: string) =>
    field in current ? Object.fromEntries(Object.entries(current).filter(([key]) => key !== field)) : current;

  const set = (field: keyof typeof values) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => without(current, field)); // typing in a field takes its red message away
  };

  function switchTo(next: Mode) {
    setMode(next);
    setSentTo(null);
    setCode("");
    setErrors({});
    setFormError("");
    setNotice("");
  }

  function backToDetails() {
    setSentTo(null);
    setCode("");
    setErrors({});
    setFormError("");
    setNotice("");
  }

  function check(): Errors {
    const found: Errors = {};
    if (mode === "register") {
      if (!values.firstName.trim()) found.firstName = "Please enter your first name.";
      if (!values.lastName.trim()) found.lastName = "Please enter your last name.";
    }
    const emailError = validateEmail(values.email);
    if (emailError) found.email = emailError;
    if (mode === "login" && !values.password) found.password = "Please enter your password.";
    if (mode === "register" && values.password.length < MIN_PASSWORD) {
      found.password = `Use at least ${MIN_PASSWORD} characters.`;
    }
    return found;
  }

  async function submitDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const found = check();
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      document.getElementById(`auth-${first}`)?.focus();
      return;
    }

    setBusy(true);
    try {
      if (mode === "login") {
        await login(values.email.trim(), values.password);
        // Success: the session is stored and this card is replaced by the dashboard.
      } else {
        const sent = await startRegistration({ ...values, email: values.email.trim() });
        setSentTo(sent.email);
        setResendIn(sent.resendAfterSeconds);
        setDelivery(sent.delivery);
        setCode("");
        setBusy(false);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        // Field-level messages go under their fields; anything else (wrong password, email taken, offline) above the button.
        const known = Object.fromEntries(Object.entries(error.fields).filter(([key]) => key in values));
        setErrors(known);
        if (Object.keys(known).length === 0) setFormError(error.message);
        else document.getElementById(`auth-${Object.keys(known)[0]}`)?.focus();
      } else {
        setFormError("Something went wrong. Please try again.");
      }
      setBusy(false);
    }
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sentTo) return;
    setFormError("");
    setNotice("");
    if (code.length !== CODE_LENGTH) {
      setErrors({ code: `Enter the ${CODE_LENGTH}-digit code from the email.` });
      document.getElementById("auth-code")?.focus();
      return;
    }

    setBusy(true);
    try {
      await verifyRegistration(sentTo, code);
      // Success: the account exists, the session is stored, the dashboard takes over.
    } catch (error) {
      setBusy(false);
      if (!(error instanceof ApiError)) {
        setFormError("Something went wrong. Please try again.");
        return;
      }
      if (error.code === "OTP_INVALID" || error.code === "OTP_EXPIRED") {
        setErrors({ code: error.message });
        document.getElementById("auth-code")?.focus();
      } else if (error.code === "OTP_TOO_MANY_ATTEMPTS" || error.code === "OTP_NOT_FOUND" || error.code === "EMAIL_TAKEN") {
        // This sign-up can't continue: back to the details, with the reason.
        backToDetails();
        setFormError(error.message);
      } else {
        setFormError(error.message);
      }
    }
  }

  async function resend() {
    if (!sentTo || resendIn > 0) return;
    setFormError("");
    setNotice("");
    setBusy(true);
    try {
      const sent = await resendVerification(sentTo);
      setResendIn(sent.resendAfterSeconds);
      setDelivery(sent.delivery);
      setCode("");
      setErrors({});
      setNotice(`We've sent a new code to ${sent.email}. The earlier one no longer works.`);
    } catch (error) {
      if (error instanceof ApiError && error.retryAfterSeconds) setResendIn(error.retryAfterSeconds);
      if (error instanceof ApiError && error.code === "OTP_NOT_FOUND") {
        backToDetails();
        setFormError(error.message);
      } else {
        setFormError(error instanceof ApiError ? error.message : "Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  const tab = (value: Mode, label: string) => (
    <button
      type="button"
      role="tab"
      id={`auth-tab-${value}`}
      aria-selected={mode === value}
      aria-controls="auth-panel"
      onClick={() => switchTo(value)}
      className={`h-12 flex-1 cursor-pointer font-system text-[14px] font-semibold tracking-[0.08em] uppercase transition-colors duration-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-gold ${
        mode === value
          ? "bg-white text-brand-gold-dark shadow-[inset_0_-2px_0_#ce8e22]"
          : "bg-[#f7f7f7] text-[#555] hover:text-brand-gold-dark"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto w-full max-w-[480px] overflow-hidden rounded-2xl border border-[#eadcb6] bg-white shadow-[0_18px_36px_-28px_rgba(120,85,20,0.5)]">
      <div role="tablist" aria-label="Login or register" className="flex border-b border-[#eadcb6]">
        {tab("login", "Login")}
        {tab("register", "Register")}
      </div>

      {verifying ? (
        <form
          id="auth-panel"
          role="tabpanel"
          aria-labelledby="auth-tab-register"
          noValidate
          onSubmit={submitCode}
          className="space-y-4 p-6 sm:p-8"
        >
          <div>
            <h2 className="font-serif text-[22px] leading-snug text-[#222]">Check your email</h2>
            <p className="mt-2 font-system text-[14px] leading-6 text-[#555]">
              We&apos;ve sent a {CODE_LENGTH}-digit code to <strong className="font-semibold wrap-break-word text-[#222]">{sentTo}</strong>. Enter it
              below to create your account. It works for 10 minutes.
            </p>
          </div>

          <TextField
            id="auth-code"
            label="Verification code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={CODE_LENGTH}
            value={code}
            error={errors.code}
            onChange={(value) => {
              setCode(value.replace(/\D/g, "").slice(0, CODE_LENGTH));
              setErrors((current) => without(current, "code"));
            }}
          />

          {delivery === "console" && (
            <p className={devNote}>
              <strong className="font-semibold">Developer note:</strong> email isn&apos;t set up yet (no SMTP details in{" "}
              <code>backend/.env</code>), so nothing was emailed. The code is printed in the terminal running the backend
              (<code>npm run dev</code> in the <code>backend</code> folder). This note never shows on the live site.
            </p>
          )}

          {notice && (
            <p role="status" className={successBox}>
              {notice}
            </p>
          )}
          {formError && (
            <p role="alert" className={errorBox}>
              {formError}
            </p>
          )}

          <button type="submit" disabled={busy} className={`${primaryButton} w-full`}>
            {busy ? "Checking…" : "Verify and create account"}
          </button>

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 font-system text-[14px] text-[#555]">
            <span>
              Didn&apos;t get it?{" "}
              <button
                type="button"
                onClick={resend}
                disabled={busy || resendIn > 0}
                className={`${textLink} font-semibold disabled:cursor-not-allowed disabled:text-[#999] disabled:no-underline`}
              >
                {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
              </button>
            </span>
            <button type="button" onClick={backToDetails} className={textLink}>
              Use a different email
            </button>
          </div>
        </form>
      ) : (
        <form
          id="auth-panel"
          role="tabpanel"
          aria-labelledby={`auth-tab-${mode}`}
          noValidate
          onSubmit={submitDetails}
          className="space-y-4 p-6 sm:p-8"
        >
          {mode === "register" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="auth-firstName"
                label="First name"
                autoComplete="given-name"
                value={values.firstName}
                error={errors.firstName}
                onChange={set("firstName")}
              />
              <TextField
                id="auth-lastName"
                label="Last name"
                autoComplete="family-name"
                value={values.lastName}
                error={errors.lastName}
                onChange={set("lastName")}
              />
            </div>
          )}

          <TextField
            id="auth-email"
            label="Email address"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={values.email}
            error={errors.email}
            onChange={set("email")}
          />
          <TextField
            id="auth-password"
            label="Password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={values.password}
            error={errors.password}
            onChange={set("password")}
          />
          {mode === "register" && !errors.password && (
            <p className="-mt-2 font-system text-[12px] leading-4 text-[#777]">
              At least {MIN_PASSWORD} characters. We&apos;ll email you a code to confirm your address.
            </p>
          )}

          {formError && (
            <p role="alert" className={errorBox}>
              {formError}
            </p>
          )}

          <button type="submit" disabled={busy} className={`${primaryButton} w-full`}>
            {busy ? (mode === "login" ? "Logging in…" : "Sending code…") : mode === "login" ? "Log in" : "Send verification code"}
          </button>

          <p className="text-center font-system text-[14px] text-[#555]">
            {mode === "login" ? "New to Bhumi Blend? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => switchTo(mode === "login" ? "register" : "login")}
              className="cursor-pointer font-semibold text-brand-gold-dark underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
            >
              {mode === "login" ? "Create an account" : "Log in"}
            </button>
          </p>
        </form>
      )}
    </div>
  );
}
