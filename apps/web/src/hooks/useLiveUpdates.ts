import { useEffect, useState } from 'react';
import { sync, reload, getConfig } from '@capacitor/live-updates';
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
      console.log('Not a native platform, skipping Live Updates initialization');
      return;
    }

    console.log('Native platform detected:', Capacitor.getPlatform());

    const initializeLiveUpdates = async () => {
      try {
        console.log('Initializing Live Updates...');

        // v0.4.0 has no getCurrentBundle; read config instead
        const cfg = await getConfig().catch(() => null);
        setUpdateStatus(prev => ({ ...prev, currentBundle: cfg?.channel ?? null }));

        // Check for updates on app start
        await checkForUpdates();
      } catch (error) {
        console.error('Failed to initialize Live Updates:', error);
        // Don't set error state immediately - this might be expected in development
        console.log('Live Updates may not be fully configured yet');
      }
    };

    initializeLiveUpdates();
  }, []);

  const checkForUpdates = async (): Promise<void> => {
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
      const result = await sync();
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
    } catch (error) {
      console.error('Live update check failed:', error);
      setUpdateStatus(prev => ({
        ...prev,
        isChecking: false,
        error: null // Don't show error to user in development
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
      const result = await sync();

      setUpdateStatus(prev => ({
        ...prev,
        isDownloading: false,
        downloadProgress: 100,
        updateAvailable: false
      }));

      if (result.snapshot?.id) {
        console.log('Update downloaded successfully:', result.snapshot.id);
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
      await reload();
    } catch (error) {
      console.error('Failed to reload app:', error);
      // Fallback to window reload
      window.location.reload();
    }
  };

  const getUpdateInfo = async (): Promise<any | null> => {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    try {
      // v0.4.0 has no getLatestBundle; return current config
      return await getConfig();
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
