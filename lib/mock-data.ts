import type { CreatorCardModel, JobBrief } from "@/lib/types";
import {
  computeQualityScore,
  itemsFromUrls,
  mergeWorks,
} from "@/lib/portfolio";
import { syncCategoryPrices } from "@/lib/pricing";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

type CreatorSeed = Omit<
  CreatorCardModel,
  "works" | "links" | "listing_status" | "quality_score" | "category_prices"
>;

/**
 * Mumbai / MMR areas — individual suburbs for search + portfolio.
 * (No East/West pairs; northern line explicit.)
 */
export const LOCATIONS = [
  // South & island
  "South Mumbai",
  "Colaba",
  "Fort / CST",
  "Worli / Lower Parel",
  "Dadar / Matunga",
  // Western line
  "Bandra / Khar",
  "Santacruz / Vile Parle",
  "Juhu",
  "Andheri",
  "Goregaon",
  "Malad",
  "Kandivali",
  "Borivali",
  "Dahisar",
  // Northern / extended west
  "Mira Road",
  "Bhayandar",
  "Mira–Bhayandar",
  "Vasai",
  "Virar",
  "Vasai–Virar",
  // Central / east
  "Kurla / Chembur",
  "Ghatkopar",
  "Mulund",
  "Ghatkopar / Mulund",
  "Powai / BKC",
  "Powai",
  "BKC",
  // Thane belt
  "Thane",
  "Kalyan",
  "Dombivli",
  "Kalyan–Dombivli",
  // Navi
  "Navi Mumbai",
  "Vashi",
  "Nerul",
  "Kharghar",
  "Panvel",
  // Destinations
  "Alibaug / Lonavala",
  "Remote / Online",
  "All Mumbai / Travel OK",
] as const;

/** Typeahead aliases → canonical location label */
export const LOCATION_ALIASES: Record<string, string> = {
  kandivali: "Kandivali",
  kandivli: "Kandivali",
  borivali: "Borivali",
  borivli: "Borivali",
  goregaon: "Goregaon",
  malad: "Malad",
  dahisar: "Dahisar",
  mira: "Mira Road",
  "mira road": "Mira Road",
  bhayandar: "Bhayandar",
  bhayander: "Bhayandar",
  andheri: "Andheri",
  juhu: "Juhu",
  bandra: "Bandra / Khar",
  khar: "Bandra / Khar",
  santacruz: "Santacruz / Vile Parle",
  "vile parle": "Santacruz / Vile Parle",
  parle: "Santacruz / Vile Parle",
  ghatkopar: "Ghatkopar",
  mulund: "Mulund",
  powai: "Powai",
  bkc: "BKC",
  thane: "Thane",
  kalyan: "Kalyan",
  dombivli: "Dombivli",
  dombivali: "Dombivli",
  vashi: "Vashi",
  nerul: "Nerul",
  kharghar: "Kharghar",
  panvel: "Panvel",
  navi: "Navi Mumbai",
  "navi mumbai": "Navi Mumbai",
  vasai: "Vasai",
  virar: "Virar",
  worli: "Worli / Lower Parel",
  "lower parel": "Worli / Lower Parel",
  dadar: "Dadar / Matunga",
  matunga: "Dadar / Matunga",
  chembur: "Kurla / Chembur",
  kurla: "Kurla / Chembur",
  colaba: "Colaba",
  alibaug: "Alibaug / Lonavala",
  lonavala: "Alibaug / Lonavala",
};

/** Resolve free-text to best location labels for suggestions */
export function matchLocations(query: string, limit = 8): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...LOCATIONS].slice(0, 8);

  const scored = new Map<string, number>();

  const aliasHit = LOCATION_ALIASES[q];
  if (aliasHit) scored.set(aliasHit, 100);

  for (const [alias, canon] of Object.entries(LOCATION_ALIASES)) {
    if (alias.startsWith(q) || alias.includes(q)) {
      scored.set(canon, Math.max(scored.get(canon) ?? 0, 80 - alias.length));
    }
  }

  for (const loc of LOCATIONS) {
    const l = loc.toLowerCase();
    if (l === q) scored.set(loc, 100);
    else if (l.startsWith(q)) scored.set(loc, Math.max(scored.get(loc) ?? 0, 70));
    else if (l.includes(q)) scored.set(loc, Math.max(scored.get(loc) ?? 0, 50));
    else {
      // token match: "kandivali" in "Western..." no; "goregaon" in label
      const tokens = l.split(/[\s/–—,-]+/);
      if (tokens.some((t) => t.startsWith(q) || q.startsWith(t))) {
        scored.set(loc, Math.max(scored.get(loc) ?? 0, 60));
      }
    }
  }

  return Array.from(scored.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label]) => label)
    .slice(0, limit);
}

