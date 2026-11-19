import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { ErrorNotice, Loading, Notice, PageTitle, useTitle } from "../components/ui";
import { ApiError, api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useApi } from "../lib/useApi";
import { SettingsTabs } from "./Settings";

// Settings → Emails: the emails the shop sends when an order is placed. Two of them:
//   "New order"       goes to the shop owner (the recipients are set here)
//   "Order received"  goes to the customer who placed the order
// Each has the same screen, mirroring WooCommerce's: switch it on or off, its subject / heading / extra
// text, and a live preview with a "send a test email" button.

type Format = "html" | "plain";
type NewOrderSettings = { enabled: boolean; recipients: string; subject: string; heading: string; additionalContent: string; format: Format };
type EmailSummary = { key: string; title: string; description: string; enabled: boolean; recipients: string };
type Payload = {
  key: string;
  title: string;
  description: string;
  /** false for the customer's email: it goes to the customer, so there is no recipient to type. */
  recipientsEditable: boolean;
  settings: NewOrderSettings;
  /** What an empty field falls back to. */
  defaults: { recipients: string; subject: string; heading: string };
  placeholders: string[];
  /** false = no SMTP on the server yet: emails are only printed in the backend's console. */
  emailConfigured: boolean;
};
type Preview = { subject: string; html: string; text: string; format: Format };

const NoSmtpNotice = () => (
  <Notice kind="warning">
    Email isn't set up on the server yet (no SMTP details in the backend's settings), so emails are not really sent: they are only printed in the backend's console.
  </Notice>
);

// ---- the list ---------------------------------------------------------------------

