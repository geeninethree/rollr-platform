export type UserRole = "creator" | "client";
export type SubscriptionStatus = "inactive" | "active" | "past_due";

/** What a creator offers on ROLLR */
export type ServiceMode = "shoot" | "edit";

/** Client brief intent */
export type BriefType = "shoot" | "edit" | "full_package";

export type InquiryStatus = "pending" | "accepted" | "declined";

/** Vetting pipeline (local/mock until Supabase) */
export type ListingStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "rejected";

export type PortfolioMediaType = "image" | "video";
export type PortfolioRole = "shoot" | "edit" | "both";

export type PortfolioItem = {
  id: string;
  url: string;
  media_type: PortfolioMediaType;
  /** External video (YouTube/Vimeo) when media_type is video */
  video_url?: string | null;
  title?: string;
  caption?: string;
  category?: string;
  role: PortfolioRole;
  is_featured: boolean;
  sort_order: number;
};

export type ExternalLinks = {
  portfolio_url?: string | null;
  instagram_url?: string | null;
  showreel_url?: string | null;
};

export type Profile = {
  id: string;
  updated_at: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
};

export type CreatorProfile = {
  id: string;
  profile_id: string;
  bio: string | null;
  starting_price: number;
  cities: string[];
  sub_regions: string[];
  categories: string[];
  is_featured: boolean;
  sub_status: SubscriptionStatus;
  created_at: string;
};

/** Public creator model — never expose private phone in UI */
export type CreatorCardModel = {
  id: string;
  profile_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  starting_price: number;
  cities: string[];
  sub_regions: string[];
  categories: string[];
  is_featured: boolean;
  sub_status: SubscriptionStatus;
  cover_url: string;
  /** @deprecated prefer works — kept for simple URL lists */
  portfolio: string[];
  tagline: string;
  rating: number;
  review_count: number;
  response_label: string;
  service_modes: ServiceMode[];
  edit_tagline?: string;
  edit_bio?: string;
  edit_starting_price?: number;
  edit_specialties?: string[];
  edit_softwares?: string[];
  turnaround_label?: string;
  /** @deprecated prefer works with role edit */
  edit_portfolio?: string[];
  /** Full portfolio showcase */
  works: PortfolioItem[];
  links: ExternalLinks;
  listing_status: ListingStatus;
  /** 0–100 quality score for ranking / vetting UX */
  quality_score: number;
};

export type JobBrief = {
  id: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  category: string;
  budget_hint?: string;
  created_at: string;
  cover_url: string;
  client_name: string;
  brief_type: BriefType;
};

export type SearchFilters = {
  locations: string[];
  eventDate: string;
  categories: string[];
  proOnly: boolean;
  under15k: boolean;
  alsoEdits: boolean;
  alsoShoots: boolean;
};

export type Inquiry = {
  id: string;
  creator_id: string;
  creator_name: string;
  client_name: string;
  client_whatsapp: string;
  client_email?: string;
  brief_type: BriefType;
  event_date: string;
  location: string;
  category: string;
  budget?: string;
  message: string;
  status: InquiryStatus;
  created_at: string;
  updated_at: string;
};

export type SendBriefInput = {
  creator_id: string;
  creator_name: string;
  client_name: string;
  client_whatsapp: string;
  client_email?: string;
  brief_type: BriefType;
  event_date: string;
  location: string;
  category: string;
  budget?: string;
  message: string;
  default_brief_type?: BriefType;
};

/** Publish requirements (shown to creators; enforced in studio demo) */
export type QualityCheck = {
  id: string;
  label: string;
  ok: boolean;
  required: boolean;
};
