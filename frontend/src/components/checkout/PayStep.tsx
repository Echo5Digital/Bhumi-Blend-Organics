"use client";

import { useEffect, useRef, useState } from "react";
import { rupees } from "@/lib/checkout";

export type PlacedOrder = { number: string; date: string; total: number };

const payButton =
  "cursor-pointer rounded-[3px] bg-[#2b6cb0] px-[18px] py-[9px] font-system text-[18px] leading-6 text-white transition-colors duration-200 hover:bg-[#245a93] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2b6cb0]";

// What the live site shows right after "Buy It Now": the order's number, date,
// total and payment method, then Pay Now (opens Razorpay) and Cancel.
//
// There is no backend yet, so the order number is a placeholder made in the
// browser and Pay Now cannot open Razorpay — it says so instead of looking
// broken. When the backend exists, this is where the real order and the
// Razorpay checkout plug in. Cancel goes back to the form with everything the
// visitor typed still in it.
export function PayStep({ order, onCancel }: { order: PlacedOrder; onCancel: () => void }) {
  const [notice, setNotice] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  // A new "page" for keyboard and screen-reader users: start at the top, on this block.
  useEffect(() => {
    window.scrollTo({ top: 0 });
    rootRef.current?.focus({ preventScroll: true });
  }, []);

  const facts = [
    { label: "Order number:", value: order.number },
    { label: "Date:", value: order.date },
    { label: "Total:", value: rupees.format(order.total) },
    { label: "Payment method:", value: "Credit Card/Debit Card/UPI/NetBanking" },
  ];

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

      <p className="mt-10 text-[16px] leading-6">
        Thank you for your order, please click the button below to pay with Razorpay.
      </p>

      <div className="mt-5 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setNotice("Online payment isn't connected yet, so this order has not been placed.")}
          className={payButton}
        >
          Pay Now
        </button>
        <button type="button" onClick={onCancel} className={payButton}>
          Cancel
        </button>
      </div>

      <p role="status" className="mt-4 min-h-6 text-[14px] leading-6 text-[#555]">
        {notice}
      </p>
    </div>
  );
}
