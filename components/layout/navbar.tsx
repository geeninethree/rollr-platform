"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { ChevronDown, Menu, X } from "lucide-react";
import { UserMenu } from "@/components/auth/user-menu";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { countPending, INQUIRIES_CHANGED } from "@/lib/inquiries";
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
  { href: "/list", label: "List for ₹299/mo", desc: "Pricing & interest list" },
  { href: "/studio", label: "Portfolio", desc: "Build your listing" },
  { href: "/inbox", label: "Inbox", desc: "Briefs (demo)" },
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
    const refresh = () => setPending(countPending());
    refresh();
    window.addEventListener(INQUIRIES_CHANGED, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(INQUIRIES_CHANGED, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let cancelled = false;

    async function loadUser(u: User | null) {
      if (cancelled) return;
      setUser(u);
      if (!u) {
        setProfileName("");
        setProfileRole("client");
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
    }

    supabase.auth.getUser().then(({ data }) => {
      void loadUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
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
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-5">
          <Logo size="lg" />

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
                    "rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors whitespace-nowrap pressable",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
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
                  "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors pressable",
                  creatorsActive || creatorsOpen
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
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
                  className="absolute left-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-xl shadow-black/40 animate-rise"
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
                <>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="hidden sm:inline-flex"
                  >
                    <Link href="/login">Sign in</Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="hidden font-medium sm:inline-flex"
                  >
                    <Link href="/signup">Sign up</Link>
                  </Button>
                </>
              )}
              <Button
                asChild
                size="sm"
                className={cn(
                  "font-semibold shadow-sm shadow-primary/20 pressable",
                  onList && "ring-2 ring-primary/40"
                )}
              >
                <Link href="/list">
                  <span className="hidden sm:inline">List — ₹299</span>
                  <span className="sm:hidden">₹299</span>
                </Link>
              </Button>
            </>
          )}
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-secondary pressable md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          className="border-t border-border bg-background/95 px-4 py-3 backdrop-blur-xl md:hidden animate-rise"
          aria-label="Mobile"
        >
          <ul className="flex flex-col gap-1">
            {publicLinks.map((link) => {
              const active = link.match(pathname);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "block rounded-md px-3 py-2.5 text-sm font-medium",
                      active
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
            <li className="mt-2 border-t border-border pt-2">
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                For creators
              </p>
              {creatorLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
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
              <li className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-2">
                <Link
                  href="/login"
                  className="rounded-md border border-border px-3 py-2.5 text-center text-sm font-medium"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-md bg-secondary px-3 py-2.5 text-center text-sm font-medium"
                >
                  Sign up
                </Link>
              </li>
            )}
            {user && (
              <li className="mt-2 border-t border-border px-3 pt-2 text-sm text-muted-foreground">
                Signed in as {profileName}
              </li>
            )}
            <li className="mt-2">
              <Link
                href="/list"
                className="block rounded-md bg-primary px-3 py-2.5 text-center text-sm font-semibold text-primary-foreground pressable"
              >
                List Profile — ₹299/mo
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
