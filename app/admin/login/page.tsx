"use client";

import React, { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { ArrowRight, Loader2, Lock } from "lucide-react";

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

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center p-4 sm:p-6">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur-xl md:grid-cols-[1.2fr_0.8fr]">
          <div className="relative hidden min-h-[420px] md:block">
            <Image
              src="/media/journey-sky.jpg"
              alt="Travel planning"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            <div className="relative z-10 flex h-full flex-col justify-end p-8">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-400">
                Private Access
              </span>
              <h1 className="mt-2 text-3xl font-bold leading-tight text-white lg:text-4xl">
                Travel Beats Admin
              </h1>
              <p className="mt-2 max-w-sm text-sm text-slate-300">
                Manage destinations, journeys, journal stories, enquiries, users, and review submissions.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between p-8 md:p-10">
            <div>
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
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <SubmitButton />
              </form>
            </div>

            <div className="mt-8 flex items-center gap-2 border-t border-white/5 pt-4 text-xs text-slate-500">
              <Lock className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
              <span>Restricted URL. Unauthorized access attempts are monitored.</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}