export const SHOOT_CATEGORIES = [
  "Wedding",
  "Personal Events",
  "Nightclub",
  "Corporate",
  "Fashion",
  "Real Estate",
  "Concert",
  "Product",
  "Podcasts",
  "Custom",
] as const;

export const EDIT_SPECIALTIES = [
  "Wedding film",
  "Reels / vertical",
  "Colour grade",
  "Corporate highlight",
  "Same-day teaser",
  "Multi-cam edit",
  "Product polish",
] as const;

/** @deprecated use SHOOT_CATEGORIES — kept for imports */
export const CATEGORIES = SHOOT_CATEGORIES;

const MOCK_CREATORS_RAW: CreatorSeed[] = [
  {
    id: "c1",
    profile_id: "p1",
    full_name: "Aarav Mehta",
    email: "aarav@example.com",
    avatar_url: img("photo-1507003211169-0a1dd7228f2d", 200),
    tagline: "Cinematic wedding films",
    bio: "Wedding and destination films with clean cinematic edits. Same-day teaser reels for Bandra, Juhu, and South Mumbai venues.",
    starting_price: 25000,
    cities: ["Mumbai"],
    sub_regions: ["Bandra", "Juhu", "South Mumbai"],
    categories: ["Wedding", "Fashion"],
    is_featured: true,
    sub_status: "active",
    cover_url: img("photo-1519741497674-611481863552"),
    portfolio: [
      img("photo-1606800052052-a08af7148866"),
      img("photo-1465495976277-4387d4b0b4c6"),
      img("photo-1520854221256-17451cc331bf"),
    ],
    rating: 4.9,
    review_count: 48,
    response_label: "Usually replies in under 2 hours",
    service_modes: ["shoot", "edit"],
    edit_tagline: "Wedding films & same-day teasers",
    edit_bio:
      "Full wedding film cuts, colour, and same-day teasers from multi-cam kits. Remote edit accepted with clear shot lists.",
    edit_starting_price: 12000,
    edit_specialties: ["Wedding film", "Same-day teaser", "Colour grade"],
    edit_softwares: ["DaVinci Resolve", "Premiere Pro"],
    turnaround_label: "Teaser 48h · Film 2–3 weeks",
    edit_portfolio: [
      img("photo-1511285560929-80b456fea0bc"),
      img("photo-1465495976277-4387d4b0b4c6"),
      img("photo-1529636798458-92182e662485"),
    ],
  },
  {
    id: "c2",
    profile_id: "p2",
    full_name: "Priya Shah",
    email: "priya@example.com",
    avatar_url: img("photo-1494790108377-be9c29b29330", 200),
    tagline: "Nightclub & event stills",
    bio: "Low-light specialist for clubs and late nights across Bandra–Andheri. Fast selects for guestlist and brand recaps.",
    starting_price: 12000,
    cities: ["Mumbai"],
    sub_regions: ["Bandra", "Andheri", "Powai"],
    categories: ["Nightclub", "Concert"],
    is_featured: true,
    sub_status: "active",
    cover_url: img("photo-1470229722913-7c0e2dbbafd3"),
    portfolio: [
      img("photo-1514525253161-7a46d19cd819"),
      img("photo-1514525253161-7a46d19cd819"),
      img("photo-1493225457124-a3eb161ffa5f"),
    ],
    rating: 4.8,
    review_count: 36,
    response_label: "Usually replies the same day",
    service_modes: ["shoot", "edit"],
    edit_tagline: "Event recaps & vertical reels",
    edit_bio:
      "Fast nightclub and concert recaps. Selects, light grade, and vertical cuts for Instagram the next morning.",
    edit_starting_price: 6000,
    edit_specialties: ["Reels / vertical", "Same-day teaser"],
    edit_softwares: ["Lightroom", "Premiere Pro", "CapCut"],
    turnaround_label: "Selects overnight · Reels 24–48h",
    edit_portfolio: [
      img("photo-1514525253161-7a46d19cd819"),
      img("photo-1514525253161-7a46d19cd819"),
      img("photo-1501386761578-eac5c94b800a"),
    ],
  },
  {
    id: "c3",
    profile_id: "p3",
    full_name: "Rohan Desai",
    email: "rohan@example.com",
    avatar_url: img("photo-1472099645785-5658abf4ff4e", 200),
    tagline: "Corporate multi-cam coverage",
    bio: "Conference and summit coverage with multi-cam setups. Clean highlight reels for keynotes, panels, and brand stages.",
    starting_price: 18000,
    cities: ["Mumbai"],
    sub_regions: ["BKC", "Worli", "South Mumbai"],
    categories: ["Corporate", "Product"],
    is_featured: false,
    sub_status: "inactive",
    cover_url: img("photo-1540575467063-178a50c2df87"),
    portfolio: [
      img("photo-1505373877841-8d25f7d46678"),
      img("photo-1475721027785-f74eccf877e2"),
      img("photo-1559223607-a43c990c692c"),
    ],
    rating: 4.6,
    review_count: 21,
    response_label: "Usually replies within a day",
    service_modes: ["shoot"],
  },
  {
    id: "c4",
    profile_id: "p4",
    full_name: "Ananya Iyer",
    email: "ananya@example.com",
    avatar_url: img("photo-1438761681033-6461ffad8d80", 200),
    tagline: "Fashion lookbooks & brand film",
    bio: "Soft editorial lighting for lookbooks and short brand films. Strong colour direction for Mumbai labels and agencies.",
    starting_price: 15000,
    cities: ["Mumbai"],
    sub_regions: ["Juhu", "Bandra", "Andheri"],
    categories: ["Fashion", "Product"],
    is_featured: true,
    sub_status: "active",
    cover_url: img("photo-1469334031218-e382a71b716b"),
    portfolio: [
      img("photo-1515886657613-9f3515b0c78f"),
      img("photo-1483985988355-763728e1935b"),
      img("photo-1509631179647-0177331693ae"),
    ],
    rating: 4.9,
    review_count: 29,
    response_label: "Usually replies in under 3 hours",
    service_modes: ["shoot", "edit"],
    edit_tagline: "Colour & fashion film polish",
    edit_bio:
      "Lookbook selects, grade, and short brand films. Comfortable taking client footage or finishing her own shoots.",
    edit_starting_price: 9000,
    edit_specialties: ["Colour grade", "Product polish", "Reels / vertical"],
    edit_softwares: ["DaVinci Resolve", "Photoshop"],
    turnaround_label: "Selects 3–5 days · Film 1–2 weeks",
    edit_portfolio: [
      img("photo-1515886657613-9f3515b0c78f"),
      img("photo-1509631179647-0177331693ae"),
      img("photo-1483985988355-763728e1935b"),
    ],
  },
  {
    id: "c5",
    profile_id: "p5",
    full_name: "Kabir Khan",
    email: "kabir@example.com",
    avatar_url: img("photo-1500648767791-00dcc994a43e", 200),
    tagline: "Property walkthroughs & reels",
    bio: "Luxury listing reels and stills for brokers and developers. Gimbal walkthroughs tailored for Instagram and portals.",
    starting_price: 8000,
    cities: ["Mumbai"],
    sub_regions: ["Navi Mumbai", "Thane", "Powai"],
    categories: ["Real Estate"],
    is_featured: false,
    sub_status: "inactive",
    cover_url: img("photo-1600596542815-ffad4c1539a9"),
    portfolio: [
      img("photo-1600585154340-be6161a56a0c"),
      img("photo-1600607687939-ce8a6c25118c"),
      img("photo-1600566753190-17f0baa2a6c3"),
    ],
    rating: 4.5,
    review_count: 17,
    response_label: "Usually replies within a day",
    service_modes: ["shoot"],
  },
  {
    id: "c6",
    profile_id: "p6",
    full_name: "Meher Patel",
    email: "meher@example.com",
    avatar_url: img("photo-1544005313-94ddf0286df2", 200),
    tagline: "Live music & festival docs",
    bio: "Stage and crowd coverage for gigs and festivals. Fast social galleries when you need posts the same night.",
    starting_price: 14000,
    cities: ["Mumbai"],
    sub_regions: ["Andheri", "Worli", "Bandra"],
    categories: ["Concert", "Nightclub"],
    is_featured: false,
    sub_status: "past_due",
    cover_url: img("photo-1501386761578-eac5c94b800a"),
    portfolio: [
      img("photo-1501386761578-eac5c94b800a"),
      img("photo-1429962714451-bb934ecdc4ec"),
      img("photo-1506157786151-b8491531f063"),
    ],
    rating: 4.7,
    review_count: 24,
    response_label: "Usually replies the same day",
    service_modes: ["shoot", "edit"],
    edit_tagline: "Live cuts & multi-cam sync",
    edit_bio:
      "Multi-cam concert edits, social cuts, and festival docs. Works remote for bands and venues across Mumbai.",
    edit_starting_price: 7000,
    edit_specialties: ["Multi-cam edit", "Reels / vertical"],
    edit_softwares: ["Premiere Pro", "After Effects"],
    turnaround_label: "Social cuts 24h · Full set 1 week",
    edit_portfolio: [
      img("photo-1501386761578-eac5c94b800a"),
      img("photo-1429962714451-bb934ecdc4ec"),
      img("photo-1501386761578-eac5c94b800a"),
    ],
  },
  {
    id: "c7",
    profile_id: "p7",
    full_name: "Ishaan Rao",
    email: "ishaan@example.com",
    avatar_url: img("photo-1519085360753-af0119f7cbe7", 200),
    tagline: "Intimate wedding photography",
    bio: "Quiet, film-inspired wedding photography for couples who want candids over stiff poses. South Mumbai and Bandra specialist.",
    starting_price: 22000,
    cities: ["Mumbai"],
    sub_regions: ["South Mumbai", "Bandra", "Juhu"],
    categories: ["Wedding"],
    is_featured: true,
    sub_status: "active",
    cover_url: img("photo-1511285560929-80b456fea0bc"),
    portfolio: [
      img("photo-1583939003579-730e3918a45a"),
      img("photo-1591604466107-ec97de577aff"),
      img("photo-1529636798458-92182e662485"),
    ],
    rating: 5.0,
    review_count: 41,
    response_label: "Usually replies in under 2 hours",
    service_modes: ["shoot", "edit"],
    edit_tagline: "Film-inspired wedding galleries",
    edit_bio:
      "Culling, film-inspired grade, and album-ready selects. Also finishes other photographers' wedding cards on request.",
    edit_starting_price: 10000,
    edit_specialties: ["Wedding film", "Colour grade"],
    edit_softwares: ["Lightroom", "Capture One"],
    turnaround_label: "Preview 1 week · Full gallery 3 weeks",
    edit_portfolio: [
      img("photo-1583939003579-730e3918a45a"),
      img("photo-1511285560929-80b456fea0bc"),
      img("photo-1591604466107-ec97de577aff"),
    ],
  },
  {
    id: "c8",
    profile_id: "p8",
    full_name: "Sana Qureshi",
    email: "sana@example.com",
    avatar_url: img("photo-1534528741775-53994a69daeb", 200),
    tagline: "Product & F&B content",
    bio: "Still and motion for F&B brands, menus, and product drops. Colour-true work for Instagram, menus, and e-commerce.",
    starting_price: 9000,
    cities: ["Mumbai"],
    sub_regions: ["Bandra", "Andheri", "Powai"],
    categories: ["Product", "Corporate"],
    is_featured: false,
    sub_status: "inactive",
    cover_url: img("photo-1414235077428-338989a2e8c0"),
    portfolio: [
      img("photo-1556910103-1c02745aae4d"),
      img("photo-1495474472287-4d71bcdd2085"),
      img("photo-1504674900247-0877df9cc836"),
    ],
    rating: 4.6,
    review_count: 19,
    response_label: "Usually replies within a day",
    service_modes: ["shoot"],
  },
  // Edit-primary creators
  {
    id: "c9",
    profile_id: "p9",
    full_name: "Dev Kapoor",
    email: "dev@example.com",
    avatar_url: img("photo-1506794778202-cad84cf45f1d", 200),
    tagline: "Post house — wedding & corporate",
    bio: "Dedicated post specialist. Bring footage; leave with a graded film, reels, and delivery masters.",
    starting_price: 0,
    cities: ["Mumbai"],
    sub_regions: ["Andheri", "Bandra", "Powai"],
    categories: ["Wedding", "Corporate"],
    is_featured: true,
    sub_status: "active",
    cover_url: img("photo-1574717024653-61fd2cf4d44d"),
    portfolio: [
      img("photo-1492691527719-9d1e07e534b4"),
      img("photo-1478720568477-152d9b164e26"),
      img("photo-1485846234645-a62644f84728"),
    ],
    rating: 4.9,
    review_count: 52,
    response_label: "Usually replies in under 4 hours",
    service_modes: ["edit"],
    edit_tagline: "Full post for wedding & brand film",
    edit_bio:
      "Edit-only. Multi-cam wedding films, corporate highlights, and colour finishing. Remote handover via Drive/Frame.io.",
    edit_starting_price: 15000,
    edit_specialties: [
      "Wedding film",
      "Corporate highlight",
      "Colour grade",
      "Multi-cam edit",
    ],
    edit_softwares: ["DaVinci Resolve", "Premiere Pro", "After Effects"],
    turnaround_label: "Teaser 72h · Long film 2–4 weeks",
    edit_portfolio: [
      img("photo-1492691527719-9d1e07e534b4"),
      img("photo-1478720568477-152d9b164e26"),
      img("photo-1485846234645-a62644f84728"),
    ],
  },
  {
    id: "c10",
    profile_id: "p10",
    full_name: "Naina Joshi",
    email: "naina@example.com",
    avatar_url: img("photo-1487412720507-e7ab37603c6f", 200),
    tagline: "Reels editor for creators & F&B",
    bio: "Vertical-first editor for Mumbai F&B and personal brands. Hooks, captions, and platform-ready exports.",
    starting_price: 0,
    cities: ["Mumbai"],
    sub_regions: ["Bandra", "Juhu", "Andheri"],
    categories: ["Product", "Fashion"],
    is_featured: false,
    sub_status: "active",
    cover_url: img("photo-1611162616305-c69b3fa7fbe0"),
    portfolio: [
      img("photo-1611162616475-46b635cb6868"),
      img("photo-1611162616475-46b635cb6868"),
      img("photo-1550745165-9bc0b252726f"),
    ],
    rating: 4.7,
    review_count: 33,
    response_label: "Usually replies the same day",
    service_modes: ["edit"],
    edit_tagline: "Vertical reels & social polish",
    edit_bio:
      "Batch reels, product polish, and caption-ready cuts. Ideal if you already have footage and need a fast social engine.",
    edit_starting_price: 4500,
    edit_specialties: ["Reels / vertical", "Product polish"],
    edit_softwares: ["Premiere Pro", "CapCut", "After Effects"],
    turnaround_label: "3–5 reels per week typical",
    edit_portfolio: [
      img("photo-1611162616475-46b635cb6868"),
      img("photo-1611162616475-46b635cb6868"),
      img("photo-1550745165-9bc0b252726f"),
    ],
  },
];

