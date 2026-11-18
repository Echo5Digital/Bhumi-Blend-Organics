import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ErrorNotice, Field, Loading, Notice, PageTitle, useTitle } from "../components/ui";
import { ApiError, api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { toDayString } from "../lib/format";
import type { Coupon } from "../lib/types";
import { useApi } from "../lib/useApi";

const randomCode = () => {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no look-alikes (0/O, 1/I)
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (byte) => letters[byte % letters.length]).join("");
};

/** The day (YYYY-MM-DD, Indian time) a stored date falls on, for a date box. */
const dayOf = (iso?: string) => (iso ? toDayString(new Date(iso)) : "");

function CouponForm({ initial }: { initial: Coupon | null }) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const creating = initial === null;
  useTitle(creating ? "Add coupon" : `Coupon ${initial.code}`);

  const [code, setCode] = useState(initial?.code ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [type, setType] = useState<"percent" | "fixed">(initial?.type ?? "percent");
  const [value, setValue] = useState(initial ? String(initial.value) : "");
  const [maxDiscount, setMaxDiscount] = useState(initial?.maxDiscount !== undefined ? String(initial.maxDiscount) : "");
  const [minSubtotal, setMinSubtotal] = useState(initial && initial.minSubtotal > 0 ? String(initial.minSubtotal) : "");
  const [startsAt, setStartsAt] = useState(dayOf(initial?.startsAt));
  const [expiresAt, setExpiresAt] = useState(dayOf(initial?.expiresAt));
  const [usageLimit, setUsageLimit] = useState(initial?.usageLimit !== undefined ? String(initial.usageLimit) : "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    const found: Record<string, string> = {};
    if (!/^[A-Za-z0-9_-]{3,40}$/.test(code.trim())) found.code = "Use 3–40 letters, numbers, dashes or underscores.";
    const amount = Number(value);
    if (value.trim() === "" || Number.isNaN(amount) || amount <= 0) found.value = "Enter an amount above 0.";
    else if (type === "percent" && amount > 100) found.value = "A percentage can't be more than 100.";
    if (maxDiscount.trim() !== "" && !(Number(maxDiscount) > 0)) found.maxDiscount = "Enter an amount above 0, or leave it empty.";
    if (minSubtotal.trim() !== "" && !(Number(minSubtotal) >= 0)) found.minSubtotal = "Enter 0 or more, or leave it empty.";
    if (usageLimit.trim() !== "" && !(Number.isInteger(Number(usageLimit)) && Number(usageLimit) >= 1)) found.usageLimit = "Enter a whole number, 1 or more, or leave it empty.";
    if (startsAt && expiresAt && startsAt > expiresAt) found.expiresAt = "The expiry date is before the start date.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    // Dates are whole Indian days: it starts at the day's first moment and ends at its last.
    const start = startsAt ? `${startsAt}T00:00:00+05:30` : null;
    const end = expiresAt ? `${expiresAt}T23:59:59+05:30` : null;
    const body = {
      code: code.trim(),
      type,
      value: amount,
      isActive,
      minSubtotal: minSubtotal.trim() ? Number(minSubtotal) : 0,
      ...(creating
        ? {
            ...(description.trim() && { description: description.trim() }),
            ...(type === "percent" && maxDiscount.trim() && { maxDiscount: Number(maxDiscount) }),
            ...(start && { startsAt: start }),
            ...(end && { expiresAt: end }),
            ...(usageLimit.trim() && { usageLimit: Number(usageLimit) }),
          }
        : {
            description: description.trim() || null,
            maxDiscount: type === "percent" && maxDiscount.trim() ? Number(maxDiscount) : null,
            startsAt: start,
            expiresAt: end,
            usageLimit: usageLimit.trim() ? Number(usageLimit) : null,
          }),
    };

    setBusy(true);
    try {
      if (creating) {
        const result = await api<{ coupon: Coupon }>("/admin/coupons", { method: "POST", token, body });
        navigate(`/coupons/${result.coupon.id}`, { replace: true });
      } else {
        await api(`/admin/coupons/${initial.id}`, { method: "PATCH", token, body });
        setMessage({ kind: "success", text: "Coupon saved." });
      }
    } catch (caught) {
      if (caught instanceof ApiError) {
        setErrors(caught.fields);
        setMessage({ kind: "error", text: caught.code === "DUPLICATE" ? "A coupon with that code already exists." : caught.message });
      } else setMessage({ kind: "error", text: "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!initial || !window.confirm(`Delete the coupon ${initial.code}?`)) return;
    try {
      await api(`/admin/coupons/${initial.id}`, { method: "DELETE", token });
      navigate("/coupons", { replace: true });
    } catch (caught) {
      setMessage({ kind: "error", text: caught instanceof ApiError ? caught.message : "Something went wrong." });
    }
  }

  return (
    <div className="page">
      <PageTitle title={creating ? "Add new coupon" : "Edit coupon"}>
        <Link to="/coupons" className="btn">
          ← All coupons
        </Link>
      </PageTitle>
      {message && <Notice kind={message.kind} onDismiss={() => setMessage(null)}>{message.text}</Notice>}

      <form onSubmit={save} noValidate>
        <div className="grid-2">
          <section className="card">
            <div className="card-head">
              <h2>Coupon data</h2>
            </div>
            <div className="body field-grid">
              <div className="full">
                <Field label="Coupon code" htmlFor="code" error={errors.code} hint="Shoppers type this at checkout, in any letter case.">
                  <div style={{ display: "flex", gap: 8 }}>
                    <input id="code" type="text" value={code} className={errors.code ? "invalid" : ""} onChange={(event) => setCode(event.target.value.toUpperCase())} />
                    {creating && (
                      <button type="button" className="btn" onClick={() => setCode(randomCode())}>
                        Generate
                      </button>
                    )}
                  </div>
                </Field>
              </div>
              <div className="full">
                <Field label="Description" htmlFor="description" hint="For your own reference.">
                  <textarea id="description" rows={2} value={description} onChange={(event) => setDescription(event.target.value)} />
                </Field>
              </div>
              <Field label="Discount type" htmlFor="type">
                <select id="type" value={type} onChange={(event) => setType(event.target.value as "percent" | "fixed")}>
                  <option value="percent">Percentage discount</option>
                  <option value="fixed">Fixed cart discount (₹)</option>
                </select>
              </Field>
              <Field label={type === "percent" ? "Percentage off" : "Amount off (₹)"} htmlFor="value" error={errors.value}>
                <input id="value" type="number" min="0" step="0.01" value={value} className={errors.value ? "invalid" : ""} onChange={(event) => setValue(event.target.value)} />
              </Field>
              {type === "percent" && (
                <Field label="Maximum discount (₹)" htmlFor="max" error={errors.maxDiscount} hint="Caps what a percentage coupon can take off. Empty = no cap.">
                  <input id="max" type="number" min="0" step="0.01" value={maxDiscount} className={errors.maxDiscount ? "invalid" : ""} onChange={(event) => setMaxDiscount(event.target.value)} />
                </Field>
              )}
              <Field label="Minimum spend (₹)" htmlFor="min" error={errors.minSubtotal} hint="The cart must come to at least this. Empty = no minimum.">
                <input id="min" type="number" min="0" step="0.01" value={minSubtotal} className={errors.minSubtotal ? "invalid" : ""} onChange={(event) => setMinSubtotal(event.target.value)} />
              </Field>
              <Field label="Starts on" htmlFor="start" hint="Empty = already active.">
                <input id="start" type="date" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} />
              </Field>
              <Field label="Expires on" htmlFor="expires" error={errors.expiresAt} hint="Works through the end of that day. Empty = never.">
                <input id="expires" type="date" value={expiresAt} className={errors.expiresAt ? "invalid" : ""} onChange={(event) => setExpiresAt(event.target.value)} />
              </Field>
              <Field label="Usage limit" htmlFor="limit" error={errors.usageLimit} hint="How many paid orders can use it in total. Empty = unlimited.">
                <input id="limit" type="number" min="1" step="1" value={usageLimit} className={errors.usageLimit ? "invalid" : ""} onChange={(event) => setUsageLimit(event.target.value)} />
              </Field>
            </div>
          </section>

          <aside>
            <section className="card">
              <div className="card-head">
                <h2>Publish</h2>
              </div>
              <div className="body stack">
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
                  Active
                </label>
                {!creating && (
                  <p className="hint" style={{ margin: 0 }}>
                    Used {initial.usedCount} {initial.usedCount === 1 ? "time" : "times"} so far.
                  </p>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" className="btn primary" disabled={busy}>
                    {busy ? "Saving…" : creating ? "Create coupon" : "Save changes"}
                  </button>
                </div>
                {!creating && (
                  <button type="button" className="link-button danger" onClick={remove} style={{ textAlign: "left" }}>
                    Delete coupon
                  </button>
                )}
              </div>
            </section>
          </aside>
        </div>
      </form>
    </div>
  );
}

export function CouponEdit() {
  const { id } = useParams();
  const creating = id === undefined;
  const coupon = useApi<{ coupon: Coupon }>(creating ? null : `/admin/coupons/${id}`);

  if (!creating && !coupon.data) {
    return (
      <div className="page">
        <PageTitle title="Edit coupon" />
        <ErrorNotice error={coupon.error} />
        {!coupon.error && <Loading />}
        <Link to="/coupons">← All coupons</Link>
      </div>
    );
  }
  return <CouponForm key={id ?? "new"} initial={creating ? null : coupon.data!.coupon} />;
}
