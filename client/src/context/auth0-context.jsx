import { createContext, useContext } from "react";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";

// Create a context for Auth0
const Auth0Context = createContext();

// Provider component that wraps the app and makes auth object available
export const Auth0ProviderWithNavigate = ({ children }) => {
  const navigate = useNavigate();

  const domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE;
  const redirectUri = import.meta.env.VITE_AUTH0_CALLBACK_URL;

  if (!domain || !clientId) {
    return <div>Auth0 domain or client ID not configured</div>;
  }

  const onRedirectCallback = (appState) => {
    navigate(appState?.returnTo || "/admin");
  };

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        audience: audience,
        scope: "openid profile email",
      }}
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  );
};

// Re-export the useAuth0 hook
export { useAuth0 };

// Hook to use Auth0 context (if you need customizations beyond the standard hook)
export const useAuth0Context = () => useContext(Auth0Context);
