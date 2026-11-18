import type { MailMessage } from "./mailer.js";

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

/** The email with the 6-digit sign-up code. Plain text and a simple branded HTML version. */
export function verificationEmail({
  to,
  firstName,
  code,
  minutes,
}: {
  to: string;
  firstName: string;
  code: string;
  minutes: number;
}): MailMessage {
  const subject = `${code} is your Bhumi Blend verification code`;

  const text = [
    `Hi ${firstName},`,
    "",
    "Welcome to Bhumi Blend Organics! Use this code to finish creating your account:",
    "",
    `    ${code}`,
    "",
    `It expires in ${minutes} minutes. If you didn't try to sign up, you can safely ignore this email.`,
    "",
    "— Bhumi Blend Organics",
  ].join("\n");

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#fcfcf5;font-family:Arial,Helvetica,sans-serif;color:#222;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #eadcb6;border-radius:12px;">
      <tr><td style="padding:28px 28px 8px;font-size:22px;color:#b8791f;font-family:Georgia,serif;">Bhumi Blend Organics</td></tr>
      <tr><td style="padding:8px 28px;font-size:16px;line-height:24px;">
        Hi ${escapeHtml(firstName)},<br><br>
        Welcome! Use this code to finish creating your account:
      </td></tr>
      <tr><td align="center" style="padding:12px 28px;">
        <div style="display:inline-block;padding:14px 26px;background:#fbf3e0;border:1px solid #eadcb6;border-radius:8px;font-size:32px;letter-spacing:8px;font-weight:bold;color:#222;">${escapeHtml(code)}</div>
      </td></tr>
      <tr><td style="padding:8px 28px 28px;font-size:14px;line-height:21px;color:#666;">
        This code expires in ${minutes} minutes. If you didn't try to sign up, you can safely ignore this email.
      </td></tr>
    </table>
  </body>
</html>`;

  return { to, subject, text, html };
}