export function EmailsList() {
  useTitle("Emails");
  const { data, error } = useApi<{ emails: EmailSummary[]; emailConfigured: boolean }>("/admin/emails");
  return (
    <div className="page">
      <PageTitle title="Settings" />
      <SettingsTabs />
      <ErrorNotice error={error} />
      {!data && !error && <Loading />}
      {data && (
        <>
          {!data.emailConfigured && <NoSmtpNotice />}
          <p className="hint" style={{ marginTop: 0 }}>
            Email notifications sent from your store. Choose one to change who receives it, what it says and how it looks.
          </p>
          <section className="card flush">
            <div className="table-wrap" style={{ border: 0, boxShadow: "none" }}>
              <table className="list">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Recipient(s)</th>
                    <th>Status</th>
                    <th>
                      <span className="sr-only">Manage</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.emails.map((email) => (
                    <tr key={email.key}>
                      <td>
                        <Link to={`/settings/emails/${email.key}`} className="strong">
                          {email.title}
                        </Link>
                        <div className="muted">{email.description}</div>
                      </td>
                      <td>{email.key === "new-order" ? email.recipients || "—" : "The customer"}</td>
                      <td>
                        <span className={`badge ${email.enabled ? "completed" : "pending"}`}>{email.enabled ? "Enabled" : "Disabled"}</span>
                      </td>
                      <td className="num">
                        <Link to={`/settings/emails/${email.key}`} className="btn">
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

// ---- the "New order" screen ---------------------------------------------------------

function NewOrderForm({ initial }: { initial: Payload }) {
  const { token } = useAuth();
  const [form, setForm] = useState<NewOrderSettings>(initial.settings);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [view, setView] = useState<"desktop" | "mobile">("desktop");
  const frame = useRef<HTMLIFrameElement>(null);

  const [test, setTest] = useState<{ open: boolean; to: string; sending: boolean; message: { kind: "success" | "error"; text: string } | null }>({ open: false, to: "", sending: false, message: null });

  const set = <K extends keyof NewOrderSettings>(key: K, value: NewOrderSettings[K]) => setForm((previous) => ({ ...previous, [key]: value }));
  const error = (path: string) => errors[path] && <p className="field-error">{errors[path]}</p>;
  const placeholderHint = `Available placeholders: ${initial.placeholders.join(", ")}`;

  // What the preview and the test email are built from: the wording as typed right now (saved or not).
  const wording = { subject: form.subject, heading: form.heading, additionalContent: form.additionalContent, format: form.format };

  // Rebuild the preview shortly after the wording changes.
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const result = await api<Preview>(`/admin/emails/${initial.key}/preview`, { method: "POST", token, body: { subject: form.subject, heading: form.heading, additionalContent: form.additionalContent, format: form.format } });
        if (!cancelled) {
          setPreview(result);
          setPreviewFailed(false);
        }
      } catch {
        if (!cancelled) setPreviewFailed(true);
      }
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [form.subject, form.heading, form.additionalContent, form.format, token, initial.key]);

  // Links in the preview open in a new tab instead of replacing the preview.
  const previewHtml = preview?.html.replace("<head>", '<head><base target="_blank">');
  const fitFrame = () => {
    const document = frame.current?.contentDocument;
    if (frame.current && document) frame.current.style.height = `${document.documentElement.scrollHeight + 4}px`;
  };
  useEffect(fitFrame, [view, preview]);

  async function save(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setBusy(true);
    try {
      const result = await api<{ settings: NewOrderSettings }>(`/admin/emails/${initial.key}`, { method: "PUT", token, body: form });
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

  async function sendTest(event: FormEvent) {
    event.preventDefault();
    setTest((previous) => ({ ...previous, sending: true, message: null }));
    try {
      const result = await api<{ sent: boolean; delivery: "email" | "console" }>(`/admin/emails/${initial.key}/test`, { method: "POST", token, body: { to: test.to.trim(), ...wording } });
      const text = result.delivery === "email" ? `A test email was sent to ${test.to.trim()}.` : "Email isn't set up on the server yet, so nothing was sent: the test email was printed in the backend's console.";
      setTest((previous) => ({ ...previous, sending: false, message: { kind: result.delivery === "email" ? "success" : "error", text } }));
    } catch (caught) {
      const text = caught instanceof ApiError ? (Object.values(caught.fields)[0] ?? caught.message) : "Something went wrong.";
      setTest((previous) => ({ ...previous, sending: false, message: { kind: "error", text } }));
    }
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "6px 0 4px" }}>
        <Link to="/settings/emails" className="icon-button" aria-label="Back to all emails" title="Back to all emails">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
        <h2 className="form-section" style={{ margin: 0 }}>
          {initial.title}
        </h2>
      </div>
      <p className="hint" style={{ marginTop: 0 }}>
        {initial.recipientsEditable ? "New order emails are sent to the chosen recipient(s) when a new order is received." : "This email goes to the customer, at the address they entered at checkout, right after they place an order."}
      </p>
      {!initial.emailConfigured && <NoSmtpNotice />}

      <form onSubmit={save} noValidate>
        {message && <Notice kind={message.kind} onDismiss={() => setMessage(null)}>{message.text}</Notice>}
        <table className="form-table">
          <tbody>
            <tr>
              <th>Enable/Disable</th>
              <td>
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="checkbox" checked={form.enabled} onChange={(event) => set("enabled", event.target.checked)} />
                  Enable this email notification
                </label>
              </td>
            </tr>
            {initial.recipientsEditable ? (
              <tr>
                <th>
                  <label htmlFor="recipients">Recipient(s)</label>
                </th>
                <td>
                  <input id="recipients" className={`small ${errors.recipients ? "invalid" : ""}`} type="text" value={form.recipients} placeholder={initial.defaults.recipients} onChange={(event) => set("recipients", event.target.value)} />
                  <p className="hint">Enter recipients (comma separated) for this email.{initial.defaults.recipients ? ` If left empty, it goes to ${initial.defaults.recipients}.` : " Without a recipient, no email is sent."}</p>
                  {error("recipients")}
                </td>
              </tr>
            ) : (
              <tr>
                <th>Recipient</th>
                <td>The customer who placed the order (the email address they entered at checkout).</td>
              </tr>
            )}
            <tr>
              <th>
                <label htmlFor="subject">Subject</label>
              </th>
              <td>
                <input id="subject" className={`small ${errors.subject ? "invalid" : ""}`} type="text" value={form.subject} placeholder={initial.defaults.subject} onChange={(event) => set("subject", event.target.value)} />
                <p className="hint">{placeholderHint}</p>
                {error("subject")}
              </td>
            </tr>
            <tr>
              <th>
                <label htmlFor="heading">Email heading</label>
              </th>
              <td>
                <input id="heading" className={`small ${errors.heading ? "invalid" : ""}`} type="text" value={form.heading} placeholder={initial.defaults.heading} onChange={(event) => set("heading", event.target.value)} />
                <p className="hint">{placeholderHint}</p>
                {error("heading")}
              </td>
            </tr>
            <tr>
              <th>
                <label htmlFor="additional">Additional content</label>
              </th>
              <td>
                <textarea id="additional" className={`small ${errors.additionalContent ? "invalid" : ""}`} rows={4} style={{ width: "100%", maxWidth: 400 }} value={form.additionalContent} onChange={(event) => set("additionalContent", event.target.value)} />
                <p className="hint">Text to appear below the main email content. {placeholderHint}</p>
                {error("additionalContent")}
              </td>
            </tr>
            <tr>
              <th>
                <label htmlFor="format">Email type</label>
              </th>
              <td>
                <select id="format" value={form.format} onChange={(event) => set("format", event.target.value as Format)} style={{ maxWidth: 400 }}>
                  <option value="html">HTML</option>
                  <option value="plain">Plain text</option>
                </select>
                <p className="hint">Choose which format of email to send.</p>
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

      <h2 className="form-section" style={{ marginTop: 36 }}>
        Email preview
      </h2>
      <p className="hint" style={{ marginTop: 0 }}>
        Preview your email template. It shows a sample order and updates as you type. You can also check it on a phone and send yourself a test email.
      </p>
      <section className="email-preview">
        <div className="email-preview-bar">
          <div className="segmented" role="group" aria-label="Preview size">
            <button type="button" aria-pressed={view === "desktop"} onClick={() => setView("desktop")}>
              Desktop
            </button>
            <button type="button" aria-pressed={view === "mobile"} onClick={() => setView("mobile")}>
              Mobile
            </button>
          </div>
          <button type="button" className="btn" aria-expanded={test.open} onClick={() => setTest((previous) => ({ ...previous, open: !previous.open, to: previous.to || form.recipients.split(/[\s,;]+/)[0] || "" }))}>
            Send a test email
          </button>
        </div>

        {test.open && (
          <form onSubmit={sendTest} className="email-test" noValidate>
            <label htmlFor="test-to" className="sr-only">
              Send the test email to
            </label>
            <input id="test-to" type="email" placeholder="you@example.com" value={test.to} onChange={(event) => setTest((previous) => ({ ...previous, to: event.target.value }))} style={{ flex: "1 1 220px", maxWidth: 320 }} />
            <button type="submit" className="btn primary" disabled={test.sending || test.to.trim() === ""}>
              {test.sending ? "Sending…" : "Send"}
            </button>
          </form>
        )}
        {test.message && <Notice kind={test.message.kind} onDismiss={() => setTest((previous) => ({ ...previous, message: null }))}>{test.message.text}</Notice>}

        {previewFailed && <Notice kind="error">The preview couldn't be built just now.</Notice>}
        {!preview && !previewFailed && <Loading />}
        {preview && (
          <>
            <p className="email-subject">
              <span className="muted">Subject:</span> {preview.subject}
            </p>
            <div className="email-frame" style={{ width: view === "mobile" ? 390 : "100%" }}>
              {preview.format === "plain" ? (
                <pre className="email-plain">{preview.text}</pre>
              ) : (
                <iframe ref={frame} title="Email preview" srcDoc={previewHtml} sandbox="allow-same-origin allow-popups" scrolling="no" onLoad={fitFrame} />
              )}
            </div>
          </>
        )}
      </section>
    </>
  );
}

/** One email's screen (/settings/emails/new-order or /settings/emails/order-received). */
export function EmailScreen() {
  const { kind } = useParams();
  const { data, error } = useApi<Payload>(`/admin/emails/${encodeURIComponent(kind ?? "")}`);
  useTitle(data?.title ?? "Email");
  return (
    <div className="page">
      <PageTitle title="Settings" />
      <SettingsTabs />
      <ErrorNotice error={error} />
      {!data && !error && <Loading />}
      {/* keyed by the email, so moving between the two never carries one's text over to the other */}
      {data && <NewOrderForm key={data.key} initial={data} />}
    </div>
  );
}
