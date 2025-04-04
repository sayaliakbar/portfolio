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
  const [activeTab, setActiveTab] = useState("projects");
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
      console.log("User data loaded:", response.data);
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

    // Reload user data when switching to security tab
    if (tab === "security") {
      loadUserData();
    }
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  const renderTabContent = () => {
    if (isAdding || editingProject) {
      return (
        <ProjectForm
          project={editingProject}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsAdding(false);
            setEditingProject(null);
          }}
        />
      );
    }

    switch (activeTab) {
      case "security":
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
            <TwoFactorSetup
              user={userData}
              onSetupComplete={handleTwoFactorSetupComplete}
            />
          </div>
        );
      case "projects":
      default:
        return (
          <>
            <h2 className="text-xl font-semibold mb-4">Manage Projects</h2>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-lg">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 text-left">Title</th>
                      <th className="py-3 px-4 text-left">Description</th>
                      <th className="py-3 px-4 text-left">Technologies</th>
                      <th className="py-3 px-4 text-center">Featured</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.length > 0 ? (
                      projects.map((project) => (
                        <tr
                          key={project._id || project.id}
                          className="border-b border-gray-200 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4">{project.title}</td>
                          <td className="py-3 px-4 truncate max-w-xs">
                            {project.description}
                          </td>
                          <td className="py-3 px-4">
                            {project.technologies.join(", ")}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {project.featured ? "✅" : "❌"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleEditProject(project)}
                              className="bg-blue-600 text-white px-3 py-1 rounded-md mr-2 hover:bg-blue-700 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteProject(project._id || project.id)
                              }
                              className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="py-4 px-4 text-center text-gray-500"
                        >
                          No projects found. Add your first project!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        );
    }
  };

  return (
    <div className="py-28">
      <div className="container mx-auto px-4">
        <Motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <div>
              <button
                onClick={handleAddProject}
                className="bg-green-600 text-white px-4 py-2 rounded-md mr-4 hover:bg-green-700 transition-colors"
              >
                Add New Project
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex -mb-px">
              <button
                onClick={() => handleTabSwitch("projects")}
                className={`py-3 px-6 border-b-2 font-medium text-sm ${
                  activeTab === "projects"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Projects
              </button>
              <button
                onClick={() => handleTabSwitch("security")}
                className={`py-3 px-6 border-b-2 font-medium text-sm ${
                  activeTab === "security"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Security
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
