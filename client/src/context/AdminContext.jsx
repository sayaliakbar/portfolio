import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { isAuthenticated, refreshAuthToken } from "../utils/auth";

// Create context
const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    isLoading: true,
    tokenExpiration: null,
    user: null,
  });
  const navigate = useNavigate();

  // Check token on component mount and set up expiration check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is authenticated
        const authResult = await isAuthenticated();

        if (authResult) {
          // Get token and decode it to get expiration
          const token = localStorage.getItem("auth_token");
          if (token) {
            const decoded = jwtDecode(token);

            // Set auth state with expiration time
            setAuthState({
              isAuthenticated: true,
              isLoading: false,
              tokenExpiration: decoded.exp * 1000, // Convert to milliseconds
              user: decoded.user,
            });
          } else {
            setAuthState({
              isAuthenticated: true,
              isLoading: false,
              tokenExpiration: null,
              user: null,
            });
          }
        } else {
          // Not authenticated
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            tokenExpiration: null,
            user: null,
          });
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          tokenExpiration: null,
          user: null,
        });
      }
    };

    checkAuth();
  }, []);

  // Set up timer to check token expiration
  useEffect(() => {
    let tokenCheckInterval;

    if (authState.isAuthenticated && authState.tokenExpiration) {
      // Check every minute if token is about to expire
      tokenCheckInterval = setInterval(async () => {
        const expiresIn = authState.tokenExpiration - Date.now();

        // If token expires in less than 2 minutes, try to refresh
        if (expiresIn < 120000) {
          console.log("Token expiring soon, attempting refresh");
          const refreshed = await refreshAuthToken();

          if (!refreshed) {
            // Refresh failed, redirect to login
            console.log("Token refresh failed, redirecting to login");
            logout();
            navigate("/admin/login");
          } else {
            // Update token expiration after refresh
            const token = localStorage.getItem("auth_token");
            if (token) {
              const decoded = jwtDecode(token);
              setAuthState((prev) => ({
                ...prev,
                tokenExpiration: decoded.exp * 1000,
              }));
            }
          }
        }
      }, 60000); // Check every minute
    }

    return () => {
      if (tokenCheckInterval) clearInterval(tokenCheckInterval);
    };
  }, [authState.isAuthenticated, authState.tokenExpiration, navigate]);

  // Function to logout user
  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      tokenExpiration: null,
      user: null,
    });
  };

  // Function to set authenticated state after login
  const login = (token) => {
    try {
      const decoded = jwtDecode(token);
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        tokenExpiration: decoded.exp * 1000,
        user: decoded.user,
      });
    } catch (error) {
      console.error("Token decode error:", error);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        tokenExpiration: null,
        user: null,
      });
    }
  };

  return (
    <AdminContext.Provider
      value={{
        ...authState,
        login,
        logout,
        checkAuth: isAuthenticated,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

// Custom hook to use the admin context
export const useAdmin = () => useContext(AdminContext);

export default AdminContext;
