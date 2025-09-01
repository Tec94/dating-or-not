import { useEffect, useState } from 'react';
import { LiveUpdates } from '@capacitor/live-updates';
import { Capacitor } from '@capacitor/core';
export const useLiveUpdates = () => {
    const [updateStatus, setUpdateStatus] = useState({
        isChecking: false,
        updateAvailable: false,
        isDownloading: false,
        downloadProgress: 0,
        error: null,
        currentBundle: null
    });
    useEffect(() => {
        // Only run on native platforms
        if (!Capacitor.isNativePlatform()) {
            console.log('Not a native platform, skipping Live Updates initialization');
            return;
        }
        console.log('Native platform detected:', Capacitor.getPlatform());
        const initializeLiveUpdates = async () => {
            try {
                console.log('Initializing Live Updates...');
                // Get current bundle info
                const currentBundle = await LiveUpdates.getCurrentBundle();
                console.log('Current bundle:', currentBundle);
                setUpdateStatus(prev => ({
                    ...prev,
                    currentBundle: currentBundle.bundleId || null
                }));
                // Check for updates on app start
                await checkForUpdates();
            }
            catch (error) {
                console.error('Failed to initialize Live Updates:', error);
                // Don't set error state immediately - this might be expected in development
                console.log('Live Updates may not be fully configured yet');
            }
        };
        initializeLiveUpdates();
    }, []);
    const checkForUpdates = async () => {
        if (!Capacitor.isNativePlatform()) {
            console.log('Skipping update check - not on native platform');
            return;
        }
        setUpdateStatus(prev => ({
            ...prev,
            isChecking: true,
            error: null
        }));
        try {
            console.log('Checking for Live Updates...');
            const result = await LiveUpdates.sync();
            console.log('Sync result:', result);
            setUpdateStatus(prev => ({
                ...prev,
                isChecking: false,
                updateAvailable: result.activeApplicationPathChanged || false
            }));
            if (result.activeApplicationPathChanged) {
                console.log('Live update applied successfully');
                // Optionally show user notification that app has been updated
            }
        }
        catch (error) {
            console.error('Live update check failed:', error);
            setUpdateStatus(prev => ({
                ...prev,
                isChecking: false,
                error: null // Don't show error to user in development
            }));
        }
    };
    const downloadUpdate = async () => {
        if (!Capacitor.isNativePlatform()) {
            return;
        }
        setUpdateStatus(prev => ({
            ...prev,
            isDownloading: true,
            downloadProgress: 0,
            error: null
        }));
        try {
            const result = await LiveUpdates.sync();
            setUpdateStatus(prev => ({
                ...prev,
                isDownloading: false,
                downloadProgress: 100,
                updateAvailable: false
            }));
            if (result.bundleId) {
                console.log('Update downloaded successfully:', result.bundleId);
                // Update will be applied on next app restart
            }
        }
        catch (error) {
            console.error('Update download failed:', error);
            setUpdateStatus(prev => ({
                ...prev,
                isDownloading: false,
                error: 'Failed to download update'
            }));
        }
    };
    const reloadApp = async () => {
        if (!Capacitor.isNativePlatform()) {
            window.location.reload();
            return;
        }
        try {
            await LiveUpdates.reload();
        }
        catch (error) {
            console.error('Failed to reload app:', error);
            // Fallback to window reload
            window.location.reload();
        }
    };
    const getUpdateInfo = async () => {
        if (!Capacitor.isNativePlatform()) {
            return null;
        }
        try {
            return await LiveUpdates.getLatestBundle();
        }
        catch (error) {
            console.error('Failed to get update info:', error);
            return null;
        }
    };
    return {
        updateStatus,
        checkForUpdates,
        downloadUpdate,
        reloadApp,
        getUpdateInfo
    };
};
export default useLiveUpdates;
