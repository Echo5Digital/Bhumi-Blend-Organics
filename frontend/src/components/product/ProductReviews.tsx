"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api";
import { getProductReviews, sendProductReview, type PublicReview } from "@/lib/reviews";

// The Reviews tab of a product page: on the left the star summary and the approved reviews, on the
// right the "Add a review" form. A review someone sends waits for an admin's approval (the backend
// keeps it as pending), so only approved ones are listed for everybody. The person who sent one
// also sees it in the list, marked "Your review is awaiting approval", until it is approved (then it
// appears normally) or rejected (then it disappears). That is remembered in this browser only.

const AUTHOR_KEY = "bhumiblend-review-author";
const PENDING_KEY = "bhumiblend-pending-reviews";

type OwnReview = { id: string; rating: number; review: string; name: string; createdAt: string };

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });

function readPending(slug: string): OwnReview[] {
  try {
    const all = JSON.parse(localStorage.getItem(PENDING_KEY) ?? "{}") as Record<string, OwnReview[]>;
    return Array.isArray(all[slug]) ? all[slug].filter((item) => typeof item?.id === "string") : [];
  } catch {
    return [];
  }
}

function writePending(slug: string, list: OwnReview[]) {
  try {
    const all = JSON.parse(localStorage.getItem(PENDING_KEY) ?? "{}") as Record<string, OwnReview[]>;
    if (list.length > 0) all[slug] = list.slice(0, 5);
    else delete all[slug];
    localStorage.setItem(PENDING_KEY, JSON.stringify(all));
  } catch {
    // Storage blocked: the review is still sent; it just isn't remembered on this device.
  }
}

const starPath = "M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9L12 2.5z";

function Star({ filled, className = "h-5 w-5" }: { filled: boolean; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`${className} stroke-[#C89B3C] ${filled ? "fill-[#C89B3C]" : "fill-none"}`} strokeWidth={1.6} strokeLinejoin="round">
      <path d={starPath} />
    </svg>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span role="img" aria-label={`Rated ${value} out of 5`} className="flex shrink-0 gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} filled={n <= value} className="h-[18px] w-[18px]" />
      ))}
    </span>
  );
}

function Avatar() {
  return (
    <span aria-hidden="true" className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f3ead3] text-[#b79a52] sm:h-[50px] sm:w-[50px]">
      <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current sm:h-8 sm:w-8">
        <path d="M12 12.2a4.1 4.1 0 1 0 0-8.2 4.1 4.1 0 0 0 0 8.2zm0 1.9c-3.9 0-7.2 2-7.2 4.7 0 .6.5 1.1 1.1 1.1h12.2c.6 0 1.1-.5 1.1-1.1 0-2.7-3.3-4.7-7.2-4.7z" />
      </svg>
    </span>
  );
}

const star = <span className="text-[#c62828]">*</span>;
const label = "block font-system text-[16px] text-[#444]";
const field =
  "mt-2 block w-full rounded-[3px] border bg-white px-2.5 font-system text-[16px] text-[#2f261b] outline-none transition-[border-color,box-shadow] duration-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/25";
const border = (hasError: boolean) => (hasError ? "border-[#c62828]" : "border-[#e1d6b8]");

