"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import { clearCart } from "@/lib/cart";
import { cancelOrder, confirmOrder, rupees, type PlacedOrder } from "@/lib/checkout";

const payButton =
  "inline-block cursor-pointer rounded-[3px] bg-[#2b6cb0] px-[18px] py-[9px] font-system text-[18px] leading-6 text-white transition-colors duration-200 hover:bg-[#245a93] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2b6cb0] disabled:cursor-not-allowed disabled:opacity-60";

// What the live site shows right after "Buy It Now": the order's number, date,
// total and payment method, then Pay Now and Cancel. The order is already
// recorded by the backend (that is where its number comes from).
//
// - Cancel cancels that order and goes back to the form with everything the
//   visitor typed still in it.
// - Pay Now, while online payment isn't connected (the backend sent no payment
//   details), places the order as it stands: the backend is told (which sends the
//   shop owner the "New order" email), the cart is emptied and the visitor sees that
//   the order was received. The order stays "pending payment" in the admin. When
//   Razorpay's keys are added, this is where its popup opens instead.
export function PayStep({ order, onCancel }: { order: PlacedOrder; onCancel: () => void }) {
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [received, setReceived] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // A new "page" for keyboard and screen-reader users: start at the top, on this block.
  useEffect(() => {
    window.scrollTo({ top: 0 });
    rootRef.current?.focus({ preventScroll: true });
  }, [received]);

  const facts = [
    { label: "Order number:", value: String(order.number) },
    { label: "Date:", value: order.date },
    { label: "Total:", value: rupees.format(order.total) },
    { label: "Payment method:", value: "Credit Card/Debit Card/UPI/NetBanking" },
  ];

  async function payNow() {
    if (order.payment) {
      // The backend has a Razorpay payment ready, but the popup isn't built into this page yet.
      setNotice("Online payment can't be opened from this page yet.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      await confirmOrder(order);
    } catch (error) {
      // Not placed: keep the cart and the pay step so the visitor can try again.
      setNotice(error instanceof ApiError ? error.message : "We couldn't place your order just now. Please try again.");
      setBusy(false);
      return;
    }
    clearCart();
    setReceived(true);
  }

  async function cancel() {
    setBusy(true);
    setNotice("");
    try {
      await cancelOrder(order);
      onCancel();
    } catch (error) {
      setNotice(error instanceof ApiError ? error.message : "We couldn't cancel the order just now. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div ref={rootRef} tabIndex={-1} className="font-system text-[#2b2b2b] outline-none">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:flex sm:flex-wrap sm:gap-x-0">
        {facts.map(({ label, value }) => (
          <div
            key={label}
            className="sm:border-r sm:border-dashed sm:border-[#cfcfcf] sm:pr-6 sm:pl-6 sm:first:pl-0 sm:last:border-r-0"
          >
            <dt className="text-[11px] leading-4 uppercase">{label}</dt>
            <dd className="mt-1 text-[16px] leading-6 font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      {received ? (
        <>
          <p role="status" className="mt-10 text-[16px] leading-6">
            Thank you. Your order has been received. Payment for it is still pending.
          </p>
          <div className="mt-5">
            <Link href="/shop" className={payButton}>
              Continue shopping
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="mt-10 text-[16px] leading-6">
            Thank you for your order, please click the button below to pay with Razorpay.
          </p>

          <div className="mt-5 flex flex-wrap gap-1.5">
            <button type="button" onClick={payNow} disabled={busy} className={payButton}>
              Pay Now
            </button>
            <button type="button" onClick={cancel} disabled={busy} className={payButton}>
              Cancel
            </button>
          </div>

          <p role="status" className="mt-4 min-h-6 text-[14px] leading-6 text-[#555]">
            {notice}
          </p>
        </>
      )}
    </div>
  );
}
