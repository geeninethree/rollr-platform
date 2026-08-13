"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { ChevronDown, Menu, X } from "lucide-react";
import { UserMenu } from "@/components/auth/user-menu";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { fetchMyInquiries, INQUIRIES_CHANGED } from "@/lib/inquiries";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const publicLinks = [
  { href: "/", label: "Photographers", match: (p: string) => p === "/" },
  {
    href: "/editors",
    label: "Editors",
    match: (p: string) => p.startsWith("/editors"),
  },
  {
    href: "/job-board",
    label: "Job Board",
    match: (p: string) => p.startsWith("/job-board"),
  },
];

const creatorLinks = [
  { href: "/list", label: "List free (alpha)", desc: "Pricing · ₹299/mo later" },
  { href: "/studio", label: "Portfolio", desc: "Build your listing" },
  { href: "/inbox", label: "Inbox", desc: "Client briefs" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [creatorsOpen, setCreatorsOpen] = useState(false);
  const [pending, setPending] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [profileName, setProfileName] = useState<string>("");
  const [profileRole, setProfileRole] = useState<string>("client");
  const creatorsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let cancelled = false;

    async function loadPending(userId: string) {
      const result = await fetchMyInquiries(supabase!, userId);
      if (cancelled) return;
      const n = result.items.filter((i) => i.status === "pending").length;
      setPending(n);
    }

    async function loadUser(u: User | null) {
      if (cancelled) return;
      setUser(u);
      if (!u) {
        setProfileName("");
        setProfileRole("client");
        setPending(0);
        return;
      }

      setProfileName(
        (u.user_metadata?.full_name as string) ||
          u.email?.split("@")[0] ||
          "User"
      );
      setProfileRole((u.user_metadata?.role as string) || "client");

      const { data } = await supabase!
        .from("profiles")
        .select("full_name, role")
        .eq("id", u.id)
        .maybeSingle();

      if (!cancelled && data) {
        if (data.full_name) setProfileName(data.full_name);
        if (data.role) setProfileRole(data.role);
      }

      void loadPending(u.id);
    }

    supabase.auth.getUser().then(({ data }) => {
      void loadUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadUser(session?.user ?? null);
    });

    const onInquiries = () => {
      void supabase.auth.getUser().then(({ data }) => {
        if (data.user) void loadPending(data.user.id);
      });
    };
    window.addEventListener(INQUIRIES_CHANGED, onInquiries);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener(INQUIRIES_CHANGED, onInquiries);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
    setCreatorsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!creatorsOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (
        creatorsRef.current &&
        !creatorsRef.current.contains(e.target as Node)
      ) {
        setCreatorsOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [creatorsOpen]);

  const onList = pathname.startsWith("/list");
  const creatorsActive =
    pathname.startsWith("/list") ||
    pathname.startsWith("/studio") ||
    pathname.startsWith("/inbox");
  const hideAuthChrome =
    pathname.startsWith("/login") || pathname.startsWith("/signup");

  return (
    <header className="sticky top-0 z-50 pt-3 sm:pt-4">
      <div className="page-shell">
      <div className="chrome-float flex h-12 w-full items-center justify-between gap-2 rounded-full px-2.5 sm:h-14 sm:gap-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Logo size="sm" />

          <nav
            className="hidden items-center gap-0.5 md:flex"
            aria-label="Main"
          >
            {publicLinks.map((link) => {
              const active = link.match(pathname);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[13px] font-medium whitespace-nowrap pressable transition-product",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-white/50 hover:bg-white/[0.06] hover:text-white"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="relative" ref={creatorsRef}>
              <button
                type="button"
                onClick={() => setCreatorsOpen((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-medium pressable transition-product",
                  creatorsActive || creatorsOpen
                    ? "bg-white/[0.08] text-white"
                    : "text-white/50 hover:bg-white/[0.06] hover:text-white"
                )}
                aria-expanded={creatorsOpen}
                aria-haspopup="menu"
              >
                For creators
                {pending > 0 && (
                  <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                    {pending}
                  </span>
                )}
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 opacity-70 transition-transform",
                    creatorsOpen && "rotate-180"
                  )}
                />
              </button>
              {creatorsOpen && (
                <div
                  role="menu"
                  className="absolute left-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121214]/95 py-1 shadow-2xl shadow-black/50 backdrop-blur-xl animate-rise"
                >
                  {creatorLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      className={cn(
                        "flex flex-col px-3 py-2.5 transition-colors hover:bg-secondary",
                        pathname.startsWith(item.href) && "bg-secondary/80"
                      )}
                      onClick={() => setCreatorsOpen(false)}
                    >
                      <span className="text-sm font-medium text-foreground">
                        {item.label}
                        {item.href === "/inbox" && pending > 0
                          ? ` (${pending})`
                          : ""}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {item.desc}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {!hideAuthChrome && (
            <>
              {user ? (
                <UserMenu
                  email={user.email || ""}
                  fullName={profileName}
                  role={profileRole}
                />
              ) : (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="hidden text-white/55 hover:bg-white/[0.06] hover:text-white sm:inline-flex"
                >
                  <Link href="/login">Sign in</Link>
                </Button>
              )}
              <Button
                asChild
                size="sm"
                variant="outline"
                className={cn(
                  "h-9 font-semibold pressable",
                  onList && "ring-2 ring-primary/30"
                )}
              >
                <Link href="/signup?role=creator&next=/studio">
                  <span className="hidden sm:inline">List free</span>
                  <span className="sm:hidden">List</span>
                </Link>
              </Button>
            </>
          )}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-white/80 transition-colors hover:bg-white/[0.08] pressable md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      </div>

      {open && (
        <nav
          className="page-shell mt-2 pb-3 md:hidden animate-rise"
          aria-label="Mobile"
        >
        <div className="chrome-float rounded-2xl py-2">
          <ul className="flex flex-col gap-0.5 px-1">
            {publicLinks.map((link) => {
              const active = link.match(pathname);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "block rounded-full px-3 py-2.5 text-sm font-medium",
                      active
                        ? "bg-primary/15 text-primary"
                        : "text-white/55 hover:bg-white/[0.06] hover:text-white"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
            <li className="mt-2 border-t border-white/[0.06] pt-2">
              <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-[0.14em] text-white/30">
                For creators
              </p>
              {creatorLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between rounded-full px-3 py-2.5 text-sm font-medium text-white/55 hover:bg-white/[0.06] hover:text-white"
                >
                  {item.label}
                  {item.href === "/inbox" && pending > 0 && (
                    <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                      {pending}
                    </span>
                  )}
                </Link>
              ))}
            </li>
            {!user && (
              <li className="mt-2 grid grid-cols-2 gap-2 border-t border-white/[0.06] px-2 pt-2">
                <Link
                  href="/login"
                  className="rounded-full border border-white/10 px-3 py-2.5 text-center text-sm font-medium text-white/80"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-primary px-3 py-2.5 text-center text-sm font-medium text-primary-foreground"
                >
                  Sign up
                </Link>
              </li>
            )}
            {user && (
              <li className="mt-2 border-t border-white/[0.06] px-3 pt-2 text-sm text-white/40">
                {profileName}
              </li>
            )}
            <li className="mt-2 px-2 pb-1">
              <Link
                href="/signup?role=creator&next=/studio"
                className="block rounded-full border border-primary/60 px-3 py-2.5 text-center text-sm font-semibold text-primary pressable"
              >
                List free
              </Link>
            </li>
          </ul>
          </div>
        </nav>
      )}
    </header>
  );
}
