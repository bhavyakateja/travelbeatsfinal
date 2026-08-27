"use client";

import React, { useState, useActionState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { ArrowRight, Eye, EyeOff, Loader2, Lock } from "lucide-react";

import { adminLogIn } from "@/app/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Authenticating...</span>
        </>
      ) : (
        <>
          <span>Access dashboard</span>
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </button>
  );
}

export default function AdminLoginPage() {
  const [state, formAction] = useActionState(adminLogIn, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center p-4 sm:p-6">
        {/* Header content originally overlaying the image */}
        <div className="mb-6 w-full text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-400">
            Private Access
          </span>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-white lg:text-4xl">
            Travel Beats Admin
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">
            Manage destinations, journeys, journal stories, enquiries, users, and review submissions.
          </p>
        </div>

        {/* Centered Admin Card */}
        <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl md:p-10">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-sky-400">
                Secure Sign In
              </p>
              <h2 className="mt-1 text-2xl font-bold text-white">Admin Login</h2>
            </div>
            <Link
              href="/"
              className="rounded-lg px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              Back to site
            </Link>
          </div>

          {state && !state.ok && (
            <div className="mb-5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-300">
              {state.message}
            </div>
          )}

          <form action={formAction} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-xs font-medium text-slate-300">
                Admin email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@travelbeats.com"
                className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-xs font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 pr-11 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <SubmitButton />
          </form>

          <div className="mt-8 flex items-center justify-center gap-2 border-t border-white/5 pt-4 text-xs text-slate-500">
            <Lock className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
            <span>Restricted URL. Unauthorized access attempts are monitored.</span>
          </div>
        </div>
      </div>
    </main>
  );
}