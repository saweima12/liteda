# Progressive Web App (PWA) Support

Liteda is a fully functional Progressive Web App (PWA), allowing users to install it on their devices and use it offline.

## Features

### ✅ Installable
- Add to home screen on mobile devices
- Install as desktop app on Windows/Mac/Linux
- Native app-like experience

### 📴 Offline Support
- Service worker caching for fast load times
- Graceful offline fallback page
- Automatic reconnection detection

### 🔄 Smart Caching
- **App Shell**: Cache-first strategy for instant loads
- **API Requests**: Network-first with cache fallback
- **Static Assets**: Cache-first for optimal performance
- **Images**: Cache-first to reduce bandwidth

### 🔔 Update Notifications
- Automatic update checks every hour
- User prompt when new version available
- Seamless update process

## Installation

### Desktop (Chrome/Edge/Brave)

1. Open Liteda in your browser
2. Look for the install icon (⊕) in the address bar
3. Click "Install" or "Add to Desktop"
4. Liteda will open in a standalone window

**Keyboard Shortcut**: `Ctrl/Cmd + Shift + A` → Install

### Mobile (iOS)

1. Open Liteda in Safari
2. Tap the Share button (□↑)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" to confirm

### Mobile (Android)

1. Open Liteda in Chrome
2. Tap the menu (⋮)
3. Tap "Add to Home Screen" or "Install App"
4. Tap "Install" to confirm

## Development

### Generate PWA Icons

Before using PWA features, you need to generate icon files:

```bash
# Option 1: Using npm script (requires Inkscape or ImageMagick)
bun run pwa:icons

# Option 2: Manual generation
# See static/ICONS_README.md for detailed instructions
```

### Test PWA Locally

1. **Build the production version** (PWA requires HTTPS or localhost):
   ```bash
   bun run build
   bun preview
   ```

2. **Open DevTools** → Application tab:
   - Check "Manifest" section for icon loading
   - Check "Service Workers" for registration status
   - Test offline mode in "Network" tab (set to "Offline")

3. **Test Installation**:
   - Look for install prompt in browser
   - Try "Add to Home Screen" feature
   - Verify app opens in standalone mode

### Service Worker Development

The service worker is located at `static/service-worker.js`.

**Clear Cache During Development**:
```javascript
// In browser console
navigator.serviceWorker.getRegistration().then(reg => {
  reg.unregister();
});

// Clear all caches
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});

// Or send message to service worker
navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
```

### Caching Strategies

| Resource Type | Strategy | Description |
|--------------|----------|-------------|
| HTML Pages | Network-first | Always try fresh content |
| API Calls | Network-first | Fresh data with offline fallback |
| CSS/JS | Cache-first | Fast loading, update on new version |
| Images | Cache-first | Reduce bandwidth usage |
| Fonts | Cache-first | Instant text rendering |

### Update Service Worker

When you modify `service-worker.js`:

1. Increment `CACHE_VERSION` constant
2. Users will see update prompt on next visit
3. Accepting update will reload with new version

```javascript
// In service-worker.js
const CACHE_VERSION = 'liteda-v2'; // Increment version
```

## Configuration

### Customize Manifest

Edit `static/manifest.json` to customize PWA appearance:

```json
{
  "name": "My Homelab Dashboard",
  "short_name": "Dashboard",
  "description": "Custom description",
  "theme_color": "#your-color",
  "background_color": "#your-color",
  ...
}
```

### Add Screenshots

Add promotional screenshots for install prompt:

1. Take screenshots of your dashboard (desktop: 1280x720, mobile: 750x1334)
2. Save to `static/screenshot-desktop.png` and `static/screenshot-mobile.png`
3. Screenshots appear in browser install prompts

### Add Shortcuts

Define quick actions in `manifest.json`:

```json
{
  "shortcuts": [
    {
      "name": "Media Server",
      "url": "/?page=media",
      "icons": [{ "src": "/icon-192.png", "sizes": "192x192" }]
    }
  ]
}
```

## Testing Checklist

- [ ] Icons load correctly (192x192, 512x512)
- [ ] Manifest is accessible at `/manifest.json`
- [ ] Service worker registers successfully
- [ ] Offline page displays when network is down
- [ ] Install prompt appears in browser
- [ ] App installs successfully
- [ ] App opens in standalone mode (no browser UI)
- [ ] Updates trigger notification
- [ ] Cache strategies work as expected

## Lighthouse PWA Audit

Run Lighthouse audit to verify PWA compliance:

1. Open Chrome DevTools → Lighthouse tab
2. Select "Progressive Web App" category
3. Click "Generate report"
4. Aim for 90+ score

**Common Issues**:
- ❌ Icons not loading → Run `bun run pwa:icons`
- ❌ Service worker not registering → Check console for errors
- ❌ Not installable → Verify HTTPS or localhost
- ❌ Manifest errors → Validate JSON syntax

## Browser Support

| Browser | Desktop Install | Mobile Install | Offline |
|---------|----------------|----------------|---------|
| Chrome | ✅ | ✅ | ✅ |
| Edge | ✅ | ✅ | ✅ |
| Firefox | ⚠️ Limited | ❌ | ✅ |
| Safari | ❌ | ✅ | ✅ |
| Opera | ✅ | ✅ | ✅ |
| Brave | ✅ | ✅ | ✅ |

## Troubleshooting

### Service Worker Not Updating

```javascript
// Force update in console
navigator.serviceWorker.getRegistration().then(reg => {
  reg.update();
});
```

### Clear Everything and Reinstall

```javascript
// Unregister service worker
navigator.serviceWorker.getRegistration().then(reg => {
  reg.unregister();
});

// Clear all caches
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});

// Hard refresh
location.reload(true);
```

### PWA Not Installable

1. Ensure you're using HTTPS or localhost
2. Verify manifest.json is accessible
3. Check that icons exist and load
4. Verify service worker registers successfully
5. Check browser console for errors

### Offline Page Not Showing

1. Ensure `/offline.html` exists in `static/`
2. Verify it's precached in service worker
3. Test network offline mode in DevTools
4. Check service worker console logs

## Production Deployment

### Docker

PWA files are automatically included in Docker builds:

```dockerfile
# No special configuration needed
# static/ directory is copied to build
```

### Verify Production PWA

```bash
# Build and preview
bun run build
bun preview

# Test in browser
# Visit http://localhost:4173
# Check PWA install prompt
```

### HTTPS Requirement

PWA features require HTTPS in production (except localhost).

Options:
- Use reverse proxy with SSL (Nginx, Traefik, Caddy)
- Use Cloudflare for free HTTPS
- Use Let's Encrypt certificates

## Additional Resources

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Google PWA Guide](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

## FAQ

**Q: Do I need to do anything for PWA to work?**
A: Just generate icons with `bun run pwa:icons` and deploy. PWA features are automatic.

**Q: Will PWA work in development mode?**
A: Yes, but best tested in production build (`bun run build && bun preview`)

**Q: How much storage does the cache use?**
A: Typically 5-20MB depending on your dashboard size. Browsers manage cache automatically.

**Q: Can I disable PWA?**
A: Yes, remove service worker registration from `src/app.html`. But we recommend keeping it for better performance.

**Q: How often does the cache update?**
A: Service worker checks for updates every hour. Users can also manually reload.
