import { useAuth0 } from "../context/auth0-context";
import { motion as Motion } from "framer-motion";

const Auth0Login = () => {
  const { loginWithRedirect, isAuthenticated, isLoading, error } = useAuth0();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to admin if already logged in
  if (isAuthenticated) {
    window.location.href = "/admin/dashboard";
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-md"
      >
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Admin Access Only
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            This area is restricted to site administrators only
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error.message}
          </div>
        )}

        <div className="text-center pb-6">
          <p className="text-red-600 text-sm mb-2">⚠️ Notice</p>
          <p className="text-gray-700 text-sm mb-4">
            If you're looking to view my portfolio, please return to the{" "}
            <a href="/" className="text-indigo-600 hover:text-indigo-800">
              homepage
            </a>{" "}
            or{" "}
            <a
              href="/projects"
              className="text-indigo-600 hover:text-indigo-800"
            >
              projects page
            </a>
            .
          </p>
        </div>

        <div>
          <button
            onClick={() =>
              loginWithRedirect({
                appState: { returnTo: "/admin/dashboard" },
              })
            }
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg
                className="h-5 w-5 text-indigo-300 group-hover:text-indigo-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            Administrator Login
          </button>
        </div>
      </Motion.div>
    </div>
  );
};

export default Auth0Login;
