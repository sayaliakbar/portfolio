import { useState } from "react";
import { motion as Motion } from "framer-motion";
import { loginUser, registerAdmin, verify2FA } from "../utils/auth";

const AdminLogin = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [isUsingBackupCode, setIsUsingBackupCode] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // If we're in 2FA verification mode
      if (requiresTwoFactor) {
        const result = await verify2FA(twoFactorCode, isUsingBackupCode);

        if (result.success) {
          onLogin(true);
        } else {
          setError(result.message);
        }
      } else {
        // Normal login/register flow
        const result = isRegister
          ? await registerAdmin({ username, password })
          : await loginUser({ username, password });

        if (result.success) {
          // Check if 2FA is required
          if (result.requiresTwoFactor) {
            setRequiresTwoFactor(true);
          } else {
            onLogin(true);
          }
        } else {
          // Show appropriate message based on the error
          if (
            result.message &&
            result.message.includes("Access denied from your location")
          ) {
            setError(
              "This admin area is restricted to authorized locations only."
            );
          } else {
            setError(result.message);
          }
        }
      }
    } catch (err) {
      if (
        err.response &&
        err.response.status === 403 &&
        err.response.data &&
        err.response.data.message &&
        err.response.data.message.includes("Access denied")
      ) {
        setError("This admin area is restricted to authorized locations only.");
      } else {
        setError("Authentication failed. Please try again.");
      }
      console.error("Authentication error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleUsingBackupCode = () => {
    setIsUsingBackupCode(!isUsingBackupCode);
    setTwoFactorCode("");
  };

  const handleBackToLogin = () => {
    setRequiresTwoFactor(false);
    setTwoFactorCode("");
    setIsUsingBackupCode(false);
  };

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
            {requiresTwoFactor
              ? "Two-Factor Authentication"
              : isRegister
              ? "Admin Setup"
              : "Admin Login"}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {requiresTwoFactor
              ? `Enter the ${
                  isUsingBackupCode ? "backup code" : "verification code"
                } from your authenticator app`
              : isRegister
              ? "Create the admin account for your portfolio"
              : "Enter your credentials to access the admin dashboard"}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {requiresTwoFactor ? (
            <div>
              <div className="rounded-md shadow-sm">
                <div>
                  <label htmlFor="twoFactorCode" className="sr-only">
                    {isUsingBackupCode ? "Backup Code" : "Authentication Code"}
                  </label>
                  <input
                    id="twoFactorCode"
                    name="twoFactorCode"
                    type="text"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder={
                      isUsingBackupCode ? "Backup Code" : "Authentication Code"
                    }
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  className="text-indigo-600 hover:text-indigo-800 text-sm transition-colors cursor-pointer"
                  onClick={toggleUsingBackupCode}
                >
                  {isUsingBackupCode
                    ? "Use authentication code instead"
                    : "Use backup code instead"}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="username" className="sr-only">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer${
                loading ? " opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg
                    className="animate-spin h-5 w-5 text-indigo-300"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </span>
              ) : (
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
              )}
              {loading
                ? "Verifying..."
                : requiresTwoFactor
                ? "Verify"
                : isRegister
                ? "Create Admin Account"
                : "Sign in"}
            </button>
          </div>

          <div className="text-center">
            {requiresTwoFactor ? (
              <button
                type="button"
                className="text-indigo-600 hover:text-indigo-800 text-sm transition-colors cursor-pointer"
                onClick={handleBackToLogin}
              >
                Back to login
              </button>
            ) : (
              <button
                type="button"
                className="text-indigo-600 hover:text-indigo-800 text-sm transition-colors cursor-pointer"
                onClick={() => setIsRegister(!isRegister)}
              >
                {isRegister
                  ? "Already have an account? Sign in"
                  : "First time setup? Create admin account"}
              </button>
            )}
          </div>
        </form>
      </Motion.div>
    </div>
  );
};

export default AdminLogin;
