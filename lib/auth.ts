import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

export type AuthProfile = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url: string | null;
};

export async function getSessionUser() {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function getAuthProfile(): Promise<AuthProfile | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    return profile as AuthProfile;
  }

  // Trigger may lag; fall back to auth metadata
  return {
    id: user.id,
    full_name:
      (user.user_metadata?.full_name as string) ||
      user.email?.split("@")[0] ||
      "User",
    email: user.email || "",
    role: (user.user_metadata?.role as UserRole) || "client",
    avatar_url: (user.user_metadata?.avatar_url as string) || null,
  };
}
