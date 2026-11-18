"use client";

import Link from "next/link";
import { logout, useSession } from "@/lib/auth";
import { textLink } from "./ui";

// /my-account once logged in: the greeting and the three shortcuts, as on the
// live site's account dashboard.
export function Dashboard() {
  const session = useSession();
  if (!session) return null; // AccountShell shows the login form instead
  const name = session.customer.displayName;

  return (
    <>
      <p>
        Hello <strong className="font-bold text-black">{name}</strong> (not{" "}
        <strong className="font-bold text-black">{name}</strong>?{" "}
        <button type="button" onClick={logout} className={textLink}>
          Log out
        </button>
        )
      </p>
      <p className="mt-8">
        From your account dashboard you can view your{" "}
        <Link href="/my-account/orders" className={textLink}>
          recent orders
        </Link>
        , manage your{" "}
        <Link href="/my-account/addresses" className={textLink}>
          shipping and billing addresses
        </Link>
        , and{" "}
        <Link href="/my-account/account-details" className={textLink}>
          edit your password and account details
        </Link>
        .
      </p>
    </>
  );
}
