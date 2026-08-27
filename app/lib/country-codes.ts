export type CountryCode = {
  iso: string;
  name: string;
  dial: string;
};

// A curated set covering the countries this business's customers and
// destinations most realistically involve, not the full ISO-3166 list of
// ~240 entries. Small enough to inline directly in the client bundle with
// no meaningful cost. India first (and default) given the business is
// India-based — see the `timezone` default in the User model.
export const COUNTRY_CODES: CountryCode[] = [
  { iso: "IN", name: "India", dial: "+91" },
  { iso: "US", name: "United States", dial: "+1" },
  { iso: "GB", name: "United Kingdom", dial: "+44" },
  { iso: "AE", name: "United Arab Emirates", dial: "+971" },
  { iso: "SG", name: "Singapore", dial: "+65" },
  { iso: "AU", name: "Australia", dial: "+61" },
  { iso: "CA", name: "Canada", dial: "+1" },
  { iso: "DE", name: "Germany", dial: "+49" },
  { iso: "FR", name: "France", dial: "+33" },
  { iso: "IT", name: "Italy", dial: "+39" },
  { iso: "ES", name: "Spain", dial: "+34" },
  { iso: "NL", name: "Netherlands", dial: "+31" },
  { iso: "CH", name: "Switzerland", dial: "+41" },
  { iso: "SE", name: "Sweden", dial: "+46" },
  { iso: "NO", name: "Norway", dial: "+47" },
  { iso: "DK", name: "Denmark", dial: "+45" },
  { iso: "JP", name: "Japan", dial: "+81" },
  { iso: "KR", name: "South Korea", dial: "+82" },
  { iso: "CN", name: "China", dial: "+86" },
  { iso: "HK", name: "Hong Kong", dial: "+852" },
  { iso: "TH", name: "Thailand", dial: "+66" },
  { iso: "MY", name: "Malaysia", dial: "+60" },
  { iso: "ID", name: "Indonesia", dial: "+62" },
  { iso: "PH", name: "Philippines", dial: "+63" },
  { iso: "VN", name: "Vietnam", dial: "+84" },
  { iso: "SA", name: "Saudi Arabia", dial: "+966" },
  { iso: "QA", name: "Qatar", dial: "+974" },
  { iso: "KW", name: "Kuwait", dial: "+965" },
  { iso: "OM", name: "Oman", dial: "+968" },
  { iso: "BH", name: "Bahrain", dial: "+973" },
  { iso: "EG", name: "Egypt", dial: "+20" },
  { iso: "ZA", name: "South Africa", dial: "+27" },
  { iso: "NG", name: "Nigeria", dial: "+234" },
  { iso: "KE", name: "Kenya", dial: "+254" },
  { iso: "BR", name: "Brazil", dial: "+55" },
  { iso: "MX", name: "Mexico", dial: "+52" },
  { iso: "AR", name: "Argentina", dial: "+54" },
  { iso: "RU", name: "Russia", dial: "+7" },
  { iso: "TR", name: "Turkey", dial: "+90" },
  { iso: "IL", name: "Israel", dial: "+972" },
  { iso: "PK", name: "Pakistan", dial: "+92" },
  { iso: "BD", name: "Bangladesh", dial: "+880" },
  { iso: "LK", name: "Sri Lanka", dial: "+94" },
  { iso: "NP", name: "Nepal", dial: "+977" },
  { iso: "NZ", name: "New Zealand", dial: "+64" },
  { iso: "IE", name: "Ireland", dial: "+353" },
  { iso: "PT", name: "Portugal", dial: "+351" },
  { iso: "GR", name: "Greece", dial: "+30" },
  { iso: "PL", name: "Poland", dial: "+48" },
  { iso: "AT", name: "Austria", dial: "+43" },
  { iso: "BE", name: "Belgium", dial: "+32" },
];

export const DEFAULT_COUNTRY_CODE = "+91";

// Longest dial codes first when matching, so e.g. "+971" isn't
// mis-detected as "+9" followed by leftover digits "71...".
const DIAL_CODES_BY_LENGTH = [...COUNTRY_CODES]
  .map((country) => country.dial)
  .sort((a, b) => b.length - a.length);

/**
 * Splits a stored/combined phone string like "+91 9876543210" back into
 * its dial code and local number, for pre-filling an edit form (e.g. the
 * profile page) from a value that was saved by formatPhoneNumber().
 */
export function parsePhoneNumber(fullPhone: string | null | undefined): {
  dialCode: string;
  number: string;
} {
  const trimmed = (fullPhone || "").trim();
  if (!trimmed) {
    return { dialCode: DEFAULT_COUNTRY_CODE, number: "" };
  }

  const match = DIAL_CODES_BY_LENGTH.find((dial) => trimmed.startsWith(dial));
  if (!match) {
    return { dialCode: DEFAULT_COUNTRY_CODE, number: trimmed };
  }

  return { dialCode: match, number: trimmed.slice(match.length).trim() };
}

export function formatPhoneNumber(dialCode: string, number: string) {
  const digits = number.trim();
  return digits ? `${dialCode} ${digits}` : "";
}