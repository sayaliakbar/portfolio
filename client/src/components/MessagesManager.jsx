import { useState, useEffect, useCallback } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { getAuthStatus } from "../utils/auth";
import api from "../utils/api";
import { showToast } from "../utils/toast";

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
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors cursor-pointer "
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

// Cache for messages data
let messagesCache = {
  data: null,
  timestamp: 0,
};
const CACHE_DURATION = 30000; // 30 seconds

const MessagesManager = ({ onMessageRead }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [authError, setAuthError] = useState(false);
  const [rateLimitError, setRateLimitError] = useState(false);

  // Confirm dialog states
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

  // Optimized initialization function with caching
  const initializeComponent = useCallback(async () => {
    setAuthError(false);
    setLoading(true);

    try {
      // Use the optimized auth check function
      const isAuth = await getAuthStatus();

      if (isAuth) {
        await loadMessages();
      } else {
        console.error("Auth check returned false");
        setAuthError(true);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error during initialization:", error);
      if (error.response && error.response.status === 429) {
        setAuthError(true);
        setRateLimitError(true);
      } else {
        setAuthError(true);
      }
      setLoading(false);
    }
  }, []);

  // Load messages with caching
  const loadMessages = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);

      // Check if we can use cached data
      const now = Date.now();
      if (
        !forceRefresh &&
        messagesCache.data &&
        now - messagesCache.timestamp < CACHE_DURATION
      ) {
        console.log("Using cached messages data");
        setMessages(messagesCache.data);
        setLoading(false);
        return;
      }

      // Get fresh data
      const response = await api.get("/messages");

      if (!response.data || !response.data.data) {
        console.error("Invalid response format:", response);
        throw new Error("Unexpected API response format");
      }

      // Update cache and state
      const messageData = response.data.data || [];
      messagesCache = {
        data: messageData,
        timestamp: now,
      };

      setMessages(messageData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading messages:", error);

      if (error.response) {
        // Handle specific HTTP error codes
        if (error.response.status === 429) {
          setRateLimitError(true);
          setAuthError(true);
        } else if (error.response.status === 401) {
          setAuthError(true);
        } else {
          showToastMessage(
            `Failed to load messages: ${error.response.status} ${error.response.statusText}`,
            "error"
          );
        }
      } else if (error.request) {
        // Request was made but no response received (network error)
        showToastMessage(
          "Network error. Please check your connection and try again.",
          "error"
        );
      } else {
        // Other errors
        showToastMessage(
          "Failed to load messages. Please try again later.",
          "error"
        );
      }

      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeComponent();

    // Set up periodic refresh if component stays mounted for a long time
    const refreshInterval = setInterval(() => {
      // Only refresh if the component is actively being viewed (not in error state)
      if (!authError && !rateLimitError) {
        loadMessages(true);
      }
    }, 60000); // Refresh every minute

    return () => clearInterval(refreshInterval);
  }, [initializeComponent, loadMessages, authError, rateLimitError]);

  const handleMessageClick = async (message) => {
    console.log("Message clicked:", message);
    setSelectedMessage(message);

    // Mark as read if it's unread
    if (!message.isRead) {
      try {
        console.log(`Marking message ${message._id} as read...`);

        // Update UI immediately for better user experience
        const updatedMessages = messages.map((m) =>
          m._id === message._id ? { ...m, isRead: true } : m
        );
        setMessages(updatedMessages);

        // Also update the selected message
        setSelectedMessage((prev) => ({
          ...prev,
          isRead: true,
        }));

        // Update cache to maintain consistency
        if (messagesCache.data) {
          messagesCache.data = updatedMessages;
        }

        // Call the onMessageRead prop to update the unread count in parent component
        onMessageRead();

        // Make API call in the background
        await api.post(`/messages/${message._id}/read`, {});
      } catch (error) {
        console.error("Error marking message as read:", error);

        // Already updated UI optimistically, so we just log the error
        if (error.response && error.response.status === 429) {
          console.warn("Rate limit hit when marking message as read");
        }
      }
    }
  };

  const handleDeleteMessage = async (id) => {
    showConfirmDialog(
      "Delete Message",
      "Are you sure you want to delete this message? This action cannot be undone.",
      async () => {
        try {
          // Update UI immediately for better user experience
          const updatedMessages = messages.filter((m) => m._id !== id);
          setMessages(updatedMessages);

          // Update cache to maintain consistency
          if (messagesCache.data) {
            messagesCache.data = updatedMessages;
          }

          // Clear selected message if it was the one deleted
          if (selectedMessage && selectedMessage._id === id) {
            setSelectedMessage(null);
          }

          // Make API call in the background
          await api.delete(`/messages/${id}`);

          // Show success toast
          showToastMessage("Message deleted successfully");
        } catch (error) {
          console.error(`Error deleting message ${id}:`, error);

          // On error, restore original messages from a fresh API call
          loadMessages(true);

          // Show error message
          if (error.response) {
            if (error.response.status === 429) {
              showToastMessage(
                "Rate limit exceeded. Please try again later.",
                "error"
              );
            } else if (error.response.status === 401) {
              setAuthError(true);
            } else {
              showToastMessage(
                `Failed to delete message: ${error.response.status} ${error.response.statusText}`,
                "error"
              );
            }
          } else {
            showToastMessage(
              "Failed to delete the message. Please try again.",
              "error"
            );
          }
        }
        closeConfirmDialog();
      }
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    // Create a single error object with all relevant info
    const errorInfo = {
      title: rateLimitError ? "Rate Limit Exceeded" : "Authentication Error",
      message: rateLimitError
        ? "You've made too many requests in a short period. Please wait before trying again."
        : "Unable to verify your authentication. This may happen if your session has expired.",
      hint: rateLimitError
        ? "This is a temporary restriction to prevent server overload."
        : "If this persists, try logging out and back in.",
      retryDelay: rateLimitError ? 5000 : 1000, // 5 seconds for rate limit, 1 second otherwise
    };

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 max-w-md">
            <p className="font-bold text-lg mb-2">{errorInfo.title}</p>
            <p className="mb-3">{errorInfo.message}</p>
            <p className="text-sm">{errorInfo.hint}</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => {
                // Reset error states
                setAuthError(false);
                setRateLimitError(false);
                // Set loading to true
                setLoading(true);
                // Re-initialize with appropriate delay
                setTimeout(() => {
                  initializeComponent();
                }, errorInfo.retryDelay);
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              {rateLimitError ? "Retry After Delay" : "Retry"}
            </button>
            <a
              href="/admin"
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirmDialog}
      />

      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold">Messages</h2>
        <p className="text-gray-500 text-sm mt-1">
          Manage contact messages from your portfolio
        </p>
      </div>

      <div className="flex flex-col md:flex-row h-full">
        {/* Messages List */}
        <div
          className="w-full md:w-1/3 border-r border-gray-200 overflow-y-auto"
          style={{ maxHeight: "70vh" }}
        >
          <div className="divide-y divide-gray-200">
            {messages.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No messages found
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message._id}
                  onClick={() => handleMessageClick(message)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer relative ${
                    selectedMessage?._id === message._id ? "bg-indigo-50" : ""
                  } ${!message.isRead ? "bg-blue-50" : ""}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-800 flex items-center">
                        {message.name}
                        {!message.isRead && (
                          <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full inline-block"></span>
                        )}
                      </h3>
                      <p className="text-gray-500 text-sm">{message.subject}</p>
                    </div>
                    <p className="text-xs text-gray-400">
                      {formatDate(message.createdAt)}
                    </p>
                  </div>
                  <p className="text-gray-500 text-sm mt-1 line-clamp-1">
                    {message.email}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className="w-full md:w-2/3 p-6">
          {selectedMessage ? (
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-medium">
                    {selectedMessage.subject}
                  </h2>
                  <div className="flex items-center mt-1">
                    <p className="text-gray-600 text-sm mr-4">
                      From: {selectedMessage.name} ({selectedMessage.email})
                    </p>
                    <p className="text-gray-500 text-xs">
                      {formatDate(selectedMessage.createdAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteMessage(selectedMessage._id);
                  }}
                  className="bg-red-100 text-red-700 px-3 py-1 rounded-md hover:bg-red-200 transition-colors text-sm cursor-pointer"
                >
                  Delete
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 whitespace-pre-wrap">
                {selectedMessage.message}
              </div>

              <div className="mt-4 text-sm text-gray-500">
                Status: {selectedMessage.isRead ? "Read" : "Unread"}
              </div>
            </Motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p>Select a message to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesManager;
