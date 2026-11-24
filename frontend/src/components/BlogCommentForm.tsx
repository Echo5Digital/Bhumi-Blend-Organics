"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api";
import { sendBlogComment } from "@/lib/blogComments";

// "Leave a Reply" at the very end of a blog article: a comment box, Name / Email / Website, the
// "save my details" tick and the Post Comment button. A sent comment waits for the shop owner's
// approval (the backend keeps it as pending), so the visitor is told it is "awaiting moderation".
// With the tick ticked, name, email and website are kept in this browser for next time.

const REMEMBER_KEY = "bhumiblend-comment-author";

const star = <span className="text-[#c62828]">*</span>;

const box =
  "peer w-full rounded-[3px] border bg-white px-2.5 font-system text-[16px] text-[#2f261b] outline-none transition-[border-color,box-shadow] duration-200 placeholder-transparent focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/25";
const boxBorder = (hasError: boolean) => (hasError ? "border-[#c62828]" : "border-[#e1d6b8]");
// The label sits inside the empty box like a placeholder, with its star in red, and goes away once something is typed.
const insideLabel =
  "pointer-events-none absolute left-2.5 font-system text-[16px] text-[#6d6459] peer-[:not(:placeholder-shown)]:hidden";

export function BlogCommentForm({ slug }: { slug: string }) {
  const uid = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [comment, setComment] = useState("");
  const [company, setCompany] = useState("");
  const [remember, setRemember] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Fill in the details this visitor asked us to remember.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(REMEMBER_KEY) ?? "null") as { name?: string; email?: string; website?: string } | null;
      if (saved) {
        setName(saved.name ?? "");
        setEmail(saved.email ?? "");
        setWebsite(saved.website ?? "");
        setRemember(true);
      }
    } catch {
      // Private window or blocked storage: the form simply starts empty.
    }
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;
    setState("sending");
    setMessage("");
    setFieldErrors({});
    try {
      const result = await sendBlogComment({ postSlug: slug, name, email, website, comment, company });
      try {
        if (remember) localStorage.setItem(REMEMBER_KEY, JSON.stringify({ name, email, website }));
        else localStorage.removeItem(REMEMBER_KEY);
      } catch {
        // Not being able to remember is no reason to fail.
      }
      setComment("");
      if (!remember) {
        setName("");
        setEmail("");
        setWebsite("");
      }
      setMessage(result.message);
      setState("sent");
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.fields);
        setMessage(Object.keys(error.fields).length > 0 ? "Please check the highlighted details." : error.message);
      } else {
        setMessage("Sorry, your comment could not be sent. Please try again.");
      }
      setState("error");
    }
  }

  const err = (field: string) => fieldErrors[field];
  const errorText = (field: string) =>
    err(field) ? (
      <p id={`${uid}-${field}-error`} className="mt-1.5 font-system text-[13px] text-[#c62828]">
        {err(field)}
      </p>
    ) : null;

  return (
    <section aria-labelledby={`${uid}-title`} className="mx-auto max-w-[1180px] px-4 pb-20 sm:px-6 sm:pb-28">
      <div className="max-w-[800px]">
        <h2 id={`${uid}-title`} className="font-serif text-[26px] leading-tight font-bold text-brand-gold-dark sm:text-[32px]">
          Leave a Reply
        </h2>
        <p className="mt-3 font-system text-[14px] text-[#4a4036] italic">
          Your email address will not be published. Required fields are marked {star}
        </p>

        <form onSubmit={onSubmit} className="relative mt-6">
          <div className="relative">
            <textarea
              id={`${uid}-comment`}
              name="comment"
              required
              maxLength={3000}
              rows={9}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder=" "
              aria-invalid={err("comment") ? true : undefined}
              aria-describedby={err("comment") ? `${uid}-comment-error` : undefined}
              className={`${box} ${boxBorder(!!err("comment"))} block min-h-[233px] resize-y py-2.5`}
            />
            <label htmlFor={`${uid}-comment`} className={`${insideLabel} top-2.5`}>
              Comment {star}
            </label>
          </div>
          {errorText("comment")}

          <div className="mt-9 grid gap-5 sm:grid-cols-3 sm:gap-6">
            <div>
              <div className="relative">
                <input
                  id={`${uid}-name`}
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  maxLength={80}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder=" "
                  aria-invalid={err("name") ? true : undefined}
                  aria-describedby={err("name") ? `${uid}-name-error` : undefined}
                  className={`${box} ${boxBorder(!!err("name"))} h-[44px]`}
                />
                <label htmlFor={`${uid}-name`} className={`${insideLabel} top-1/2 -translate-y-1/2`}>
                  Name {star}
                </label>
              </div>
              {errorText("name")}
            </div>
            <div>
              <div className="relative">
                <input
                  id={`${uid}-email`}
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder=" "
                  aria-invalid={err("email") ? true : undefined}
                  aria-describedby={err("email") ? `${uid}-email-error` : undefined}
                  className={`${box} ${boxBorder(!!err("email"))} h-[44px]`}
                />
                <label htmlFor={`${uid}-email`} className={`${insideLabel} top-1/2 -translate-y-1/2`}>
                  Email {star}
                </label>
              </div>
              {errorText("email")}
            </div>
            <div>
              <div className="relative">
                <input
                  id={`${uid}-website`}
                  name="website"
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  maxLength={200}
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  placeholder=" "
                  aria-invalid={err("website") ? true : undefined}
                  aria-describedby={err("website") ? `${uid}-website-error` : undefined}
                  className={`${box} ${boxBorder(!!err("website"))} h-[44px]`}
                />
                <label htmlFor={`${uid}-website`} className={`${insideLabel} top-1/2 -translate-y-1/2`}>
                  Website
                </label>
              </div>
              {errorText("website")}
            </div>
          </div>

          {/* A box for robots only: people never see it or reach it with the keyboard. */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0">
            <label>
              Company
              <input type="text" name="company" tabIndex={-1} autoComplete="off" value={company} onChange={(event) => setCompany(event.target.value)} />
            </label>
          </div>

          <label className="mt-6 flex cursor-pointer items-start gap-2.5 font-system text-[16px] text-[#2f261b]">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="mt-[5px] h-4 w-4 shrink-0 cursor-pointer accent-brand-gold-dark"
            />
            <span>Save my name, email, and website in this browser for the next time I comment.</span>
          </label>

          <button
            type="submit"
            disabled={state === "sending"}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-[4px] bg-gradient-to-r from-[#e6bd62] to-[#C89B3C] px-[18px] font-system text-[17px] font-medium text-[#2a1a05] shadow-[0_12px_24px_-16px_rgba(184,121,31,0.85)] transition-[filter,transform] duration-300 hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold-dark disabled:translate-y-0 disabled:opacity-70"
          >
            {state === "sending" ? "Posting…" : "Post Comment"}
          </button>

          {/* The answer sits right under the button, where the visitor is looking. */}
          {state === "sent" && (
            <p role="status" className="mt-5 rounded-[3px] border border-brand-gold/50 bg-[#fff8ec] px-4 py-3 font-system text-[15px] text-[#6b4f17]">
              Thank you! {message}
            </p>
          )}
          {state === "error" && message && (
            <p role="alert" className="mt-5 rounded-[3px] border border-[#c62828]/40 bg-[#fdf1f0] px-4 py-3 font-system text-[15px] text-[#8c1d18]">
              {message}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
