import Image from "next/image";
import { SiteFooter, SiteHeader, TripRequestForm } from "../components";
import { getDestinations, getJourneys } from "../lib/content";

export const revalidate = 300;

export default async function BuildYourTrip({
  searchParams,
}: {
  searchParams: Promise<{ destination?: string; journey?: string }>;
}) {
  const [params, destinations, journeys] = await Promise.all([
    searchParams,
    getDestinations(),
    getJourneys(),
  ]);

  const selectedDest = destinations.find(
    (d) => d.id === params.destination || d.slug === params.destination
  );
  const selectedJourney = journeys.find(
    (j) => j.id === params.journey || j.slug === params.journey
  );

  const initialDestination = selectedDest?.name || selectedJourney?.title || "";

  const steps = [
    {
      step: "Step 1",
      title: "Tell us what you’re looking for",
      desc: "Destination, dates, budget, interests. Tell us how you want your trip to feel.",
    },
    {
      step: "Step 2",
      title: "We build your itinerary",
      desc: "Our travel experts create an itinerary around your preferences, pace and priorities.",
    },
    {
      step: "Step 3",
      title: "Make it yours",
      desc: "Want more time to explore? Have something specific in mind? We’ll tailor the itinerary with you.",
    },
    {
      step: "Step 4",
      title: "Pack your bags",
      desc: "Everything is taken care of. Now all that’s left is to pack your bags and get ready for a story worth telling.",
    },
  ];

  return (
    <>
      <SiteHeader />
      <main className="w-full bg-slate-50 min-h-screen">
        {/* Hero Section */}
        <section className="relative min-h-[600px] md:min-h-[750px] flex items-center justify-center px-6 pt-32 pb-20 md:pt-36 md:pb-28 text-white overflow-hidden">
          {/* Background Image */}
          <Image
            src="/media/make-trip-hero.png"
            alt="Build your trip hero"
            fill
            priority
            className="object-cover object-center z-0"
            sizes="100vw"
          />

          {/* Dark Overlay Gradient for maximum contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#031838]/90 via-[#031838]/50 to-transparent z-1" />

          {/* Hero Content */}
          <div className="relative z-2 max-w-5xl mx-auto w-full text-center md:text-left">
            <span className="inline-block text-xs uppercase tracking-widest font-extrabold text-[#00A8E8] bg-[#00A8E8]/10 px-3 py-1 rounded-full border border-[#00A8E8]/20 mb-4">
              Build your trip
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight text-white mb-5 drop-shadow-md">
              Travel isn’t about packages 
              <br />
              <em className="font-serif italic text-[#00A8E8]">— it’s about creating your own adventure.</em>
            </h1>
            <p className="max-w-xl text-slate-200 text-base md:text-lg leading-relaxed font-medium drop-shadow-sm">
              Sometimes the right package opens doors to new horizons.
              But the real adventure begins when you choose your own path.
            </p>
          </div>
        </section>

        {/* Form Body Section */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left Column: 4 Steps */}
            <div className="lg:col-span-5 space-y-8">
              <div>
                <span className="text-xs uppercase tracking-widest font-bold text-[#00A8E8] block mb-2">
                  How it works
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-[#031838] tracking-tight leading-snug">
                  Build your trip with us in just 4 easy steps.
                </h2>
              </div>

              <div className="space-y-6">
                {steps.map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#00A8E8]/10 text-[#0077B6] border border-[#00A8E8]/20 text-sm font-bold mt-0.5">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-[#031838] mb-1">
                        {item.title}
                      </h3>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Form */}
            <div className="lg:col-span-7">
              <TripRequestForm
                initialDestination={initialDestination}
                destinationsList={destinations.map((d) => d.name)}
              />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}