"use client";

import { useId, useMemo, useState } from "react";
import {
  COUNTRY_CODES,
  DEFAULT_COUNTRY_CODE,
  formatPhoneNumber,
  parsePhoneNumber,
} from "./lib/country-codes";

interface PhoneNumberInputProps {
  /** Form field name the combined "+<dial> <number>" value is submitted under. */
  name: string;
  label?: string;
  /** Existing stored value, e.g. "+91 9876543210" — for pre-filling an edit form. */
  defaultValue?: string;
  required?: boolean;
  /** Optional — for controlled usage outside a plain form submission. */
  onChange?: (fullPhone: string) => void;
}

/**
 * Country-code select + number field that behaves as a single logical
 * input: it always keeps a hidden `<input name={name}>` in sync with the
 * combined value, so any consumer — a server action reading FormData
 * (TripRequestForm) or a controlled profile-update form — sees one plain
 * "phone" field either way.
 */
export function PhoneNumberInput({
  name,
  label = "Phone",
  defaultValue = "",
  required = false,
  onChange,
}: PhoneNumberInputProps) {
  const initial = useMemo(() => parsePhoneNumber(defaultValue), [defaultValue]);

  const [dialCode, setDialCode] = useState(initial.dialCode || DEFAULT_COUNTRY_CODE);
  const [number, setNumber] = useState(initial.number);

  const inputId = useId();
  const combined = formatPhoneNumber(dialCode, number);

  const emitChange = (nextDial: string, nextNumber: string) => {
    onChange?.(formatPhoneNumber(nextDial, nextNumber));
  };

  return (
    <div>
      <label
        htmlFor={inputId}
        className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5"
      >
        {label}
      </label>

      <div className="flex rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:border-[#0a1f4d] focus-within:bg-white transition-all">
        <select
          aria-label="Country code"
          value={dialCode}
          onChange={(event) => {
            setDialCode(event.target.value);
            emitChange(event.target.value, number);
          }}
          className="shrink-0 bg-transparent border-r border-slate-200 px-2 text-sm text-slate-700 focus:outline-none cursor-pointer max-w-[6.5rem]"
        >
          {COUNTRY_CODES.map((country) => (
            <option key={country.iso} value={country.dial}>
              {country.dial} {country.iso}
            </option>
          ))}
        </select>

        <input
          id={inputId}
          type="tel"
          inputMode="tel"
          required={required}
          value={number}
          onChange={(event) => {
            // Digits, spaces, and hyphens only — permissive enough for
            // however someone naturally types a number, restrictive
            // enough to keep the combined value clean.
            const nextNumber = event.target.value.replace(/[^\d\s-]/g, "");
            setNumber(nextNumber);
            emitChange(dialCode, nextNumber);
          }}
          placeholder="98765 43210"
          className="w-full min-w-0 px-3 py-3 bg-transparent text-sm text-slate-900 focus:outline-none"
        />
      </div>

      {/* Server actions read FormData by field name — this is the single
          value actions/enquiry.ts and a future profile-update action will
          see as `phone`. */}
      <input type="hidden" name={name} value={combined} />
    </div>
  );
}