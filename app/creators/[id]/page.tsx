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

  // Directory only lists published; direct URL allows admin preview of pending.
  const tabParam = searchParams?.tab;
  const initialTab: ServiceMode | undefined =
    tabParam === "edit" || tabParam === "shoot" ? tabParam : undefined;

  return (
    <>
      {creator.listing_status !== "published" && (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-100">
          Preview only — listing status:{" "}
          <strong>{creator.listing_status}</strong>. Not shown in the public
          directory until published.
        </div>
      )}
      <CreatorProfile creator={creator} initialTab={initialTab} />
    </>
  );
}
