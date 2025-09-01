import { useEffect, useState } from 'react';
import { LiveUpdates, LiveUpdatesSummary } from '@capacitor/live-updates';
import { Capacitor } from '@capacitor/core';

interface UpdateStatus {
  isChecking: boolean;
  updateAvailable: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  error: string | null;
  currentBundle: string | null;
}

export const useLiveUpdates = () => {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
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
      return;
    }

    const initializeLiveUpdates = async () => {
      try {
        // Get current bundle info
        const currentBundle = await LiveUpdates.getCurrentBundle();
        setUpdateStatus(prev => ({
          ...prev,
          currentBundle: currentBundle.bundleId || null
        }));

        // Check for updates on app start
        await checkForUpdates();
      } catch (error) {
        console.error('Failed to initialize Live Updates:', error);
        setUpdateStatus(prev => ({
          ...prev,
          error: 'Failed to initialize updates'
        }));
      }
    };

    initializeLiveUpdates();
  }, []);

  const checkForUpdates = async (): Promise<void> => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    setUpdateStatus(prev => ({
      ...prev,
      isChecking: true,
      error: null
    }));

    try {
      const result = await LiveUpdates.sync({
        updateMethod: 'background'
      });

      setUpdateStatus(prev => ({
        ...prev,
        isChecking: false,
        updateAvailable: result.activeApplicationPathChanged || false
      }));

      if (result.activeApplicationPathChanged) {
        console.log('Live update applied successfully');
        // Optionally show user notification that app has been updated
      }
    } catch (error) {
      console.error('Live update check failed:', error);
      setUpdateStatus(prev => ({
        ...prev,
        isChecking: false,
        error: 'Failed to check for updates'
      }));
    }
  };

  const downloadUpdate = async (): Promise<void> => {
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
      const result = await LiveUpdates.downloadUpdate({
        updateMethod: 'background'
      });

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
    } catch (error) {
      console.error('Update download failed:', error);
      setUpdateStatus(prev => ({
        ...prev,
        isDownloading: false,
        error: 'Failed to download update'
      }));
    }
  };

  const reloadApp = async (): Promise<void> => {
    if (!Capacitor.isNativePlatform()) {
      window.location.reload();
      return;
    }

    try {
      await LiveUpdates.reload();
    } catch (error) {
      console.error('Failed to reload app:', error);
      // Fallback to window reload
      window.location.reload();
    }
  };

  const getUpdateInfo = async (): Promise<LiveUpdatesSummary | null> => {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    try {
      return await LiveUpdates.getLatestBundle();
    } catch (error) {
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
