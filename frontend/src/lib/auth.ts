"use client";

import { api } from "@/lib/api";
import type { StoredAddress } from "@/lib/checkout";
import { createPersistentStore } from "@/lib/persistent-store";

// The shopper's login: a token from the backend plus their details, kept in
// localStorage so they stay logged in on this device. The header's account icon
// and every /my-account page read this one store.
//
// The token is only checked by the backend; if it has expired the next request
// answers 401 and AccountShell logs the visitor out.

export type Customer = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  addresses: { shipping?: StoredAddress; billing?: StoredAddress };
};

export type Session = { token: string; customer: Customer };

const store = createPersistentStore<Session | null>({
  key: "bhumiblend:session",
  empty: null,
  parse: (raw) => {
    if (typeof raw !== "object" || raw === null) return null;
    const { token, customer } = raw as Record<string, unknown>;
    if (typeof token !== "string" || typeof customer !== "object" || customer === null) return null;
    const { id, email, displayName } = customer as Record<string, unknown>;
    if (typeof id !== "string" || typeof email !== "string" || typeof displayName !== "string") return null;
    return { token, customer: customer as Customer };
  },
});

/** The logged-in visitor, or null (also null on the server and while the page is still hydrating). */
export function useSession(): Session | null {
  return store.useStore().value;
}

type AuthResponse = { token: string; customer: Customer };

export async function login(email: string, password: string) {
  const response = await api<AuthResponse>("/account/login", { method: "POST", body: { email, password } });
  store.update(() => ({ token: response.token, customer: response.customer }));
}

/** Sent after the first sign-up step: where the code went and how long the shopper has. */
/** `delivery` is "console" only while developing without SMTP: the code was printed in the backend's terminal, not emailed. */
export type VerificationSent = { email: string; expiresInSeconds: number; resendAfterSeconds: number; delivery: "email" | "console" };

/** Sign-up step 1: the backend emails a 6-digit code. No account exists until it is entered. */
export function startRegistration(input: { firstName: string; lastName: string; email: string; password: string }) {
  return api<VerificationSent>("/account/register", { method: "POST", body: input });
}

/** Sign-up step 2: the right code creates the account and logs the visitor in. */
export async function verifyRegistration(email: string, code: string) {
  const response = await api<AuthResponse>("/account/register/verify", { method: "POST", body: { email, code } });
  store.update(() => ({ token: response.token, customer: response.customer }));
}

/** A fresh code (30 seconds apart; the old one stops working). */
export function resendVerification(email: string) {
  return api<VerificationSent>("/account/register/resend", { method: "POST", body: { email } });
}

export function logout() {
  store.update(() => null);
}

/** After the visitor edits their details or addresses: keep the same login, swap in the new details. */
export function updateCustomer(customer: Customer) {
  store.update((session) => (session ? { token: session.token, customer } : session));
}
