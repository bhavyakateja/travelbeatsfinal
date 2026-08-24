import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | The Travel Beats",
  description:
    "Read the Privacy Policy of The Travel Beats to understand how we collect, use, protect, and handle your personal data in compliance with privacy laws.",
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="bg-slate-950 text-slate-300 min-h-screen py-16 px-6 lg:px-12">
      <article className="max-w-4xl mx-auto space-y-8">
        <header className="border-b border-slate-800 pb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-400">
            Effective Date: January 1, 2026 | Last Updated: August 2026
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">1. Introduction</h2>
          <p className="leading-relaxed">
            Welcome to <strong>The Travel Beats</strong> ("we," "our," "us"). We are committed to safeguarding the personal privacy of our clients, visitors, and users. This Privacy Policy outlines our data processing practices in accordance with the <strong>Information Technology Act, 2000</strong>, the <strong>IT (Reasonable Security Practices) Rules, 2011</strong>, and the <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong> of India, as well as applicable global standards (such as GDPR) for international travelers.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">2. Information We Collect</h2>
          <p className="leading-relaxed">
            To deliver personalized itinerary planning, travel bookings, and seamless travel logistics, we collect the following categories of information:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-400">
            <li>
              <strong className="text-slate-200">Personal Identification:</strong> Full name, date of birth, gender, nationality, passport details, visa details, and identification numbers required for domestic and international travel bookings.
            </li>
            <li>
              <strong className="text-slate-200">Contact Details:</strong> Email address, phone number, physical postal address, and WhatsApp contact handles.
            </li>
            <li>
              <strong className="text-slate-200">Financial Data:</strong> Billing addresses, payment modes, and transaction references processed securely via RBI-compliant third-party payment gateways.
            </li>
            <li>
              <strong className="text-slate-200">Travel Preferences & Logistics:</strong> Flight/train details, dietary preferences, accommodation preferences, medical disclosures (when voluntarily provided for emergency assistance), and special accommodation requests.
            </li>
            <li>
              <strong className="text-slate-200">Technical Data:</strong> IP addresses, browser types, device information, and interaction metrics gathered through cookies to optimize user experience.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">3. How We Use Your Information</h2>
          <p className="leading-relaxed">We use your personal data strictly for lawful and legitimate purposes, including:</p>
          <ul className="list-disc pl-6 space-y-2 text-slate-400">
            <li>Designing, processing, and finalizing custom travel itineraries and bookings.</li>
            <li>Communicating booking confirmations, updates, vouchers, and itinerary changes.</li>
            <li>Facilitating flight, hotel, transport, tour, and visa processing services with third-party vendors.</li>
            <li>Providing 24/7 customer support and emergency travel assistance.</li>
            <li>Complying with statutory, regulatory, tax, and law enforcement obligations under Indian law.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">4. Data Sharing & Third-Party Vendors</h2>
          <p className="leading-relaxed">
            We do not sell, rent, or trade your personal data. However, to complete travel arrangements, we share necessary details with trusted third parties:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-400">
            <li>Airlines, hotels, ground transport operators, tour guides, and cruise lines involved in your itinerary.</li>
            <li>Government entities, consular authorities, and visa processing centers.</li>
            <li>Payment gateways, banking institutions, and insurance providers.</li>
            <li>Legal and law enforcement authorities when mandated by court orders or Indian law.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">5. Data Protection & Security</h2>
          <p className="leading-relaxed">
            We implement industry-standard administrative, physical, and technical security measures (including SSL encryption and secure server access controls) to protect your personal data against unauthorized access, disclosure, alteration, or destruction.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">6. Your Data Rights</h2>
          <p className="leading-relaxed">Under applicable data protection laws, you possess the following rights regarding your data:</p>
          <ul className="list-disc pl-6 space-y-2 text-slate-400">
            <li><strong>Right to Access:</strong> Request a copy of the personal data we hold about you.</li>
            <li><strong>Right to Correction:</strong> Request updates or corrections to inaccurate personal records.</li>
            <li><strong>Right to Erasure:</strong> Request the deletion of personal data when no longer legally required.</li>
            <li><strong>Withdrawal of Consent:</strong> Withdraw consent for marketing or non-essential communications at any time.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">7. Grievance Officer & Contact Information</h2>
          <p className="leading-relaxed">
            In compliance with the Information Technology Act 2000 and the DPDP Act 2023, the details of our Grievance Officer are provided below:
          </p>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-2 text-sm text-slate-300">
            <p><strong className="text-white">Grievance Officer:</strong> Munazir</p>
            <p><strong className="text-white">Company Name:</strong> The Travel Beats</p>
            <p><strong className="text-white">Address:</strong> Block 23, Shop no. 7, Ground floor, Cloth Market, Opposite St. Patrick's College, Sanjay Place, Agra, Uttar Pradesh 282002, India.</p>
            <p><strong className="text-white">Email:</strong> munazir@thetravelbeats.com</p>
            <p><strong className="text-white">Phone:</strong> +91-9837916666 / +91-9837916605</p>
          </div>
        </section>
      </article>
    </main>
  );
}