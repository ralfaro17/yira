export type RewardType = 'AVATAR_ITEM' | 'BADGE' | 'PROFILE_TITLE' | 'MAP_PIN' | 'MERCH';

export interface PaquiTransaction {
  id: number;
  amount: number;
  base_amount: number;
  multiplier_applied: string | number;
  transaction_type: string;
  message: string;
  created_at: string;
}

export interface PaquiWallet {
  balance: number;
  lifetime_earned: number;
  membership_multiplier: number;
  has_active_membership: boolean;
  recent_transactions: PaquiTransaction[];
  updated_at: string;
}

export interface RewardItem {
  id: number;
  name: string;
  slug: string;
  description: string;
  cost_paquis: number;
  reward_type: RewardType;
  icon_or_image_url: string;
  is_active: boolean;
  already_owned: boolean;
  is_equipped: boolean;
}

export interface UserReward {
  id: number;
  reward: RewardItem;
  purchased_at: string;
  is_equipped: boolean;
}

export interface StopCompletionResult {
  success: boolean;
  already_completed: boolean;
  message: string;
  paquis_earned: number;
  current_balance: number;
  multiplier_applied?: number;
  all_stops_completed?: boolean;
}

export interface RouteCompletionResult {
  success: boolean;
  already_completed: boolean;
  message: string;
  paquis_earned: number;
  current_balance: number;
  multiplier_applied?: number;
}
