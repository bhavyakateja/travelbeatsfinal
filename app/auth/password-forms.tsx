"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useActionState } from "react";
import { requestPasswordReset, resetPassword, type AuthActionState } from "../actions/auth";

function Message({ state }: { state: AuthActionState }) {
  if (!state?.message) return null;
  return <p className={state.ok ? "form-message form-message--success" : "form-message"} aria-live="polite">{state.message}</p>;
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, null);
  return (
    <form action={action} className="auth-form">
      <header className="auth-form-header"><span className="eyebrow">Account recovery</span><h2>Reset your password</h2></header>
      <p className="auth-help-text">Enter your email and we’ll send a secure reset link if it is linked to an account.</p>
      <div className="auth-fields"><label className="auth-field"><span>Email address</span><input name="email" type="email" required autoComplete="email" placeholder="name@example.com" /></label></div>
      <button className="button button-primary" type="submit" disabled={pending}><span>{pending ? "Sending…" : "Send reset link"}</span><ArrowRight size={16} /></button>
      <Message state={state} />
      <Link className="auth-forgot-link" href="/auth/login">Back to sign in</Link>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string | undefined }) {
  const [state, action, pending] = useActionState(resetPassword, null);
  if (!token) {
    return <div className="auth-form"><header className="auth-form-header"><span className="eyebrow">Account recovery</span><h2>Invalid reset link</h2></header><p className="auth-help-text">This link is incomplete. Request a new password reset email.</p><Link className="auth-forgot-link" href="/auth/forgot-password">Request a reset link</Link></div>;
  }
  return (
    <form action={action} className="auth-form">
      <input type="hidden" name="token" value={token} />
      <header className="auth-form-header"><span className="eyebrow">Account recovery</span><h2>Choose a new password</h2></header>
      <div className="auth-fields">
        <label className="auth-field"><span>New password</span><input name="password" type="password" minLength={8} required autoComplete="new-password" placeholder="At least 8 characters" /></label>
        <label className="auth-field"><span>Confirm new password</span><input name="confirmPassword" type="password" minLength={8} required autoComplete="new-password" placeholder="Repeat new password" /></label>
      </div>
      <button className="button button-primary" type="submit" disabled={pending}><span>{pending ? "Updating…" : "Reset password"}</span><ArrowRight size={16} /></button>
      <Message state={state} />
    </form>
  );
}
