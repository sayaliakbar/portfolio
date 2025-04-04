import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Auth0ProviderWithNavigate } from "./context/auth0-context";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Auth0ProviderWithNavigate>
        <App />
      </Auth0ProviderWithNavigate>
    </BrowserRouter>
  </StrictMode>
);
