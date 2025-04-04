import { useState, useEffect } from "react";
import { motion as Motion } from "framer-motion";
import { setup2FA, verifyAnd2FA, disable2FA } from "../utils/auth";

const TwoFactorSetup = ({ user, onSetupComplete }) => {
  // Debug output

  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [shake, setShake] = useState(false);
  const [twoFactorStatus, setTwoFactorStatus] = useState(
    user?.twoFactorEnabled || false
  );

  // Update local status when user prop changes
  useEffect(() => {
    if (user) {
      console.log(
        "User prop changed, updating twoFactorStatus:",
        user.twoFactorEnabled
      );
      setTwoFactorStatus(user.twoFactorEnabled || false);
    } else {
      // Reset status if user is null/undefined
      console.log("User is null/undefined, resetting twoFactorStatus");
      setTwoFactorStatus(false);
    }
  }, [user]);

  // Force refresh when showing the component
  useEffect(() => {
    // If onSetupComplete is available, trigger a refresh
    if (onSetupComplete && user === null) {
      console.log("Initial load with null user, requesting refresh");
      onSetupComplete();
    }
  }, []);

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Reset shake effect after animation completes
  useEffect(() => {
    if (shake) {
      const timer = setTimeout(() => {
        setShake(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shake]);

  const handleStartSetup = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await setup2FA();
      if (result.success) {
        setSetupData(result);
        setIsSettingUp(true);
      } else {
        setError(result.message || "Failed to setup 2FA");
      }
    } catch (err) {
      setError("Could not setup 2FA. Please try again.");
      console.error("2FA setup error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndEnable = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!verificationCode || verificationCode.trim() === "") {
      setError("Please enter a verification code");
      setShake(true);
      setLoading(false);
      return;
    }

    try {
      const result = await verifyAnd2FA(verificationCode);
      if (result.success) {
        // Update user object locally to reflect enabled 2FA status
        if (user) {
          user.twoFactorEnabled = true;
        }
        // Update local status state immediately
        setTwoFactorStatus(true);
        setSuccess("Two-factor authentication enabled successfully!");
        setShowBackupCodes(true);
        if (onSetupComplete) {
          onSetupComplete();
        }
      } else {
        setError(
          result.message ||
            "Verification failed. Please check your code and try again."
        );
        setShake(true);
        // Focus on the verification code input field after error
        document.getElementById("verificationCode")?.focus();
      }
    } catch (err) {
      setError("Verification failed. Please check your code and try again.");
      setShake(true);
      console.error("2FA verification error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await disable2FA(disablePassword);
      if (result.success) {
        // Update user object locally to reflect disabled 2FA status
        if (user) {
          user.twoFactorEnabled = false;
        }
        // Update local status state immediately
        setTwoFactorStatus(false);
        setSuccess("Two-factor authentication disabled successfully!");
        setIsDisabling(false);
        if (onSetupComplete) {
          onSetupComplete();
        }
      } else {
        setError(result.message || "Could not disable 2FA");
      }
    } catch (err) {
      setError("Failed to disable 2FA. Please try again.");
      console.error("2FA disable error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial state - choose setup or disable
  if (!isSettingUp && !isDisabling) {
    return (
      <Motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white p-6 rounded-lg shadow-md"
      >
        <h2 className="text-xl font-semibold mb-4">
          Two-Factor Authentication
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
            {success}
          </div>
        )}

        <div className="mb-4">
          <p className="text-gray-700 mb-2">
            Status:{" "}
            <span
              className={
                twoFactorStatus
                  ? "text-green-600 font-medium"
                  : "text-red-600 font-medium"
              }
            >
              {twoFactorStatus ? "Enabled" : "Disabled"}
            </span>
          </p>
          <p className="text-sm text-gray-500">
            Two-factor authentication adds an extra layer of security to your
            account by requiring a verification code in addition to your
            password when signing in.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {twoFactorStatus ? (
            <button
              type="button"
              onClick={() => setIsDisabling(true)}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
            >
              Disable 2FA
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartSetup}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded"
            >
              {loading ? "Loading..." : "Setup 2FA"}
            </button>
          )}
        </div>
      </Motion.div>
    );
  }

  // Disable 2FA form
  if (isDisabling) {
    return (
      <Motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white p-6 rounded-lg shadow-md"
      >
        <h2 className="text-xl font-semibold mb-4">
          Disable Two-Factor Authentication
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        <p className="text-sm text-gray-500 mb-4">
          To disable two-factor authentication, please confirm your password.
        </p>

        <form onSubmit={handleDisable2FA}>
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              required
              className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
            >
              {loading ? "Processing..." : "Disable 2FA"}
            </button>
            <button
              type="button"
              onClick={() => setIsDisabling(false)}
              disabled={loading}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </Motion.div>
    );
  }

  // 2FA setup flow
  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white p-6 rounded-lg shadow-md"
    >
      <h2 className="text-xl font-semibold mb-4">
        {showBackupCodes
          ? "Save Your Backup Codes"
          : "Setup Two-Factor Authentication"}
      </h2>

      {/* Only show main error box for non-verification errors or during backup codes display */}
      {error && (showBackupCodes || !verificationCode) && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          {success}
        </div>
      )}

      {showBackupCodes ? (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            <strong>Important:</strong> Store these backup codes in a secure
            location. Each code can be used once to sign in if you lose access
            to your authenticator app.
          </p>

          <div className="bg-gray-100 p-4 rounded mb-4 font-mono text-sm">
            {setupData?.backupCodes?.map((code, index) => (
              <div key={index} className="mb-1">
                {code}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setShowBackupCodes(false);
              setIsSettingUp(false);
              if (onSetupComplete) {
                onSetupComplete();
              }
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded"
          >
            I've Saved My Backup Codes
          </button>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Scan the QR code with your authenticator app (like Google
            Authenticator, Authy, or Microsoft Authenticator), then enter the
            verification code provided by the app.
          </p>

          <div className="flex flex-col items-center mb-4">
            <div className="mb-3 text-center">
              <div className="flex items-center justify-center mb-2">
                <img
                  src="/favicon.svg"
                  alt="PortfolioApp Logo"
                  className="w-8 h-8 mr-2"
                />
                <h3 className="text-lg font-semibold">PortfolioApp</h3>
              </div>
              <p className="text-sm text-gray-600">
                Authenticator setup for {user?.username}
              </p>
            </div>

            {setupData?.qrCode && (
              <div className="border p-3 rounded shadow-sm">
                <img
                  src={setupData.qrCode}
                  alt="QR Code for 2FA"
                  className="w-48 h-48"
                />
              </div>
            )}
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">
              If you can't scan the QR code, enter this code manually in your
              app:
            </p>
            <div className="bg-gray-100 p-2 rounded font-mono text-center">
              {setupData?.secret}
            </div>
          </div>

          <form onSubmit={handleVerifyAndEnable}>
            <div className="mb-4">
              <label
                htmlFor="verificationCode"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Verification Code
              </label>
              <Motion.div
                animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.5 }}
              >
                <input
                  type="text"
                  id="verificationCode"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  className={`border ${
                    error
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  } rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                />
              </Motion.div>
              {error && !showBackupCodes && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded"
              >
                {loading ? "Verifying..." : "Verify and Enable"}
              </button>
              <button
                type="button"
                onClick={() => setIsSettingUp(false)}
                disabled={loading}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </Motion.div>
  );
};

export default TwoFactorSetup;
