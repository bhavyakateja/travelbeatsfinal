import Image from "next/image";
import { AuthForms, SiteFooter, SiteHeader } from "../../components";

export default function Login() {
  return (
    <>
      <SiteHeader />
      <main className="auth-page-main">
        <section className="page-hero page-hero--auth">
          {/* Hero Background Layer */}
          <div className="page-hero-bg">
            <Image
              src="/media/hero-auth.png"
              alt="Coastal travel background"
              fill
              priority
              sizes="100vw"
            />
            {/* Subtle Gradient for readability without hiding image detail */}
            <div className="page-hero-overlay" aria-hidden="true" />
          </div>

          {/* Hero Content */}
          <div className="page-hero-inner">
            <span className="eyebrow">Your profile</span>
            <h1>
              One account,
              <br />
              <em>every saved plan.</em>
            </h1>
            <p>Sign in to manage your saved journeys and wishlist.</p>
          </div>
        </section>

        <AuthForms mode="signin" />
      </main>
      <SiteFooter />
    </>
  );
}