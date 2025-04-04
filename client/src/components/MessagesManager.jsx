import { useState, useEffect } from "react";
import { motion as Motion } from "framer-motion";
import { fetchMessages, markMessageAsRead, deleteMessage } from "../utils/api";
import { checkAuthStatus } from "../utils/auth";

const MessagesManager = ({ onMessageRead }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Check auth status first
        const isAuthenticated = await checkAuthStatus();
        console.log("Authentication status:", isAuthenticated);

        if (isAuthenticated) {
          loadMessages();
        } else {
          setAuthError(true);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error during initialization:", error);
        setAuthError(true);
        setLoading(false);
      }
    };

    init();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await fetchMessages();
      setMessages(response.data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
      alert("Failed to load messages. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = async (message) => {
    console.log("Message clicked:", message);
    console.log("Current isRead status:", message.isRead);
    setSelectedMessage(message);

    // Mark as read if it's unread
    if (!message.isRead) {
      try {
        console.log(`Marking message ${message._id} as read...`);
        const response = await markMessageAsRead(message._id);
        console.log(`Mark as read response:`, response);

        // Update local state even if the API fails
        setMessages(
          messages.map((m) =>
            m._id === message._id ? { ...m, isRead: true } : m
          )
        );

        // Also update the selected message
        setSelectedMessage((prev) => ({
          ...prev,
          isRead: true,
        }));

        // Call the onMessageRead prop to update the unread count in parent component
        onMessageRead();
      } catch (error) {
        console.error("Error marking message as read:", error);

        // Still update UI state even if API fails to avoid a poor user experience
        setMessages(
          messages.map((m) =>
            m._id === message._id ? { ...m, isRead: true } : m
          )
        );

        setSelectedMessage((prev) => ({
          ...prev,
          isRead: true,
        }));

        // Still call onMessageRead even if the API fails but we're updating the UI
        onMessageRead();

        // Only show alert in development mode
        if (import.meta.env.DEV) {
          alert(
            `Error marking message as read: ${
              error.message ||
              "Network error. The update will be shown in the UI but may not be saved to the database."
            }`
          );
        }
      }
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm("Are you sure you want to delete this message?")) {
      return;
    }

    try {
      await deleteMessage(id);
      // Remove message from state
      setMessages(messages.filter((m) => m._id !== id));
      // Clear selected message if it was the one deleted
      if (selectedMessage && selectedMessage._id === id) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
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
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
            <p>
              <strong>Authentication Error</strong>
            </p>
            <p>
              Unable to verify your authentication. Please try logging out and
              back in.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
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
                  onClick={() => handleDeleteMessage(selectedMessage._id)}
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
