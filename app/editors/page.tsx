import { DirectoryView } from "@/components/discover/directory-view";

export const metadata = {
  title: "Editors",
  description:
    "Mumbai video editors, colourists, and post specialists. Browse, open a profile, send a brief.",
};

export default function EditorsPage() {
  return <DirectoryView mode="edit" />;
}
