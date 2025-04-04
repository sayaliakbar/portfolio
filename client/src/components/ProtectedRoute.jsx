import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "../context/auth0-context";
import { useAdmin } from "../context/AdminContext";

const ProtectedRoute = ({ children }) => {
  const {
    isAuthenticated: isAuth0Authenticated,
    isLoading: isAuth0Loading,
    loginWithRedirect,
  } = useAuth0();
  const { isAuthenticated: isJwtAuthenticated, isLoading: isJwtLoading } =
    useAdmin();
  const navigate = useNavigate();

  // Check both authentication methods
  const isAuthenticated = isAuth0Authenticated || isJwtAuthenticated;
  const isLoading = isAuth0Loading || isJwtLoading;

  useEffect(() => {
    const checkAuth = async () => {
      if (!isLoading && !isAuthenticated) {
        // If using Auth0, redirect to Auth0 login
        if (import.meta.env.VITE_AUTH0_DOMAIN) {
          await loginWithRedirect({
            appState: { returnTo: window.location.pathname },
          });
        } else {
          // Otherwise redirect to our custom login
          navigate("/admin/login", { replace: true });
        }
      }
    };

    checkAuth();
  }, [isAuthenticated, isLoading, loginWithRedirect, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : null;
};

export default ProtectedRoute;
