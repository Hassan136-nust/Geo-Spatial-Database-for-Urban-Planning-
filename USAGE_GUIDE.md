# 🎮 GeoSpatial Urban Intelligence Platform - Usage Guide

## Quick Start Guide

### 1. First Launch

When you first load the application:
1. You'll see a loading animation while the 3D Earth textures load
2. The Earth globe will appear in the background
3. The glassmorphic navigation bar appears at the top
4. The Overview page loads by default

### 2. Navigation

**Top Navigation Bar** (Glassmorphic pill)
- **Overview** - Dashboard with KPIs and system stats
- **Analytics** - Urban analytics and data trends
- **Mapping** - Spatial layer controls and regions
- **Data Streams** - Real-time pipeline monitoring

Click any section to navigate. The camera will smoothly transition to a new position.

### 3. Earth Globe Interactions

#### Auto-Rotation (Default)
The Earth continuously rotates on its own. This creates a living, dynamic background.

#### Scroll Interaction
- **Action**: Scroll your mouse wheel or trackpad
- **Effect**: The Earth rotates based on scroll position
- **Use Case**: Explore different angles while reading content

#### Manual Rotation (Drag)
- **Action**: Click and drag on the Earth
- **Effect**: Manually spin the globe in any direction
- **Physics**: Smooth inertia and damping create realistic motion
- **Limits**: Vertical rotation capped at ±90° (prevents flipping)

#### Hover Effect
- **Action**: Move your mouse over the Earth
- **Effect**: Atmospheric glow intensifies
- **Visual Cue**: Cursor changes to grab/grabbing

### 4. Keyboard Shortcuts

Press `?` to view all keyboard shortcuts in-app.

| Key | Action |
|-----|--------|
| `?` | Show keyboard shortcuts dialog |
| `P` | Toggle performance stats overlay |
| `Esc` | Close dialogs |
| `Scroll` | Rotate Earth |
| `Click + Drag` | Manual Earth rotation |

### 5. Performance Stats (Developer Tool)

Press `P` to toggle a real-time performance monitor:
- **FPS** - Frames per second (target: 60fps)
  - Green: 55+ fps (excellent)
  - Yellow: 30-54 fps (good)
  - Red: <30 fps (needs optimization)
- **Memory** - JavaScript heap usage (if available)

**Use Cases:**
- Debug performance issues
- Monitor resource usage
- Verify smooth animations

### 6. Page Features

#### Overview Page
- **KPI Cards**: Active sensors, data points, cities, sessions
- **Live Data Stream**: Real-time sensor updates
- **System Status**: Network health, processing, storage

#### Analytics Page
- **Traffic Trends**: +23.4% vs. last month
- **Peak Hours**: 8-10 AM congestion analysis
- **Hourly Distribution**: Visual bar chart
- **Zone Performance**: 5 urban zones with metrics

#### Mapping Page
- **Map Layers**: 6 toggleable layers
  - Traffic Flow
  - Environmental Sensors
  - Public Transit
  - Emergency Services
  - Infrastructure
  - Population Density
- **Regional Stats**: North District, Central Hub, South Corridor

#### Data Streams Page
- **Active Streams**: 4 real-time data pipelines
- **Infrastructure**: Edge servers, cloud instances, network nodes
- **Processing Queue**: Pending, processing, completed counts

## Advanced Features

### Camera Transitions

Each route has a unique camera position:

| Route | Position | FOV | Feel |
|-------|----------|-----|------|
| Overview | `[0, 0, 8]` | 50° | Centered, neutral |
| Analytics | `[0, 1, 7]` | 55° | Slightly elevated |
| Mapping | `[1, 0, 7.5]` | 50° | Right offset |
| Data | `[-1, 0.5, 7.5]` | 52° | Left-elevated |

**Transition Duration**: 1.2 seconds  
**Easing**: Cubic ease-out for smooth, professional feel

### Glassmorphic Design

