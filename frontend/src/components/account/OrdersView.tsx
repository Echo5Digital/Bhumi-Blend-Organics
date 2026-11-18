"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchOrders, orderStatusLabel, type AccountOrder } from "@/lib/account";
import { ApiError } from "@/lib/api";
import { useSession } from "@/lib/auth";
import { formatAddress, rupees } from "@/lib/checkout";
import { errorBox, primaryButton, sectionHeading } from "./ui";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; orders: AccountOrder[] };

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

// /my-account/orders — the orders placed while logged in, newest first; each
// opens to show what was in it, where it goes and its tracking number.
export function OrdersView() {
  const token = useSession()?.token;
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchOrders(token)
      .then((result) => {
        if (!cancelled) setState({ status: "ready", orders: result.items });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: error instanceof ApiError ? error.message : "We couldn't load your orders. Please try again.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) return null; // AccountShell shows the login form instead

  return (
    <>
      <h2 className={sectionHeading}>Orders</h2>

      {state.status === "loading" && <p className="mt-5 text-[#777]">Loading your orders…</p>}

      {state.status === "error" && (
        <p role="alert" className={`${errorBox} mt-5`}>
          {state.message}
        </p>
      )}

      {state.status === "ready" && state.orders.length === 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-[3px] border border-[#eadcb6] bg-[#fbf3e0] px-5 py-4 text-[#6b4a10]">
          <p>No order has been made yet.</p>
          <Link href="/shop" className={`${primaryButton} !h-11 !px-6`}>
            Browse products
          </Link>
        </div>
      )}

      {state.status === "ready" && state.orders.length > 0 && (
        <ul className="mt-5 space-y-3">
          {state.orders.map((order) => (
            <li key={order.number}>
              <details className="group rounded-[3px] border border-[#e5e5e5] open:border-[#d9bd7a]">
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-6 gap-y-1 p-4 marker:hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-gold [&::-webkit-details-marker]:hidden">
                  <span className="min-w-[80px] font-bold text-black">#{order.number}</span>
                  <span className="min-w-[130px]">{dateFormat.format(new Date(order.createdAt))}</span>
                  <span className="min-w-[110px] font-semibold text-brand-gold-dark">{orderStatusLabel(order)}</span>
                  <span className="ml-auto font-semibold text-black">{rupees.format(order.total)}</span>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-5 w-5 fill-none stroke-current transition-transform duration-200 group-open:rotate-180"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </summary>

                <div className="space-y-4 border-t border-[#eee] p-4">
                  <ul className="divide-y divide-[#f1f1f1]">
                    {order.items.map((item) => (
                      <li key={item.slug} className="flex justify-between gap-4 py-2">
                        <span>
                          {item.name}
                          {item.size ? <span className="text-[#777]"> · {item.size}</span> : null}
                          <span className="text-[#777]"> × {item.qty}</span>
                        </span>
                        <span className="shrink-0">{rupees.format(item.lineTotal)}</span>
                      </li>
                    ))}
                  </ul>

                  <dl className="space-y-1 text-[14px]">
                    <div className="flex justify-between gap-4">
                      <dt>Subtotal</dt>
                      <dd>{rupees.format(order.subtotal)}</dd>
                    </div>
                    {order.discountTotal > 0 && (
                      <div className="flex justify-between gap-4">
                        <dt>Coupon{order.coupon ? ` (${order.coupon.code})` : ""}</dt>
                        <dd>−{rupees.format(order.discountTotal)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-4">
                      <dt>Shipping</dt>
                      <dd>{order.shippingTotal > 0 ? rupees.format(order.shippingTotal) : "Free"}</dd>
                    </div>
                    <div className="flex justify-between gap-4 font-bold text-black">
                      <dt>Total</dt>
                      <dd>{rupees.format(order.total)}</dd>
                    </div>
                  </dl>

                  <div className="text-[14px]">
                    <p className="font-semibold text-black">Shipping address</p>
                    <p className="mt-1 text-[#555]">
                      {order.shipping.firstName} {order.shipping.lastName}, {formatAddress(order.shipping)}
                    </p>
                  </div>

                  {order.tracking && (
                    <p className="text-[14px]">
                      <span className="font-semibold text-black">Tracking:</span> {order.tracking.carrier ? `${order.tracking.carrier} · ` : ""}
                      {order.tracking.trackingNumber}
                    </p>
                  )}
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