function withPortfolio(c: CreatorSeed): CreatorCardModel {
  const shoot = itemsFromUrls(c.portfolio, "shoot", {
    category: c.categories[0],
    prefix: `${c.id}-s`,
  });
  const edit = itemsFromUrls(c.edit_portfolio ?? [], "edit", {
    category: c.edit_specialties?.[0] ?? c.categories[0],
    prefix: `${c.id}-e`,
  });
  // Extra showcase pieces so galleries feel fuller than 3 thumbs
  const extraShoot = itemsFromUrls(
    [c.cover_url, c.portfolio[0], c.portfolio[1] ?? c.portfolio[0]].filter(
      Boolean
    ) as string[],
    "shoot",
    { featuredCount: 0, prefix: `${c.id}-xs`, category: c.categories[0] }
  ).map((w, i) => ({ ...w, sort_order: 10 + i, is_featured: false }));

  const works = mergeWorks(shoot, edit, extraShoot);
  const slug = c.full_name.toLowerCase().replace(/[^a-z]+/g, "");
  const category_prices = syncCategoryPrices(
    c.categories,
    Object.fromEntries(
      c.categories.map((cat) => [cat, c.starting_price || 10000])
    ),
    "shoot"
  );
  const base: CreatorCardModel = {
    ...c,
    works,
    links: {
      portfolio_url: `https://${slug}.example.studio`,
      instagram_url: `https://instagram.com/${slug}`,
      showreel_url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
    },
    listing_status: "published",
    quality_score: 0,
    category_prices,
  };
  return { ...base, quality_score: computeQualityScore(base) };
}

