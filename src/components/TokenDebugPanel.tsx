/**
 * Token Debug Panel
 * Visual debugging tool for automatic token refresh
 * Only visible in development mode
 */

import { useState, useEffect } from "react";
import axios, {
  getTimeUntilRefresh,
  getLastRefreshTime,
  getRefreshThreshold,
  getAccessTokenExpiry,
  resetRefreshTimer,
  clearRefreshTimer,
  manualRefresh,
} from "@/lib/axios";
import { useAuth } from "@/hooks/use-auth";

type RefreshLog = {
  timestamp: number;
  type: "success" | "error" | "info";
  message: string;
};

export default function TokenDebugPanel() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const [logs, setLogs] = useState<RefreshLog[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilRefresh(getTimeUntilRefresh());
      setLastRefreshTime(getLastRefreshTime());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut: Ctrl+Shift+D to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Only show in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  const addLog = (type: RefreshLog["type"], message: string) => {
    setLogs((prev) => [
      { timestamp: Date.now(), type, message },
      ...prev.slice(0, 9), // Keep last 10 logs
    ]);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    addLog("info", "Manual refresh triggered...");

    try {
      const success = await manualRefresh();

      if (success) {
        addLog("success", "✅ Token refreshed successfully");
        setTimeUntilRefresh(getTimeUntilRefresh());
        setLastRefreshTime(getLastRefreshTime());
      } else {
        addLog("error", "❌ Token refresh failed");
      }
    } catch (error) {
      addLog("error", `❌ Error: ${error}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSimulateAccessTokenExpiry = async () => {
    // Delete access token cookie
    document.cookie =
      "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    addLog("info", "🔧 Access token cookie deleted (simulating expiry)");
    addLog("info", "Triggering test API call to /api/users/me...");

    // Trigger a test API call to see the refresh in action
    // Using /api/users/me (Directus endpoint) instead of /auth/me
    try {
      const response = await axios.get("/api/users/me");
      addLog(
        "success",
        "✅ API call succeeded (token was refreshed automatically)"
      );
      addLog("info", "Check browser console for refresh logs");
      console.log("Test API response:", response.data);
    } catch (error) {
      addLog("error", "❌ API call failed - check console for details");
      console.error("Test API error:", error);
    }
  };

  const handleSimulateFullExpiry = async () => {
    // Delete both cookies
    document.cookie =
      "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie =
      "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    addLog("info", "🔧 Both tokens deleted (simulating full expiry)");
    addLog("info", "Triggering test API call to /api/users/me...");

    // Trigger a test API call to see the redirect
    try {
      const response = await axios.get("/api/users/me");
      addLog("info", "⚠️ API call succeeded unexpectedly");
      console.log("Test API response:", response.data);
    } catch (error) {
      addLog("error", "❌ Refresh failed - redirecting to login");
      console.error("Test API error:", error);

      // The axios interceptor should handle the redirect automatically
      // But if not, we'll do it manually after a short delay
      setTimeout(() => {
        if (window.location.pathname !== "/login") {
          addLog("info", "🔄 Manual redirect to login...");
          window.location.href = "/login";
        }
      }, 1000);
    }
  };

  const handleResetTimer = () => {
    resetRefreshTimer();
    setTimeUntilRefresh(getTimeUntilRefresh());
    setLastRefreshTime(getLastRefreshTime());
    addLog("success", "✅ Refresh timer reset");
  };

  const handleClearTimer = () => {
    clearRefreshTimer();
    setTimeUntilRefresh(getTimeUntilRefresh());
    setLastRefreshTime(getLastRefreshTime());
    addLog("info", "🔧 Refresh timer cleared");
  };

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getStatusColor = (): string => {
    if (!user) return "bg-gray-500"; // Not logged in
    if (timeUntilRefresh === 0) return "bg-red-500"; // Expired
    if (timeUntilRefresh < 60000) return "bg-yellow-500"; // Expiring soon (< 1 min)
    return "bg-green-500"; // Valid
  };

  const getStatusText = (): string => {
    if (!user) return "Not Authenticated";
    if (timeUntilRefresh === 0) return "Token Expired";
    if (timeUntilRefresh < 60000) return "Expiring Soon";
    return "Active";
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium z-50 transition-colors"
        title="Open Token Debug Panel (Ctrl+Shift+D)"
      >
        🔧 Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-2xl z-50 w-[900px] h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between bg-blue-600 text-white px-4 py-2 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔧</span>
          <h3 className="font-semibold">Token Debug Panel</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="hover:bg-blue-700 px-2 py-1 rounded text-sm"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? "▲" : "▼"}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-blue-700 px-2 py-1 rounded text-sm"
            title="Close (Ctrl+Shift+D)"
          >
            ✕
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex overflow-hidden h-full">
          {/* Left Column - Debug Controls */}
          <div className="w-[450px] flex flex-col overflow-y-auto border-r border-gray-200 dark:border-gray-700">
            {/* Status Section */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </span>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {getStatusText()}
                  </span>
                </div>
              </div>

              {/* Countdown Timer */}
              <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-3 mb-3">
                <div className="text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Time Until Next Refresh
                  </div>
                  <div className="text-3xl font-mono font-bold text-blue-600 dark:text-blue-400">
                    {formatTime(timeUntilRefresh)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Threshold: {formatTime(getRefreshThreshold())}
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded">
                  <div className="text-gray-600 dark:text-gray-400">
                    Auth Status
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {user ? "✅ Logged In" : "❌ Logged Out"}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded">
                  <div className="text-gray-600 dark:text-gray-400">
                    Last Refresh
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {lastRefreshTime > 0
                      ? formatTimestamp(lastRefreshTime)
                      : "Never"}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded">
                  <div className="text-gray-600 dark:text-gray-400">
                    Token Expiry
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {formatTime(getAccessTokenExpiry())}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded">
                  <div className="text-gray-600 dark:text-gray-400">User</div>
                  <div className="font-semibold text-gray-900 dark:text-white truncate">
                    {user?.email || "None"}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Test Actions
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-3 py-2 rounded text-xs font-medium transition-colors"
                >
                  {isRefreshing ? "Refreshing..." : "🔄 Refresh Now"}
                </button>
                <button
                  onClick={handleResetTimer}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-xs font-medium transition-colors"
                >
                  ⏱️ Reset Timer
                </button>
                <button
                  onClick={handleSimulateAccessTokenExpiry}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded text-xs font-medium transition-colors"
                >
                  ⚠️ Expire Access
                </button>
                <button
                  onClick={handleSimulateFullExpiry}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-xs font-medium transition-colors"
                >
                  🚨 Expire All
                </button>
              </div>
              <button
                onClick={handleClearTimer}
                className="w-full mt-2 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-xs font-medium transition-colors"
              >
                🗑️ Clear Timer
              </button>
            </div>
          </div>

          {/* Right Column - Recent Events */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
              Recent Events
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3 space-y-2">
              {logs.length === 0 ? (
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-8">
                  No events yet. Try triggering a refresh!
                </div>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={index}
                    className={`text-xs p-3 rounded ${
                      log.type === "success"
                        ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300"
                        : log.type === "error"
                        ? "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300"
                        : "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300"
                    }`}
                  >
                    <div className="font-mono text-[10px] text-gray-600 dark:text-gray-400 mb-1">
                      {formatTimestamp(log.timestamp)}
                    </div>
                    <div className="leading-relaxed">{log.message}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-gray-100 dark:bg-gray-900 px-4 py-2 rounded-b-lg text-xs text-gray-600 dark:text-gray-400 text-center">
        Press{" "}
        <kbd className="font-mono bg-white dark:bg-gray-800 px-1 rounded">
          Ctrl+Shift+D
        </kbd>{" "}
        to toggle
      </div>
    </div>
  );
}
