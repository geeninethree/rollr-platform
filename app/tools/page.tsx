"use client";

import Link from "next/link";
import {
  CalendarCheck,
  ClipboardList,
  FileText,
  FolderOpen,
  IndianRupee,
  Package,
  Receipt,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const tools = [
  {
    href: "/invoices",
    title: "Invoices",
    desc: "Bill clients, share link, mark paid",
    icon: Receipt,
  },
  {
    href: "/quotes",
    title: "Quotes",
    desc: "Estimates before the job",
    icon: FileText,
  },
  {
    href: "/bookings",
    title: "Booking confirmations",
    desc: "Date, package, deposit, terms",
    icon: CalendarCheck,
  },
  {
    href: "/rate-cards",
    title: "Rate cards",
    desc: "Public package pricing sheet",
    icon: IndianRupee,
  },
  {
    href: "/delivery",
    title: "Delivery notes",
    desc: "Handover checklist for clients",
    icon: Package,
  },
  {
    href: "/clients",
    title: "Client folder",
    desc: "All history per client",
    icon: FolderOpen,
  },
  {
    href: "/earnings",
    title: "Earnings / GST",
    desc: "Year summary + CSV export",
    icon: ClipboardList,
  },
  {
    href: "/inbox",
    title: "Inbox",
    desc: "Accept briefs · open WhatsApp",
    icon: Send,
  },
];

export default function ToolsPage() {
  return (
    <div className="bg-grid-fade">
      <div className="page-shell max-w-4xl space-y-8 py-8 sm:py-12">
        <div className="space-y-2">
          <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-primary">
            Creator tools
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Business kit
          </h1>
          <p className="max-w-lg text-sm text-white/45">
            Quotes, bookings, invoices, delivery, and clients — you stay the
            seller. ROLLR never takes a cut.
          </p>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2">
          {tools.map((t) => (
            <li key={t.href}>
              <Link href={t.href} className="block h-full">
                <Card className="h-full transition-colors hover:border-primary/30">
                  <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <t.icon className="h-4 w-4" />
                    </span>
                    <div>
                      <CardTitle className="text-base text-white">
                        {t.title}
                      </CardTitle>
                      <CardContent className="p-0 pt-1 text-sm text-white/45">
                        {t.desc}
                      </CardContent>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
