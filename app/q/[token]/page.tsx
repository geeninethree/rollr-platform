"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Printer } from "lucide-react";
import { QuoteDocument } from "@/components/docs/quote-document";
import { Button } from "@/components/ui/button";
import { fetchQuoteByToken, type Quote } from "@/lib/quotes";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function PublicQuotePage() {
  const params = useParams();
  const token = String(params?.token || "");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setError("Couldn’t load quote.");
        setLoading(false);
        return;
      }
      const result = await fetchQuoteByToken(supabase, token);
      if (result.error || !result.quote) {
        setError(result.error || "Quote not found.");
        setLoading(false);
        return;
      }
      setQuote(result.quote);
      setLoading(false);
    }
    if (token) void load();
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading quote…
      </div>
    );
  }
  if (error || !quote) {
    return (
      <div className="page-shell py-20 text-center">
        <p className="text-sm text-white/50">{error || "Not found"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] py-8 print:bg-white print:py-0">
      <div className="page-shell mb-4 flex justify-end print:hidden">
        <Button type="button" variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Print / Save PDF
        </Button>
      </div>
      <div className="page-shell print:max-w-none">
        <QuoteDocument quote={quote} />
      </div>
    </div>
  );
}
