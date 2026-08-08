import { notFound } from "next/navigation";
import { CreatorProfile } from "@/components/creators/creator-profile";
import { getCreatorById, MOCK_CREATORS } from "@/lib/mock-data";
import type { ServiceMode } from "@/lib/types";

type PageProps = {
  params: { id: string };
  searchParams?: { tab?: string };
};

export function generateStaticParams() {
  return MOCK_CREATORS.map((c) => ({ id: c.id }));
}

export function generateMetadata({ params }: PageProps) {
  const creator = getCreatorById(params.id);
  if (!creator) return { title: "Creator — ROLLR" };
  return {
    title: `${creator.full_name} — ROLLR`,
    description: creator.bio ?? creator.tagline,
  };
}

export default function CreatorProfilePage({
  params,
  searchParams,
}: PageProps) {
  const creator = getCreatorById(params.id);
  if (!creator) notFound();

  const tabParam = searchParams?.tab;
  const initialTab: ServiceMode | undefined =
    tabParam === "edit" || tabParam === "shoot" ? tabParam : undefined;

  return <CreatorProfile creator={creator} initialTab={initialTab} />;
}
