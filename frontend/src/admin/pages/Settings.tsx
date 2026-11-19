import { useState, type FormEvent } from "react";
import { ErrorNotice, Loading, Notice, PageTitle, useTitle } from "../components/ui";
import { ApiError, api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { INDIAN_STATES } from "../lib/india";
import type { Settings as SettingsData } from "../lib/types";
import { useApi } from "../lib/useApi";

function SettingsForm({ initial }: { initial: SettingsData }) {
  const { token } = useAuth();
  const [form, setForm] = useState<SettingsData>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => setForm((previous) => ({ ...previous, [key]: value }));
  const setAddress = (key: keyof SettingsData["address"], value: string) => setForm((previous) => ({ ...previous, address: { ...previous.address, [key]: value } }));
  const error = (path: string) => errors[path] && <p className="field-error">{errors[path]}</p>;

  async function save(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setBusy(true);
    try {
      const result = await api<{ settings: SettingsData }>("/admin/settings", { method: "PUT", token, body: form });
      setForm(result.settings);
      setErrors({});
      setMessage({ kind: "success", text: "Your settings have been saved." });
    } catch (caught) {
      if (caught instanceof ApiError) {
        setErrors(caught.fields);
        setMessage({ kind: "error", text: Object.keys(caught.fields).length > 0 ? "Please fix the highlighted fields." : caught.message });
      } else setMessage({ kind: "error", text: "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} noValidate>
      {message && <Notice kind={message.kind} onDismiss={() => setMessage(null)}>{message.text}</Notice>}

      <h2 className="form-section">Store details</h2>
      <p className="hint" style={{ marginTop: 0 }}>This is where your business is located. The address, email and phone below show on the website's Contact Us page and footer; leave one blank to keep the website's built-in text.</p>
      <table className="form-table">
        <tbody>
          <tr>
            <th>
              <label htmlFor="storeName">Store name</label>
            </th>
            <td>
              <input id="storeName" className={`small ${errors.storeName ? "invalid" : ""}`} type="text" value={form.storeName} onChange={(event) => set("storeName", event.target.value)} />
              {error("storeName")}
            </td>
          </tr>
          <tr>
            <th>
              <label htmlFor="line1">Address line 1</label>
            </th>
            <td>
              <input id="line1" className="small" type="text" value={form.address.line1} onChange={(event) => setAddress("line1", event.target.value)} />
              <p className="hint">The street address for your business location.</p>
            </td>
          </tr>
          <tr>
            <th>
              <label htmlFor="line2">Address line 2</label>
            </th>
            <td>
              <input id="line2" className="small" type="text" value={form.address.line2} onChange={(event) => setAddress("line2", event.target.value)} />
            </td>
          </tr>
          <tr>
            <th>
              <label htmlFor="city">City</label>
            </th>
            <td>
              <input id="city" className="small" type="text" value={form.address.city} onChange={(event) => setAddress("city", event.target.value)} />
            </td>
          </tr>
          <tr>
            <th>
              <label htmlFor="state">Country / State</label>
            </th>
            <td>
              <div style={{ display: "flex", gap: 8, maxWidth: 400 }}>
                <select aria-label="Country" disabled value="India">
                  <option>India</option>
                </select>
                <select id="state" className={errors["address.state"] ? "invalid" : ""} value={form.address.state} onChange={(event) => setAddress("state", event.target.value)}>
                  <option value="">Select a state…</option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
              {error("address.state")}
            </td>
          </tr>
          <tr>
            <th>
              <label htmlFor="pin">PIN code</label>
            </th>
            <td>
              <input id="pin" className={`tiny ${errors["address.pin"] ? "invalid" : ""}`} type="text" inputMode="numeric" maxLength={6} value={form.address.pin} onChange={(event) => setAddress("pin", event.target.value)} />
              {error("address.pin")}
            </td>
          </tr>
          <tr>
            <th>
              <label htmlFor="contactEmail">Contact email</label>
            </th>
            <td>
              <input id="contactEmail" className={`small ${errors.contactEmail ? "invalid" : ""}`} type="email" value={form.contactEmail} onChange={(event) => set("contactEmail", event.target.value)} />
              {error("contactEmail")}
            </td>
          </tr>
          <tr>
            <th>
              <label htmlFor="contactPhone">Contact phone</label>
            </th>
            <td>
              <input id="contactPhone" className="small" type="tel" value={form.contactPhone} onChange={(event) => set("contactPhone", event.target.value)} />
            </td>
          </tr>
        </tbody>
      </table>

      <h2 className="form-section">General options</h2>
      <table className="form-table">
        <tbody>
          <tr>
            <th>Selling location(s)</th>
            <td>Sell to India only</td>
          </tr>
          <tr>
            <th>Shipping</th>
            <td>Free shipping on every order</td>
          </tr>
          <tr>
            <th>Currency</th>
            <td>Indian rupee (₹)</td>
          </tr>
          <tr>
            <th>Enable coupons</th>
            <td>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" checked={form.couponsEnabled} onChange={(event) => set("couponsEnabled", event.target.checked)} />
                Enable the use of coupon codes
              </label>
              <p className="hint">When off, shoppers can't apply any coupon at checkout.</p>
            </td>
          </tr>
          <tr>
            <th>
              <label htmlFor="low">Low stock threshold</label>
            </th>
            <td>
              <input id="low" className={`tiny ${errors.lowStockThreshold ? "invalid" : ""}`} type="number" min="0" step="1" value={form.lowStockThreshold} onChange={(event) => set("lowStockThreshold", Number(event.target.value))} />
              <p className="hint">A product with this many left (or fewer) shows as “low in stock”.</p>
              {error("lowStockThreshold")}
            </td>
          </tr>
        </tbody>
      </table>

      <p>
        <button type="submit" className="btn primary" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </button>
      </p>
    </form>
  );
}

export function Settings() {
  useTitle("Settings");
  const { data, error } = useApi<{ settings: SettingsData }>("/admin/settings");
  return (
    <div className="page">
      <PageTitle title="Settings" />
      <nav className="nav-tabs" aria-label="Settings sections">
        <a className="active" href="#general" onClick={(event) => event.preventDefault()}>
          General
        </a>
      </nav>
      <ErrorNotice error={error} />
      {!data && !error && <Loading />}
      {data && <SettingsForm initial={data.settings} />}
    </div>
  );
}
