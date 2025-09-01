import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useLiveUpdates } from '../hooks/useLiveUpdates';
export const LiveUpdatesManager = ({ children }) => {
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
        return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg p-6 max-w-sm mx-4", children: [_jsx("h3", { className: "text-lg font-semibold mb-2", children: "App Update Available" }), _jsx("p", { className: "text-gray-600 mb-4", children: "A new version of Dating or Not is available. The app will update automatically." }), _jsx("div", { className: "flex justify-end", children: _jsx("button", { onClick: () => window.location.reload(), className: "px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600", children: "Restart App" }) })] }) }));
    }
    // Show loading state during update check
    if (updateStatus.isChecking) {
        return (_jsx("div", { className: "fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-40", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" }), "Checking for updates..."] }) }));
    }
    // Show error if update check failed
    if (updateStatus.error) {
        return (_jsx("div", { className: "fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-40", children: _jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "mr-2", children: "\u26A0\uFE0F" }), updateStatus.error] }) }));
    }
    return _jsx(_Fragment, { children: children });
};
export default LiveUpdatesManager;
