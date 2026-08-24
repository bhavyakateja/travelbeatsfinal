"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, ChevronRight, Star, X } from "lucide-react";

interface JourneyGroup {
  country: string;
  slug: string;
  packages: Array<{
    id: string;
    title: string;
    duration: string;
    summary: string;
    schedule: { day: string; details: string }[];
    rating?: string | null;
    reviewCount?: number;
  }>;
}

export function JourneyModalWrapper({ group }: { group: JourneyGroup }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full mt-3 py-2.5 px-4 bg-[#031838] hover:bg-[#0077B6] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
      >
        <span>View Route Options</span>
        <ChevronRight size={14} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in text-left">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100">
            {/* Modal Header */}
            <div className="bg-[#031838] p-5 text-white flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold leading-tight text-white">
                  {group.country} Routes
                </h2>
                <p className="text-xs text-slate-300">
                  Select an itinerary or customize your own
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 divide-y divide-slate-100">
              {group.packages.map((pkg, i) => (
                <div key={pkg.id} className={i > 0 ? "pt-4" : ""}>
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <h4 className="font-bold text-sm text-[#031838]">
                      {pkg.title}
                    </h4>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Rating Badge */}
                      {pkg.rating && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                          <Star size={10} className="fill-amber-400 text-amber-400" />
                          <span>{pkg.rating}</span>
                          {pkg.reviewCount ? (
                            <span className="text-[10px] text-amber-600/80 font-normal">
                              ({pkg.reviewCount})
                            </span>
                          ) : null}
                        </span>
                      )}

                      <span className="text-xs font-bold text-[#0077B6] bg-[#00A8E8]/10 px-2.5 py-0.5 rounded-full border border-[#00A8E8]/20">
                        <Calendar size={11} className="inline mr-1" />
                        {pkg.duration}
                      </span>
                    </div>
                  </div>

                  {pkg.summary && (
                    <p className="text-xs text-slate-500 mb-2">{pkg.summary}</p>
                  )}

                  {pkg.schedule.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {pkg.schedule.map((st, sIndex) => (
                        <span
                          key={sIndex}
                          className="inline-block bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded text-[11px] text-slate-600"
                        >
                          <strong className="text-[#031838]">{st.day}:</strong>{" "}
                          {st.details}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                All itineraries can be tailored.
              </span>
              <Link
                href={`/build-your-trip?destination=${encodeURIComponent(group.country)}`}
                className="px-4 py-2 bg-[#00A8E8] hover:bg-[#0077B6] text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <span>Customize {group.country} Trip</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}