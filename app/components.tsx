"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleAlert, Compass, Globe2, Heart, Menu, MessageCircle, UserCircle2, X, Star } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { logIn, logOut, signUp, type AuthActionState } from "./actions/auth";
import { toggleWishlist, type WishlistActionState } from "./actions/wishlist";
import type { DestinationData } from "./lib/data";
import React, { useMemo, useRef, useDeferredValue } from "react";
import { Check, ChevronDown, MapPin, Search } from "lucide-react";
import { SwipeableImageCarousel } from "./swipeable-image-carousel";
import { startTransition, useOptimistic } from "react";
import { createEnquiry, type EnquiryActionState } from "./actions/enquiries"
import { PhoneNumberInput } from "./PhoneNumberInput";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className={compact ? "brand brand--compact" : "brand"}
      aria-label="The Travel Beats home"
    >
      <Image
        src={
          compact
            ? "/brand/travel-beats-monogram.png"
            : "/brand/travel-beats-horizontal.png"
        }
        alt="The Travel Beats"
        width={compact ? 72 : 196}
        height={compact ? 58 : 66}
        priority={!compact}
      />
    </Link>
  );
}

type HeaderUser = { fullName: string };

function HeaderProfile() {
  const [user, setUser] = useState<HeaderUser | null>(null);

  useEffect(() => {
    let active = true;

    void fetch("/api/profile", { cache: "no-store" })
      .then((response) => response.json() as Promise<{ user: HeaderUser | null }>)
      .then((data) => {
        if (active) setUser(data.user);
      })
      .catch(() => {
        // Fallback remains as login link on fetch error
      });

    return () => {
      active = false;
    };
  }, []);

  if (!user) {
    return (
      <Link
        className="nav-icon-link"
        href="/auth/login"
        aria-label="Profile"
      >
        <UserCircle2 size={19} />
      </Link>
    );
  }

  return (
    <div className="nav-profile-wrapper" tabIndex={0}>
      <button className="nav-icon-link" type="button" aria-label="Account menu">
        <UserCircle2 size={19} />
      </button>

      <div className="nav-profile-popover">
        <span className="nav-profile-greeting">Logged in as</span>
        <Link href="/profile" className="nav-profile-name">
          {user.fullName}
        </Link>
        <form action={logOut}>
          <button type="submit" className="nav-logout-btn">
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="nav-shell">
        <Logo />

        <nav
          className={open ? "main-nav is-open" : "main-nav"}
          aria-label="Primary navigation"
        >
          <Link href="/destinations" onClick={() => setOpen(false)}>
            Destinations
          </Link>
          <Link href="/journeys" onClick={() => setOpen(false)}>
            Journeys
          </Link>
          <Link href="/journal" onClick={() => setOpen(false)}>
            Journal
          </Link>
          <Link href="/build-your-trip" onClick={() => setOpen(false)}>
            Build your trip
          </Link>
          <Link href="/about" onClick={() => setOpen(false)}>
            About
          </Link>
        </nav>

        <div className="nav-actions">
          <Link className="nav-contact" href="/build-your-trip">
            Talk to an expert <ArrowRight size={15} />
          </Link>

          <Link
            className="nav-icon-link"
            href="/wishlist"
            aria-label="Wishlist"
          >
            <Heart size={18} />
          </Link>

          {/* Replaced static link with dynamic HeaderProfile component */}
          <HeaderProfile />

          <button
            type="button"
            className="menu-button"
            onClick={() => setOpen((current) => !current)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </header>
  );
}

export function WhatsAppButton() {
  const defaultText = "Hi Travel Beats, I would like help planning a journey.";
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");

  const href = number
    ? `https://wa.me/${number}?text=${encodeURIComponent(defaultText)}`
    : `https://wa.me/?text=${encodeURIComponent(defaultText)}`;

  return (
    <a
      className="whatsapp-button"
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with Travel Beats on WhatsApp"
    >
      <MessageCircle size={23} />
      <span>Chat with us</span>
    </a>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer bg-slate-950 text-slate-300 py-12 px-6 border-t border-slate-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {/* Section 1: Left Description */}
        <div className="space-y-4">
          <Logo compact />
          <h2 className="text-xl font-bold text-white">The Travel Beats</h2>
          <p className="text-sm leading-relaxed text-slate-400">
            We believe travel is more than just a journey – it’s an experience that beats in the heart of every adventure. Whether you're dreaming of exploring the majestic landscapes of India or immersing yourself in the charm of international destinations, we craft journeys that leave a lasting impression.
          </p>
        </div>

        {/* Section 2: Quick Links */}
        <div className="space-y-3">
          <p className="footer-label font-semibold text-white uppercase text-xs tracking-wider">Explore</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/destinations" className="hover:text-white transition-colors">Destinations</Link></li>
            <li><Link href="/journeys" className="hover:text-white transition-colors">Journeys</Link></li>
            <li><Link href="/journal" className="hover:text-white transition-colors">Journal</Link></li>
            <li><Link href="/build-your-trip" className="hover:text-white transition-colors">Build your trip</Link></li>
          </ul>
        </div>

        {/* Section 3: Company & Policies */}
        <div className="space-y-3">
          <p className="footer-label font-semibold text-white uppercase text-xs tracking-wider">Company</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
            <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms-and-conditions" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
            <li><Link href="/profile" className="hover:text-white transition-colors">Your Profile</Link></li>
          </ul>
        </div>

        {/* Section 4: Contact Us */}
        <div className="space-y-3 text-sm">
          <p className="footer-label font-semibold text-white uppercase text-xs tracking-wider">Contact Us</p>
          <p className="text-slate-400">
            Block 23, Shop no. 7, Ground floor, Cloth Market, opposite St. Patricks college, Sanjay Place, Agra, Uttar Pradesh 282002.
          </p>
          <p>
            <strong className="text-white">Phone: </strong>
            <a href="tel:+919837916666" className="hover:underline">+91-9837916666</a>,{" "}
            <a href="tel:+919837916605" className="hover:underline">+91-9837916605</a>,{" "}
            <a href="tel:05624306035" className="hover:underline">0562 4306035</a>
          </p>
          <p>
            <strong className="text-white">Email: </strong>
            <a href="mailto:munazir@thetravelbeats.com" className="hover:underline">munazir@thetravelbeats.com</a>
          </p>
          <p>
            <strong className="text-white">Website: </strong>
            <a href="https://www.thetravelbeats.com" target="_blank" rel="noopener noreferrer" className="hover:underline">www.thetravelbeats.com</a>
          </p>

          <div className="pt-2">
            <p className="text-xs text-slate-400 mb-2 font-medium">Follow us :</p>
            <div className="flex items-center gap-3">
              {/* Facebook Icon SVG */}
              <a href="https://www.facebook.com/travelwithttb" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="p-2 rounded-full bg-slate-800 text-white hover:bg-sky-600 transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              {/* Instagram Icon SVG */}
              <a href="https://www.instagram.com/travelwithttb" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="p-2 rounded-full bg-slate-800 text-white hover:bg-pink-600 transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-xs text-slate-400 mb-2 font-medium">Review us On Google</p>
            <a
              href="https://share.google/g988XnNOeIpESbdkK"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
            >
              <Star size={14} className="fill-white" />
              Write a Review
            </a>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
        <span>© {new Date().getFullYear()} The Travel Beats. All rights reserved.</span>

        <a
          href="https://adgrowthpartners.netlify.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 hover:text-sky-400 transition-colors"
        >
          <span>Made with</span>
          <Heart size={12} className="text-rose-500 fill-rose-500 inline-block" />
          <span>by <strong className="font-semibold underline underline-offset-2 text-white">AD Growth Partner</strong></span>
        </a>
      </div>
    </footer>
  );
}

export function DestinationCard({
  destination,
  index,
  wishlisted = false,
}: {
  destination: DestinationData;
  index: number;
  wishlisted?: boolean;
}) {
  const formattedIndex = String(index + 1).padStart(2, "0");
  const imageList =
    destination.images && destination.images.length > 0
      ? destination.images
      : [destination.image];

  return (
    <article className="destination-card-wrap">
      {/* Click interceptor stops navigation when toggling wishlist */}
      <div
        className="wishlist-button-wrapper"
        onClick={(e) => e.stopPropagation()}
      >
        <WishlistButton
          itemId={destination.id}
          itemType="DESTINATION"
          defaultActive={wishlisted}
          label={`Toggle wishlist for ${destination.name}`}
        />
      </div>

      <Link
        href={`/destinations/${destination.slug}`}
        className="destination-card group"
      >
        <SwipeableImageCarousel
          images={imageList}
          alt={destination.name}
          sizes="(max-width: 900px) 90vw, 30vw"
          badgePosition="top-right"
        />
        <div className="card-overlay pointer-events-none z-1" aria-hidden="true" />

        <span className="card-number" aria-hidden="true">
          {formattedIndex}
        </span>

        <div className="destination-content">
          <span className="destination-region">{destination.region}</span>
          <h3 className="destination-title">{destination.name}</h3>
          <p className="destination-tag">{destination.tags[0]}</p>
        </div>

        <span className="circle-arrow" aria-hidden="true">
          <ArrowRight size={18} />
        </span>
      </Link>
    </article>
  );
}

export function WishlistButton({
  itemId,
  itemType,
  defaultActive = false,
  label,
}: {
  itemId: string;
  itemType: "DESTINATION" | "PACKAGE";
  defaultActive?: boolean;
  label: string;
}) {
  const initialState: WishlistActionState = {
    ok: false,
    message: "",
    active: defaultActive,
  };

  const [state, formAction, pending] = useActionState(
    toggleWishlist,
    initialState
  );

  const settledActive = state.message ? state.active : defaultActive;

  // The server round trip (auth check + DB reads/writes) will always have
  // some latency, however fast the queries are. Flip the heart the instant
  // the user clicks instead of waiting for the response, then let it
  // reconcile with the real result once the action settles — a failed
  // toggle naturally snaps back to `settledActive` since that's what this
  // optimistic value is layered on top of.
  const [active, setOptimisticActive] = useOptimistic(
    settledActive,
    (_current: boolean, next: boolean) => next
  );

  return (
    <form
      action={(formData) => {
        startTransition(() => {
          setOptimisticActive(!active);
          formAction(formData);
        });
      }}
      className="relative inline-flex items-center"
    >
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="itemType" value={itemType} />

      <button
        type="submit"
        disabled={pending}
        aria-label={label}
        aria-pressed={active}
        title={active ? "Remove from wishlist" : "Save to wishlist"}
        className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50 ${
          active
            ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
            : "border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        <Heart size={18} fill={active ? "currentColor" : "none"} />
      </button>

      {/* Floating Toast Notification relative to the button container */}
      {state.message ? (
        <div
          key={`${state.message}-${state.active}`}
          role="status"
          className={`absolute top-full right-0 mt-2 z-50 flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold shadow-md transition-all ${
            state.ok ? "bg-slate-900 text-white" : "bg-rose-600 text-white"
          }`}
        >
          {state.ok ? <CheckCircle2 size={16} /> : <CircleAlert size={16} />}
          <span>{state.message}</span>
        </div>
      ) : null}

      <span className="sr-only" aria-live="polite">
        {state.message}
      </span>
    </form>
  );
}

export function SectionIntro({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="section-intro">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {text && <p className="section-intro-text">{text}</p>}
    </div>
  );
}

interface TripRequestFormProps {
  initialDestination?: string;
  destinationsList?: string[];
}

// Module-level so every mount of this component (and every time the
// dropdown is reopened) shares the same in-flight/completed request
// instead of re-fetching. This is intentionally simple — no chunking, no
// idle-callback scheduling — because the expensive part (iterating and
// sorting ~150k raw city records) now happens once server-side in
// app/api/cities/route.ts, which is itself cached for a week. The client
// is just fetching and JSON-parsing an already-sorted array.
let majorCitiesRequest: Promise<string[]> | null = null;
let allCitiesRequest: Promise<string[]> | null = null;

function fetchCities(scope: "major" | "all"): Promise<string[]> {
  const existing = scope === "major" ? majorCitiesRequest : allCitiesRequest;
  if (existing) return existing;

  const request = fetch(`/api/cities?scope=${scope}`)
    .then((response) => {
      if (!response.ok) throw new Error(`City list request failed (${response.status})`);
      return response.json() as Promise<string[]>;
    })
    .catch((error) => {
      console.error("Failed to load city list:", error);
      return [];
    });

  if (scope === "major") {
    majorCitiesRequest = request;
  } else {
    allCitiesRequest = request;
  }

  return request;
}

const initialEnquiryState: EnquiryActionState = { ok: false, message: "" };

export function TripRequestForm({
  initialDestination = "",
  destinationsList = [],
}: TripRequestFormProps) {
  const [state, formAction, pending] = useActionState(createEnquiry, initialEnquiryState);

  const [majorCities, setMajorCities] = useState<string[] | null>(null);
  const [allCities, setAllCities] = useState<string[] | null>(null);

  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(
    initialDestination ? [initialDestination] : []
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Don't make filtering-as-you-type block keystrokes.
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Fetch the small "major cities" list the first time the dropdown opens.
  useEffect(() => {
    if (!isDropdownOpen || majorCities !== null) return;

    let cancelled = false;
    fetchCities("major").then((cities) => {
      if (!cancelled) setMajorCities(cities);
    });

    return () => {
      cancelled = true;
    };
  }, [isDropdownOpen, majorCities]);

  // Only fetch the full global list once the user actually searches —
  // it's a bigger payload, no reason to pull it down for people who never
  // type anything.
  useEffect(() => {
    if (!deferredSearchQuery.trim() || allCities !== null) return;

    let cancelled = false;
    fetchCities("all").then((cities) => {
      if (!cancelled) setAllCities(cities);
    });

    return () => {
      cancelled = true;
    };
  }, [deferredSearchQuery, allCities]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredDestinations = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    if (!query) {
      const base = majorCities ?? [];
      return Array.from(new Set([...destinationsList, ...base])).slice(0, 80);
    }

    const source = allCities ?? majorCities ?? [];
    return Array.from(new Set([...destinationsList, ...source]))
      .filter((destination) => destination.toLowerCase().includes(query))
      .slice(0, 80);
  }, [deferredSearchQuery, majorCities, allCities, destinationsList]);

  const isLoadingCities = isDropdownOpen && majorCities === null;
  const isLoadingSearch = deferredSearchQuery.trim().length > 0 && allCities === null;

  const toggleDestination = (destination: string) => {
    setSelectedDestinations((current) =>
      current.includes(destination)
        ? current.filter((item) => item !== destination)
        : [...current, destination]
    );
  };

  const removeDestination = (destination: string) => {
    setSelectedDestinations((current) => current.filter((item) => item !== destination));
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
      <form action={formAction} className="space-y-5">
        {/* Name & Email Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              required
              placeholder="Your name"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#0a1f4d] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#0a1f4d] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Phone & Destinations Multi-Select Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PhoneNumberInput name="phone" label="Phone" />

          {/* Global Multi-Select Dropdown Field */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
              Destinations (Select multiple)
            </label>

            <div
              onClick={() => setIsDropdownOpen((current) => !current)}
              className="w-full min-h-11.5 p-2 px-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer flex flex-wrap items-center gap-1.5 pr-8 relative transition-all focus-within:border-[#0a1f4d] focus-within:bg-white"
            >
              {selectedDestinations.length === 0 && (
                <span className="text-slate-400 text-sm ml-1">
                  Search Udaipur, Kyoto, Paris...
                </span>
              )}

              {selectedDestinations.map((destination) => (
                <span
                  key={destination}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#0a1f4d] text-white"
                >
                  {destination}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeDestination(destination);
                    }}
                    className="hover:text-amber-300 transition-colors ml-0.5"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}

              <ChevronDown
                size={16}
                className={`absolute right-3 top-3.5 text-slate-400 transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </div>

            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col">
                <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                  <Search size={14} className="text-slate-400 ml-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search any city or country..."
                    className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                    autoFocus
                  />
                </div>

                <div className="overflow-y-auto max-h-56 p-1">
                  {isLoadingCities ? (
                    <div className="p-4 text-xs text-slate-400 text-center">
                      Loading destinations...
                    </div>
                  ) : filteredDestinations.length === 0 ? (
                    <div className="p-4 text-xs text-slate-400 text-center">
                      No matching global cities found.
                    </div>
                  ) : (
                    <>
                      {filteredDestinations.map((destination) => {
                        const isSelected = selectedDestinations.includes(destination);
                        return (
                          <div
                            key={destination}
                            onClick={() => toggleDestination(destination)}
                            className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-slate-100 font-semibold text-[#0a1f4d]"
                                : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <MapPin size={12} className="text-slate-400" />
                              {destination}
                            </span>
                            {isSelected && <Check size={14} className="text-[#0a1f4d]" />}
                          </div>
                        );
                      })}
                      {isLoadingSearch && (
                        <div className="p-2 text-[11px] text-slate-400 text-center">
                          Searching more destinations...
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Travel Dates & Guests Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
              Travel Start
            </label>
            <input
              type="date"
              name="travelStart"
              className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-[#0a1f4d]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
              Travel End
            </label>
            <input
              type="date"
              name="travelEnd"
              className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-[#0a1f4d]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
              Adults
            </label>
            <input
              type="number"
              min={1}
              defaultValue={1}
              name="adults"
              className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#0a1f4d]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
              Children
            </label>
            <input
              type="number"
              min={0}
              defaultValue={0}
              name="children"
              className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#0a1f4d]"
            />
          </div>
        </div>

        {/* Message Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
            Tell us about the journey
          </label>
          <textarea
            name="message"
            rows={4}
            placeholder="Pace, places, interests, budget, or anything else that matters to you."
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#0a1f4d] focus:bg-white transition-all resize-none"
          />
        </div>

        {/*
         * The enquiry schema (actions/enquiry.ts) takes a single
         * `destination` string, but this UI lets someone pick several. We
         * join them into one readable string — the server does a
         * best-effort match against a single destination's slug/name, so
         * a multi-destination pick will usually fall through to a
         * CUSTOM_TRIP enquiry rather than linking to one Destination row.
         * The full text is still preserved and visible to your team either
         * way, via contactSnapshot/tripDetails and the email itself.
         */}
        <input type="hidden" name="destination" value={selectedDestinations.join(", ")} />

        {state.message && (
          <div
            className={`p-3 rounded-xl text-xs font-medium border ${
              state.ok
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {state.message}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full md:w-auto px-8 py-3.5 bg-[#0a1f4d] text-white hover:bg-[#102a6b] transition-all rounded-full font-semibold text-sm shadow-md cursor-pointer disabled:opacity-50"
        >
          {pending ? "Sending..." : "Send enquiry →"}
        </button>
      </form>
    </div>
  );
}

function AuthMessage({ state }: { state: AuthActionState | null }) {
  if (!state || !state.message) return null;
  return (
    <p
      className={
        state.ok ? "form-message form-message--success" : "form-message"
      }
      aria-live="polite"
    >
      {state.message}
    </p>
  );
}

export function AuthForms({ mode }: { mode: "signin" | "signup" }) {
  const initialState: AuthActionState = { ok: false, message: "" };

  const [loginState, loginAction, loginPending] = useActionState(
    logIn,
    initialState
  );
  const [signupState, signupAction, signupPending] = useActionState(
    signUp,
    initialState
  );

  return (
    <section className="auth-container">
      <div className="auth-card">
        {/* Integrated Segmented Tab Switcher */}
        <div className="auth-switch" role="tablist" aria-label="Profile actions">
          <Link
            role="tab"
            aria-selected={mode === "signin"}
            className={mode === "signin" ? "auth-tab is-active" : "auth-tab"}
            href="/auth/login"
          >
            Sign in
          </Link>
          <Link
            role="tab"
            aria-selected={mode === "signup"}
            className={mode === "signup" ? "auth-tab is-active" : "auth-tab"}
            href="/auth/signup"
          >
            Create account
          </Link>
        </div>

        <div className="auth-card-body">
          {mode === "signin" ? (
            <form action={loginAction} className="auth-form">
              <header className="auth-form-header">
                <span className="eyebrow">Welcome back</span>
                <h2>Sign in</h2>
              </header>

              <div className="auth-fields">
                <label className="auth-field">
                  <span>Email address</span>
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@example.com"
                  />
                </label>

                <label className="auth-field">
                  <span>Password</span>
                  <input
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                  />
                </label>
                <Link className="auth-forgot-link" href="/auth/forgot-password">
                  Forgot your password?
                </Link>
              </div>

              <button
                className="button button-primary"
                type="submit"
                disabled={loginPending}
              >
                <span>{loginPending ? "Signing in…" : "Sign in"}</span>
                <ArrowRight size={16} />
              </button>

              <AuthMessage state={loginState} />
            </form>
          ) : (
            <form action={signupAction} className="auth-form">
              <header className="auth-form-header">
                <span className="eyebrow">Start your profile</span>
                <h2>Create an account</h2>
              </header>

              <div className="auth-fields">
                <label className="auth-field">
                  <span>Full name</span>
                  <input
                    name="fullName"
                    required
                    autoComplete="name"
                    placeholder="Jane Doe"
                  />
                </label>

                <label className="auth-field">
                  <span>Email address</span>
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@example.com"
                  />
                </label>

                <label className="auth-field">
                  <span>Password</span>
                  <input
                    name="password"
                    type="password"
                    minLength={8}
                    required
                    autoComplete="new-password"
                    placeholder="Min. 8 characters"
                  />
                </label>
              </div>

              <button
                className="button button-primary"
                type="submit"
                disabled={signupPending}
              >
                <span>{signupPending ? "Creating…" : "Create account"}</span>
                <ArrowRight size={16} />
              </button>

              <AuthMessage state={signupState} />
            </form>
          )}

          {/* Styled Integrated Logout */}
          <footer className="auth-card-footer">
            <form action={logOut}>
              <button className="auth-logout-btn" type="submit">
                Log out from current session
              </button>
            </form>
          </footer>
        </div>
      </div>
    </section>
  );
}
