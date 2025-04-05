import { useState, useEffect, useCallback, useRef } from "react";
import {
  useNavigate,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { motion as Motion } from "framer-motion";
import {
  fetchProjects,
  deleteProject,
  fetchUnreadMessageCount,
} from "../utils/api";
import { isAuthenticated as checkAuthStatus, logoutUser } from "../utils/auth";
import AdminLogin from "../components/AdminLogin";
import ProjectForm from "../components/ProjectForm";
import TwoFactorSetup from "../components/TwoFactorSetup";
import MessagesManager from "../components/MessagesManager";
import api from "../utils/api";

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [userData, setUserData] = useState(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [lastAuthCheck, setLastAuthCheck] = useState(0);
  const [resumeUrl, setResumeUrl] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Store function references in refs to break dependency cycles
  const authCheckRef = useRef(async () => {
    // Default implementation before the real one is assigned
    console.log("Initial auth check");
    const authStatus = await checkAuthStatus();
    setIsAuthenticated(authStatus);
    setLastAuthCheck(Date.now());
    return authStatus;
  });

  // Determine active tab based on the current route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/projects")) return "projects";
    if (path.includes("/messages")) return "messages";
    if (path.includes("/security")) return "security";
    if (path.includes("/resume")) return "resume";
    return "dashboard";
  };

  const activeTab = getActiveTab();

  // Optimized authentication check function
  const verifyAuth = useCallback(
    async (forceCheck = false) => {
      const now = Date.now();
      // Only check every 10 seconds unless forced
      if (forceCheck || now - lastAuthCheck > 10000) {
        console.log("Performing auth check");
        const authStatus = await checkAuthStatus();
        setIsAuthenticated(authStatus);
        setLastAuthCheck(now);
        return authStatus;
      } else {
        // Use current auth state from function scope, not from state
        // to avoid circular dependency
        return isAuthenticated;
      }
    },
    [lastAuthCheck] // Remove isAuthenticated from dependencies
  );

  // Store the current verifyAuth function in ref
  useEffect(() => {
    authCheckRef.current = verifyAuth;
  }, [verifyAuth]);

  // Authentication wrapper for API calls with reduced checks
  const authenticatedApiCall = useCallback(async (apiFunction) => {
    // Only verify auth if it hasn't been checked recently
    const authStatus = await authCheckRef.current();

    if (!authStatus) {
      setIsAuthenticated(false);
      return null;
    }

    // Execute the API function
    return await apiFunction();
  }, []);

  // Function to handle resume upload
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);

      // Create FormData object
      const formData = new FormData();
      formData.append("resume", file);

      // Upload the file
      const response = await api.post("/resume/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Update the resume URL from the response
      setResumeUrl(response.data.fileUrl);

      // Show success message
      alert("Resume uploaded successfully!");
    } catch (error) {
      console.error("Error uploading resume:", error);
      alert("Failed to upload resume. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Update loadAllData to also load resume data
  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);

      // Single auth check before multiple API calls
      const authStatus = await authCheckRef.current(true);
      if (!authStatus) {
        setLoading(false);
        return;
      }

      // Execute all API calls in parallel
      const [
        projectsResponse,
        userDataResponse,
        messageCountResponse,
        resumeResponse,
      ] = await Promise.allSettled([
        fetchProjects(),
        api.get("/auth"),
        fetchUnreadMessageCount(),
        api.get("/resume"),
      ]);

      // Handle projects data
      if (projectsResponse.status === "fulfilled") {
        setProjects(projectsResponse.value);
      } else {
        console.error("Error loading projects:", projectsResponse.reason);
      }

      // Handle user data
      if (userDataResponse.status === "fulfilled") {
        const response = userDataResponse.value;
        console.log("User data received:", response.data);

        // Process 2FA status
        processTwoFactorStatus(response.data);

        // Set user data
        setUserData(response.data);
      } else {
        console.error("Error loading user data:", userDataResponse.reason);
      }

      // Handle message count
      if (messageCountResponse.status === "fulfilled") {
        setUnreadMessageCount(messageCountResponse.value);
      } else {
        console.error(
          "Error loading message count:",
          messageCountResponse.reason
        );
      }

      // Handle resume data
      if (resumeResponse.status === "fulfilled") {
        const response = resumeResponse.value;
        if (response.data && response.data.fileUrl) {
          setResumeUrl(response.data.fileUrl);
        }
      } else {
        console.error("Error loading resume data:", resumeResponse.reason);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies to avoid re-creation

  // Helper function to process 2FA status
  const processTwoFactorStatus = (userData) => {
    if (!userData) return;

    // Check if 2FA field exists in the response
    if (Object.prototype.hasOwnProperty.call(userData, "twoFactorEnabled")) {
      console.log("twoFactorEnabled field exists:", userData.twoFactorEnabled);
    } else {
      console.warn("twoFactorEnabled field missing from response!");

      // Use localStorage as fallback
      const storedStatus = localStorage.getItem("twoFactorEnabled");
      if (storedStatus) {
        console.log("Using stored 2FA status:", storedStatus);
        userData.twoFactorEnabled = storedStatus === "true";
      }
    }

    // Save current status to localStorage for future reference
    if (userData.twoFactorEnabled !== undefined) {
      localStorage.setItem("twoFactorEnabled", userData.twoFactorEnabled);
    }
  };

  useEffect(() => {
    // Initial data load on mount
    loadAllData();
    // Don't include loadAllData in the dependency array since it would cause a re-render loop
  }, []);

  const handleLogin = (success) => {
    if (success) {
      setIsAuthenticated(true);
      loadAllData();
    }
  };

  const handleLogout = () => {
    logoutUser();
    setIsAuthenticated(false);
    navigate("/admin");
  };

  const handleAddProject = () => {
    setEditingProject(null);
    setIsAdding(true);
    navigate("/admin/projects");
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setIsAdding(false);
    navigate("/admin/projects");
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?")) {
      return;
    }

    try {
      await authenticatedApiCall(async () => {
        await deleteProject(projectId);
      });

      // Refresh project list
      loadAllData();
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const handleFormSubmit = async () => {
    // Reset form state
    setEditingProject(null);
    setIsAdding(false);

    // Reload projects with authentication check
    await loadAllData();
  };

  const handleTwoFactorSetupComplete = async () => {
    // Reload user data with authentication check
    await loadAllData();
  };

  const handleTabSwitch = async (tab) => {
    // Verify authentication first
    const authStatus = await verifyAuth();
    if (!authStatus) {
      setIsAuthenticated(false);
      return;
    }

    // Navigate to the appropriate route
    navigate(`/admin/${tab === "dashboard" ? "" : tab}`);

    // Cancel project adding/editing when switching tabs
    if (isAdding || editingProject) {
      setIsAdding(false);
      setEditingProject(null);
    }

    // Reload data when switching tabs
    if (tab === "security") {
      await loadAllData();
    }

    // Always reload unread message count when switching tabs
    await loadAllData();
  };

  // Function to decrement unread count when a message is read
  const decrementUnreadCount = () => {
    setUnreadMessageCount((prevCount) => Math.max(0, prevCount - 1));
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  const renderDashboardOverview = () => {
    const featuredCount = projects.filter((p) => p.featured).length;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-4">
        <Motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-lg font-medium opacity-90">Total Projects</p>
              <h3 className="text-3xl font-bold mt-2">{projects.length}</h3>
            </div>
            <div className="p-3 bg-white bg-opacity-70 rounded-lg shadow-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="black"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={handleAddProject}
              className="text-sm bg-white text-black bg-opacity-20 hover:bg-opacity-90 hover:text-blue-700 py-2 px-4 rounded-full transition-all duration-200 cursor-pointer font-medium"
            >
              Add New
            </button>
          </div>
        </Motion.div>

        <Motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-6"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-lg font-medium opacity-90">Featured</p>
              <h3 className="text-3xl font-bold mt-2">{featuredCount}</h3>
            </div>
            <div className="p-3 bg-white bg-opacity-70 rounded-lg shadow-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="black"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => handleTabSwitch("projects")}
              className="text-sm bg-white text-black bg-opacity-20 hover:bg-opacity-90 hover:text-purple-700 py-2 px-4 rounded-full transition-all duration-200 cursor-pointer font-medium"
            >
              Manage
            </button>
          </div>
        </Motion.div>

        <Motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg shadow-lg p-6"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-lg font-medium opacity-90">Messages</p>
              <h3 className="text-3xl font-bold mt-2">
                {unreadMessageCount > 0 ? `${unreadMessageCount} new` : "0 new"}
              </h3>
            </div>
            <div className="p-3 bg-white bg-opacity-70 rounded-lg shadow-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="black"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => handleTabSwitch("messages")}
              className="text-sm bg-white text-black bg-opacity-20 hover:bg-opacity-90 hover:text-amber-700 py-2 px-4 rounded-full transition-all duration-200 cursor-pointer font-medium"
            >
              View All
            </button>
          </div>
        </Motion.div>

        <Motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-lg font-medium opacity-90">Security</p>
              <h3 className="text-3xl font-bold mt-2">
                {userData?.twoFactorEnabled ? "Active" : "Basic"}
              </h3>
            </div>
            <div className="p-3 bg-white bg-opacity-70 rounded-lg shadow-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="black"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => handleTabSwitch("security")}
              className="text-sm bg-white text-black bg-opacity-20 hover:bg-opacity-90 hover:text-green-700 py-2 px-4 rounded-full transition-all duration-200 cursor-pointer font-medium"
            >
              Manage
            </button>
          </div>
        </Motion.div>
      </div>
    );
  };

  const renderTabContent = () => {
    if (isAdding || editingProject) {
      return (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <ProjectForm
            project={editingProject}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setIsAdding(false);
              setEditingProject(null);
            }}
          />
        </Motion.div>
      );
    }

    switch (activeTab) {
      case "dashboard":
        return (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {renderDashboardOverview()}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Recent Projects</h2>
                  <button
                    onClick={() => handleTabSwitch("projects")}
                    className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projects.slice(0, 5).map((project) => (
                      <div
                        key={project._id || project.id}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div>
                          <h3 className="font-medium">{project.title}</h3>
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {project.description}
                          </p>
                        </div>
                        <div className="flex mt-2 sm:mt-0">
                          <button
                            onClick={() => handleEditProject(project)}
                            className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md mr-2 hover:bg-blue-200 transition-colors text-sm cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteProject(project._id || project.id)
                            }
                            className="bg-red-100 text-red-700 px-3 py-1 rounded-md hover:bg-red-200 transition-colors text-sm cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}

                    {projects.length === 0 && (
                      <div className="py-4 text-center text-gray-500">
                        No projects found. Add your first project!
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Account Overview</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Username</p>
                    <p className="font-medium">
                      {userData?.username || "Unknown"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Role</p>
                    <p className="font-medium">{userData?.role || "Admin"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">
                      Two-Factor Authentication
                    </p>
                    <p className="font-medium">
                      {userData?.twoFactorEnabled ? (
                        <span className="text-green-600">Enabled</span>
                      ) : (
                        <span className="text-amber-600">Disabled</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Resume</p>
                    <p className="font-medium">
                      {resumeUrl ? (
                        <a
                          href={resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 transition-colors flex items-center"
                        >
                          <span>Available</span>
                          <svg
                            className="w-4 h-4 ml-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      ) : (
                        <span className="text-gray-500">Not uploaded</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Login</p>
                    <p className="font-medium">
                      {userData?.lastLogin
                        ? new Date(userData.lastLogin).toLocaleString()
                        : "Unknown"}
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => handleTabSwitch("security")}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition-colors duration-200 cursor-pointer"
                    >
                      Security Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Motion.div>
        );
      case "projects":
        return (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white rounded-lg shadow-md">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <div className="p-6">
                  {projects.length === 0 ? (
                    <div className="text-center py-8">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-16 w-16 mx-auto text-gray-400 mb-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                      <p className="text-gray-500">
                        No projects found. Create your first project!
                      </p>
                      <button
                        onClick={handleAddProject}
                        className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors duration-200 cursor-pointer"
                      >
                        Add Project
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {projects.map((project) => (
                        <div
                          key={project._id || project.id}
                          className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
                        >
                          <div
                            className="h-48 bg-gray-200 bg-cover bg-center"
                            style={{
                              backgroundImage: project.image
                                ? `url(${project.image})`
                                : "none",
                            }}
                          ></div>
                          <div className="p-4">
                            <div className="flex justify-between items-start">
                              <h3 className="font-semibold text-lg">
                                {project.title}
                              </h3>
                              {project.featured && (
                                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded">
                                  Featured
                                </span>
                              )}
                            </div>
                            <p className="text-gray-500 mt-2 line-clamp-2">
                              {project.description}
                            </p>
                            <div className="flex mt-4 space-x-2">
                              <button
                                onClick={() => handleEditProject(project)}
                                className="flex-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200 transition-colors cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteProject(project._id || project.id)
                                }
                                className="flex-1 bg-red-100 text-red-700 px-3 py-1 rounded-md hover:bg-red-200 transition-colors cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Motion.div>
        );
      case "security":
        return (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Security Settings</h2>

              {/* 2FA Status Banner */}
              <div
                className={`mb-6 p-4 rounded-lg flex items-center ${
                  userData?.twoFactorEnabled ? "bg-green-100" : "bg-yellow-100"
                }`}
              >
                <div
                  className={`p-3 rounded-full mr-4 ${
                    userData?.twoFactorEnabled
                      ? "bg-green-200"
                      : "bg-yellow-200"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-6 w-6 ${
                      userData?.twoFactorEnabled
                        ? "text-green-700"
                        : "text-yellow-700"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {userData?.twoFactorEnabled ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    )}
                  </svg>
                </div>
                <div>
                  <h3
                    className={`font-semibold ${
                      userData?.twoFactorEnabled
                        ? "text-green-800"
                        : "text-yellow-800"
                    }`}
                  >
                    Two-Factor Authentication is{" "}
                    {userData?.twoFactorEnabled ? "Enabled" : "Disabled"}
                  </h3>
                  <p
                    className={`text-sm ${
                      userData?.twoFactorEnabled
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {userData?.twoFactorEnabled
                      ? "Your account is protected with an additional layer of security."
                      : "Enhance your account security by enabling two-factor authentication below."}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-lg font-medium mb-4">
                  Two-Factor Authentication (2FA)
                </h3>
                <p className="text-gray-600 mb-4">
                  Add an extra layer of security to your account by enabling
                  two-factor authentication. When 2FA is enabled, you'll need to
                  provide a verification code from your authentication app when
                  logging in.
                </p>

                <TwoFactorSetup
                  user={userData}
                  onSetupComplete={handleTwoFactorSetupComplete}
                />
              </div>
            </div>
          </Motion.div>
        );
      case "messages":
        return (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <MessagesManager onMessageRead={decrementUnreadCount} />
          </Motion.div>
        );
      case "resume":
        return (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Resume Management</h2>
                {resumeUrl && (
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors duration-200 cursor-pointer flex items-center"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download Resume
                  </a>
                )}
              </div>

              <div className="border-b border-gray-200 pb-6 mb-6">
                <p className="text-gray-600 mb-4">
                  Upload your resume to make it available for download on your
                  portfolio website. Visitors will be able to download your
                  resume from the page you specify.
                </p>

                {resumeUrl ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                    <div className="flex items-start">
                      <div className="bg-blue-100 p-2 rounded-md mr-4">
                        <svg
                          className="w-6 h-6 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-medium text-blue-800">
                          Resume Uploaded
                        </h3>
                        <p className="text-sm text-blue-600 mt-1">
                          Your resume is available for download.
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <a
                            href={resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200 transition-colors text-sm cursor-pointer flex items-center"
                          >
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            View
                          </a>
                          <button
                            onClick={async () => {
                              if (
                                window.confirm(
                                  "Are you sure you want to delete your resume?"
                                )
                              ) {
                                try {
                                  await api.delete("/resume");
                                  setResumeUrl("");
                                  alert("Resume deleted successfully!");
                                } catch (error) {
                                  console.error(
                                    "Error deleting resume:",
                                    error
                                  );
                                  alert(
                                    "Failed to delete resume. Please try again."
                                  );
                                }
                              }
                            }}
                            className="bg-red-100 text-red-700 px-3 py-1 rounded-md hover:bg-red-200 transition-colors text-sm cursor-pointer flex items-center"
                          >
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                    <div className="flex items-start">
                      <div className="bg-yellow-100 p-2 rounded-md mr-4">
                        <svg
                          className="w-6 h-6 text-yellow-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-yellow-800">
                          No Resume Uploaded
                        </h3>
                        <p className="text-sm text-yellow-600 mt-1">
                          You haven't uploaded a resume yet. Upload one below to
                          make it available for download.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Upload Resume</h3>
                <p className="text-gray-600 text-sm">
                  Supported formats: PDF, DOC, DOCX. Maximum size: 5MB.
                </p>

                <div className="mt-4 border-2 border-dashed border-gray-300 rounded-md px-6 py-8">
                  <div className="space-y-4 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label
                        htmlFor="resume-upload"
                        className="relative cursor-pointer bg-indigo-600 py-2 px-4 rounded-md font-medium text-white hover:bg-indigo-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="resume-upload"
                          name="resume-upload"
                          type="file"
                          ref={fileInputRef}
                          onChange={handleResumeUpload}
                          className="sr-only"
                          accept=".pdf,.doc,.docx"
                        />
                      </label>
                      <p className="pl-1 pt-2">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, DOC, DOCX up to 5MB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Navigation Bar */}
      <header className="bg-gradient-to-r from-indigo-800 to-purple-900 shadow-lg z-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 mr-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-3">
              <a
                href="/"
                className="bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-md transition-all duration-200 flex items-center font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 12l2-2m0 0l7-7 7 7m-7-7v14"
                  />
                </svg>
                <span>Home</span>
              </a>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-md transition-all duration-200 cursor-pointer flex items-center font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation - Separate section */}
      <nav className="bg-white shadow-md border-t border-indigo-100 z-10">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => handleTabSwitch("dashboard")}
              className={`px-5 py-4 font-medium text-sm transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center ${
                activeTab === "dashboard"
                  ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50"
                  : "text-gray-500 hover:text-indigo-600 hover:bg-gray-50"
              }`}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              Dashboard
            </button>
            <button
              onClick={() => handleTabSwitch("projects")}
              className={`px-5 py-4 font-medium text-sm transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center ${
                activeTab === "projects" || isAdding || editingProject
                  ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50"
                  : "text-gray-500 hover:text-indigo-600 hover:bg-gray-50"
              }`}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              Projects
            </button>
            <button
              onClick={() => handleTabSwitch("messages")}
              className={`px-5 py-4 font-medium text-sm transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center ${
                activeTab === "messages"
                  ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50"
                  : "text-gray-500 hover:text-indigo-600 hover:bg-gray-50"
              }`}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Messages
              {unreadMessageCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                  {unreadMessageCount}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabSwitch("security")}
              className={`px-5 py-4 font-medium text-sm transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center ${
                activeTab === "security"
                  ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50"
                  : "text-gray-500 hover:text-indigo-600 hover:bg-gray-50"
              }`}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              Security
            </button>
            <button
              onClick={() => handleTabSwitch("resume")}
              className={`px-5 py-4 font-medium text-sm transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center ${
                activeTab === "resume"
                  ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50"
                  : "text-gray-500 hover:text-indigo-600 hover:bg-gray-50"
              }`}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Resume
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content with spacing from navigation */}
      <main className="flex-grow container mx-auto px-4 py-6 mt-2">
        {isAdding || editingProject ? (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <ProjectForm
              project={editingProject}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setIsAdding(false);
                setEditingProject(null);
              }}
            />
          </Motion.div>
        ) : (
          <Routes>
            <Route
              path="/"
              element={
                <Motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderDashboardOverview()}

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">
                          Recent Projects
                        </h2>
                        <button
                          onClick={() => handleTabSwitch("projects")}
                          className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                        >
                          View All
                        </button>
                      </div>

                      {loading ? (
                        <div className="flex justify-center py-12">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {projects.slice(0, 5).map((project) => (
                            <div
                              key={project._id || project.id}
                              className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div>
                                <h3 className="font-medium">{project.title}</h3>
                                <p className="text-sm text-gray-500 line-clamp-1">
                                  {project.description}
                                </p>
                              </div>
                              <div className="flex mt-2 sm:mt-0">
                                <button
                                  onClick={() => handleEditProject(project)}
                                  className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md mr-2 hover:bg-blue-200 transition-colors text-sm cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteProject(
                                      project._id || project.id
                                    )
                                  }
                                  className="bg-red-100 text-red-700 px-3 py-1 rounded-md hover:bg-red-200 transition-colors text-sm cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}

                          {projects.length === 0 && (
                            <div className="py-4 text-center text-gray-500">
                              No projects found. Add your first project!
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h2 className="text-xl font-semibold mb-4">
                        Account Overview
                      </h2>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500">Username</p>
                          <p className="font-medium">
                            {userData?.username || "Unknown"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Role</p>
                          <p className="font-medium">
                            {userData?.role || "Admin"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            Two-Factor Authentication
                          </p>
                          <p className="font-medium">
                            {userData?.twoFactorEnabled ? (
                              <span className="text-green-600">Enabled</span>
                            ) : (
                              <span className="text-amber-600">Disabled</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Resume</p>
                          <p className="font-medium">
                            {resumeUrl ? (
                              <a
                                href={resumeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 transition-colors flex items-center"
                              >
                                <span>Available</span>
                                <svg
                                  className="w-4 h-4 ml-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                  />
                                </svg>
                              </a>
                            ) : (
                              <span className="text-gray-500">
                                Not uploaded
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Last Login</p>
                          <p className="font-medium">
                            {userData?.lastLogin
                              ? new Date(userData.lastLogin).toLocaleString()
                              : "Unknown"}
                          </p>
                        </div>
                        <div className="pt-2">
                          <button
                            onClick={() => handleTabSwitch("security")}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition-colors duration-200 cursor-pointer"
                          >
                            Security Settings
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Motion.div>
              }
            />

            <Route
              path="/projects"
              element={
                <Motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Projects content */}
                  <div className="bg-white rounded-lg shadow-md">
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-semibold">Projects</h2>
                        <p className="text-gray-500 text-sm mt-1">
                          Manage your portfolio projects
                        </p>
                      </div>
                      <button
                        onClick={handleAddProject}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors duration-200 cursor-pointer"
                      >
                        Add Project
                      </button>
                    </div>

                    {/* Project list */}
                    {renderTabContent()}
                  </div>
                </Motion.div>
              }
            />

            <Route
              path="/messages"
              element={
                <Motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <MessagesManager onMessageRead={decrementUnreadCount} />
                </Motion.div>
              }
            />

            <Route
              path="/security"
              element={
                <Motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">
                      Security Settings
                    </h2>

                    {/* 2FA Status Banner */}
                    <div
                      className={`mb-6 p-4 rounded-lg flex items-center ${
                        userData?.twoFactorEnabled
                          ? "bg-green-100"
                          : "bg-yellow-100"
                      }`}
                    >
                      <div
                        className={`p-3 rounded-full mr-4 ${
                          userData?.twoFactorEnabled
                            ? "bg-green-200"
                            : "bg-yellow-200"
                        }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-6 w-6 ${
                            userData?.twoFactorEnabled
                              ? "text-green-700"
                              : "text-yellow-700"
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          {userData?.twoFactorEnabled ? (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                          ) : (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          )}
                        </svg>
                      </div>
                      <div>
                        <h3
                          className={`font-semibold ${
                            userData?.twoFactorEnabled
                              ? "text-green-800"
                              : "text-yellow-800"
                          }`}
                        >
                          Two-Factor Authentication is{" "}
                          {userData?.twoFactorEnabled ? "Enabled" : "Disabled"}
                        </h3>
                        <p
                          className={`text-sm ${
                            userData?.twoFactorEnabled
                              ? "text-green-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {userData?.twoFactorEnabled
                            ? "Your account is protected with an additional layer of security."
                            : "Enhance your account security by enabling two-factor authentication below."}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6 mt-6">
                      <h3 className="text-lg font-medium mb-4">
                        Two-Factor Authentication (2FA)
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Add an extra layer of security to your account by
                        enabling two-factor authentication. When 2FA is enabled,
                        you'll need to provide a verification code from your
                        authentication app when logging in.
                      </p>

                      <TwoFactorSetup
                        user={userData}
                        onSetupComplete={handleTwoFactorSetupComplete}
                      />
                    </div>
                  </div>
                </Motion.div>
              }
            />

            <Route
              path="/resume"
              element={
                <Motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Resume</h2>
                    <p className="text-gray-600 mb-4">
                      Upload or view your resume.
                    </p>

                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="resume"
                          className="text-sm text-gray-500"
                        >
                          Resume File
                        </label>
                        <input
                          type="file"
                          id="resume"
                          ref={fileInputRef}
                          onChange={handleResumeUpload}
                          className="mt-2 border border-gray-300 rounded-md p-2"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="resumeUrl"
                          className="text-sm text-gray-500"
                        >
                          Resume URL
                        </label>
                        <input
                          type="text"
                          id="resumeUrl"
                          value={resumeUrl}
                          readOnly
                          className="mt-2 border border-gray-300 rounded-md p-2"
                        />
                      </div>
                    </div>
                  </div>
                </Motion.div>
              }
            />

            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        )}
      </main>
    </div>
  );
};

export default Admin;