All UI panels use:
- **Backdrop blur**: 24px blur radius
- **Background**: 5% white opacity
- **Border**: 10% white opacity
- **Hover**: Lifts 4px with increased opacity
- **Shadow**: Deep, soft shadows for depth

### Motion Design

**Entrance Animations**:
- Opacity: 0 → 1
- Y-position: 20px → 0px
- Duration: 600ms
- Easing: Cubic bezier [0.22, 1, 0.36, 1]

**Staggered Lists**:
- Delay: 50-100ms per item
- Creates cascading effect

**Hover States**:
- Scale: 1.05 (buttons)
- Lift: -4px (panels)
- Duration: 200ms

## Tips & Tricks

### 1. Performance Optimization
- Keep only one browser tab open for best performance
- Use Chrome/Edge for best WebGL performance
- Disable browser extensions if experiencing lag
- Close performance stats when not needed (saves ~2-3 FPS)

### 2. Visual Effects
- Scroll slowly to see smooth Earth rotation
- Drag with momentum for inertia effect
- Hover over different UI elements for animations
- Watch the atmospheric glow pulse subtly

### 3. Navigation Flow
- Use keyboard shortcuts for power-user efficiency
- Notice camera transitions between pages
- Observe globe continuing to rotate during navigation
- Explore different sections to see varied camera angles

### 4. Responsive Design
- Works on desktop (1920x1080 optimal)
- Tablet support (1024x768+)
- Mobile support (responsive grid/text)
- Best experience: Desktop with mouse

## Troubleshooting

### Earth Not Loading
- **Issue**: Black screen or no Earth
- **Solution**: 
  - Check internet connection (textures load from CDN)
  - Ensure WebGL is enabled in browser
  - Try refreshing the page
  - Check browser console for errors

### Low FPS / Laggy Performance
- **Issue**: <30 FPS, choppy animations
- **Solutions**:
  - Close other browser tabs
  - Update graphics drivers
  - Try in Chrome (best WebGL support)
  - Reduce browser zoom to 100%
  - Close resource-heavy applications

### Globe Not Rotating on Scroll
- **Issue**: Scroll doesn't affect Earth
- **Solution**:
  - Ensure JavaScript is enabled
  - Check if page content is scrollable (try adding content)
  - Verify no browser extensions blocking scroll events

### Textures Not Loading
- **Issue**: White sphere instead of Earth
- **Solution**:
  - Check internet connection
  - Verify CDN URLs are accessible
  - Clear browser cache
  - Check browser console for CORS errors

### UI Elements Not Visible
- **Issue**: Can't see glassmorphic panels
- **Solution**:
  - Ensure backdrop-filter is supported (modern browsers)
  - Try in Chrome/Firefox/Edge
  - Check if dark mode is active
  - Verify CSS loaded correctly

## Browser Compatibility

### Fully Supported ✅
- Chrome 90+
- Edge 90+
- Firefox 88+
- Safari 15+

### Requires Modern Features
- WebGL 2.0
- ES6+ JavaScript
- CSS backdrop-filter
- CSS custom properties

### Not Supported ❌
- Internet Explorer (any version)
- Opera Mini
- Very old mobile browsers

## Best Practices

1. **Explore Gradually**: Start with Overview, then explore other sections
2. **Use Shortcuts**: Learn keyboard shortcuts for efficiency
3. **Monitor Performance**: Toggle stats occasionally to ensure smooth operation
4. **Interact Naturally**: Scroll and drag feel natural - use them freely
5. **Enjoy the Details**: Notice subtle animations, glows, and transitions

## Accessibility

### Current Features
- Keyboard navigation support
- High contrast text (white on black)
- Focus indicators
- Semantic HTML structure

### Future Improvements
- Screen reader support
- Reduced motion preferences
- Keyboard-only globe control
- ARIA labels

## Contact & Support

For issues, questions, or feature requests:
- Check ARCHITECTURE.md for technical details
- Review this guide for usage questions
- Contact development team for support

---

**Enjoy exploring the GeoSpatial Urban Intelligence Platform!** 🌍✨
