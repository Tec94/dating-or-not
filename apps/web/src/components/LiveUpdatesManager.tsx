import React, { useEffect } from 'react';
import { useLiveUpdates } from '../hooks/useLiveUpdates';

interface LiveUpdatesManagerProps {
  children: React.ReactNode;
}

export const LiveUpdatesManager: React.FC<LiveUpdatesManagerProps> = ({ children }) => {
  const { updateStatus, checkForUpdates } = useLiveUpdates();

  useEffect(() => {
    // Check for updates when component mounts
    checkForUpdates();

    // Set up periodic update checks (every 30 minutes)
    const interval = setInterval(() => {
      checkForUpdates();
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [checkForUpdates]);

  // Show update notification if available
  if (updateStatus.updateAvailable) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
          <h3 className="text-lg font-semibold mb-2">App Update Available</h3>
          <p className="text-gray-600 mb-4">
            A new version of Dating or Not is available. The app will update automatically.
          </p>
          <div className="flex justify-end">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600"
            >
              Restart App
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state during update check
  if (updateStatus.isChecking) {
    return (
      <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-40">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Checking for updates...
        </div>
      </div>
    );
  }

  // Show error if update check failed
  if (updateStatus.error) {
    return (
      <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-40">
        <div className="flex items-center">
          <span className="mr-2">⚠️</span>
          {updateStatus.error}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default LiveUpdatesManager;