export const MOCK_CREATORS: CreatorCardModel[] =
  MOCK_CREATORS_RAW.map(withPortfolio);

export function getPublishedCreators() {
  return MOCK_CREATORS.filter((c) => c.listing_status === "published");
}

export const MOCK_JOBS: JobBrief[] = [
  {
    id: "j1",
    title: "Nightclub photographer for a 3-hour private night",
    description:
      "Need a low-light stills photographer for a private guestlist night at a Bandra club. Deliver about 50 edited images within 48 hours.",
    location: "Bandra",
    event_date: "2026-08-22",
    category: "Nightclub",
    budget_hint: "₹10k–15k",
    created_at: "2026-08-06T10:00:00Z",
    cover_url: img("photo-1514525253161-7a46d19cd819", 900),
    client_name: "Guestlist Co.",
    brief_type: "shoot",
  },
  {
    id: "j2",
    title: "Wedding reception coverage — half day",
    description:
      "Reception at a South Mumbai venue. One primary shooter preferred; second shooter optional for guest candids. Teaser reel is a plus.",
    location: "South Mumbai",
    event_date: "2026-09-14",
    category: "Wedding",
    budget_hint: "₹25k–40k",
    created_at: "2026-08-05T14:30:00Z",
    cover_url: img("photo-1519741497674-611481863552", 900),
    client_name: "Mehta Wedding",
    brief_type: "full_package",
  },
  {
    id: "j3",
    title: "Corporate summit multi-cam (full day)",
    description:
      "Full-day conference near BKC. Keynotes, panels, and a highlight reel. Prefer creators with a corporate showreel.",
    location: "Worli",
    event_date: "2026-08-28",
    category: "Corporate",
    budget_hint: "₹30k+",
    created_at: "2026-08-04T09:15:00Z",
    cover_url: img("photo-1540575467063-178a50c2df87", 900),
    client_name: "Northline Events",
    brief_type: "shoot",
  },
  {
    id: "j4",
    title: "Edit-only: 8-hour wedding film + teaser",
    description:
      "Footage already shot (two cameras). Need a 6–8 min film, colour, and a 60s teaser. Drive link ready after kickoff.",
    location: "Remote / Mumbai",
    event_date: "2026-08-30",
    category: "Wedding",
    budget_hint: "₹12k–20k",
    created_at: "2026-08-07T11:00:00Z",
    cover_url: img("photo-1574717024653-61fd2cf4d44d", 900),
    client_name: "S. & A. Couples",
    brief_type: "edit",
  },
  {
    id: "j5",
    title: "Luxury flat walkthrough reel",
    description:
      "2BHK in Powai. Need a 60–90s vertical reel plus about 10 stills for the listing. Gimbal required.",
    location: "Powai",
    event_date: "2026-08-12",
    category: "Real Estate",
    budget_hint: "₹6k–10k",
    created_at: "2026-08-07T08:00:00Z",
    cover_url: img("photo-1600596542815-ffad4c1539a9", 900),
    client_name: "Harbour Homes",
    brief_type: "full_package",
  },
  {
    id: "j6",
    title: "Batch reels edit — F&B brand (edit only)",
    description:
      "We have raw iPhone + mirrorless clips. Need 6 vertical reels with captions for a café launch week.",
    location: "Remote",
    event_date: "2026-08-20",
    category: "Product",
    budget_hint: "₹8k–12k",
    created_at: "2026-08-08T09:00:00Z",
    cover_url: img("photo-1611162616305-c69b3fa7fbe0", 900),
    client_name: "Coastal Cup",
    brief_type: "edit",
  },
];

export function getCreatorById(id: string) {
  return MOCK_CREATORS.find((c) => c.id === id) ?? null;
}
