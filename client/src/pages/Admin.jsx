import { useState, useEffect, useCallback, useRef } from "react";
import {
  useNavigate,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import {
  fetchProjects,
  deleteProject,
  fetchUnreadMessageCount,
} from "../utils/api";
import ProjectForm from "../components/ProjectForm";
import MessagesManager from "../components/MessagesManager";
import Login from "../components/Login";
import api from "../utils/api";
import { showToast } from "../utils/toast";
import { jwtDecode } from "jwt-decode";

// Confirmation Dialog Component
const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        >
          <Motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden"
          >
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {title}
              </h3>
              <p className="text-gray-600">{message}</p>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
};

const Admin = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [resumeUrl, setResumeUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  const [username, setUsername] = useState("User");

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const showToastMessage = (message, type = "success") => {
    showToast(message, type);
  };

  // Show confirmation dialog
  const showConfirmDialog = (title, message, onConfirm) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  };

  // Close confirmation dialog
  const closeConfirmDialog = () => {
    setConfirmDialog({ ...confirmDialog, isOpen: false });
  };

  // Determine active tab based on the current route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/projects")) return "projects";
    if (path.includes("/messages")) return "messages";
    if (path.includes("/resume")) return "resume";
    return "dashboard";
  };

  const activeTab = getActiveTab();

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

      // Show success toast instead of alert
      showToastMessage("Resume uploaded successfully!");
    } catch (error) {
      console.error("Error uploading resume:", error);
      // Show error toast instead of alert
      showToastMessage("Failed to upload resume. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Update loadAllData to also load resume data
  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);

      // Execute all API calls in parallel
      const [projectsResponse, messageCountResponse, resumeResponse] =
        await Promise.allSettled([
          fetchProjects(),
          fetchUnreadMessageCount(),
          api.get("/resume"),
        ]);

      // Handle projects data
      if (projectsResponse.status === "fulfilled") {
        setProjects(projectsResponse.value);
      } else {
        console.error("Error loading projects:", projectsResponse.reason);
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

  useEffect(() => {
    // Initial data load on mount if authenticated
    if (isAuthenticated) {
      loadAllData();
    } else {
      navigate("/admin/login");
    }
  }, [loadAllData, isAuthenticated, navigate]);

  // Extract username from token on component mount
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.user && decoded.user.username) {
          setUsername(decoded.user.username);
        }
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      // Call the server logout endpoint to invalidate the refresh token
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Error calling logout endpoint:", error);
    } finally {
      // Clear all auth data from localStorage
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");

      // Redirect to home page
      navigate("/");
    }
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
    // Use the confirm dialog instead of window.confirm
    showConfirmDialog(
      "Delete Project",
      "Are you sure you want to delete this project? This action cannot be undone.",
      async () => {
        try {
          await deleteProject(projectId);

          // Show success toast
          showToastMessage("Project deleted successfully!");

          // Refresh project list
          loadAllData();
        } catch (error) {
          console.error("Error deleting project:", error);
          showToastMessage(
            "Error deleting project. Please try again.",
            "error"
          );
        }
        closeConfirmDialog();
      }
    );
  };

  const handleFormSubmit = async () => {
    // Reset form state
    setEditingProject(null);
    setIsAdding(false);

    // Reload projects
    await loadAllData();
  };

  const handleTabSwitch = async (tab) => {
    // Navigate to the appropriate route
    navigate(`/admin/${tab === "dashboard" ? "" : tab}`);

    // Cancel project adding/editing when switching tabs
    if (isAdding || editingProject) {
      setIsAdding(false);
      setEditingProject(null);
    }

    // Reload data when switching tabs
    await loadAllData();
  };

  // Function to decrement unread count when a message is read
  const decrementUnreadCount = () => {
    setUnreadMessageCount((prevCount) => Math.max(0, prevCount - 1));
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (
        file.type === "application/pdf" ||
        file.type === "application/msword" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        try {
          const formData = new FormData();
          formData.append("resume", file);

          const response = await api.post("/resume/upload", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });

          setResumeUrl(response.data.fileUrl);
          showToastMessage("Resume uploaded successfully!");
        } catch (error) {
          console.error("Error uploading resume:", error);
          showToastMessage(
            "Failed to upload resume. Please try again.",
            "error"
          );
        }
      } else {
        showToastMessage("Please upload a PDF or Word document.", "error");
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  const renderDashboardOverview = () => {
    const featuredCount = projects.filter((p) => p.featured).length;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Dashboard Cards */}
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-lg shadow p-5"
        >
          <svg
            className="w-8 h-8 text-indigo-500 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="text-lg font-medium opacity-90">Projects</p>
          <p className="text-2xl font-bold mt-1 mb-2">{projects.length || 0}</p>
          <div className="mt-4">
            <button
              onClick={handleAddProject}
              className="text-sm bg-white text-black bg-opacity-20 hover:bg-opacity-90 hover:text-green-700 py-2 px-4 rounded-full transition-all duration-200 cursor-pointer font-medium"
            >
              Add New
            </button>
          </div>
        </Motion.div>

        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-lg shadow p-5"
        >
          <svg
            className="w-8 h-8 text-indigo-500 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="text-lg font-medium opacity-90">Messages</p>
          <p className="text-2xl font-bold mt-1 mb-2">
            {unreadMessageCount || 0}{" "}
            <span className="text-sm font-normal text-gray-500">
              {unreadMessageCount === 1 ? "unread message" : "unread messages"}
            </span>
          </p>
          <div className="mt-4">
            <button
              onClick={() => handleTabSwitch("messages")}
              className="text-sm bg-white text-black bg-opacity-20 hover:bg-opacity-90 hover:text-green-700 py-2 px-4 rounded-full transition-all duration-200 cursor-pointer font-medium"
            >
              Manage
            </button>
          </div>
        </Motion.div>

        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-white rounded-lg shadow p-5"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8 text-indigo-500 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976-2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
          <p className="text-lg font-medium opacity-90">Featured</p>
          <p className="text-2xl font-bold mt-1 mb-2">{featuredCount}</p>
          <div className="mt-4">
            <button
              onClick={() => handleTabSwitch("projects")}
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
                    <p className="font-medium">{username}</p>
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
                    <p className="font-medium">{renderLastLogin()}</p>
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
                <div>
                  <h2 className="text-xl font-semibold">Resume Management</h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Upload and manage your professional resume
                  </p>
                </div>
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
                            onClick={() => {
                              showConfirmDialog(
                                "Delete Resume",
                                "Are you sure you want to delete your resume? This action cannot be undone.",
                                async () => {
                                  try {
                                    await api.delete("/resume");
                                    setResumeUrl("");
                                    showToastMessage(
                                      "Resume deleted successfully!"
                                    );
                                    closeConfirmDialog(); // Close the dialog after successful deletion
                                  } catch (error) {
                                    console.error(
                                      "Error deleting resume:",
                                      error
                                    );
                                    showToastMessage(
                                      "Failed to delete resume. Please try again.",
                                      "error"
                                    );
                                    closeConfirmDialog(); // Close the dialog even if there's an error
                                  }
                                }
                              );
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

                <div
                  className={`mt-4 border-2 border-dashed rounded-md px-6 py-8 transition-colors duration-200 ${
                    isDragging
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-300"
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="space-y-4 text-center">
                    <svg
                      className={`mx-auto h-12 w-12 transition-colors duration-200 ${
                        isDragging ? "text-indigo-500" : "text-gray-400"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 13h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
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

  const renderLastLogin = () => {
    return new Date().toLocaleString() + " (Current login)";
  };

  return (
    <>
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirmDialog}
      />

      <div className="min-h-screen bg-gray-100 flex flex-col">
        {/* Admin Top Bar */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">
                    Admin Dashboard
                  </h1>
                </div>
              </div>
              <div className="flex items-center">
                <button
                  onClick={handleLogout}
                  className="ml-3 bg-white hover:bg-red-50 text-red-700 px-4 py-2 rounded-md text-sm font-medium border border-red-300 hover:border-red-400 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-4 pb-5 mb-8 border-b border-gray-200">
              {/* Tabs */}
              <button
                onClick={() => handleTabSwitch("dashboard")}
                className={`px-3 py-2 font-medium text-sm rounded-md ${
                  activeTab === "dashboard"
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-500 hover:text-gray-700"
                } cursor-pointer`}
              >
                Dashboard
              </button>
              <button
                onClick={() => handleTabSwitch("projects")}
                className={`px-3 py-2 font-medium text-sm rounded-md ${
                  activeTab === "projects"
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-500 hover:text-gray-700"
                } cursor-pointer`}
              >
                Projects
              </button>
              <button
                onClick={() => handleTabSwitch("messages")}
                className={`px-3 py-2 font-medium text-sm rounded-md flex items-center ${
                  activeTab === "messages"
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-500 hover:text-gray-700"
                } cursor-pointer`}
              >
                Messages
                {unreadMessageCount > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {unreadMessageCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleTabSwitch("resume")}
                className={`px-3 py-2 font-medium text-sm rounded-md ${
                  activeTab === "resume"
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-500 hover:text-gray-700"
                } cursor-pointer`}
              >
                Resume
              </button>
            </div>

            {/* Main content */}
            {renderTabContent()}
          </div>
        </div>
      </div>
    </>
  );
};

export default Admin;
