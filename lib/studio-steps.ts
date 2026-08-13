import { worksForMode } from "@/lib/portfolio";
import type { StudioDraft } from "@/lib/studio";

export type StudioStepId =
  | "about"
  | "photos"
  | "services"
  | "pricing"
  | "portfolio"
  | "review";

export type StudioStep = {
  id: StudioStepId;
  number: number;
  title: string;
  short: string;
  description: string;
};

export const STUDIO_STEPS: StudioStep[] = [
  {
    id: "about",
    number: 1,
    title: "About you",
    short: "About",
    description: "Name, tagline, and a short bio clients will read first.",
  },
  {
    id: "photos",
    number: 2,
    title: "Profile photos",
    short: "Photos",
    description: "Profile photo and cover image for your public listing.",
  },
  {
    id: "services",
    number: 3,
    title: "Services & areas",
    short: "Services",
    description: "What you offer, where you work, and categories.",
  },
  {
    id: "pricing",
    number: 4,
    title: "Package prices",
    short: "Prices",
    description: "Starting package floors by category (not hourly).",
  },
  {
    id: "portfolio",
    number: 5,
    title: "Portfolio work",
    short: "Work",
    description: "At least 3 pieces on ROLLR — feature your best three.",
  },
  {
    id: "review",
    number: 6,
    title: "Links & submit",
    short: "Submit",
    description: "Optional links, then save or submit for review.",
  },
];

/** Per-step validation — returns human messages (empty = step OK). */
export function validateStudioStep(
  stepId: StudioStepId,
  draft: StudioDraft
): string[] {
  const errors: string[] = [];

  switch (stepId) {
    case "about": {
      if (!draft.full_name.trim()) errors.push("Add your name or studio name.");
      if (!draft.tagline.trim()) {
        errors.push("Add a short tagline (e.g. Wedding films · Bandra).");
      }
      if (draft.bio.trim().length < 40) {
        errors.push(
          `Bio needs at least 40 characters (you have ${draft.bio.trim().length}).`
        );
      }
      break;
    }
    case "photos": {
      if (!draft.avatar_url.trim()) {
        errors.push("Upload a profile photo.");
      }
      if (!draft.cover_url.trim()) {
        errors.push("Upload a cover image.");
      }
      break;
    }
    case "services": {
      if (draft.service_modes.length === 0) {
        errors.push("Pick at least one service: coverage or editing.");
      }
      if (draft.sub_regions.length === 0) {
        errors.push("Select at least one area you work in.");
      }
      if (draft.categories.length === 0) {
        errors.push("Select at least one category.");
      }
      break;
    }
    case "pricing": {
      if (draft.categories.length === 0) {
        errors.push("Go back and pick categories first.");
        break;
      }
      for (const cat of draft.categories) {
        const price = draft.category_prices[cat] ?? 0;
        if (!price || price <= 0) {
          errors.push(`Set a starting package price for ${cat}.`);
        }
      }
      break;
    }
    case "portfolio": {
      if (draft.works.length < 3) {
        errors.push(
          `Add at least 3 portfolio pieces (you have ${draft.works.length}).`
        );
      }
      const featured = draft.works.filter((w) => w.is_featured);
      if (draft.works.length >= 3 && featured.length < 3) {
        errors.push(
          `Mark 3 pieces as Featured (currently ${featured.length}).`
        );
      }
      const claimsShoot = draft.service_modes.includes("shoot");
      const claimsEdit = draft.service_modes.includes("edit");
      if (claimsShoot && worksForMode(draft.works, "shoot").length < 2) {
        errors.push("Add at least 2 shoot/coverage samples.");
      }
      if (claimsEdit && worksForMode(draft.works, "edit").length < 2) {
        errors.push("Add at least 2 edit/post samples.");
      }
      break;
    }
    case "review":
      // Links optional — no hard errors
      break;
  }

  return errors;
}

export function isStepComplete(stepId: StudioStepId, draft: StudioDraft): boolean {
  return validateStudioStep(stepId, draft).length === 0;
}

/** First incomplete required step (for “jump to issue”). */
export function firstIncompleteStep(draft: StudioDraft): StudioStepId {
  for (const step of STUDIO_STEPS) {
    if (step.id === "review") continue;
    if (!isStepComplete(step.id, draft)) return step.id;
  }
  return "review";
}

export function stepIndex(id: StudioStepId): number {
  return STUDIO_STEPS.findIndex((s) => s.id === id);
}
