export interface Department {
  id: string;
  name: string;
  tagline: string;
  is_available: boolean;
  description: string;
  image_url: string;
  highlight_tags: string[];
}

export interface Interest {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface Place {
  id: number;
  name: string;
  department: string;
  category: string;
  description: string;
  address?: string | null;
  latitude: number;
  longitude: number;
  image_url?: string | null;
  is_business: boolean;
  has_membership: boolean;
  estimated_duration_minutes: number;
  rating: number;
  order?: number;
  ai_recommendation_reason?: string;
}

export interface RecommendedPlace extends Place {
  matched_interests: string[];
  is_partner_promoted: boolean;
  recommendation_score: number;
  recommendation_reason: string;
}

export interface RouteGenerationResult {
  title: string;
  summary: string;
  estimated_total_hours: number;
  places: Place[];
  ai_generations_used?: number;
  is_premium?: boolean;
  free_trials_left?: number;
}

export interface AIStatusResponse {
  is_premium: boolean;
  ai_generations_used: number;
  can_use_ai: boolean;
  can_host_group: boolean;
  free_trials_left: number;
}

export interface SaveRouteItemPayload {
  place_id: number;
  order: number;
  ai_recommendation_reason?: string;
}

export interface SaveRoutePayload {
  title: string;
  department: string;
  selected_interests: string[];
  is_group?: boolean;
  is_ai_generated?: boolean;
  items: SaveRouteItemPayload[];
}

export interface RouteParticipant {
  id: number;
  user: {
    id: number;
    username: string;
    display: string;
    has_profile_picture?: boolean;
    profile_picture_url?: string | null;
  };
  is_host: boolean;
  joined_at: string;
}

export interface RouteItemDetail {
  id: number;
  order: number;
  place: Place;
  ai_recommendation_reason?: string;
  is_completed: boolean;
  my_completed?: boolean;
  attending_users_count?: number;
  attending_users?: Array<{
    id: number;
    username: string;
    display: string;
  }>;
  my_attending?: boolean;
}

export interface SavedRoute {
  id: number;
  title: string;
  department: string;
  selected_interests: string[];
  status: string;
  created_at: string;
  is_group: boolean;
  is_ai_generated: boolean;
  invite_code: string | null;
  host: {
    id: number;
    username: string;
    display: string;
  } | null;
  is_host: boolean;
  is_participant: boolean;
  participants_count: number;
  participants: RouteParticipant[];
  items: RouteItemDetail[];
}

export interface JoinGroupPayload {
  invite_code?: string;
  route_id?: number;
}

export interface JoinGroupResponse {
  success: boolean;
  message: string;
  route: SavedRoute;
}

export interface VoteRouteItemResponse {
  success: boolean;
  item_id: number;
  place_name: string;
  attending: boolean;
  message: string;
}

export interface ActiveRouteResponse {
  has_active_route: boolean;
  route: SavedRoute | null;
}

export interface CancelRouteResponse {
  success: boolean;
  message: string;
  route_id: number;
}
