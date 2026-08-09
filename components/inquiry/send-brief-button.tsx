"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SendBriefDialog } from "@/components/inquiry/send-brief-dialog";
import type { BriefType, CreatorCardModel } from "@/lib/types";
import { cn } from "@/lib/utils";

type SendBriefButtonProps = {
  creator: CreatorCardModel;
  defaultBriefType?: BriefType;
  presetEventDate?: string;
  surface?: "shoot" | "edit";
  size?: "default" | "sm" | "lg";
  className?: string;
  label?: string;
  variant?: "default" | "outline" | "secondary";
};

export function SendBriefButton({
  creator,
  defaultBriefType,
  presetEventDate,
  surface,
  size = "sm",
  className,
  label = "Send brief",
  variant = "outline",
}: SendBriefButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        size={size}
        variant={variant}
        className={cn("font-semibold", className)}
        onClick={() => setOpen(true)}
      >
        <FileText className="h-4 w-4" />
        {label}
      </Button>
      <SendBriefDialog
        creator={creator}
        open={open}
        onOpenChange={setOpen}
        defaultBriefType={defaultBriefType}
        presetEventDate={presetEventDate}
        surface={surface}
      />
    </>
  );
}
