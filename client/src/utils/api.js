import axios from "axios";
import { jwtDecode } from "jwt-decode";

// Create an axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Initialize with token from localStorage if available
const token = localStorage.getItem("auth_token");
if (token) {
  api.defaults.headers.common["x-auth-token"] = token;
  console.log("Initialized API with token from localStorage");
}

// Helper function to check if token is expired
const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    console.error("Error decoding token:", error);
    return true;
  }
};

// Request interceptor - Add auth token and check expiration
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem("auth_token");
    console.log("API Request to:", config.url);
    console.log("Token exists:", !!token);

    // If token exists, check if it's expired
    if (token) {
      if (isTokenExpired(token)) {
        // Token is expired - clear localStorage and redirect to login
        console.log("Token expired, redirecting to login");
        localStorage.removeItem("auth_token");
        localStorage.removeItem("refresh_token");

        // If not on login page already, redirect
        if (!window.location.pathname.includes("/admin/login")) {
          window.location.href = "/admin/login";
        }
        return Promise.reject("Token expired");
      }

      // Token is valid, add to headers
      config.headers["x-auth-token"] = token;
      console.log("Added token to request headers");
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 Unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      // Clear tokens on authentication error
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");

      // Redirect to login if not already there
      if (!window.location.pathname.includes("/admin/login")) {
        console.log("Unauthorized, redirecting to login");
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const fetchProjects = async () => {
  try {
    const response = await api.get("/projects");
    return response.data;
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
};

export const fetchFeaturedProjects = async () => {
  try {
    const response = await api.get("/projects/featured");
    return response.data;
  } catch (error) {
    console.error("Error fetching featured projects:", error);
    throw error;
  }
};

export const fetchProjectById = async (id) => {
  try {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching project ${id}:`, error);
    throw error;
  }
};

export const createProject = async (projectData) => {
  try {
    const response = await api.post("/projects", projectData);
    return response.data;
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

export const updateProject = async (id, projectData) => {
  try {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  } catch (error) {
    console.error(`Error updating project ${id}:`, error);
    throw error;
  }
};

export const deleteProject = async (id) => {
  try {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting project ${id}:`, error);
    throw error;
  }
};

export const sendMessage = async (messageData) => {
  try {
    // Set a timeout to detect slow/unresponsive server
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await api.post("/messages", messageData, {
      signal: controller.signal,
    });

    // Clear timeout since request completed
    clearTimeout(timeoutId);

    // Return the data from the response
    return response.data;
  } catch (error) {
    // Check if this was a timeout error
    if (error.name === "AbortError") {
      throw new Error("Request timed out. Server may be down or unreachable.");
    }

    console.error("Error sending message:", error);
    throw error;
  }
};

// New Message API functions
export const fetchMessages = async () => {
  try {
    // Ensure token is included
    const token = localStorage.getItem("auth_token");
    const headers = token ? { "x-auth-token": token } : {};

    const response = await api.get("/messages", { headers });
    return response.data;
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
};

export const fetchUnreadMessageCount = async () => {
  try {
    // Ensure token is included
    const token = localStorage.getItem("auth_token");
    const headers = token ? { "x-auth-token": token } : {};

    const response = await api.get("/messages/unread-count", { headers });
    return response.data.count;
  } catch (error) {
    console.error("Error fetching unread message count:", error);
    throw error;
  }
};

export const markMessageAsRead = async (id) => {
  let attempts = 0;
  const maxAttempts = 3;

  const attemptMarkAsRead = async () => {
    try {
      // Ensure token is included
      const token = localStorage.getItem("auth_token");
      const headers = token ? { "x-auth-token": token } : {};

      // Try POST instead of PATCH as some servers may not handle PATCH properly
      const response = await api.post(`/messages/${id}/read`, {}, { headers });
      console.log("Mark as read response:", response);
      return response.data;
    } catch (error) {
      console.error(
        `Attempt ${attempts + 1} failed: Error marking message ${id} as read:`,
        error
      );

      if (attempts < maxAttempts - 1) {
        attempts++;
        console.log(`Retrying (${attempts}/${maxAttempts - 1})...`);
        return attemptMarkAsRead(); // Retry
      }

      throw error; // If we've reached max attempts, rethrow the error
    }
  };

  return attemptMarkAsRead();
};

export const deleteMessage = async (id) => {
  try {
    // Ensure token is included
    const token = localStorage.getItem("auth_token");
    const headers = token ? { "x-auth-token": token } : {};

    const response = await api.delete(`/messages/${id}`, { headers });
    return response.data;
  } catch (error) {
    console.error(`Error deleting message ${id}:`, error);
    throw error;
  }
};

export const uploadProjectImage = async (imageFile) => {
  try {
    // Create form data
    const formData = new FormData();
    formData.append("image", imageFile);

    // Set content type to multipart/form-data for file upload
    const response = await api.post("/uploads/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

export const deleteProjectImage = async (publicId) => {
  try {
    const response = await api.delete(`/uploads/image/${publicId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
};

export default api;
