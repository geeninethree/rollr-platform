import { minCategoryPrice } from "@/lib/pricing";
import type { BriefType, CreatorCardModel, ServiceMode } from "@/lib/types";

export function formatPriceInr(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDateIn(iso: string, opts?: Intl.DateTimeFormatOptions) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      ...opts,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function isProCreator(
  creator: Pick<CreatorCardModel, "is_featured" | "sub_status">
) {
  return creator.is_featured || creator.sub_status === "active";
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function hasService(
  creator: Pick<CreatorCardModel, "service_modes">,
  mode: ServiceMode
) {
  return creator.service_modes.includes(mode);
}

export function isHybrid(creator: Pick<CreatorCardModel, "service_modes">) {
  return (
    creator.service_modes.includes("shoot") &&
    creator.service_modes.includes("edit")
  );
}

export function briefTypeLabel(type: BriefType) {
  switch (type) {
    case "shoot":
      return "Shoot only";
    case "edit":
      return "Edit only";
    case "full_package":
      return "Shoot + edit";
  }
}

/** Normalise client WhatsApp for wa.me (digits only, assume India if 10 digits). */
export function normaliseWhatsApp(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 10) digits = `91${digits}`;
  if (digits.startsWith("0") && digits.length === 11) {
    digits = `91${digits.slice(1)}`;
  }
  return digits;
}

/**
 * Option 2: after accept, the *creator* opens WhatsApp to the *client*.
 * Creator phone is never used in the public UI.
 */
export function creatorToClientWhatsAppUrl(input: {
  clientWhatsapp: string;
  clientName: string;
  creatorName: string;
  briefType: BriefType;
  eventDate?: string;
  location?: string;
}) {
  const phone = normaliseWhatsApp(input.clientWhatsapp);
  const when = input.eventDate ? ` on ${input.eventDate}` : "";
  const where = input.location ? ` in ${input.location}` : "";
  const text = [
    `Hi ${input.clientName},`,
    `This is ${input.creatorName} on ROLLR.`,
    `I've accepted your ${briefTypeLabel(input.briefType).toLowerCase()} brief${when}${where}.`,
    `Happy to discuss scope, timing, and deliverables here.`,
  ].join(" ");

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function shootPrice(creator: CreatorCardModel) {
  const fromCats = minCategoryPrice(creator.category_prices);
  return fromCats > 0 ? fromCats : creator.starting_price;
}

export function editPrice(creator: CreatorCardModel) {
  const fromCats = minCategoryPrice(creator.category_prices);
  if (fromCats > 0) return fromCats;
  return creator.edit_starting_price ?? creator.starting_price;
}

/** Lowest package floor across categories (or mode fallback). */
export function displayPriceForMode(
  creator: CreatorCardModel,
  mode: "shoot" | "edit"
) {
  return mode === "edit" ? editPrice(creator) : shootPrice(creator);
}

export function priceLabelFrom(price: number) {
  if (!price || price <= 0) return "Price on request";
  return `From ${formatPriceInr(price)}`;
}
