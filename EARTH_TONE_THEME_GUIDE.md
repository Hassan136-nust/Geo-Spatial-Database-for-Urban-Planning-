# Earth-Tone Theme Implementation Guide

## 🎨 Refined Color System Overview

### Base Colors
- **Primary (Warm Olive Green)**: `#4A6741` - Main brand color, navigation, buttons
- **Background (Soft Warm Beige)**: `#F5F1E8` - Main background (not harsh white)
- **Accent (Warm Amber)**: `#C9A961` - Highlights, CTAs, active states
- **Water**: `#6B9BD1` - Softer water blue for map features
- **Vegetation**: `#5A8F4F` - Natural green for parks
- **Neutral/Roads**: `#7A8075` - Gray-green for roads

### Text Colors (Critical for Readability)
- **Primary Text**: `#2C3E2E` - Deep forest green (not black) for headings
- **Secondary Text**: `#4A5A48` - Medium green-gray for labels
- **Muted Text**: `#6B7566` - Lighter green-gray for meta info
- **Text on Dark**: `#F5F1E8` - Warm beige text on olive backgrounds

### Dark Mode Colors
- **Background**: `#2C3E2E` - Deep forest green (not pure black)
- **Card**: `#3D5536` - Darker olive for cards
- **Accent**: `#D4B574` - Brighter amber for visibility

