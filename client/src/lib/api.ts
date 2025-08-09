import axios from "axios";

// API base URL - adjust this to match your backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          localStorage.setItem("accessToken", accessToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch {
        // Refresh failed, redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

// Types
export interface User {
  id: number;
  name: string;
  email: string;
  createdAt?: string;
}

export interface Trip {
  id: number;
  title: string;
  description: string | null;
  creatorId: number;
  destination: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  creator: string | null;
}

export interface TripWithCreator extends Trip {
  creator: string;
}

export interface TripDay {
  id: number;
  tripId: number;
  day: string;
  createdAt: string;
}

export interface TripWithDays {
  trip: Trip;
  days: TripDay[];
}

export interface DaySelection {
  id: number;
  userId: number | null;
  guestName: string | null;
  tripDayId: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TripDayWithSelections {
  tripDay: TripDay;
  selections: DaySelection[];
}

export interface TripWithDaysAndSelections {
  trip: Trip;
  days: TripDayWithSelections[];
}

// Auth API functions
export const authAPI = {
  register: async (data: { name: string; email: string; password: string }) => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post("/auth/login", data);
    const { accessToken, refreshToken } = response.data;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    return response.data;
  },

  logout: async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      try {
        await api.post("/auth/logout", { refreshToken });
      } catch {
        // Continue with logout even if API call fails
      }
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },

  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await api.post("/auth/refresh", { refreshToken });
    return response.data;
  },
};

// Trip API functions
export const tripAPI = {
  getAllTrips: async () => {
    const response = await api.get("/trip/trips");
    return response.data;
  },

  getTrip: async (tripId: number) => {
    const response = await api.get(`/trip/${tripId}`);
    return response.data;
  },

  createTrip: async (data: {
    title: string;
    description?: string;
    destination?: string;
    days: string[];
  }) => {
    const response = await api.post("/trip", data);
    return response.data;
  },

  deleteTrip: async (tripId: number) => {
    const response = await api.delete(`/trip/${tripId}`);
    return response.data;
  },

  addTripDay: async (tripId: number, data: { day: string }) => {
    const response = await api.post(`/trip/${tripId}/days`, data);
    return response.data;
  },

  getTripDay: async (tripId: number, dayId: number) => {
    const response = await api.get(`/trip/${tripId}/days/${dayId}`);
    return response.data;
  },

  createDaySelection: async (
    tripId: number,
    dayId: number,
    data: { guestName?: string; notes?: string },
  ) => {
    const response = await api.post(
      `/trip/${tripId}/days/${dayId}/selections`,
      data,
    );
    return response.data;
  },

  createGuestDaySelection: async (
    tripId: number,
    dayId: number,
    data: { guestName: string; notes?: string },
  ) => {
    const response = await api.post(
      `/trip/${tripId}/days/${dayId}/guest-selections`,
      data,
    );
    return response.data;
  },

  updateDaySelection: async (
    tripId: number,
    dayId: number,
    selectionId: number,
    data: { notes?: string },
  ) => {
    const response = await api.put(
      `/trip/${tripId}/days/${dayId}/selections/${selectionId}`,
      data,
    );
    return response.data;
  },

  deleteDaySelection: async (
    tripId: number,
    dayId: number,
    selectionId: number,
  ) => {
    const response = await api.delete(
      `/trip/${tripId}/days/${dayId}/selections/${selectionId}`,
    );
    return response.data;
  },
};

export default api;
