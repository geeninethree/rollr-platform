import { notFound } from "next/navigation";
import { CreatorProfile } from "@/components/creators/creator-profile";
import { fetchCreatorById } from "@/lib/directory";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ServiceMode } from "@/lib/types";

type PageProps = {
  params: { id: string };
  searchParams?: { tab?: string };
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { title: "Creator — ROLLR" };
  const { creator } = await fetchCreatorById(supabase, params.id);
  if (!creator) return { title: "Creator — ROLLR" };
  return {
    title: `${creator.full_name} — ROLLR`,
    description: creator.bio ?? creator.tagline,
  };
}

export default async function CreatorProfilePage({
  params,
  searchParams,
}: PageProps) {
  const supabase = getSupabaseServerClient();
  if (!supabase) notFound();

  const { creator } = await fetchCreatorById(supabase, params.id);
  if (!creator) notFound();

  // Only show published (or allow draft owner later)
  if (creator.listing_status !== "published") {
    notFound();
  }

  const tabParam = searchParams?.tab;
  const initialTab: ServiceMode | undefined =
    tabParam === "edit" || tabParam === "shoot" ? tabParam : undefined;

  return <CreatorProfile creator={creator} initialTab={initialTab} />;
}
