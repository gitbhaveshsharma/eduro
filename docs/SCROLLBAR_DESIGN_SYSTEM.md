/**
 * Modern Scrollbar Design System Documentation
 * 
 * This document outlines the comprehensive scrollbar design system
 * implemented for the Eduro platform.
 */

# Modern Scrollbar Design System

## Overview
The Eduro platform uses a modern, sleek scrollbar design that provides an excellent user experience across all components. The scrollbar system is designed to be:

- **Consistent**: Uniform appearance across all components
- **Modern**: Sleek, thin design that doesn't interfere with content
- **Accessible**: Maintains functionality while improving aesthetics
- **Responsive**: Works well on both desktop and mobile devices
- **Brand-aligned**: Uses the platform's color scheme

## Design Principles

### 1. **Minimal Visual Impact**
- Thin scrollbars (4-8px width) that don't dominate the interface
- Subtle colors that complement the content
- Smooth transitions and hover effects

### 2. **Progressive Enhancement**
- Ghost scrollbars that appear on hover for non-critical areas
- Always-visible scrollbars for important content areas
- Contextual styling based on component importance

### 3. **Brand Integration**
- Uses the platform's color variables for consistency
- Active states use brand primary color
- Hover states provide visual feedback

## Scrollbar Variants

### 1. Modern Scrollbar (`scrollbar-modern`)
**Usage**: Default choice for most components
- **Width**: 6px
- **Style**: Always visible, subtle color
- **Hover**: Slightly more prominent
- **Active**: Brand primary color
- **Best for**: Dialogs, forms, lists, dropdowns

### 2. Ghost Scrollbar (`scrollbar-ghost`)
**Usage**: Premium feel for main content areas
- **Width**: 8px
- **Style**: Invisible by default
- **Hover**: Becomes visible with smooth transition
- **Active**: Brand primary color
- **Best for**: Main content, article reading, non-critical scrolling

### 3. Accent Scrollbar (`scrollbar-accent`)
**Usage**: Prominent areas requiring attention
- **Width**: 6px
- **Style**: Brand primary color throughout
- **Hover**: Brand secondary color
- **Active**: Brand highlight color
- **Best for**: Important lists, featured content, dashboards

### 4. Thin Scrollbar (`scrollbar-thin`)
**Usage**: Space-constrained areas
- **Width**: 4px
- **Style**: Ultra-minimal design
- **Hover**: Subtle enhancement
- **Active**: Brand primary color
- **Best for**: Sidebars, compact lists, narrow containers

### 5. Hidden Scrollbar (`scrollbar-hide`)
**Usage**: Custom scroll implementations
- **Width**: 0px (invisible)
- **Style**: Completely hidden but functional
- **Best for**: Custom scroll designs, clean layouts

## Implementation Examples

### Dialog Components
```tsx
import { Dialog, DialogContent, DialogBody } from '@/components/ui/dialog';

// DialogBody automatically uses modern scrollbar
<DialogContent>
  <DialogBody>
    {/* Long content that needs scrolling */}
  </DialogBody>
</DialogContent>
```

### Custom Components
```tsx
import { COMMON_SCROLLABLE_PATTERNS } from '@/lib/utils/scrollbar';

// Using predefined patterns
<div className={COMMON_SCROLLABLE_PATTERNS.MODAL_CONTENT}>
  {/* Content */}
</div>

// Using individual classes
<div className="max-h-96 overflow-y-auto scrollbar-modern">
  {/* Content */}
</div>
```

### TypeScript Utilities
```tsx
import { 
  getScrollbarClass, 
  withScrollbar, 
  SCROLLBAR_CONFIGS 
} from '@/lib/utils/scrollbar';

// Get appropriate scrollbar for component type
const scrollbarClass = getScrollbarClass('DIALOG');

// Combine with other classes
const className = withScrollbar('flex-1 p-4', scrollbarClass);
```

## Color Specifications

### Light Mode
- **Track**: Transparent
- **Thumb**: `oklch(0.708 0.003 247.858 / 0.3)` - Semi-transparent gray
- **Thumb Hover**: `oklch(0.708 0.003 247.858 / 0.6)` - More prominent gray
- **Thumb Active**: `var(--color-brand-primary)` - Brand primary color

### Dark Mode
- **Track**: Transparent
- **Thumb**: `oklch(0.556 0.003 247.858 / 0.4)` - Semi-transparent lighter gray
- **Thumb Hover**: `oklch(0.556 0.003 247.858 / 0.7)` - More prominent gray
- **Thumb Active**: `var(--color-brand-primary)` - Brand primary color

## Browser Support

### Webkit Browsers (Chrome, Safari, Edge)
- Full support for custom styling
- Smooth transitions and hover effects
- Precise color control

### Firefox
- Uses `scrollbar-width: thin`
- Limited color customization via `scrollbar-color`
- Respects system preferences while maintaining brand alignment

### Legacy Support
- Graceful degradation to browser defaults
- Maintains functionality across all browsers
- Progressive enhancement approach

## Responsive Considerations

### Mobile Devices
- Scrollbars automatically hidden on touch devices (iOS/Android)
- Touch scrolling remains fully functional
- No performance impact on mobile browsers

### Desktop
- Full visual customization active
- Hover states provide excellent UX feedback
- Keyboard navigation fully supported

## Performance

### CSS Optimization
- Minimal CSS footprint (~2KB)
- Uses CSS custom properties for theming
- No JavaScript required for basic functionality

### Runtime Performance
- No impact on scroll performance
- Hardware acceleration supported
- Efficient repaints and reflows

## Best Practices

### Do's ✅
- Use `scrollbar-modern` for most dialog and form content
- Use `scrollbar-ghost` for main content areas
- Use `scrollbar-thin` in space-constrained areas
- Test scrollbar appearance in both light and dark modes
- Consider the importance of the scrollable content when choosing variants

### Don'ts ❌
- Don't use `scrollbar-accent` everywhere (reserve for important content)
- Don't mix different scrollbar styles in the same view
- Don't override scrollbar colors without considering the design system
- Don't use `scrollbar-hide` unless implementing custom scroll indicators

## Accessibility

### Standards Compliance
- Maintains WCAG 2.1 AA compliance
- Preserves keyboard navigation
- Respects user's reduced motion preferences
- Works with screen readers

### User Preferences
- Respects system color scheme preferences
- Adapts to high contrast mode
- Maintains sufficient color contrast ratios

## Future Enhancements

### Planned Features
- Scroll position indicators for long content
- Smooth scroll animations
- Custom scroll progress bars
- Enhanced mobile scroll behaviors

### Version History
- **v1.0**: Initial implementation with basic variants
- **v1.1**: Added TypeScript utilities and documentation
- **v1.2**: Enhanced color system and dark mode support