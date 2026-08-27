"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useActionState } from "react";
import { requestPasswordReset, resetPassword, type AuthActionState } from "../actions/auth";

function Message({ state }: { state: AuthActionState }) {
  if (!state?.message) return null;
  return (
    <p className={state.ok ? "form-message form-message--success" : "form-message"} aria-live="polite">
      {state.message}
    </p>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, null);
  return (
    <section className="auth-container">
      <div className="auth-card auth-card--medium">
        <div className="auth-card-body">
          <form action={action} className="auth-form">
            <header className="auth-form-header">
              <span className="eyebrow">Account recovery</span>
              <h2>Reset your password</h2>
            </header>
            <p className="auth-help-text">
              Enter your email and we’ll send a secure reset link if it is linked to an account.
            </p>
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
            </div>
            <button className="button button-primary" type="submit" disabled={pending}>
              <span>{pending ? "Sending…" : "Send reset link"}</span>
              <ArrowRight size={16} />
            </button>
            <Message state={state} />
            <Link className="auth-forgot-link" href="/auth/login">
              Back to sign in
            </Link>
          </form>
        </div>
      </div>
    </section>
  );
}

export function ResetPasswordForm({ token }: { token: string | undefined }) {
  const [state, action, pending] = useActionState(resetPassword, null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!token) {
    return (
      <section className="auth-container">
        <div className="auth-card auth-card--medium">
          <div className="auth-card-body">
            <div className="auth-form">
              <header className="auth-form-header">
                <span className="eyebrow">Account recovery</span>
                <h2>Invalid reset link</h2>
              </header>
              <p className="auth-help-text">
                This link is incomplete. Request a new password reset email.
              </p>
              <Link className="auth-forgot-link" href="/auth/forgot-password">
                Request a reset link
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-container">
      <div className="auth-card auth-card--medium">
        <div className="auth-card-body">
          <form action={action} className="auth-form">
            <input type="hidden" name="token" value={token} />
            <header className="auth-form-header">
              <span className="eyebrow">Account recovery</span>
              <h2>Choose a new password</h2>
            </header>
            <div className="auth-fields">
              <label className="auth-field">
                <span>New password</span>
                <div className="password-input-wrapper" style={{ position: "relative", width: "100%" }}>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    minLength={8}
                    required
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    style={{ width: "100%", paddingRight: "2.5rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      padding: 0,
                      color: "#6b7280",
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <label className="auth-field">
                <span>Confirm new password</span>
                <div className="password-input-wrapper" style={{ position: "relative", width: "100%" }}>
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    minLength={8}
                    required
                    autoComplete="new-password"
                    placeholder="Repeat new password"
                    style={{ width: "100%", paddingRight: "2.5rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      padding: 0,
                      color: "#6b7280",
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
            </div>
            <button className="button button-primary" type="submit" disabled={pending}>
              <span>{pending ? "Updating…" : "Reset password"}</span>
              <ArrowRight size={16} />
            </button>
            <Message state={state} />
          </form>
        </div>
      </div>
    </section>
  );
}