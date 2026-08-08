"use client";

import { useState } from "react";
import Image from "next/image";
import { CalendarDays, CheckCircle2, MapPin, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { briefTypeLabel, formatDateIn } from "@/lib/format";
import type { JobBrief } from "@/lib/types";

type JobCardProps = {
  job: JobBrief;
};

export function JobCard({ job }: JobCardProps) {
  const [pitched, setPitched] = useState(false);

  return (
    <Card className="overflow-hidden border-border bg-card transition-colors hover:border-primary/25">
      <div className="relative aspect-[21/9] bg-secondary sm:aspect-[2.4/1]">
        <Image
          src={job.cover_url}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge className="bg-background/80 text-foreground backdrop-blur-sm hover:bg-background/80">
            {job.category}
          </Badge>
          <Badge
            variant="outline"
            className="border-primary/40 bg-background/70 text-primary backdrop-blur-sm"
          >
            {briefTypeLabel(job.brief_type)}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug sm:text-lg">
            {job.title}
          </CardTitle>
          {job.budget_hint && (
            <Badge
              variant="outline"
              className="shrink-0 border-primary/30 text-primary"
            >
              {job.budget_hint}
            </Badge>
          )}
        </div>
        <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {job.location}
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDateIn(job.event_date)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Tag className="h-3.5 w-3.5" />
            {job.client_name}
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {job.description}
        </p>
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
        <p className="text-[11px] text-muted-foreground">
          Posted {formatDateIn(job.created_at)}
        </p>
        {pitched ? (
          <div className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
            <CheckCircle2 className="h-4 w-4" />
            Pitch saved
          </div>
        ) : (
          <Button
            size="sm"
            className="font-semibold"
            onClick={() => setPitched(true)}
          >
            Pitch / Apply
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
