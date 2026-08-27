import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { City, Country } from "country-state-city";

// City/country data is static — it only changes when the country-state-city
// package itself is updated (a deploy), never at runtime. Safe to cache hard,
// both at the CDN edge and in the browser.
export const revalidate = 604800; // 7 days

let cachedCountryMap: Map<string, string> | null = null;
let cachedMajor: string[] | null = null;
let cachedAll: string[] | null = null;

function getCountryMap() {
  if (cachedCountryMap) return cachedCountryMap;

  const map = new Map<string, string>();
  for (const country of Country.getAllCountries()) {
    map.set(country.isoCode, country.name);
  }

  cachedCountryMap = map;
  return map;
}

function normalizeCityName(name: string) {
  return name.replace(/^['\u2018\u2019"`\s\d.-]+/, "").trim();
}

const collator = new Intl.Collator("en", { sensitivity: "base" });

// This is the expensive work the client used to do on every page load —
// iterate ~150k raw city entries, format them, dedupe, and sort with
// localeCompare — moved server-side, computed once per warm server
// instance (module-level cache) instead of once per browser session, and
// never shipped as part of the client JS bundle at all.
function buildCityLists() {
  if (cachedMajor && cachedAll) {
    return { major: cachedMajor, all: cachedAll };
  }

  const countryMap = getCountryMap();
  const cities = City.getAllCities();

  const majorSet = new Set<string>();
  const allSet = new Set<string>();

  for (const city of cities) {
    const cleanName = normalizeCityName(city.name);
    if (!cleanName || cleanName.length < 2 || /^\d+$/.test(cleanName)) continue;

    const countryName = countryMap.get(city.countryCode) || city.countryCode;
    const formattedName = `${cleanName}, ${countryName}`;

    allSet.add(formattedName);

    const rawCity = city as unknown as Record<string, unknown>;
    const population = Number(rawCity.population) || 0;

    if (population > 300000 || (!population && cleanName.length >= 4)) {
      majorSet.add(formattedName);
    }
  }

  const sortFn = (a: string, b: string) => collator.compare(a, b);

  cachedMajor = Array.from(majorSet).sort(sortFn);
  cachedAll = Array.from(allSet).sort(sortFn);

  return { major: cachedMajor, all: cachedAll };
}

export async function GET(request: NextRequest) {
  const scope = request.nextUrl.searchParams.get("scope") === "all" ? "all" : "major";
  const { major, all } = buildCityLists();
  const data = scope === "all" ? all : major;

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, max-age=604800, s-maxage=604800, immutable",
    },
  });
}