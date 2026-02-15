# Insights Page Design System

## Overview
This document outlines the complete design system for the UDSM Insights page, including colors, typography, spacing, and component styles.

**Last Updated:** February 15, 2026

---

## Color Palette

### Primary Colors (UDSM Blue Gradient)

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Primary Dark | `#1a4d9e` | Sidebar middle gradient, hover states |
| Primary Medium | `#235dcb` | Main brand color, primary buttons, text accents |
| Primary Light | `#2f6fd9` | Gradient end, accent elements |
| Primary Lightest | `#5b8edb` | Icons, subtle highlights (now replaced with white in most cases) |

### Sidebar Gradient
```css
background: linear-gradient(to bottom, #235dcb, #1a4d9e, #2f6fd9);
```

### Hero Section Gradient
```css
background: linear-gradient(to bottom right, #235dcb, #1a4d9e, #2f6fd9);
```

### Background Colors

| Element | Color | Hex/RGB |
|---------|-------|---------|
| Page Background | Light Gray | `#f8f9fc` |
| Card Background | White | `#ffffff` |
| Card Border | Light Gray | `border-gray-100` |
| Sidebar Background | Blue Gradient | See above |

### Text Colors

| Element | Color | CSS Class/Value |
|---------|-------|-----------------|
| Sidebar Text (Inactive) | White 80% Opacity | `text-white/80` |
| Sidebar Text (Active) | White 100% | `text-white` |
| Sidebar Icons | White | `text-white` |
| Primary Headings | UDSM Blue | `text-[#235dcb]` |
| Body Text | Gray 900 | `text-gray-900` |
| Secondary Text | Gray 600 | `text-gray-600` |
| Muted Text | Gray 400 | `text-gray-400` |
| Sidebar Subtitle | Blue 200 (70% opacity) | `text-blue-200/70` |

### State Colors

#### Success/Positive
- Background: `bg-emerald-50`
- Border: `border-emerald-200`
- Text: `text-emerald-600`, `text-emerald-700`
- Badge: `bg-emerald-100 text-emerald-700`

#### Warning
- Background: `bg-amber-50`
- Border: `border-amber-200`
- Text: `text-amber-600`, `text-amber-700`
- Badge: `bg-amber-100 text-amber-700`

#### Critical/Error
- Background: `bg-red-50`
- Border: `border-red-200`
- Text: `text-red-500`, `text-red-600`, `text-red-700`
- Badge: `bg-red-100 text-red-700`

#### Neutral/Info
- Background: `bg-blue-50`
- Border: `border-blue-200`
- Text: `text-blue-600`, `text-blue-700`
- Badge: `bg-blue-100 text-blue-700`

### Live Metrics Colors (Icons)

| Metric | Background Color (20% opacity) | Original Icon Color | Current Icon Color |
|--------|-------------------------------|---------------------|-------------------|
| Active Visitors | `#2f6fd920` | `#2f6fd9` | White |
| Visits (30m) | `#3b82f620` | `#3b82f6` | White |
| Actions | `#8b5cf620` | `#8b5cf6` | White |
| Total Downloads | `#235dcb20` | `#235dcb` | White |
| Publications | `#ec489920` | `#ec4899` | White |
| Citations | `#f9731620` | `#f97316` | White |

### Interactive States

| State | Sidebar | Buttons | Cards |
|-------|---------|---------|-------|
| Hover | `hover:bg-white/8` | `hover:bg-[#1a4d9e]` | `hover:shadow-xl` |
| Active | `bg-white/15` | `bg-[#235dcb]` | `border-blue-200` |
| Focus | `shadow-inner shadow-white/5` | - | - |

---

## Typography

### Font Families

```css
/* Headings */
font-family: 'font-heading' (from Tailwind config)

/* Body Text */
font-family: system default
```

### Text Sizes & Weights

#### Sidebar
- **Brand Title:** `text-base font-bold tracking-tight`
- **Brand Subtitle:** `text-[10px] font-medium tracking-wider uppercase`
- **Nav Items:** `text-sm font-medium`
- **Collapse Button:** `text-xs`

#### Headings
- **Section Headers:** `text-xl font-bold` (`font-heading`)
- **Section Subtitles:** `text-xs text-gray-400`
- **Card Titles:** `text-sm font-semibold`
- **Panel Titles:** `text-lg font-bold` (`font-heading`)

#### Body Text
- **Primary:** `text-sm`
- **Secondary:** `text-xs`
- **Metric Values:** `text-2xl font-bold`
- **Live Counter Values:** `text-2xl font-bold tabular-nums`
- **Live Counter Labels:** `text-[11px] font-medium`

---

## Spacing & Layout

### Sidebar Dimensions
- **Expanded Width:** `260px` (`w-[260px]`)
- **Collapsed Width:** `72px` (`w-[72px]`)
- **Transition:** `duration-300 ease-in-out`

### Padding & Margins
```css
/* Page Container */
padding: 1.5rem (p-6)
max-width: 1400px

/* Sidebar */
padding: 1rem 0.5rem (py-4 px-2)

/* Cards */
padding: 1.5rem (p-6)
margin-bottom: 1.5rem (space-y-6)

/* Sections */
gap: 1.5rem (gap-6)
```

### Border Radius
- **Small Elements:** `rounded-lg` (8px)
- **Cards:** `rounded-xl` (12px)
- **Large Sections:** `rounded-2xl` (16px)
- **Circles:** `rounded-full`

---

## Components

### Sidebar Navigation

