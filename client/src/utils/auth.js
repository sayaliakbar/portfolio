import api from "./api";

/**
 * Login with username and password
 * @param {string} username Username
 * @param {string} password Password
 * @returns {Promise<Object>} Response with token if successful
 */
export const login = async (username, password) => {
  try {
    const response = await api.post("/auth/login", { username, password });

    if (response.data.token) {
      // Store token in localStorage
      localStorage.setItem("authToken", response.data.token);
      localStorage.setItem("isAuthenticated", "true");

      return {
        success: true,
        token: response.data.token,
      };
    }

    return {
      success: false,
      message: "Login failed",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.msg || "Login failed",
    };
  }
};

/**
 * Logout the user
 * @returns {Promise<Object>} Success status
 */
export const logout = async () => {
  try {
    // Call the server logout endpoint to invalidate the refresh token
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Error calling server logout endpoint:", error);
      // Continue with local logout even if server call fails
    }

    // Clear all auth data from localStorage
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("isAuthenticated");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Logout error:", error);
    return {
      success: false,
      message: "Logout failed",
    };
  }
};

/**
 * Check if the user is authenticated
 * @returns {boolean} Whether the user is authenticated
 */
export const isAuthenticated = () => {
  return localStorage.getItem("isAuthenticated") === "true";
};

/**
 * Check authentication status asynchronously
 * @returns {Promise<boolean>} Promise that resolves to authentication status
 */
export const getAuthStatus = async () => {
  return Promise.resolve(localStorage.getItem("isAuthenticated") === "true");
};

/**
 * Refresh the JWT token using a refresh token
 * @returns {Promise<Object>} New token if successful, or error
 */
export const refreshToken = async () => {
  try {
    const currentRefreshToken = localStorage.getItem("refreshToken");

    if (!currentRefreshToken) {
      return {
        success: false,
        message: "No refresh token available",
      };
    }

    const response = await api.post("/auth/refresh", {
      refreshToken: currentRefreshToken,
    });

    if (response.data.token) {
      // Store new token in localStorage
      localStorage.setItem("authToken", response.data.token);

      return {
        success: true,
        token: response.data.token,
      };
    }

    return {
      success: false,
      message: "Failed to refresh token",
    };
  } catch (error) {
    console.error("Token refresh error:", error);

    // If refresh fails, log the user out
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      await logout();
    }

    return {
      success: false,
      message: error.response?.data?.msg || "Token refresh failed",
    };
  }
};

export default {
  login,
  logout,
  isAuthenticated,
  getAuthStatus,
  refreshToken,
};
