import type {
  Department,
  Interest,
  RouteGenerationResult,
  SaveRoutePayload,
  SavedRoute
} from '../types/route';

/**
 * Utility to retrieve CSRF token from document.cookie
 */
function getCsrfToken(): string | null {
  const match = document.cookie.match(/csrftoken=([\w-]+)/);
  return match ? match[1] : null;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const csrfToken = getCsrfToken();
  if (csrfToken && !headers.has('X-CSRFToken')) {
    headers.set('X-CSRFToken', csrfToken);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Ensure session cookies are sent
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
    } catch {
      // Ignore JSON parse errors for non-JSON responses
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  /**
   * Fetch list of departments
   */
  async getDepartments(): Promise<Department[]> {
    return request<Department[]>('/api/itineraries/departments/');
  },

  /**
   * Fetch list of available travel interests
   */
  async getInterests(): Promise<Interest[]> {
    return request<Interest[]>('/api/itineraries/interests/');
  },

  /**
   * Generate route suggestions using DeepSeek AI
   */
  async generateRoute(department: string, interests: string[]): Promise<RouteGenerationResult> {
    return request<RouteGenerationResult>('/api/itineraries/generate-route/', {
      method: 'POST',
      body: JSON.stringify({ department, interests }),
    });
  },

  /**
   * Save user selected route and activate it
   */
  async saveRoute(payload: SaveRoutePayload): Promise<SavedRoute> {
    return request<SavedRoute>('/api/itineraries/routes/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Fetch current user's AI permission status and group hosting capabilities
   */
  async getAIStatus(): Promise<import('../types/route').AIStatusResponse> {
    return request<import('../types/route').AIStatusResponse>('/api/itineraries/ai-status/');
  },

  /**
   * Fetch destinations in department sorted by Taguer membership, user interests in DB, and rating
   */
  async getRecommendedPlaces(department: string): Promise<import('../types/route').RecommendedPlace[]> {
    return request<import('../types/route').RecommendedPlace[]>(
      `/api/itineraries/places/recommended/?department=${encodeURIComponent(department)}`
    );
  },

  /**
   * Join an existing group itinerary via invite code or route ID
   */
  async joinGroupRoute(payload: import('../types/route').JoinGroupPayload): Promise<import('../types/route').JoinGroupResponse> {
    return request<import('../types/route').JoinGroupResponse>('/api/itineraries/routes/join/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Get group route details by ID or invite_code
   */
  async getGroupRoute(codeOrId: string | number): Promise<SavedRoute> {
    return request<SavedRoute>(`/api/itineraries/routes/${encodeURIComponent(codeOrId)}/group/`);
  },

  /**
   * Vote whether accompanying (attending=true) or discarding (attending=false) a stop in a group itinerary
   */
  async voteRouteItem(routeId: number, itemId: number, attending: boolean): Promise<import('../types/route').VoteRouteItemResponse> {
    return request<import('../types/route').VoteRouteItemResponse>(
      `/api/itineraries/routes/${routeId}/items/${itemId}/vote/`,
      {
        method: 'POST',
        body: JSON.stringify({ attending }),
      }
    );
  },

  /**
   * Get route details by ID
   */
  async getRoute(id: number): Promise<SavedRoute> {
    return request<SavedRoute>(`/api/itineraries/routes/${id}/`);
  },

  /**
   * Fetch current active route for the authenticated user / session
   */
  async getActiveRoute(): Promise<import('../types/route').ActiveRouteResponse> {
    return request<import('../types/route').ActiveRouteResponse>('/api/itineraries/routes/active/');
  },

  /**
   * Cancel an active route
   */
  async cancelRoute(routeId: number): Promise<import('../types/route').CancelRouteResponse> {
    return request<import('../types/route').CancelRouteResponse>(`/api/itineraries/routes/${routeId}/cancel/`, {
      method: 'POST',
    });
  },

  /**
   * Cleanup/unlink active route association for current user (handles error/cancelled/broken routes)
   */
  async cleanupActiveRoute(params?: { route_id?: number; invite_code?: string }): Promise<{ success: boolean; message: string; cleaned_count: number }> {
    return request<{ success: boolean; message: string; cleaned_count: number }>(
      '/api/itineraries/routes/cleanup-active/',
      {
        method: 'POST',
        body: JSON.stringify(params || {}),
      }
    );
  },

  /**
   * Mark a route stop as completed and award Paquis
   */
  async completeRouteItem(routeId: number, itemId: number): Promise<any> {
    return request<any>(`/api/itineraries/routes/${routeId}/items/${itemId}/complete/`, {
      method: 'POST',
    });
  },

  /**
   * Complete entire route and award 50 bonus Paquis
   */
  async completeRoute(routeId: number): Promise<any> {
    return request<any>(`/api/itineraries/routes/${routeId}/complete/`, {
      method: 'POST',
    });
  },

  /**
   * Get current user's Paqui wallet, balance and transactions
   */
  async getPaquiWallet(): Promise<any> {
    return request<any>('/api/gamification/wallet/');
  },

  /**
   * Get rewards catalog
   */
  async getRewardsCatalog(): Promise<any[]> {
    return request<any[]>('/api/gamification/rewards/');
  },

  /**
   * Purchase a reward using Paquis
   */
  async purchaseReward(rewardId: number): Promise<any> {
    return request<any>(`/api/gamification/rewards/${rewardId}/purchase/`, {
      method: 'POST',
    });
  },

  /**
   * Equip or unequip a digital reward
   */
  async equipReward(rewardId: number): Promise<any> {
    return request<any>(`/api/gamification/rewards/${rewardId}/equip/`, {
      method: 'POST',
    });
  },

  /**
   * Get rewards owned by the current user
   */
  async getMyRewards(): Promise<any[]> {
    return request<any[]>('/api/gamification/my-rewards/');
  }
};
