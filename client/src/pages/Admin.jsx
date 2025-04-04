import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { fetchProjects, deleteProject } from "../utils/api";
import { isAuthenticated as checkAuthStatus, logoutUser } from "../utils/auth";
import AdminLogin from "../components/AdminLogin";
import ProjectForm from "../components/ProjectForm";
import TwoFactorSetup from "../components/TwoFactorSetup";
import api from "../utils/api";

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication on component mount
    const checkAuth = async () => {
      const authStatus = await checkAuthStatus();
      setIsAuthenticated(authStatus);

      if (authStatus) {
        loadProjects();
        loadUserData();
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

  const handleLogin = (success) => {
    if (success) {
      setIsAuthenticated(true);
      loadProjects();
      loadUserData();
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

    // Reload user data when switching to security tab
    if (tab === "security") {
      loadUserData();
    }
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

        <Motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg shadow-lg p-6"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-lg font-medium opacity-90">Last Login</p>
              <h3 className="text-xl font-bold mt-2">
                {userData?.lastLogin
                  ? new Date(userData.lastLogin).toLocaleDateString()
                  : "Unknown"}
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={handleLogout}
              className="text-sm bg-white bg-opacity-20 hover:bg-opacity-30 py-1 px-3 rounded-full transition-colors duration-200 cursor-pointer"
            >
              Logout
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
                    <p className="font-medium flex items-center">
                      {userData?.twoFactorEnabled ? (
                        <>
                          <span className="block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                          Enabled
                        </>
                      ) : (
                        <>
                          <span className="block w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                          Disabled
                        </>
                      )}
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => handleTabSwitch("security")}
                      className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors cursor-pointer"
                    >
                      Security Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Motion.div>
        );
      case "security":
        return (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
            <TwoFactorSetup
              user={userData}
              onSetupComplete={handleTwoFactorSetupComplete}
            />
          </Motion.div>
        );
      case "projects":
      default:
        return (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
                <h2 className="text-xl font-semibold mb-2 sm:mb-0">
                  Manage Projects
                </h2>
                <button
                  onClick={handleAddProject}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Add New Project
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full rounded-lg overflow-hidden">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="py-3 px-4 text-left">Title</th>
                        <th className="py-3 px-4 text-left hidden md:table-cell">
                          Description
                        </th>
                        <th className="py-3 px-4 text-left hidden sm:table-cell">
                          Technologies
                        </th>
                        <th className="py-3 px-4 text-center">Featured</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {projects.length > 0 ? (
                        projects.map((project) => (
                          <tr
                            key={project._id || project.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="py-3 px-4 font-medium">
                              {project.title}
                            </td>
                            <td className="py-3 px-4 hidden md:table-cell">
                              <div className="truncate max-w-xs">
                                {project.description}
                              </div>
                            </td>
                            <td className="py-3 px-4 hidden sm:table-cell">
                              <div className="flex flex-wrap gap-1">
                                {project.technologies
                                  .slice(0, 3)
                                  .map((tech, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-gray-100 text-xs rounded-full"
                                    >
                                      {tech}
                                    </span>
                                  ))}
                                {project.technologies.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-100 text-xs rounded-full">
                                    +{project.technologies.length - 3}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                                  project.featured
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {project.featured ? "✓" : "×"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex flex-col sm:flex-row justify-center gap-2">
                                <button
                                  onClick={() => handleEditProject(project)}
                                  className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200 transition-colors text-sm cursor-pointer"
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
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="5"
                            className="py-6 px-4 text-center text-gray-500"
                          >
                            No projects found. Add your first project!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Motion.div>
        );
    }
  };

  return (
    <div className="py-16 md:py-24 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        <Motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your portfolio content
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={handleLogout}
                className="flex items-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex overflow-x-auto pb-2 mb-6 -mx-4 px-4 sm:px-0 sm:mx-0">
            <nav className="flex space-x-1 sm:space-x-4">
              <button
                onClick={() => handleTabSwitch("dashboard")}
                className={`px-3 sm:px-4 py-2 rounded-md font-medium text-sm cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => handleTabSwitch("projects")}
                className={`px-3 sm:px-4 py-2 rounded-md font-medium text-sm cursor-pointer ${
                  activeTab === "projects"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200"
                }`}
              >
                Projects
              </button>
              <button
                onClick={() => handleTabSwitch("security")}
                className={`px-3 sm:px-4 py-2 rounded-md font-medium text-sm cursor-pointer ${
                  activeTab === "security"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200"
                }`}
              >
                Security
              </button>
              <button
                onClick={handleAddProject}
                className="px-3 sm:px-4 py-2 rounded-md font-medium text-sm bg-green-600 text-white shadow-sm hover:bg-green-700 cursor-pointer"
              >
                New Project
              </button>
            </nav>
          </div>

          {renderTabContent()}
        </Motion.div>
      </div>
    </div>
  );
};

export default Admin;
