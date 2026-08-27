import { SiteFooter, SiteHeader } from "../../components";
import { ForgotPasswordForm } from "../password-forms";

export const metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return <><SiteHeader /><main className="auth-page-main"><section className="auth-container"><div className="auth-card"><div className="auth-card-body"><ForgotPasswordForm /></div></div></section></main><SiteFooter /></>;
}
