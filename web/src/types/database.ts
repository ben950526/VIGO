export type UserRole = "creator" | "client" | "admin";
export type VerificationStatus = "pending" | "approved" | "rejected";
export type SubscriptionTier = "free" | "pro" | "studio";
export type EmbedType = "youtube" | "vimeo" | "instagram" | "other";
export type PortfolioStatus = "pending" | "approved" | "rejected";

export interface PriceListItem {
  label: string;
  price: number;
  note?: string | null;
}

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  real_name: string | null;
  created_at: string;
}

export interface CreatorProfile {
  id: string;
  user_id: string;
  slug: string;
  studio_name: string;
  bio: string | null;
  region: string | null;
  service_types: string[];
  style_tags: string[];
  price_min: number | null;
  price_max: number | null;
  contact_email: string | null;
  line_id: string | null;
  phone: string | null;
  show_email: boolean;
  show_line: boolean;
  show_phone: boolean;
  verification_status: VerificationStatus;
  subscription_tier: SubscriptionTier;
  featured: boolean;
  is_listed: boolean;
  is_demo: boolean;
  avatar_url: string | null;
  turnaround: string | null;
  revision_policy: string | null;
  response_time: string | null;
  team_size: string | null;
  platforms: string[];
  client_types: string[];
  languages: string[];
  typical_scope: string | null;
  website_url: string | null;
  price_list: PriceListItem[];
  created_at: string;
  updated_at: string;
}

export interface PortfolioItem {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  embed_url: string;
  embed_type: EmbedType;
  thumbnail_url: string | null;
  style_tags: string[];
  sort_order: number;
  status: PortfolioStatus;
  created_at: string;
}

export interface Inquiry {
  id: string;
  creator_id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  message: string;
  budget_range: string | null;
  created_at: string;
}

export type BugReportStatus = "open" | "investigating" | "fixed" | "wont_fix";

export interface BugReportItem {
  id: string;
  message: string;
  steps: string | null;
  page_url: string | null;
  user_agent: string | null;
  viewport: string | null;
  status: BugReportStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackItem {
  id: string;
  message: string;
  role: "client" | "creator" | "visitor" | null;
  contact_email: string | null;
  page_url: string | null;
  created_at: string;
}

export interface Knock {
  id: string;
  creator_id: string;
  visitor_key: string;
  page_url: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface CreatorWithPortfolio extends CreatorProfile {
  portfolio_items: PortfolioItem[];
}
