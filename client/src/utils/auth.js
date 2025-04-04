import api from "./api";

// Set auth token in localStorage and axios headers
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("token", token);
    api.defaults.headers.common["x-auth-token"] = token;
  } else {
    localStorage.removeItem("token");
    delete api.defaults.headers.common["x-auth-token"];
  }
};

// Set refresh token in localStorage
export const setRefreshToken = (token) => {
  if (token) {
    localStorage.setItem("refreshToken", token);
  } else {
    localStorage.removeItem("refreshToken");
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

// Check if token is valid
export const isAuthenticated = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      // Try to refresh the token
      const refreshed = await refreshAuthToken();
      return refreshed;
    }

    // Set the token in headers
    api.defaults.headers.common["x-auth-token"] = token;

    // Verify token by making a request to auth endpoint
    await api.get("/auth");
    return true;
  } catch (error) {
    console.error("Auth verification error:", error);

    // If the error is due to an expired token, try to refresh it
    if (error.response && error.response.status === 401) {
      const refreshed = await refreshAuthToken();
      return refreshed;
    }

    // Clear invalid token
    setAuthToken(null);
    setRefreshToken(null);
    return false;
  }
};

// Refresh the auth token using the refresh token
export const refreshAuthToken = async () => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
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
  const token = localStorage.getItem("token");
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
