import { redirect } from "next/navigation";
import { CreatorInbox } from "@/components/inquiry/creator-inbox";
import { getSessionUser } from "@/lib/auth";

export const metadata = {
  title: "Brief inbox",
  description:
    "Creator inbox: accept client briefs and open WhatsApp to the client.",
};

export default async function InboxPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/inbox");
  }

  return (
    <div className="bg-grid-fade">
      <CreatorInbox />
    </div>
  );
}
