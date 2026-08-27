import { SiteFooter, SiteHeader } from "../../components";
import { ResetPasswordForm } from "../password-forms";

export const metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <><SiteHeader /><main className="auth-page-main"><section className="auth-container"><div className="auth-card"><div className="auth-card-body"><ResetPasswordForm token={token} /></div></div></section></main><SiteFooter /></>;
}
