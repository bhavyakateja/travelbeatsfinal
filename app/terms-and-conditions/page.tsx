import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | The Travel Beats",
  description:
    "Review the Terms and Conditions governing bookings, cancellations, travel documents, liabilities, and services with The Travel Beats.",
  robots: { index: true, follow: true },
};

export default function TermsAndConditionsPage() {
  return (
    <main className="bg-slate-950 text-slate-300 min-h-screen py-16 px-6 lg:px-12">
      <article className="max-w-4xl mx-auto space-y-8">
        <header className="border-b border-slate-800 pb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
            Terms & Conditions
          </h1>
          <p className="text-sm text-slate-400">
            Effective Date: January 1, 2026 | Last Updated: August 2026
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">1. Agreement to Terms</h2>
          <p className="leading-relaxed">
            By accessing our website (<strong>www.thetravelbeats.com</strong>), requesting travel itineraries, or booking travel services through <strong>The Travel Beats</strong>, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">2. Booking, Payment & Confirmation</h2>
          <ul className="list-disc pl-6 space-y-2 text-slate-400">
            <li>Bookings are confirmed only upon receipt of the designated advance payment and written confirmation from The Travel Beats.</li>
            <li>All quotes are subject to price availability and rate fluctuations until final payment is processed and tickets/vouchers are issued.</li>
            <li>Full payment must be cleared prior to the commencement of travel as specified in your individual itinerary quotation.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">3. Cancellations, Refunds & Modifications</h2>
          <ul className="list-disc pl-6 space-y-2 text-slate-400">
            <li>Cancellation requests must be submitted in writing via email to <strong>munazir@thetravelbeats.com</strong>.</li>
            <li>Cancellations are subject to the specific policy terms enforced by underlying service suppliers (airlines, hotels, transport operators, and cruise lines).</li>
            <li>Service charges and processing fees assessed by The Travel Beats are non-refundable under all circumstances.</li>
            <li>Refund processing timelines depend on supplier release schedules and banking channels (typically 7–14 working days following approval).</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">4. Travel Documents & Passports</h2>
          <p className="leading-relaxed">
            It is the sole responsibility of the traveler to ensure valid passports (minimum 6 months validity from travel date), appropriate visas, health certifications, and travel insurance. The Travel Beats holds no liability for denied entry, visa rejections, or document deficiencies by immigration authorities.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">5. Travel Insurance</h2>
          <p className="leading-relaxed">
            We strongly advise all travelers to purchase comprehensive travel insurance covering trip cancellations, medical emergencies, loss of baggage, travel interruptions, and personal accident insurance prior to trip departure.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">6. Limitation of Liability & Force Majeure</h2>
          <p className="leading-relaxed">
            The Travel Beats acts as an intermediary connecting clients with third-party travel vendors. We are not liable for:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-400">
            <li>Delays, schedule changes, or cancellations caused by airlines, railways, or transport providers.</li>
            <li>Loss, injury, damage, or accidents occurring during tours, transfers, or hotel stays.</li>
            <li>Events of <em>Force Majeure</em>, including acts of God, natural disasters, wars, political instability, strikes, weather conditions, or government restrictions.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">7. Governing Law & Jurisdiction</h2>
          <p className="leading-relaxed">
            These Terms and Conditions are governed by and construed in accordance with the laws of India. Any legal disputes or claims arising hereunder shall fall under the exclusive jurisdiction of the competent courts located in <strong>Agra, Uttar Pradesh, India</strong>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">8. Contact Information</h2>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-2 text-sm text-slate-300">
            <p><strong className="text-white">The Travel Beats</strong></p>
            <p><strong className="text-white">Address:</strong> Block 23, Shop no. 7, Ground floor, Cloth Market, Opposite St. Patrick's College, Sanjay Place, Agra, Uttar Pradesh 282002, India.</p>
            <p><strong className="text-white">Email:</strong> munazir@thetravelbeats.com</p>
            <p><strong className="text-white">Phone:</strong> +91-9837916666 / +91-9837916605 / 0562 4306035</p>
          </div>
        </section>
      </article>
    </main>
  );
}