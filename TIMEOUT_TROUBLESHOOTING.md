# Timeout Error Troubleshooting Guide

## Problem
The app sometimes returns timeout errors on physical devices but works fine on simulators when making API calls to JSONPlaceholder.

## Root Causes

### 1. **Network Differences**
- **Simulator**: Uses host machine's network connection (typically faster, more stable)
- **Device**: Uses device's network connection (can be slower, less stable, cellular vs WiFi)

### 2. **Timeout Configuration**
- Original timeout was only 5 seconds, insufficient for slower network conditions
- No retry mechanism for failed requests

### 3. **Network Security**
- Android devices may have stricter network security policies
- Missing network security configuration

### 4. **Debug Code**
- Debugger statements in production code can cause issues

### 5. **Random Network Issues (Why Timeouts Occur Randomly)**
- **Cellular Network Fluctuations**: Signal strength varies constantly
- **Network Congestion**: Peak usage times cause slower response
- **DNS Resolution Issues**: Intermittent DNS lookup failures
- **Carrier Network Switching**: Handoffs between towers/cells
- **Background App Restrictions**: OS throttles network requests
- **Battery Optimization**: Aggressive power saving affects network
- **VPN Interference**: Corporate/private VPNs can cause delays
- **Firewall/Proxy Issues**: Network infrastructure blocking requests
- **Server-side Rate Limiting**: API endpoints may throttle requests
- **Geographic Routing**: CDN routing changes based on location

### 6. **App Launch Issues (First Launch Works, Subsequent Fail)**
- **Network State Persistence**: Cached network connections become stale
- **Service Initialization Race Conditions**: Services not properly reinitialized
- **App Background/Foreground State**: Network state not refreshed on app resume
- **Axios Instance Caching**: Old axios instances with expired configurations
- **Network Security Policy Caching**: Android network policies not refreshed
- **DNS Cache Issues**: Stale DNS resolutions from previous sessions

## Solutions Implemented

### 1. **Dynamic Timeout Based on Network Type**
```typescript
// Before: 5000ms fixed
// After: Dynamic based on network type
- WiFi: 15 seconds
- Cellular: 20 seconds  
- Unknown/Weak: 25 seconds
- Development: 10 seconds
```

### 2. **Enhanced Retry Logic with Exponential Backoff**
- Automatic retry for network errors, timeouts, and server errors
- Configurable retry count (3 attempts)
- Exponential backoff: 1s, 2s, 4s, 8s (max)
- Better error code detection (ERR_NETWORK, ERR_INTERNET_DISCONNECTED)

### 3. **Request Deduplication**
- Prevents multiple identical requests running simultaneously
- Reduces server load and improves performance
- Automatic cleanup of pending requests

### 4. **Network State Monitoring**
- Real-time network connectivity monitoring using NetInfo
- Network type detection (WiFi vs Cellular)
- Internet reachability checking
- Network stability assessment

### 5. **Network Security Configuration**
- Added `network_security_config.xml` for Android
- Updated `AndroidManifest.xml` to use network security config
- Allows cleartext traffic for development

### 6. **Enhanced Error Handling**
- Specific error messages for different failure types
- Detailed logging for debugging
- User-friendly error messages
- Request timing measurement

### 7. **Network Monitor Component**
- Real-time network status display
- Visual indicators for network health
- Automatic visibility on network changes

### 8. **App State Management**
- Automatic service reset on app foreground
- Network state monitoring on app lifecycle changes
- Proper cleanup on app background
- Force network reset functionality

### 9. **Service Re-initialization**
- AxiosService reset and re-initialization
- Network state refresh on app resume
- Pending request cleanup
- Race condition prevention

## Additional Recommendations

### 1. **Install Network Info Library**
```bash
npm install @react-native-community/netinfo
```

### 2. **Add Network State Monitoring**
```typescript
import NetInfo from '@react-native-community/netinfo';

// Monitor network state changes
NetInfo.addEventListener(state => {
  console.log('Network state:', state);
});
```

### 3. **Test on Different Networks**
- Test on WiFi vs Cellular
- Test on different network speeds
- Test on different carriers

### 4. **Production Considerations**
- Remove debug logging in production builds
- Consider using a CDN for better global performance
- Implement proper error boundaries
- Add offline support

## Debugging Steps

1. **Check Network Logs**
   ```bash
   # iOS
   npx react-native log-ios
   
   # Android
   npx react-native log-android
   ```

2. **Monitor Comprehensive Logging**
   The app now includes detailed logging with emojis for easy identification:
   
   - 🌐 **Network logs**: Network state changes and connectivity
   - 📤 **Request logs**: Outgoing API requests
   - 📥 **Response logs**: API responses and timing
   - ❌ **Error logs**: Network errors and failures
   - ✅ **Success logs**: Successful operations
   - ⚠️ **Warning logs**: Retries and network issues
   - 🔄 **Retry logs**: Retry attempts and delays
   - 👆 **User logs**: User interactions
   - 🖥️ **Component logs**: Component lifecycle
   - 🪝 **Hook logs**: Hook state changes

3. **Network Monitor Component**
   - Visual indicator showing real-time network status
   - Green: Connected with internet
   - Orange: Connected but no internet
   - Red: Disconnected
   - Automatically appears on network changes

4. **Request Lifecycle Tracking**
   ```typescript
   // Logs show complete request lifecycle:
   // 📤 REQUEST START: GET /posts/42
   // 📥 RESPONSE SUCCESS: 200 OK (150ms)
   // 🔄 RETRY ATTEMPT 2/3 (if needed)
   // ❌ RESPONSE ERROR: timeout (if failed)
   ```

5. **Network State Monitoring**
   ```typescript
   // Real-time network state changes:
   // 📡 NETWORK STATE CHANGED: WiFi → Cellular
   // 🔍 CHECKING NETWORK STABILITY
   // ✅ NETWORK STABLE: WiFi connected
   ```

6. **Performance Tracking**
   - Request duration measurements
   - Network type detection (WiFi vs Cellular)
   - Timeout calculations based on network type
   - Retry delay calculations

7. **Error Analysis**
   - Detailed error codes and messages
   - Retry decision logging
   - Network stability assessment
   - Request deduplication tracking

8. **App Launch Debugging**
   - Monitor app state changes in logs
   - Check service initialization on app start
   - Use "Reset Network" button for manual reset
   - Watch for app foreground/background transitions

## Common Device-Specific Issues

### iOS
- App Transport Security (ATS) restrictions
- Network extension requirements
- Background app refresh settings

### Android
- Battery optimization affecting network requests
- Doze mode restrictions
- Network security policies
- VPN interference

## Performance Tips

1. **Use Request Caching**
2. **Implement Request Deduplication**
3. **Add Request Queuing**
4. **Use Background Fetch for iOS**
5. **Implement Progressive Loading**
