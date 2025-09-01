# 📱 iOS Development Guide for Dating-or-Not

## 🎯 **iOS Setup Complete!**

Your React web app has been successfully configured for iOS development using **Capacitor**. The iOS project is ready for testing and deployment.

## 📁 **Project Structure**

```
apps/web/
├── ios/                     # Native iOS project (Xcode)
│   └── App/
│       ├── App.xcodeproj    # Xcode project file
│       └── App/
│           ├── public/      # Your built web assets
│           └── Config/      # iOS app configuration
├── dist/                    # Built web app
├── capacitor.config.ts      # Capacitor configuration
└── src/                     # Your React source code
```

## 🛠 **Prerequisites for iOS Development**

### **Required Software:**
1. **macOS** - Required for iOS development
2. **Xcode** - Download from Mac App Store (free)
3. **iOS Simulator** - Included with Xcode
4. **CocoaPods** - Install via: `sudo gem install cocoapods`

### **For Device Testing:**
1. **Apple Developer Account** - Free for device testing, $99/year for App Store
2. **iOS Device** - iPhone or iPad with iOS 14+

## 🚀 **Development Workflow**

### **Option 1: Live Reload Development (Recommended)**

This allows you to see changes instantly on your iOS device/simulator while developing:

1. **Start your development servers:**
   ```bash
   # Terminal 1: Start API server
   cd apps/api && npm start

   # Terminal 2: Start web dev server  
   cd apps/web && npm run dev
   ```

2. **Ensure your iOS device/simulator can reach your dev server:**
   - Your `capacitor.config.ts` is configured to use `http://localhost:5173`
   - For physical devices, you may need to use your computer's IP address

3. **Open in Xcode and run:**
   ```bash
   cd apps/web
   npx cap open ios
   ```

4. **In Xcode:**
   - Select your target device (simulator or connected device)
   - Click the "Play" button to build and run
   - The app will load your live development server

### **Option 2: Production Build Testing**

For testing the final app experience:

1. **Build and sync:**
   ```bash
   cd apps/web
   npm run build
   npx cap sync ios
   npx cap open ios
   ```

2. **Test in Xcode as above**

## 📱 **Testing on iPhone During Development**

### **Method 1: iOS Simulator (Fastest)**

1. **Install Xcode** from Mac App Store
2. **Open your project:**
   ```bash
   cd apps/web
   npx cap open ios
   ```
3. **In Xcode:**
   - Select "iPhone 15 Pro" (or any simulator) from device dropdown
   - Click ▶️ play button
   - Simulator will launch with your app

### **Method 2: Physical iPhone (Most Accurate)**

#### **Setup (One-time):**

1. **Enable Developer Mode on iPhone:**
   - Settings → Privacy & Security → Developer Mode → Toggle ON
   - Restart iPhone when prompted

2. **Trust your Mac:**
   - Connect iPhone to Mac via USB
   - iPhone will prompt "Trust This Computer?" → Tap "Trust"

3. **Configure Xcode:**
   - Open Xcode → Preferences → Accounts
   - Sign in with your Apple ID (free Apple Developer account)

#### **Deploy to iPhone:**

1. **Connect iPhone to Mac** via USB cable

2. **Open project in Xcode:**
   ```bash
   cd apps/web
   npx cap open ios
   ```

3. **Select your iPhone** from device dropdown in Xcode

4. **Configure signing:**
   - Select "App" target in project navigator
   - Go to "Signing & Capabilities" tab
   - Select your Apple ID team
   - Xcode will automatically manage signing

5. **Build and run** - Click ▶️ play button

6. **Trust developer on iPhone:**
   - First time: Settings → General → VPN & Device Management
   - Tap your Apple ID → "Trust [Your Apple ID]"

## 🔧 **Development Commands**

```bash
# Build web app and sync to iOS
npm run build && npx cap sync ios

# Open iOS project in Xcode
npx cap open ios

# Live reload development (run web dev server first)
npm run dev
# Then run iOS app in Xcode - it will connect to localhost:5173

# Add new Capacitor plugins
npm install @capacitor/[plugin-name]
npx cap sync ios

# Update native iOS dependencies
npx cap sync ios
```

## 📋 **Installed iOS Features**

Your app includes these native iOS capabilities:

- ✅ **Camera Access** - For profile photos
- ✅ **Photo Library** - For profile pictures  
- ✅ **Location Services** - For dating proximity features
- ✅ **Push Notifications** - For matches and messages
- ✅ **Haptic Feedback** - For better UX
- ✅ **Status Bar Management** - Theme-aware status bar
- ✅ **Splash Screen** - Custom loading screen

## 🎨 **iOS-Specific Configurations**

### **App Icon & Splash Screen**
- Place app icons in: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- Splash screen configured in `capacitor.config.ts`

### **iOS Permissions**
- Camera/Photos: Automatically configured
- Location: Will prompt user when needed
- Push notifications: Configured for badges, sounds, alerts

### **Dark Mode Support**
- Your app already supports dark mode via CSS
- iOS will automatically respect user's system preference

## 🚀 **Next Steps for Production**

### **1. App Store Preparation**
```bash
# Create production build
npm run build
npx cap sync ios

# Open in Xcode and:
# - Configure App Store icons (1024x1024)
# - Set up proper certificates and provisioning profiles
# - Configure app metadata
```

### **2. Native Features Integration**

Your app is ready for these iOS-specific enhancements:

```typescript
// Example: Add haptic feedback to swipe actions
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const handleSwipe = async (direction: 'left' | 'right') => {
  await Haptics.impact({ style: ImpactStyle.Light });
  // Your existing swipe logic
};

// Example: Request push notification permissions
import { PushNotifications } from '@capacitor/push-notifications';

const requestNotificationPermission = async () => {
  await PushNotifications.requestPermissions();
};
```

## 🔍 **Troubleshooting**

### **"Could not find Xcode"**
- Install Xcode from Mac App Store
- Run: `sudo xcode-select --install`

### **"Pod install failed"**
- Install CocoaPods: `sudo gem install cocoapods`
- Run: `cd ios/App && pod install`

### **Live reload not working**
- Ensure your dev server is running on `http://localhost:5173`
- For physical devices, update `capacitor.config.ts` server URL to your Mac's IP
- Check firewall settings

### **App crashes on device**
- Check Xcode console for error messages
- Ensure all required permissions are properly configured
- Test in iOS Simulator first

## 📖 **Useful Resources**

- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [iOS Development Guide](https://capacitorjs.com/docs/basics/workflow)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)

Your Dating-or-Not app is now ready for iOS development and testing! 🎉