#### Layout
```tsx
position: fixed
top: 0
left: 0
height: 100vh
z-index: 40
```

#### Nav Item Structure
```tsx
- Background (Active): bg-white/15
- Background (Hover): hover:bg-white/8
- Icon Container: p-1.5 rounded-lg
- Icon Container (Active): bg-[#235dcb]/20
- Icon Color: text-white
- Active Indicator Dot: w-1.5 h-1.5 rounded-full bg-white
```

### Logo Container
```css
width: 56px (w-14)
height: 56px (h-14)
background: white/95 (bg-white/95)
border-radius: 50% (rounded-full)
shadow: lg
```

### Live Counter Cards
```tsx
- Icon Container: p-2 rounded-lg
- Icon Container Background: ${color}20 (20% opacity)
- Icon Color: text-white (updated from colored)
- Value: text-2xl font-bold text-white tabular-nums
- Label: text-[11px] text-blue-200/60 font-medium
```

### Section Headers
```tsx
- Icon Container: p-2.5 rounded-xl
- Icon Container Background: gradient-to-br from-[#235dcb] to-[#2f6fd9]
- Icon Color: text-white (updated from text-[#5b8edb])
- Title: text-xl font-bold text-[#235dcb]
- Subtitle: text-xs text-gray-400
```

### Insight Cards
```tsx
- Border: 1px solid
- Border Radius: rounded-xl
- Padding: p-4
- Icon Container: p-2 rounded-lg
- Icon Color: text-white (updated from colored)
- Hover: hover:shadow-md
```

### Stat Boxes
```tsx
- Background: bg-white
- Border: border-gray-100
- Border Radius: rounded-xl
- Padding: p-5
- Hover: hover:shadow-lg hover:shadow-gray-100/50
- Icon Background: ${color}10 (10% opacity)
- Value: text-2xl font-bold text-[#235dcb]
```

---

## Shadows

| Element | Shadow |
|---------|--------|
| Sidebar | `shadow-2xl` |
| Cards (hover) | `shadow-xl` or `shadow-lg shadow-gray-100/50` |
| Cards (default) | None or `border-gray-100` |
| Section Icons | `shadow-lg` |
| Logo Container | `shadow-lg` |

---

## Animations & Transitions

### Transitions
```css
/* Standard Transition */
transition-all duration-300

/* Color Transitions */
transition-colors duration-200

/* Fade In */
animate-fade-in

/* Pulse (Live Indicator) */
animate-pulse
```

### Hover Effects
- **Sidebar Items:** Background fade-in
- **Cards:** Shadow elevation + border color change
- **Buttons:** Background color darkening
- **Icons:** Color shift (if applicable)

---

## Recent Updates (February 2026)

### Icon Color Improvements
**Changed all icons to white for better visibility:**

1. ✅ Sidebar navigation icons: `text-udsm-blue` → `text-white`
2. ✅ Active state indicator: `bg-[#5b8edb]` → `bg-white`
3. ✅ LiveCounter icons: `style={{ color }}` → `text-white`
4. ✅ SectionHeader icons: `text-[#5b8edb]` → `text-white`
5. ✅ InsightCard icons: No explicit color → `text-white`

### Design Rationale
- **Improved Contrast:** White icons provide better contrast against blue gradient backgrounds
- **Consistency:** Uniform icon color throughout the interface
- **Accessibility:** Better readability and visibility for all users
- **Modern Aesthetic:** Clean, professional appearance

---

## Accessibility Notes

### Color Contrast
- White text on blue gradient: ✅ WCAG AA compliant
- Gray text on white background: ✅ WCAG AA compliant
- All interactive elements have sufficient contrast

### Interactive Elements
- Minimum touch target size: 44×44px
- Clear focus states
- Hover states for all clickable elements

---

## Usage Guidelines

### Do's ✅
- Use white icons on colored backgrounds (especially blue gradients)
- Maintain consistent spacing using Tailwind's spacing scale
- Use the UDSM blue palette for brand consistency
- Apply shadows sparingly for visual hierarchy

### Don'ts ❌
- Don't use colored icons on gradient backgrounds (poor contrast)
- Don't deviate from the color palette
- Don't mix different border radius values within the same component
- Don't use custom colors outside the defined palette

---

## Code Examples

### Sidebar Navigation Item
```tsx
<button className="group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 
  text-sm font-medium transition-all duration-200 
  bg-white/15 text-white shadow-inner shadow-white/5">
  <div className="p-1.5 rounded-lg bg-[#235dcb]/20">
    <Icon className="w-4 h-4 text-white" />
  </div>
  <span>Label</span>
</button>
```

### Section Header
```tsx
<div className="flex items-center gap-3 mb-6">
  <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#235dcb] to-[#2f6fd9] shadow-lg">
    <Icon className="w-5 h-5 text-white" />
  </div>
  <div>
    <h3 className="font-heading text-xl font-bold text-[#235dcb]">Title</h3>
    <p className="text-xs text-gray-400 mt-0.5">Subtitle</p>
  </div>
</div>
```

### Live Counter
```tsx
<div className="text-center">
  <div className="flex items-center justify-center mb-2">
    <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
      <span className="text-white">{icon}</span>
    </div>
  </div>
  <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
  <p className="text-[11px] text-blue-200/60 font-medium mt-0.5">{label}</p>
</div>
```

---

## Related Files
- Main design system: `UDSM_DESIGN_SYSTEM.md`
- Color reference: `COLOR_REFERENCE.md`
- Branding updates: `BRANDING_UPDATES_SUMMARY.md`
