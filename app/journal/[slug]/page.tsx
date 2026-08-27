// app/journal/[slug]/page.tsx
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Calendar, Sparkles, MapPin } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SiteFooter, SiteHeader } from "../../components";
import { getPrisma } from "../../lib/db";

export const dynamic = "force-dynamic";

interface JournalArticleProps {
  params: Promise<{ slug: string }>;
}

export default async function JournalArticlePage({ params }: JournalArticleProps) {
  const { slug } = await params;

  const post = await getPrisma().blogPost.findUnique({
    where: {
      slug,
    },
    include: {
      destination: {
        select: {
          name: true,
          slug: true,
        },
      },
      recommendedPackages: {
        where: {
          isPublished: true,
          archivedAt: null,
        },
        take: 2,
        select: {
          id: true,
          title: true,
          summary: true,
          durationDays: true,
          durationNights: true,
          heroImageUrl: true,
        },
      },
    },
  });

  if (!post || !post.isPublished || post.archivedAt) {
    notFound();
  }

  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Recently Published";

  return (
    <>
      <SiteHeader />
      <main className="w-full bg-slate-50 min-h-screen">
        {/* Article Hero */}
        <header className="relative pt-32 pb-16 md:pt-40 md:pb-24 bg-[#031838] text-white px-6 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00A8E8]/15 via-[#031838] to-[#031838] pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto">
            <Link
              href="/journal"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#00A8E8] hover:text-white transition-colors mb-8"
            >
              <ArrowLeft size={14} />
              Back to Journal
            </Link>

            <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest text-[#00A8E8] mb-4">
              {post.destination?.name && (
                <span className="flex items-center gap-1 bg-[#00A8E8]/10 border border-[#00A8E8]/20 px-3 py-1 rounded-full">
                  <MapPin size={12} />
                  {post.destination.name}
                </span>
              )}
              {post.tags.map((tag) => (
                <span key={tag} className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-slate-300">
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-slate-300 text-base md:text-xl leading-relaxed max-w-3xl mb-8 font-medium">
                {post.excerpt}
              </p>
            )}

            {/* Metadata Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <span className="font-bold text-white">{post.authorName}</span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  {formattedDate}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} />
                  {post.readingMinutes} min read
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Featured Cover Image */}
        {post.coverImageUrl && (
          <div className="max-w-5xl mx-auto px-6 -mt-8 md:-mt-12 relative z-20">
            <div className="relative h-72 md:h-[480px] w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900">
              <Image
                src={post.coverImageUrl}
                alt={post.coverImageAlt || post.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1200px) 100vw, 1200px"
              />
            </div>
          </div>
        )}

        {/* Article Body Container */}
        <section className="max-w-4xl mx-auto px-6 py-12 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Main Content Area */}
            <div className="lg:col-span-12 space-y-8">
              <article className="prose prose-slate prose-lg max-w-none prose-headings:text-[#031838] prose-headings:font-bold prose-headings:mt-8 prose-headings:mb-4 prose-p:text-slate-700 prose-p:leading-relaxed prose-li:text-slate-700 prose-strong:text-slate-900 prose-a:text-[#00A8E8] hover:prose-a:underline prose-blockquote:border-l-[#00A8E8] prose-blockquote:text-[#031838] prose-blockquote:font-serif prose-blockquote:italic">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {post.body}
                </ReactMarkdown>
              </article>

              {/* Recommended Packages Callout */}
              {post.recommendedPackages.length > 0 && (
                <div className="mt-16 bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-md">
                  <div className="flex items-center gap-2 text-[#00A8E8] font-bold text-xs uppercase tracking-widest mb-2">
                    <Sparkles size={14} />
                    <span>Inspirations from this story</span>
                  </div>
                  <h3 className="text-2xl font-bold text-[#031838] mb-6">
                    Curated Journeys Mentioned
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {post.recommendedPackages.map((pkg) => (
                      <div key={pkg.id} className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200 flex flex-col justify-between">
                        {pkg.heroImageUrl && (
                          <div className="relative h-36 w-full">
                            <Image src={pkg.heroImageUrl} alt={pkg.title} fill className="object-cover" />
                          </div>
                        )}
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <h4 className="font-bold text-[#031838] text-base">{pkg.title}</h4>
                              <span className="text-[10px] font-mono font-bold text-[#0077B6] bg-[#00A8E8]/10 px-2 py-0.5 rounded">
                                {pkg.durationNights}N/{pkg.durationDays}D
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2">{pkg.summary}</p>
                          </div>
                          <Link
                            href="/journeys"
                            className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#00A8E8] hover:underline"
                          >
                            Explore Package <ArrowLeft size={12} className="rotate-180" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom CTA Banner */}
              <div className="mt-12 bg-[#031838] rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    Ready to craft your own narrative?
                  </h3>
                  <p className="text-xs text-slate-300">
                    Let our travel experts design a personalized route tailored to your exact pacing.
                  </p>
                </div>
                <Link
                  href="/build-your-trip"
                  className="px-6 py-3 bg-[#00A8E8] hover:bg-[#0077B6] text-white font-bold text-xs rounded-xl transition-colors shrink-0 shadow-md"
                >
                  Build Your Trip
                </Link>
              </div>
            </div>

          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}