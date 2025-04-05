import api from "./api";
import { jwtDecode } from "jwt-decode";

// Add these variables at the top of the file, after imports
let lastAuthCheckTime = 0;
let lastAuthCheckResult = null;
const AUTH_CHECK_CACHE_DURATION = 10000; // 10 seconds

// Set auth token in localStorage and axios headers
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("auth_token", token);
    api.defaults.headers.common["x-auth-token"] = token;
  } else {
    localStorage.removeItem("auth_token");
    delete api.defaults.headers.common["x-auth-token"];
  }
};

// Set refresh token in localStorage
export const setRefreshToken = (token) => {
  if (token) {
    localStorage.setItem("refresh_token", token);
  } else {
    localStorage.removeItem("refresh_token");
  }
};

// Set 2FA temporary token
export const setTempToken = (token) => {
  if (token) {
    sessionStorage.setItem("tempToken", token);
  } else {
    sessionStorage.removeItem("tempToken");
  }
};

// Get the temporary token
export const getTempToken = () => {
  return sessionStorage.getItem("tempToken");
};

// Optimized function to check authentication with caching
export const getAuthStatus = async (forceCheck = false) => {
  const now = Date.now();

  // Return cached result if not expired and not forced to check
  if (
    !forceCheck &&
    lastAuthCheckResult !== null &&
    now - lastAuthCheckTime < AUTH_CHECK_CACHE_DURATION
  ) {
    console.log("Using cached auth status:", lastAuthCheckResult);
    return lastAuthCheckResult;
  }

  // Perform new authentication check
  try {
    // First, check if token exists and is valid without API call
    const token = localStorage.getItem("auth_token");
    if (!token) {
      console.log("No token found, attempting refresh");
      const refreshed = await refreshAuthToken();
      lastAuthCheckTime = Date.now();
      lastAuthCheckResult = refreshed;
      return refreshed;
    }

    // Check if token is expired without API call
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      if (decoded.exp < currentTime) {
        console.log("Token expired, attempting refresh");
        const refreshed = await refreshAuthToken();
        lastAuthCheckTime = Date.now();
        lastAuthCheckResult = refreshed;
        return refreshed;
      }

      // Token is valid, set in headers and return true
      api.defaults.headers.common["x-auth-token"] = token;
      lastAuthCheckTime = Date.now();
      lastAuthCheckResult = true;
      return true;
    } catch (decodeError) {
      console.error("Token decode error:", decodeError);

      // Try to refresh on decode error
      const refreshed = await refreshAuthToken();
      lastAuthCheckTime = Date.now();
      lastAuthCheckResult = refreshed;
      return refreshed;
    }
  } catch (error) {
    console.error("Auth check error:", error);
    lastAuthCheckTime = Date.now();
    lastAuthCheckResult = false;
    return false;
  }
};

// Refresh the auth token using the refresh token
export const refreshAuthToken = async () => {
  try {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      return false;
    }

    const response = await api.post("/auth/refresh", { refreshToken });
    const { token } = response.data;

    // Set the new access token
    setAuthToken(token);

    return true;
  } catch (error) {
    console.error("Token refresh error:", error);

    // Clear tokens on refresh failure
    setAuthToken(null);
    setRefreshToken(null);
    return false;
  }
};

// Login user
export const loginUser = async (credentials) => {
  try {
    const response = await api.post("/auth/login", credentials);

    // Check if 2FA is required
    if (response.data.requiresTwoFactor) {
      // Store temporary token for 2FA verification
      setTempToken(response.data.tempToken);

      return {
        success: true,
        requiresTwoFactor: true,
      };
    }

    const { token, refreshToken } = response.data;

    // Set tokens in localStorage and headers
    setAuthToken(token);
    setRefreshToken(refreshToken);

    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Login failed",
    };
  }
};

// Verify 2FA code
export const verify2FA = async (code, isBackupCode = false) => {
  try {
    const tempToken = getTempToken();

    if (!tempToken) {
      return {
        success: false,
        message: "2FA session expired. Please login again.",
      };
    }

    const response = await api.post("/auth/verify-2fa", {
      tempToken,
      code,
      isBackupCode,
    });

    const { token, refreshToken } = response.data;

    // Clear temporary token
    setTempToken(null);

    // Set tokens in localStorage and headers
    setAuthToken(token);
    setRefreshToken(refreshToken);

    return { success: true };
  } catch (error) {
    console.error("2FA verification error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Verification failed",
    };
  }
};

// Setup 2FA for the user
export const setup2FA = async () => {
  try {
    const response = await api.post("/auth/setup-2fa");
    return {
      success: true,
      ...response.data,
    };
  } catch (error) {
    console.error("2FA setup error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "2FA setup failed",
    };
  }
};

// Verify and enable 2FA
export const verifyAnd2FA = async (token) => {
  try {
    await api.post("/auth/verify-setup-2fa", { token });
    return { success: true };
  } catch (error) {
    console.error("2FA verification error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "2FA verification failed",
    };
  }
};

// Disable 2FA
export const disable2FA = async (password) => {
  try {
    await api.post("/auth/disable-2fa", { password });
    return { success: true };
  } catch (error) {
    console.error("Disable 2FA error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to disable 2FA",
    };
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    // Call the logout endpoint to invalidate the refresh token
    await api.post("/auth/logout");
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // Clear tokens regardless of server response
    setAuthToken(null);
    setRefreshToken(null);
    setTempToken(null);
  }
};

// Initialize auth by setting token from localStorage
export const initializeAuth = () => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    setAuthToken(token);
  }
};

// Register admin (should be used only once for initial setup)
export const registerAdmin = async (credentials) => {
  try {
    const response = await api.post("/auth/register", credentials);
    const { token, refreshToken } = response.data;

    // Set tokens in localStorage and headers
    setAuthToken(token);
    setRefreshToken(refreshToken);

    return { success: true };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Registration failed",
    };
  }
};

// Debug function to check authentication status
export const checkAuthStatus = async () => {
  // Use cached auth check by default
  return await getAuthStatus();

  /* Original implementation with API call:
  try {
    const response = await api.get("/auth/check-auth");
    console.log("Auth status:", response.data);
    return response.data.authenticated;
  } catch (error) {
    console.error("Auth check error:", error);
    return false;
  }
  */
};

// Check if token is valid and not expired (uses cached auth status)
export const isAuthenticated = async (forceCheck = false) => {
  return await getAuthStatus(forceCheck);
};
