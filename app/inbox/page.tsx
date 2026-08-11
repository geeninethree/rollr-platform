import { CreatorInbox } from "@/components/inquiry/creator-inbox";

export const metadata = {
  title: "Brief inbox",
  description:
    "Creator inbox: accept client briefs and open WhatsApp to the client.",
};

export default function InboxPage() {
  return (
    <div className="bg-grid-fade">
      <CreatorInbox />
    </div>
  );
}
