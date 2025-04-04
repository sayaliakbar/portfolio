import { useState, useEffect } from "react";
import axios from "axios";

const CloudflareAccessInfo = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [adminStatus, setAdminStatus] = useState(false);

  useEffect(() => {
    const checkCloudflareAccess = async () => {
      try {
        setLoading(true);
        // The Cloudflare Access JWT is automatically included in headers
        // when a request is made through a Cloudflare Access protected domain
        const userResponse = await axios.get("/api/cloudflare/me");
        setUserData(userResponse.data);

        const adminResponse = await axios.get("/api/cloudflare/check-admin");
        setAdminStatus(adminResponse.data.isAdmin);

        setLoading(false);
      } catch (err) {
        console.error("Cloudflare Access error:", err);
        setError(
          "Error authenticating with Cloudflare Access. Please ensure you are accessing this site through your Cloudflare Access URL."
        );
        setLoading(false);
      }
    };

    checkCloudflareAccess();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="ml-3">Verifying Cloudflare Access...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">
        Cloudflare Access Authentication
      </h2>

      {userData ? (
        <div className="space-y-4">
          <div className="flex items-center">
            <span className="font-medium mr-2">Email:</span>
            <span>{userData.email}</span>
          </div>

          <div className="flex items-center">
            <span className="font-medium mr-2">Name:</span>
            <span>{userData.name || "Not provided"}</span>
          </div>

          <div className="flex items-center">
            <span className="font-medium mr-2">Admin Status:</span>
            <span className={adminStatus ? "text-green-600" : "text-red-600"}>
              {adminStatus ? "Admin" : "Not an admin"}
            </span>
          </div>

          {userData.accessGroups && userData.accessGroups.length > 0 && (
            <div>
              <span className="font-medium">Access Groups:</span>
              <ul className="list-disc list-inside ml-4 mt-2">
                {userData.accessGroups.map((group, index) => (
                  <li key={index}>{group}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center">
            <span className="font-medium mr-2">Identity Provider:</span>
            <span>{userData.identityProvider}</span>
          </div>
        </div>
      ) : (
        <p>
          No user data available. Please ensure you're authenticated with
          Cloudflare Access.
        </p>
      )}
    </div>
  );
};

export default CloudflareAccessInfo;
