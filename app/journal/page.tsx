// app/journal/page.tsx
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionIntro, SiteFooter, SiteHeader } from "../components";
import { getPrisma } from "../lib/db";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const posts = await getPrisma().blogPost.findMany({
    where: {
      isPublished: true,
      archivedAt: null,
    },
    include: {
      destination: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      publishedAt: "desc",
    },
  });

  return (
    <>
      <SiteHeader />
      <main className="w-full bg-slate-50 min-h-screen">
        {/* Hero Section */}
        <section className="relative min-h-[500px] md:min-h-[600px] flex items-center justify-center px-6 pt-32 pb-20 md:pt-36 md:pb-28 text-white overflow-hidden">
          <Image
            src="/media/hero-journal.jpg"
            alt="The Travel Beats Journal Hero"
            fill
            priority
            className="object-cover object-center z-0"
            sizes="100vw"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#031838]/90 via-[#031838]/60 to-[#031838]/40 z-1" />

          <div className="relative z-2 max-w-4xl mx-auto w-full text-center">
            <span className="inline-block text-xs uppercase tracking-widest font-extrabold text-[#00A8E8] bg-[#00A8E8]/10 px-3.5 py-1.5 rounded-full border border-[#00A8E8]/20 mb-4 drop-shadow-sm">
              The Travel Beats journal
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight text-white mb-6 drop-shadow-md">
              Stories for
              <br />
              <em className="font-serif italic text-[#00A8E8]">the road.</em>
            </h1>
            <p className="max-w-xl mx-auto text-slate-200 text-base md:text-lg leading-relaxed font-medium drop-shadow-sm">
              Field notes, destination inspiration, and the small rituals that
              make travelling feel like living.
            </p>
          </div>
        </section>

        {/* Stories Grid Section */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <SectionIntro eyebrow="Latest stories" title="Go curious." />

          {posts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 mt-10">
              <p className="text-slate-500 font-medium">No published stories yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
              {posts.map((post) => {
                const categoryTag = post.tags[0] || post.destination?.name || "JOURNAL";
                
                return (
                  <article 
                    key={post.id} 
                    className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-[#00A8E8]/40 transition-all duration-300"
                  >
                    <div className="relative w-full h-52 overflow-hidden bg-slate-100">
                      <Image
                        src={post.coverImageUrl || "/media/journey-sky.jpg"}
                        alt={post.coverImageAlt || post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>

                    <div className="p-6 flex flex-col flex-1">
                      <span className="text-[11px] uppercase tracking-widest font-bold text-[#00A8E8] mb-2">
                        {categoryTag.toUpperCase()} · {post.readingMinutes} MIN READ
                      </span>
                      
                      <h3 className="text-xl font-bold text-[#031838] mb-2 leading-snug group-hover:text-[#00A8E8] transition-colors">
                        <Link href={`/journal/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h3>
                      
                      <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1 line-clamp-3">
                        {post.excerpt}
                      </p>

                      <Link
                        href={`/journal/${post.slug}`}
                        className="inline-flex items-center gap-2 text-xs font-bold text-[#031838] group-hover:text-[#00A8E8] transition-colors mt-auto"
                      >
                        Read article <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}