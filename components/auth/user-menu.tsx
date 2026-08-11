"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, ChevronDown, LogOut, User } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  email: string;
  fullName: string;
  role: string;
};

export function UserMenu({ email, fullName, role }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const initial = (fullName || email || "?").charAt(0).toUpperCase();

  const primaryHref =
    role === "creator"
      ? "/studio"
      : role === "recruiter"
        ? "/job-board"
        : "/job-board";
  const primaryLabel =
    role === "creator"
      ? "My portfolio"
      : role === "recruiter"
        ? "My jobs"
        : "Job board";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex max-w-[10rem] items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1.5 text-sm transition-colors hover:bg-secondary pressable"
        )}
        aria-expanded={open}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-[11px] font-semibold text-primary">
          {initial}
        </span>
        <span className="hidden truncate sm:inline">{fullName.split(" ")[0]}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-xl shadow-black/40 animate-rise">
          <div className="border-b border-border px-3 py-2">
            <p className="truncate text-sm font-medium">{fullName}</p>
            <p className="truncate text-[11px] text-muted-foreground">{email}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-primary">
              {role}
            </p>
          </div>
          <Link
            href={primaryHref}
            className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-secondary"
            onClick={() => setOpen(false)}
          >
            {role === "creator" ? (
              <User className="h-3.5 w-3.5" />
            ) : (
              <Briefcase className="h-3.5 w-3.5" />
            )}
            {primaryLabel}
          </Link>
          {role === "creator" && (
            <Link
              href="/job-board"
              className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-secondary"
              onClick={() => setOpen(false)}
            >
              <Briefcase className="h-3.5 w-3.5" />
              Job board (pitch)
            </Link>
          )}
          {(role === "client" || role === "recruiter") && (
            <Link
              href="/signup?role=creator&next=/studio"
              className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-secondary"
              onClick={() => setOpen(false)}
            >
              <User className="h-3.5 w-3.5" />
              List as creator
            </Link>
          )}
          {(role === "client" || role === "creator") && (
            <Link
              href="/signup?role=recruiter&next=/job-board"
              className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-secondary"
              onClick={() => setOpen(false)}
            >
              <Briefcase className="h-3.5 w-3.5" />
              Multi-job waitlist (₹399)
            </Link>
          )}
          {role === "recruiter" && (
            <Link
              href="/job-board#recruiter"
              className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-secondary"
              onClick={() => setOpen(false)}
            >
              <Briefcase className="h-3.5 w-3.5" />
              Recruiter plan status
            </Link>
          )}
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
