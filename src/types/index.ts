// Order types
export interface Order {
  id?: string;
  username: string;
  platform: 'java' | 'bedrock';
  rank: string;
  price: number;
  payment_proof: string;
  created_at: string;
  status: 'pending' | 'completed' | 'rejected';
}

// Rank option type
export interface RankOption {
  id?: string;
  name: string;
  price: number;
  color: string;
  image: string;
  image_url?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  discount?: number;
  discount_expires_at?: string | null;
  is_discount_active?: boolean;
  discount_days_remaining?: number | null;
  startColor?: string;
  endColor?: string;
  gradientCss?: string;
  gradient_preset?: string;
  custom_gradient?: string;
}

// Discord webhook types
export interface DiscordEmbed {
  title?: string;
  color?: number;
  description?: string;
  fields?: {
    name: string;
    value: string;
    inline?: boolean;
  }[];
  thumbnail?: {
    url: string;
  };
  footer?: {
    text: string;
    icon_url?: string;
  };
  timestamp?: string;
  image?: {
    url: string;
  };
}

export interface DiscordWebhookContent {
  username?: string;
  avatar_url?: string;
  content?: string;
  embeds: DiscordEmbed[];
} 