export function ProductReviews({ slug, rating }: { slug: string; rating: { value: number; count: number } }) {
  const uid = useId();
  const [approved, setApproved] = useState<PublicReview[]>([]);
  const [own, setOwn] = useState<OwnReview[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [remember, setRemember] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Load this product's approved reviews, and check on the ones this visitor sent earlier.
  useEffect(() => {
    let cancelled = false;
    const earlier = readPending(slug);
    getProductReviews(slug, earlier.map((item) => item.id))
      .then((result) => {
        if (cancelled) return;
        setApproved(result.reviews);
        const stillPending = earlier.filter((item) => result.own.find((entry) => entry.id === item.id)?.status === "pending");
        writePending(slug, stillPending);
        setOwn(stillPending);
        setLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setOwn(earlier);
        setLoadFailed(true);
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // The details this visitor asked us to remember.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(AUTHOR_KEY) ?? "null") as { name?: string; email?: string } | null;
      if (saved) {
        setName(saved.name ?? "");
        setEmail(saved.email ?? "");
        setRemember(true);
      }
    } catch {
      // Private window: the form simply starts empty.
    }
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;
    setState("sending");
    setMessage("");
    setFieldErrors({});
    try {
      const result = await sendProductReview(slug, { rating: stars, review: text, name, email, company });
      try {
        if (remember) localStorage.setItem(AUTHOR_KEY, JSON.stringify({ name, email }));
        else localStorage.removeItem(AUTHOR_KEY);
      } catch {
        // Not being able to remember is no reason to fail.
      }
      // Show it to its writer right away, marked as waiting (a robot's fake answer has no id).
      if (result.id) {
        const mine: OwnReview = { id: result.id, rating: stars, review: text.trim(), name: name.trim(), createdAt: new Date().toISOString() };
        const next = [mine, ...own];
        setOwn(next);
        writePending(slug, next);
      }
      setText("");
      setStars(0);
      if (!remember) {
        setName("");
        setEmail("");
      }
      setMessage(result.message);
      setState("sent");
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.fields);
        setMessage(Object.keys(error.fields).length > 0 ? "Please check the highlighted details." : error.message);
      } else {
        setMessage("Sorry, your review could not be sent. Please try again.");
      }
      setState("error");
    }
  }

  const err = (name: string) => fieldErrors[name];
  const errorText = (name: string) =>
    err(name) ? (
      <p id={`${uid}-${name}-error`} className="mt-1.5 font-system text-[13px] text-[#c62828]">
        {err(name)}
      </p>
    ) : null;
  const shown = hover || stars;

  // The page's own rating is refreshed when an admin approves a review, which can take a moment. If
  // the list just loaded holds more reviews than that rating counts, sum up the list instead, so the
  // summary never says "no reviews yet" above a review.
  const rated = approved.filter((item) => item.rating);
  const summary =
    approved.length > rating.count
      ? { value: rated.length ? Math.round((rated.reduce((total, item) => total + (item.rating ?? 0), 0) / rated.length) * 100) / 100 : 0, count: approved.length }
      : rating;
  const reviewLabel = `${summary.count} customer ${summary.count === 1 ? "review" : "reviews"}`;

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-16">
      {/* ───────── The reviews ───────── */}
      <div className="min-w-0">
        <div>
          <h2 className="font-serif text-[28px] leading-tight font-medium text-[#222] sm:text-[36px]">Reviews</h2>
          <span aria-hidden="true" className="mt-3 block h-[3px] w-14 rounded-full bg-brand-gold" />
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-[#eadcb6] bg-[#fbf8ef] px-5 py-5 sm:px-6">
          <span role="img" aria-label={`Rated ${summary.value} out of 5`} className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} filled={n <= summary.value} />
            ))}
          </span>
          <p className="font-system text-[16px] text-[#444]">
            {summary.count === 0 ? "There are no reviews yet." : `Rated ${summary.value} out of 5 based on ${reviewLabel}.`}
          </p>
        </div>

        {loadFailed && <p className="mt-5 font-system text-[14px] text-[#8c1d18]">We couldn&apos;t load the reviews just now. Please refresh the page to try again.</p>}

        {(own.length > 0 || approved.length > 0) && (
          <ol className="mt-8 space-y-5">
            {own.map((item) => (
              <li key={item.id} className="flex gap-3 sm:gap-4">
                <Avatar />
                <div className="min-w-0 flex-1 rounded-[10px] border border-[#eadcb6] bg-white px-4 py-4 sm:px-5">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                    <p className="font-system text-[14px] text-[#6d6459] italic">Your review is awaiting approval</p>
                    {item.rating > 0 && <Stars value={item.rating} />}
                  </div>
                  <p className="mt-3 font-system text-[16px] leading-[1.7] break-words whitespace-pre-line text-[#333]">{item.review}</p>
                </div>
              </li>
            ))}
            {approved.map((item) => (
              <li key={item.id} className="flex gap-3 sm:gap-4">
                <Avatar />
                <div className="min-w-0 flex-1 rounded-[10px] border border-[#eadcb6] bg-white px-4 py-4 sm:px-5">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                    <p className="font-system text-[15px] text-[#333]">
                      <strong className="font-bold text-[#222]">{item.name}</strong>
                      <span className="text-[#6d6459]"> – {dateFormat.format(new Date(item.createdAt))}</span>
                    </p>
                    {item.rating ? <Stars value={item.rating} /> : null}
                  </div>
                  <p className="mt-3 font-system text-[16px] leading-[1.7] break-words whitespace-pre-line text-[#333]">{item.review}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
        {loaded && !loadFailed && approved.length === 0 && own.length === 0 && summary.count > 0 && (
          <p className="mt-6 font-system text-[15px] text-[#555]">Be the first to write about it here: add your review.</p>
        )}
      </div>

      {/* ───────── Add a review ───────── */}
      <div className="min-w-0">
        <h2 id={`${uid}-title`} className="font-serif text-[26px] leading-tight font-medium text-[#222] sm:text-[30px]">
          Add a review
        </h2>
        <p className="mt-3 font-system text-[14px] text-[#4a4036] italic">
          Your email address will not be published. Required fields are marked {star}
        </p>

        <form onSubmit={onSubmit} aria-labelledby={`${uid}-title`} className="relative mt-6">
          <fieldset>
            <legend className={label}>Your rating</legend>
            <div className="mt-2 flex gap-1" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="cursor-pointer" onMouseEnter={() => setHover(n)}>
                  <input
                    type="radio"
                    name="rating"
                    value={n}
                    checked={stars === n}
                    onChange={() => setStars(n)}
                    // Clicking the star you already chose takes the rating back.
                    onClick={() => stars === n && setStars(0)}
                    aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
                    className="peer sr-only"
                  />
                  <Star filled={n <= shown} className="h-6 w-6 rounded-sm transition-transform duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-gold-dark hover:scale-110" />
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-6">
            <label htmlFor={`${uid}-review`} className={label}>
              Your review {star}
            </label>
            <textarea
              id={`${uid}-review`}
              name="review"
              required
              maxLength={3000}
              rows={4}
              value={text}
              onChange={(event) => setText(event.target.value)}
              aria-invalid={err("review") ? true : undefined}
              aria-describedby={err("review") ? `${uid}-review-error` : undefined}
              className={`${field} ${border(!!err("review"))} min-h-[110px] resize-y py-2.5`}
            />
            {errorText("review")}
          </div>

          <div className="mt-6">
            <label htmlFor={`${uid}-name`} className={label}>
              Name {star}
            </label>
            <input
              id={`${uid}-name`}
              name="name"
              type="text"
              autoComplete="name"
              required
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={err("name") ? true : undefined}
              aria-describedby={err("name") ? `${uid}-name-error` : undefined}
              className={`${field} ${border(!!err("name"))} h-11 sm:max-w-[330px]`}
            />
            {errorText("name")}
          </div>

          <div className="mt-6">
            <label htmlFor={`${uid}-email`} className={label}>
              Email {star}
            </label>
            <input
              id={`${uid}-email`}
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={err("email") ? true : undefined}
              aria-describedby={err("email") ? `${uid}-email-error` : undefined}
              className={`${field} ${border(!!err("email"))} h-11 sm:max-w-[330px]`}
            />
            {errorText("email")}
          </div>

          {/* A box for robots only: people never see it or reach it with the keyboard. */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0">
            <label>
              Company
              <input type="text" name="company" tabIndex={-1} autoComplete="off" value={company} onChange={(event) => setCompany(event.target.value)} />
            </label>
          </div>

          <label className="mt-7 flex cursor-pointer items-start gap-2.5 font-system text-[15px] leading-snug text-[#2f261b]">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="mt-[3px] h-4 w-4 shrink-0 cursor-pointer accent-brand-gold-dark"
            />
            <span>Save my name, email, and website in this browser for the next time I comment.</span>
          </label>

          <button
            type="submit"
            disabled={state === "sending"}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-[4px] bg-gradient-to-r from-[#e6bd62] to-[#C89B3C] px-[18px] font-system text-[17px] font-medium text-[#2a1a05] shadow-[0_12px_24px_-16px_rgba(184,121,31,0.85)] transition-[filter,transform] duration-300 hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold-dark disabled:translate-y-0 disabled:opacity-70"
          >
            {state === "sending" ? "Sending…" : "Submit"}
          </button>

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
    </div>
  );
}
