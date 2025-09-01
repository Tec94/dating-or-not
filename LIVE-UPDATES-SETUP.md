# Live Updates Setup Guide

## Issue: "capacitor.config.json is not available"

This error typically occurs when the Live Updates plugin is trying to initialize but cannot find the proper configuration. Here's how to resolve it:

## Steps to Fix:

### 1. Ensure Appflow Setup
The Live Updates feature requires your app to be properly configured with Ionic Appflow:

1. **Create Appflow Account**: Sign up at [ionic.io](https://ionic.io)
2. **Link Your App**: Connect your repository to Appflow
3. **Get App ID**: Copy your Appflow App ID from the dashboard

### 2. Update Configuration
Update your `capacitor.config.ts` with the correct Appflow App ID:

```typescript
plugins: {
  LiveUpdates: {
    appId: 'YOUR_ACTUAL_APPFLOW_APP_ID', // Replace with real ID
    channel: 'production'
  }
}
```

### 3. Sync Configuration
After updating the config, sync your native projects:

```bash
cd apps/web
npx cap sync ios
npx cap sync android
```

### 4. Verify Installation
The sync process should show:
- ✅ Creating capacitor.config.json in ios/App/App
- ✅ Found @capacitor/live-updates@0.4.0 in plugins list

## Testing Live Updates

### Development Testing:
1. The Live Updates will not function in development mode (`npm run dev`)
2. You need to build and deploy through Appflow to test updates
3. Use console logs to verify the plugin is loading correctly

### Production Testing:
1. Build your app through Appflow
2. Deploy the native app to a device
3. Make changes and deploy a new web build through Appflow
4. The app should automatically download and apply updates

## Common Issues:

### "capacitor.config.json is not available"
- **Cause**: Missing or invalid Appflow configuration
- **Solution**: Ensure you have a valid Appflow App ID and proper setup

### "Live Updates not working"
- **Cause**: Testing in development mode
- **Solution**: Test with production builds through Appflow

### "Plugin not found"
- **Cause**: Plugin not properly installed or synced
- **Solution**: Reinstall plugin and sync native projects

## Current Status:
- ✅ Plugin installed: @capacitor/live-updates@0.4.0
- ✅ Configuration updated in capacitor.config.ts
- ✅ iOS project synced successfully
- ⚠️ Needs valid Appflow App ID for full functionality

## Next Steps:
1. Replace placeholder App ID with real Appflow App ID
2. Test with production builds through Appflow
3. Verify updates are working as expected

## Debugging:
Check browser console for Live Updates logs:
- "Native platform detected: ios"
- "Initializing Live Updates..."
- "Current bundle: [bundle-info]"
- "Checking for Live Updates..."
