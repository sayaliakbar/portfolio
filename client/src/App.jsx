import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Auth0Login from "./components/Auth0Login";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth0 } from "./context/auth0-context";
import { AdminProvider } from "./context/AdminContext";
import { useEffect } from "react";
import { initializeAuth } from "./utils/auth";

function App() {
  const { isLoading } = useAuth0();

  // Initialize auth from localStorage on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {/* Public routes accessible to everyone */}
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />

            {/* Admin authentication */}
            <Route path="/admin/login" element={<Auth0Login />} />

            {/* Protected admin routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        <ScrollToTop />
      </div>
    </AdminProvider>
  );
}

export default App;
