# Theme Object Reference

Complete reference of the `theme` object structure. Use this when you need to know exactly what's available.

## 🎨 theme.colors

```typescript
colors: {
  // Primary Actions (Soft Blue)
  primary: '#3B82F6'              // Main accent, buttons, highlights
  primaryLight: '#60A5FA'         // Hover states
  primaryDark: '#2563EB'          // Pressed states

  // Secondary Actions (Teal)
  secondary: '#10B981'            // Alternative actions
  secondaryLight: '#34D399'       // Secondary hover
  
  // Backgrounds
  background: {
    primary: '#FFFFFF'            // Main background (most screens)
    secondary: '#F8FAFC'          // Cards, input fields
    tertiary: '#F1F5F9'           // Alternative backgrounds
  }
  
  // Surface Colors
  surface: {
    light: '#FFFFFF'              // Card backgrounds
    elevated: '#FAFBFC'           // Elevated elements
  }
  
  // Text Hierarchy
  text: {
    primary: '#0F172A'            // Main body text, headings
    secondary: '#475569'          // Supporting text
    tertiary: '#94A3B8'           // Placeholder, hints, captions
    inverse: '#FFFFFF'            // Text on colored backgrounds
  }
  
  // Semantic Colors
  success: '#10B981'              // Checkmarks, positive actions
  warning: '#F59E0B'              // Alerts, warnings
  error: '#EF4444'                // Errors, delete actions
  info: '#3B82F6'                 // Info messages, help text
  
  // Borders
  border: {
    light: '#E2E8F0'              // Subtle borders
    medium: '#CBD5E1'             // Standard borders
    strong: '#94A3B8'             // Prominent borders
  }
  
  // Upload Zone Styling
  uploadZone: {
    background: '#F0F7FF'         // Dashed zone background
    border: '#3B82F6'             // Dashed zone border
    borderDashed: '#93C5FD'       // Dashed line color
  }
  
  // Icon Backgrounds
  iconBackground: {
    blue: '#EFF6FF'               // Blue icon backgrounds
    teal: '#ECFDF5'               // Teal icon backgrounds
    purple: '#F5F3FF'             // Purple icon backgrounds
  }
}
```

## 🔤 theme.typography

```typescript
typography: {
  fontFamily: {
    regular: 'System'             // Default system font
    medium: 'System'
    semibold: 'System'
    bold: 'System'
  }
  
  // Font Sizes
  fontSize: {
    xs: 12                        // Captions, badges
    sm: 14                        // Helper text, small text
    base: 16                      // Body text (standard)
    lg: 18                        // Subheadings
    xl: 20                        // Headings
    '2xl': 24                     // Section titles
    '3xl': 28                     // Page subtitles
    '4xl': 32                     // Page titles
    '5xl': 40                     // Hero titles
  }
  
  // Line Heights
  lineHeight: {
    tight: 1.2                    // Compact (headings)
    normal: 1.5                   // Standard (body)
    relaxed: 1.75                 // Comfortable (long text)
    loose: 2                      // Extra (max readability)
  }
  
  // Font Weights
  fontWeight: {
    regular: '400'                // Body text
    medium: '500'                 // Emphasized text
    semibold: '600'               // Buttons, subheadings
    bold: '700'                   // Headings, titles
  }
}
```

## 📏 theme.spacing

All values in pixels (multiples of 8):

```typescript
spacing: {
  xs: 4                           // Tiny gaps, padding
  sm: 8                           // Small gaps, icon margins
  md: 16                          // Standard gaps (most common)
  lg: 24                          // Large gaps, section padding
  xl: 32                          // Extra large spacing
  '2xl': 40                       // Screen bottom padding
  '3xl': 48                       // Section spacing
  '4xl': 64                       // Hero spacing
}
```

## 🎭 theme.borderRadius

All values in pixels:

```typescript
borderRadius: {
  none: 0                         // No radius
  sm: 8                           // Small radius (inputs, badges)
  md: 12                          // Medium radius (most elements)
  lg: 16                          // Large radius (buttons, cards)
  xl: 20                          // Extra large (prominent cards)
  '2xl': 24                       // Maximum radius
  full: 9999                      // Circular (badges)
}
```

## 🌓 theme.shadows

Use with spread operator: `{ ...theme.shadows.md }`

