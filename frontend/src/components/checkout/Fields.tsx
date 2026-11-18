"use client";

import type { ReactNode } from "react";

// The form controls used on /checkout, styled like the live checkout: square-ish
// boxes with a dark outline, a small label that sits on top of the value, and
// red text under a field that needs fixing.

const box =
  "w-full rounded-[4px] border bg-white px-[10px] pt-[20px] pb-[5px] font-system text-[16px] leading-6 text-[#1e1e1e] transition-colors duration-200 focus:outline-2 focus:outline-offset-0 focus:outline-brand-gold";
const boxBorder = (error?: string) =>
  error ? "border-[#cc1818]" : "border-[#757575] hover:border-[#1e1e1e]";

const floatedLabel =
  "pointer-events-none absolute left-[11px] top-[7px] origin-left font-system text-[12px] leading-4 text-[#555] transition-all duration-150";

function ErrorText({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 font-system text-[12px] leading-4 text-[#cc1818]">
      {error}
    </p>
  );
}

export function TextField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  type = "text",
  autoComplete,
  inputMode,
  maxLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  type?: "text" | "email" | "tel" | "password";
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "tel" | "email";
  maxLength?: number;
}) {
  const errorId = `${id}-error`;
  return (
    <div>
      <div className="relative">
        {/* placeholder=" " lets CSS tell "empty" from "filled": an empty, unfocused
            field shows its label big in the middle, anything else tucks it on top. */}
        <input
          id={id}
          type={type}
          value={value}
          placeholder=" "
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className={`peer h-[52px] ${box} ${boxBorder(error)}`}
        />
        <label
          htmlFor={id}
          className={`${floatedLabel} peer-placeholder-shown:top-[14px] peer-placeholder-shown:text-[16px] peer-placeholder-shown:leading-6 peer-focus:top-[7px] peer-focus:text-[12px] peer-focus:leading-4`}
        >
          {label}
        </label>
      </div>
      <ErrorText id={errorId} error={error} />
    </div>
  );
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  autoComplete,
  placeholder,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  autoComplete?: string;
  /** Text of the empty first option; leave out when there is always a choice made. */
  placeholder?: string;
  options: readonly string[];
}) {
  const errorId = `${id}-error`;
  return (
    <div>
      <div className="relative">
        <select
          id={id}
          value={value}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className={`h-[52px] cursor-pointer appearance-none pr-9 ${box} ${boxBorder(error)}`}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <label htmlFor={id} className={floatedLabel}>
          {label}
        </label>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 fill-none stroke-[#1e1e1e]"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
      <ErrorText id={errorId} error={error} />
    </div>
  );
}

export function Checkbox({
  id,
  checked,
  onChange,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="relative grid h-5 w-5 shrink-0 place-items-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer h-5 w-5 cursor-pointer appearance-none rounded-[3px] border border-[#1e1e1e] bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="pointer-events-none absolute h-4 w-4 fill-none stroke-[#1e1e1e] opacity-0 peer-checked:opacity-100"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
      <label htmlFor={id} className="cursor-pointer font-system text-[14px] leading-5 text-[#1e1e1e]">
        {children}
      </label>
    </div>
  );
}

/**
 * One choice in a "Shipping options" / "Payment options" group. The store only
 * offers one of each for now, so it is always the selected one — still a real
 * radio, so it reads correctly to screen readers and is ready for a second choice.
 */
export function OptionCard({
  name,
  value,
  label,
  trailing,
  children,
}: {
  name: string;
  value: string;
  label: string;
  trailing?: string;
  children?: ReactNode;
}) {
  return (
    <label className="block cursor-default rounded-[4px] border border-[#1e1e1e] px-4 py-[15px] ring-1 ring-[#1e1e1e]">
      <span className="flex items-center gap-3 font-system text-[14px] leading-5 text-[#1e1e1e]">
        <input type="radio" name={name} value={value} checked readOnly className="peer sr-only" />
        <span
          aria-hidden="true"
          className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-[#1e1e1e] bg-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-gold"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-[#1e1e1e]" />
        </span>
        <span className="flex-1">{label}</span>
        {trailing && <span className="text-[13px]">{trailing}</span>}
      </span>
      {children && (
        <span className="mt-3 block font-system text-[14px] leading-5 text-[#1e1e1e]">{children}</span>
      )}
    </label>
  );
}
