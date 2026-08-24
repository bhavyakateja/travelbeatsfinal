import { SiteFooter, SiteHeader } from "../components";

export default function About() {
  return (
    <>
      <SiteHeader />
      <main className="w-full bg-slate-50 min-h-screen">
        {/* Animated Hero Section */}
        <section className="relative min-h-[450px] md:min-h-[550px] flex items-center justify-center px-6 pt-32 pb-20 md:pt-36 md:pb-28 text-white overflow-hidden bg-[#031838]">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#00A8E8]/15 via-transparent to-transparent pointer-events-none" />

          {/* Hero Content */}
          <div className="relative z-10 max-w-4xl mx-auto w-full text-center">
            <span className="inline-block text-xs uppercase tracking-widest font-extrabold text-[#00A8E8] bg-[#00A8E8]/10 px-3.5 py-1.5 rounded-full border border-[#00A8E8]/20 mb-6 animate-fade-in">
              The Travel Beats
            </span>

            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight text-white mb-6 animate-fade-in-up">
              Travel,{" "}
              <span className="text-[#00A8E8] bg-clip-text text-transparent bg-gradient-to-r from-[#00A8E8] to-[#0077B6] inline-block animate-pulse">
                thoughtfully.
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-slate-300 text-lg md:text-xl leading-relaxed font-medium animate-fade-in-up [animation-delay:200ms]">
              We believe the best journeys feel effortless because the thinking behind them is anything but.
            </p>
          </div>
        </section>

        {/* Story & Content Section */}
        <section className="max-w-4xl mx-auto px-6 py-20">
          <div className="space-y-8">
            <blockquote className="text-2xl md:text-3xl font-serif italic text-[#031838] leading-snug border-l-4 border-[#00A8E8] pl-6 py-2">
              “When a journey is planned around you, it becomes more than a trip — it becomes a story worth telling.”
            </blockquote>

            <div className="space-y-6 text-slate-600 text-base md:text-lg leading-relaxed">
              <p className="font-bold text-[#031838] text-lg md:text-xl">
                Because the perfect journey looks different to everyone.
              </p>
              <p>
                At <strong className="text-[#031838] font-bold">The Travel Beats</strong>, our travel experts thoughtfully take the time to understand your pace, your preferences, your interests and your idea of a perfect holiday to curate each journey, bringing together the right destinations, stays and experiences to create an itinerary that lets you travel on your own beat.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}