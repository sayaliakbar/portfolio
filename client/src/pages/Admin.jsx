import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userData, setUserData] = useState(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication on component mount
    const checkAuth = async () => {
      const authStatus = await checkAuthStatus();
      setIsAuthenticated(authStatus);

      if (authStatus) {
        loadProjects();
        loadUserData();
        loadUnreadMessageCount();
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await fetchProjects();
      setProjects(data);
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      const response = await api.get("/auth");
      setUserData(response.data);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadUnreadMessageCount = async () => {
    try {
      const count = await fetchUnreadMessageCount();
      setUnreadMessageCount(count);
    } catch (error) {
      console.error("Error loading unread message count:", error);
    }
  };

  const handleLogin = (success) => {
    if (success) {
      setIsAuthenticated(true);
      loadProjects();
      loadUserData();
      loadUnreadMessageCount();
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
    setActiveTab("projects");
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setIsAdding(false);
    setActiveTab("projects");
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?")) {
      return;
    }

    try {
      await deleteProject(projectId);

      // Refresh project list
      loadProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const handleFormSubmit = () => {
    // Reset form state and reload projects
    setEditingProject(null);
    setIsAdding(false);
    loadProjects();
  };

  const handleTwoFactorSetupComplete = () => {
    // Reload user data to get updated 2FA status
    loadUserData();
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);

    // Cancel project adding/editing when switching tabs
    if (isAdding || editingProject) {
      setIsAdding(false);
      setEditingProject(null);
    }

    // Reload data when switching tabs
    if (tab === "security") {
      loadUserData();
    }

    // Always reload unread message count when switching tabs
    loadUnreadMessageCount();
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
            <div className="p-3 bg-white bg-opacity-30 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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
              className="text-sm bg-white bg-opacity-20 hover:bg-opacity-30 py-1 px-3 rounded-full transition-colors duration-200 cursor-pointer"
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
            <div className="p-3 bg-white bg-opacity-30 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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
              className="text-sm bg-white bg-opacity-20 hover:bg-opacity-30 py-1 px-3 rounded-full transition-colors duration-200 cursor-pointer"
            >
              View All
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
            <div className="p-3 bg-white bg-opacity-30 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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
              className="text-sm bg-white bg-opacity-20 hover:bg-opacity-30 py-1 px-3 rounded-full transition-colors duration-200 cursor-pointer"
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
            <div className="p-3 bg-white bg-opacity-30 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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
              className="text-sm bg-white bg-opacity-20 hover:bg-opacity-30 py-1 px-3 rounded-full transition-colors duration-200 cursor-pointer"
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
                    <p className="text-sm text-gray-500">Last Login</p>
                    <p className="font-medium">
                      {userData?.lastLogin
                        ? new Date(userData.lastLogin).toLocaleString()
                        : "Unknown"}
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition-colors duration-200 cursor-pointer"
                    >
                      Logout
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
                  enabled={userData?.twoFactorEnabled || false}
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
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Navigation Bar */}
      <header className="bg-white shadow-sm z-10 pt-11">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
            <div>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer px-3 py-2 rounded-md hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation - Separate section */}
      <nav className="bg-white shadow-md border-t border-gray-200 z-10">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => handleTabSwitch("dashboard")}
              className={`px-4 py-3 font-medium text-sm transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                activeTab === "dashboard"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => handleTabSwitch("projects")}
              className={`px-4 py-3 font-medium text-sm transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                activeTab === "projects" || isAdding || editingProject
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => handleTabSwitch("messages")}
              className={`px-4 py-3 font-medium text-sm transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                activeTab === "messages"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Messages
              {unreadMessageCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                  {unreadMessageCount}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabSwitch("security")}
              className={`px-4 py-3 font-medium text-sm transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                activeTab === "security"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Security
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content with spacing from navigation */}
      <main className="flex-grow container mx-auto px-4 py-6">
        {renderTabContent()}
      </main>
    </div>
  );
};

export default Admin;
