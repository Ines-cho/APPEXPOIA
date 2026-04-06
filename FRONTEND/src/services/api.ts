// services/api.ts
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = 'http://localhost:8000';

// Get auth token for authenticated requests
const getAuthHeaders = (): Record<string, string> => {
  // For now, we'll get token from context when needed
  // This is a simplified version - in production you'd handle this differently
  return {};
};

// Generic API request function
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Dashboard API
export const dashboardAPI = {
  getDashboardData: async (userId: string) => {
    return apiRequest(`/dashboard/${userId}`);
  },
};

// Profile API
export const profileAPI = {
  getLatestProfile: async (userId: string) => {
    return apiRequest(`/profiles/${userId}`);
  },
  saveProfile: async (profileData: any) => {
    return apiRequest('/profiles/save', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  },
  analyzeProfile: async (profileData: any) => {
    return apiRequest('/analyse-profil', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  },
};

// Meal Plan API
export const mealPlanAPI = {
  getLatestPlan: async (userId: string) => {
    return apiRequest(`/plans/${userId}/latest`);
  },
  getPlanHistory: async (userId: string, limit: number = 12) => {
    return apiRequest(`/plans/${userId}/history?limit=${limit}`);
  },
  generateWeeklyPlan: async (profileData: any) => {
    return apiRequest('/plan-semaine', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  },
};

// Progress API
export const progressAPI = {
  getProgress: async (userId: string) => {
    return apiRequest(`/progression/${userId}`);
  },
  addProgressEntry: async (progressData: any) => {
    return apiRequest('/progression/entry', {
      method: 'POST',
      body: JSON.stringify(progressData),
    });
  },
};

// Grocery List API (derived from meal plan)
export const groceryAPI = {
  getGroceryList: async (userId: string) => {
    try {
      const plan = await mealPlanAPI.getLatestPlan(userId);
      return plan.mobile?.grocery_list || [];
    } catch (error) {
      console.error('Error fetching grocery list:', error);
      return [];
    }
  },
};

export default {
  dashboardAPI,
  profileAPI,
  mealPlanAPI,
  progressAPI,
  groceryAPI,
};
