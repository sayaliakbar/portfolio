import { Navigate } from "react-router-dom";

const PublicRoute = ({ children, redirectTo = "/admin" }) => {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

  // If authenticated, redirect to the specified path
  return isAuthenticated ? <Navigate to={redirectTo} replace /> : children;
};

export default PublicRoute;
