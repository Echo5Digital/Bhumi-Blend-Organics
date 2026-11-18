"use client";

import {
  INDIAN_STATES,
  type Address,
  type AddressErrors,
} from "@/lib/checkout";
import { SelectField, TextField } from "./Fields";

// The address form, used for shipping and (when it differs) billing. `prefix`
// keeps the element ids and autocomplete sections of the two forms apart.
export function AddressFields({
  prefix,
  value,
  errors,
  onChange,
  onBlur,
}: {
  prefix: "shipping" | "billing";
  value: Address;
  /** Only the errors that should be showing right now. */
  errors: AddressErrors;
  onChange: (field: keyof Address, value: string) => void;
  onBlur: (field: keyof Address) => void;
}) {
  const field = (name: keyof Address, label: string, autoComplete: string) => ({
    id: `${prefix}-${name}`,
    label,
    value: value[name],
    error: errors[name],
    autoComplete: `${prefix} ${autoComplete}`,
    onChange: (next: string) => onChange(name, next),
    onBlur: () => onBlur(name),
  });

  return (
    <div className="grid gap-4 sm:grid-cols-6">
      <div className="sm:col-span-6">
        {/* India is the only country the store ships to. */}
        <SelectField
          id={`${prefix}-country`}
          label="Country/Region"
          value={value.country}
          autoComplete={`${prefix} country-name`}
          options={["India"]}
          onChange={(next) => onChange("country", next)}
        />
      </div>
      <div className="sm:col-span-3">
        <TextField {...field("firstName", "First name", "given-name")} />
      </div>
      <div className="sm:col-span-3">
        <TextField {...field("lastName", "Last name", "family-name")} />
      </div>
      <div className="sm:col-span-6">
        <TextField {...field("line1", "Address", "address-line1")} />
      </div>
      <div className="sm:col-span-6">
        <TextField {...field("line2", "Apartment, suite, etc. (optional)", "address-line2")} />
      </div>
      <div className="sm:col-span-2">
        <TextField {...field("city", "City", "address-level2")} />
      </div>
      <div className="sm:col-span-2">
        <SelectField
          {...field("state", "State", "address-level1")}
          placeholder="Select a state"
          options={INDIAN_STATES}
        />
      </div>
      <div className="sm:col-span-2">
        <TextField
          {...field("pin", "PIN code", "postal-code")}
          inputMode="numeric"
          maxLength={6}
        />
      </div>
      <div className="sm:col-span-6">
        <TextField {...field("phone", "Phone", "tel")} type="tel" inputMode="tel" />
      </div>
    </div>
  );
}