```typescript
shadows: {
  none: {
    shadowColor: '#000'
    shadowOffset: { width: 0, height: 0 }
    shadowOpacity: 0
    shadowRadius: 0
    elevation: 0                  // Android
  }
  
  sm: {                           // Subtle shadow
    shadowColor: '#0F172A'
    shadowOffset: { width: 0, height: 1 }
    shadowOpacity: 0.05
    shadowRadius: 2
    elevation: 2
  }
  
  md: {                           // Standard shadow (most cards)
    shadowColor: '#0F172A'
    shadowOffset: { width: 0, height: 2 }
    shadowOpacity: 0.08
    shadowRadius: 4
    elevation: 4
  }
  
  lg: {                           // Large shadow (elevated cards)
    shadowColor: '#0F172A'
    shadowOffset: { width: 0, height: 4 }
    shadowOpacity: 0.1
    shadowRadius: 8
    elevation: 8
  }
  
  xl: {                           // Extra large (modals)
    shadowColor: '#0F172A'
    shadowOffset: { width: 0, height: 8 }
    shadowOpacity: 0.12
    shadowRadius: 16
    elevation: 12
  }
}
```

## ✨ theme.animation

```typescript
animation: {
  duration: {
    fast: 150                     // Quick feedback (150ms)
    normal: 250                   // Standard transitions (250ms)
    slow: 350                     // Emphasis animations (350ms)
  }
  
  easing: {
    ease: 'ease'
    easeIn: 'ease-in'
    easeOut: 'ease-out'
    easeInOut: 'ease-in-out'
  }
}
```

## 📐 theme.touchTarget

Minimum touch target sizes for accessibility:

```typescript
touchTarget: {
  min: 48                         // Minimum accessible (48x48dp)
  comfortable: 56                 // Recommended size (56x56dp)
}
```

## 🏗️ theme.layout

Screen and container padding:

```typescript
layout: {
  screenPadding: 24               // Horizontal padding on screens
  cardPadding: 20                 // Padding inside cards
  sectionSpacing: 32              // Space between major sections
}
```

---

## 📝 Usage Examples

### Basic Usage

```typescript
import { theme } from '../src/theme';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  // Using colors
  container: {
    backgroundColor: theme.colors.background.primary,
  },
  
  // Using typography
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  
  // Using spacing
  content: {
    paddingHorizontal: theme.layout.screenPadding,
    marginBottom: theme.spacing.lg,
  },
  
  // Using border radius
  button: {
    borderRadius: theme.borderRadius.lg,
  },
  
  // Using shadows
  card: {
    ...theme.shadows.md,
  },
});
```

### In Components

```typescript
import { theme } from '../src/theme';

function MyComponent() {
  return (
    <View style={{ 
      backgroundColor: theme.colors.background.primary,
      paddingHorizontal: theme.layout.screenPadding,
    }}>
      <Text style={{ 
        fontSize: theme.typography.fontSize.lg,
        color: theme.colors.text.primary,
      }}>
        Hello
      </Text>
    </View>
  );
}
```

### In Animated Components

```typescript
import { Animated } from 'react-native';
import { theme } from '../src/theme';

const opacityAnim = new Animated.Value(0);

Animated.timing(opacityAnim, {
  toValue: 1,
  duration: theme.animation.duration.normal,  // 250ms
  useNativeDriver: true,
}).start();
```

---

## 🎯 Quick Access Patterns

### Get Primary Color
```typescript
theme.colors.primary        // #3B82F6
```

### Get Primary Button Padding
```typescript
paddingVertical: theme.spacing.lg      // 24px
paddingHorizontal: theme.spacing.xl    // 32px
```

### Get Body Text Style
```typescript
fontSize: theme.typography.fontSize.base,           // 16px
color: theme.colors.text.primary,                  // #0F172A
lineHeight: 16 * theme.typography.lineHeight.normal // 24px
```

### Get Card Styling
```typescript
backgroundColor: theme.colors.surface.light,       // #FFFFFF
borderRadius: theme.borderRadius.lg,               // 16px
padding: theme.layout.cardPadding,                 // 20px
...theme.shadows.md,                               // Shadow spread
```

### Get Icon Badge
```typescript
width: 48,
height: 48,
borderRadius: theme.borderRadius.md,               // 12px
backgroundColor: theme.colors.iconBackground.blue, // #EFF6FF
```

---

## 🔗 Related Files

- **Main theme file**: `src/theme.ts`
- **Design system guide**: `DESIGN_SYSTEM.md`
- **Quick reference**: `QUICK_REFERENCE.md`
- **Component examples**: `COMPONENT_EXAMPLES.tsx`

---

## ✅ Remember

✨ **Everything you need is in `theme`**
- ✅ Never hardcode colors → use `theme.colors.*`
- ✅ Never hardcode spacing → use `theme.spacing.*`
- ✅ Never hardcode sizes → use `theme.typography.fontSize.*`
- ✅ Never hardcode shadows → use `theme.shadows.*`
- ✅ Never hardcode radius → use `theme.borderRadius.*`

This ensures **consistency** and makes **updates easy**!

---

**Last Updated:** January 28, 2026
**Theme Version:** 2.0 (Modern Light)
