import { redirect } from "next/navigation";
import { CalendarDays, UserCircle2 } from "lucide-react";
import { SiteFooter, SiteHeader } from "../components";
import { getCurrentUser } from "../lib/auth";
import { getPrisma } from "../lib/db";
import { ProfileDetails } from "./ProfileDetails";

export const revalidate = 0;

function displayDate(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(value)
    : "Flexible";
}

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const enquiries = await getPrisma().enquiry.findMany({
    where: { userId: user.id, archivedAt: null },
    include: {
      destination: { select: { name: true } },
      package: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <SiteHeader />
      <main>
        <section className="profile-hero">
          <div>
            <span className="eyebrow">Your profile</span>
            <h1>{user.fullName}</h1>
            <p>Everything you have shared with Travel Beats, in one place.</p>
          </div>
          <UserCircle2 aria-hidden="true" size={72} />
        </section>

        <section className="profile-content section-pad">
          {/* Client-side Editable Details Component */}
          <ProfileDetails user={user} />

          <div className="profile-enquiries">
            <div className="profile-section-heading">
              <div>
                <span className="eyebrow">Travel requests</span>
                <h2>Past enquiries</h2>
              </div>
              <span>{enquiries.length} total</span>
            </div>

            {enquiries.length ? (
              <div className="enquiry-list">
                {enquiries.map((enquiry) => {
                  const place =
                    enquiry.destination?.name ||
                    enquiry.package?.title ||
                    "Custom journey";
                  return (
                    <article className="enquiry-card" key={enquiry.id}>
                      <div>
                        <span className="enquiry-reference">{enquiry.reference}</span>
                        <h3>{place}</h3>
                        <p>{enquiry.message || "No additional notes were added."}</p>
                      </div>
                      <dl>
                        <div><dt><CalendarDays size={15} /> Sent</dt><dd>{displayDate(enquiry.createdAt)}</dd></div>
                        <div><dt>Travel dates</dt><dd>{displayDate(enquiry.travelStart)} – {displayDate(enquiry.travelEnd)}</dd></div>
                        <div><dt>Status</dt><dd className="enquiry-status">{enquiry.status.replaceAll("_", " ")}</dd></div>
                      </dl>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="profile-empty">
                <CalendarDays size={22} />
                <h3>No travel enquiries yet.</h3>
                <p>When you send a trip request, it will appear here.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}