### Usage Rules
✅ **Use deep forest green (#2C3E2E) instead of black**
✅ **Use warm beige (#F5F1E8) for backgrounds instead of white**
✅ **Use warm amber (#C9A961) for accents and CTAs**
✅ **Use semantic colors (water, vegetation, roads) for map features**
✅ **Maintain warm, natural earth tones throughout**

## 🎯 Tailwind Classes Available

### Background Colors
```jsx
bg-primary          // Warm Olive #4A6741
bg-background       // Soft Beige #F5F1E8
bg-accent           // Warm Amber #C9A961
bg-olive            // Warm Olive #4A6741
bg-beige            // Soft Beige #F5F1E8
bg-amber            // Warm Amber #C9A961
bg-water            // Soft Water Blue #6B9BD1
bg-vegetation       // Natural Green #5A8F4F
bg-roads            // Gray-Green #7A8075
```

### Text Colors
```jsx
text-foreground        // Deep Forest Green #2C3E2E
text-text-primary      // Deep Forest Green #2C3E2E
text-text-secondary    // Medium Green-Gray #4A5A48
text-text-muted        // Light Green-Gray #6B7566
text-text-on-dark      // Warm Beige #F5F1E8
text-amber             // Warm Amber #C9A961
text-water             // Soft Water Blue #6B9BD1
text-vegetation        // Natural Green #5A8F4F
```

### Border Colors
```jsx
border-primary         // Warm Olive
border-border          // Light beige border
border-amber           // Warm Amber accent
```

## 🔄 Migration Guide

### Replace Old Colors with New Theme

#### Black Backgrounds → Forest Green/Olive
```jsx
// OLD
className="bg-black/90 backdrop-blur-xl"
className="bg-slate-900"
className="bg-gray-900"

// NEW
className="bg-primary/95 backdrop-blur-xl"  // Warm olive for navigation/panels
className="bg-[#2C3E2E]"                    // Deep forest green for dark sections
className="bg-card"                          // For cards
```

#### Harsh White → Soft Beige
```jsx
// OLD
className="bg-white"
className="bg-gray-50"

// NEW
className="bg-background"  // Soft warm beige
className="bg-card"        // White cards on beige background
```

#### Blue/Cyan Accents → Warm Amber
```jsx
// OLD
className="text-cyan-400"
className="bg-blue-500"
className="border-cyan-500"

// NEW
className="text-amber"
className="bg-amber"
className="border-amber"
```

#### Pure Black Text → Forest Green
```jsx
// OLD
className="text-black"
className="text-gray-900"

// NEW
className="text-text-primary"    // Deep forest green
className="text-foreground"      // Same as above
```

#### White Text → Context-Aware
```jsx
// OLD (on dark backgrounds)
className="text-white"
className="text-white/80"

// NEW (on olive/dark backgrounds)
className="text-text-on-dark"
className="text-text-on-dark/90"

// NEW (on light backgrounds)
className="text-text-primary"
className="text-text-secondary"
```

## 🎨 Design Patterns

### Pattern 1: Card with Earth Tones
```jsx
<div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
  <h3 className="text-text-primary font-bold mb-2">Card Title</h3>
  <p className="text-text-secondary text-sm">Card description</p>
  <button className="mt-4 bg-amber text-text-primary px-4 py-2 rounded-lg hover:bg-amber/90">
    Action
  </button>
</div>
```

### Pattern 2: Dark Panel (Olive)
```jsx
<div className="bg-primary/95 backdrop-blur-xl border border-primary/30 rounded-2xl p-6">
  <h3 className="text-text-on-dark font-bold mb-2">Panel Title</h3>
  <p className="text-text-on-dark/80 text-sm">Panel content</p>
</div>
```

### Pattern 3: Hero Section
```jsx
<div className="bg-[#2C3E2E] min-h-screen">
  <h1 className="text-text-on-dark text-5xl font-bold">Welcome</h1>
  <p className="text-text-on-dark/80 text-lg">Subtitle text</p>
  <button className="bg-amber text-text-primary px-8 py-4 rounded-xl hover:bg-amber/90">
    Get Started
  </button>
</div>
```

### Pattern 4: Form Inputs
```jsx
<input 
  className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-amber focus:ring-2 focus:ring-amber/20"
  placeholder="Enter text..."
/>
```

### Pattern 5: Buttons
```jsx
// Primary Button (Amber)
<button className="bg-amber text-text-primary px-6 py-3 rounded-xl hover:bg-amber/90 font-medium transition-colors">
  Primary Action
</button>

// Secondary Button (Olive)
<button className="bg-primary text-text-on-dark px-6 py-3 rounded-xl hover:bg-primary/90 font-medium transition-colors">
  Secondary Action
</button>

// Outline Button
<button className="border-2 border-amber text-amber px-6 py-3 rounded-xl hover:bg-amber/10 font-medium transition-colors">
  Outline Action
</button>

// Ghost Button
<button className="text-text-primary px-6 py-3 rounded-xl hover:bg-primary/10 font-medium transition-colors">
  Ghost Action
</button>
```

### Pattern 6: Navigation Bar
```jsx
<nav className="bg-primary/95 backdrop-blur-xl border border-primary/30 rounded-full px-4 py-2.5">
  <div className="flex items-center gap-2 text-text-on-dark">
    <Logo className="text-amber" />
    <span className="font-bold">UrbanPulse</span>
  </div>
</nav>
```

## 🚀 Quick Start

1. **Theme is configured** in `src/styles/theme.css`
2. **Navigation is updated** as reference
3. **Use patterns above** for consistency
4. **Test readability** on all backgrounds
5. **Maintain warm earth tones** throughout

## 🔍 Color Palette Summary

| Element | Light Mode | Dark Mode | Usage |
|---------|-----------|-----------|-------|
| Background | `#F5F1E8` | `#2C3E2E` | Main background |
| Primary | `#4A6741` | `#5A7A51` | Buttons, nav |
| Accent | `#C9A961` | `#D4B574` | CTAs, highlights |
| Text | `#2C3E2E` | `#F5F1E8` | Body text |
| Water | `#6B9BD1` | `#7FADD4` | Map water |
| Vegetation | `#5A8F4F` | `#6FA364` | Map parks |
| Roads | `#7A8075` | `#9BA896` | Map roads |

## ✨ Key Improvements

1. **No Pure Black** - Uses deep forest green (#2C3E2E) instead
2. **No Harsh White** - Uses soft warm beige (#F5F1E8) instead
3. **Warm Amber Accent** - Replaces harsh terracotta with softer amber
4. **Cohesive Palette** - All colors work harmoniously together
5. **Better Readability** - Improved contrast while maintaining warmth
6. **Natural Feel** - Truly earth-inspired color scheme

---

**Updated**: Refined color palette with warmer, more cohesive earth tones