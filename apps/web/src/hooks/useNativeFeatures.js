/**
 * Custom hook for iOS-specific native features
 * Provides safe fallbacks for web development
 */
import { useCallback, useEffect, useState } from 'react';
// Capacitor imports with dynamic loading to avoid errors in web dev
const loadCapacitorPlugins = async () => {
    try {
        const [{ Haptics, ImpactStyle }, { Camera, CameraResultType, CameraSource }, { PushNotifications }, { Geolocation }, { StatusBar, Style }] = await Promise.all([
            import('@capacitor/haptics'),
            import('@capacitor/camera'),
            import('@capacitor/push-notifications'),
            import('@capacitor/geolocation'),
            import('@capacitor/status-bar')
        ]);
        return {
            Haptics,
            ImpactStyle,
            Camera,
            CameraResultType,
            CameraSource,
            PushNotifications,
            Geolocation,
            StatusBar,
            Style
        };
    }
    catch (error) {
        console.log('Capacitor plugins not available (running in web mode)');
        return null;
    }
};
export const useNativeFeatures = () => {
    const [isNative, setIsNative] = useState(false);
    const [plugins, setPlugins] = useState(null);
    useEffect(() => {
        const initPlugins = async () => {
            const loadedPlugins = await loadCapacitorPlugins();
            if (loadedPlugins) {
                setPlugins(loadedPlugins);
                setIsNative(true);
            }
        };
        initPlugins();
    }, []);
    // Haptic feedback for swipe actions
    const triggerHapticFeedback = useCallback(async (style = 'light') => {
        if (!plugins?.Haptics)
            return;
        try {
            const impactStyle = style === 'light' ? plugins.ImpactStyle.Light :
                style === 'medium' ? plugins.ImpactStyle.Medium :
                    plugins.ImpactStyle.Heavy;
            await plugins.Haptics.impact({ style: impactStyle });
        }
        catch (error) {
            console.log('Haptic feedback not available:', error);
        }
    }, [plugins]);
    // Take photo for profile
    const takePhoto = useCallback(async () => {
        if (!plugins?.Camera) {
            // Fallback for web - trigger file input
            return new Promise((resolve) => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.readAsDataURL(file);
                    }
                    else {
                        resolve(null);
                    }
                };
                input.click();
            });
        }
        try {
            const image = await plugins.Camera.getPhoto({
                quality: 90,
                allowEditing: true,
                resultType: plugins.CameraResultType.DataUrl,
                source: plugins.CameraSource.Camera
            });
            return image.dataUrl || null;
        }
        catch (error) {
            console.log('Camera not available:', error);
            return null;
        }
    }, [plugins]);
    // Request notification permissions
    const requestNotificationPermission = useCallback(async () => {
        if (!plugins?.PushNotifications) {
            // Web fallback - request browser notifications
            if ('Notification' in window) {
                return await Notification.requestPermission();
            }
            return 'denied';
        }
        try {
            const result = await plugins.PushNotifications.requestPermissions();
            return result.receive === 'granted' ? 'granted' : 'denied';
        }
        catch (error) {
            console.log('Push notifications not available:', error);
            return 'denied';
        }
    }, [plugins]);
    // Get user location for proximity features
    const getCurrentLocation = useCallback(async () => {
        if (!plugins?.Geolocation) {
            // Web fallback
            if ('geolocation' in navigator) {
                return new Promise((resolve) => {
                    navigator.geolocation.getCurrentPosition((position) => resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    }), () => resolve(null));
                });
            }
            return null;
        }
        try {
            const coordinates = await plugins.Geolocation.getCurrentPosition();
            return {
                latitude: coordinates.coords.latitude,
                longitude: coordinates.coords.longitude
            };
        }
        catch (error) {
            console.log('Location not available:', error);
            return null;
        }
    }, [plugins]);
    // Set status bar style to match app theme
    const setStatusBarStyle = useCallback(async (isDark) => {
        if (!plugins?.StatusBar)
            return;
        try {
            await plugins.StatusBar.setStyle({
                style: isDark ? plugins.Style.Dark : plugins.Style.Light
            });
        }
        catch (error) {
            console.log('Status bar styling not available:', error);
        }
    }, [plugins]);
    return {
        isNative,
        triggerHapticFeedback,
        takePhoto,
        requestNotificationPermission,
        getCurrentLocation,
        setStatusBarStyle
    };
};
export default useNativeFeatures;
