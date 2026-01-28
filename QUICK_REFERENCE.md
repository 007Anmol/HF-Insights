# HealthFuture Insights - Quick Reference Guide

## 🎨 Color Palette Quick Lookup

### Primary Actions (Soft Blue)
```
Primary:      #3B82F6  ← Use for main CTAs, accents
Light Blue:   #60A5FA  ← Hover/active states
Dark Blue:    #2563EB  ← Pressed states
Background:   #EFF6FF  ← Light backgrounds, upload zones
```

### Secondary Actions (Teal)
```
Secondary:    #10B981  ← Alternative actions
Light Teal:   #34D399  ← Hover states
Background:   #ECFDF5  ← Light teal backgrounds
```

### Backgrounds
```
Primary:      #FFFFFF   ← Main background
Secondary:    #F8FAFC   ← Cards, input backgrounds
Tertiary:     #F1F5F9   ← Alternative backgrounds
```

### Text Colors
```
Primary Text:     #0F172A   ← Headings, main body
Secondary Text:   #475569   ← Supporting text
Tertiary Text:    #94A3B8   ← Placeholders, hints
Inverse Text:     #FFFFFF   ← Text on colored backgrounds
```

### Semantic Colors
```
Success:  #10B981   ← Checkmarks, positive
Warning:  #F59E0B   ← Alerts, cautions
Error:    #EF4444   ← Errors, deletions
Info:     #3B82F6   ← Information boxes
```

### Borders
```
Light:    #E2E8F0   ← Default borders
Medium:   #CBD5E1   ← Emphasis borders
Strong:   #94A3B8   ← Strong borders
```

## 📏 Spacing Quick Reference

| Name | Value | Use Case |
|------|-------|----------|
| xs | 4px | Tiny gaps |
| sm | 8px | Small gaps |
| md | 16px | Standard gaps |
| lg | 24px | Section spacing |
| xl | 32px | Large sections |
| 2xl | 40px | Screen padding |
| 3xl | 48px | Large sections |
| 4xl | 64px | Extra large |

## 🎯 Common Spacing Patterns

```typescript
// Screen padding
paddingHorizontal: 24  // theme.layout.screenPadding
paddingVertical: 24    // theme.spacing.lg

// Card padding
padding: 20            // theme.layout.cardPadding

// Between elements
gap: 16                // theme.spacing.md
marginBottom: 24       // theme.spacing.lg

// Section spacing
marginTop: 32          // theme.layout.sectionSpacing
```

## 📱 Component Size Guide

### Touch Targets
```
Minimum:    48x48dp   // Accessibility standard
Comfortable: 56x56dp  // Recommended
Large:      64x64dp   // CTAs
```

### Button Sizes
```
Small:  padding 8/16     ← Inline, secondary actions
Medium: padding 16/24    ← Standard buttons
Large:  padding 24/32    ← Primary CTAs, important actions
```

### Border Radius
```
sm: 8px    ← Input fields, small elements
md: 12px   ← Icon badges, small cards
lg: 16px   ← Buttons, main cards
xl: 20px   ← Large cards, prominent elements
2xl: 24px  ← Extra emphasis
```

## 🔤 Typography Scale

| Level | Size | Weight | Use |
|-------|------|--------|-----|
| 5xl | 40px | Bold | Hero titles |
| 4xl | 32px | Bold | Page titles |
| 3xl | 28px | Bold | Section titles |
| 2xl | 24px | Bold | Subsections |
| xl | 20px | Semibold | Headings |
| lg | 18px | Semibold | Subheadings |
| base | 16px | Regular | Body text |
| sm | 14px | Regular | Helper text |
| xs | 12px | Medium | Captions, badges |

## 🌓 Shadow Levels

```
None: No shadow (flat)
sm:   Light (border elevation)
md:   Standard (cards) ⭐ Most common
lg:   Elevated (important cards)
xl:   Maximum (modals, popovers)
```

## 💡 Component Usage Quick Reference

### Button States

```typescript
// Primary CTA
<Button title="Get Started" variant="primary" size="large" fullWidth />

// Secondary CTA
<Button title="Learn More" variant="secondary" />

// Outline Button
<Button title="Cancel" variant="outline" />

// Small Button
<Button title="Edit" size="small" />

// Disabled State
<Button title="Continue" disabled />
```

### Card Types

```typescript
// Default (with shadow)
<Card elevated><Text>Content</Text></Card>

// No padding
<Card padded={false}><Image /></Card>

// Flat (no shadow)
<Card elevated={false}><Text>Content</Text></Card>

// Custom styling
<Card style={{ backgroundColor: theme.colors.surface.elevated }}>
  <Text>Custom</Text>
</Card>
```

### InfoBox Messages

```typescript
// Info message
<InfoBox 
  message="Your data is stored securely"
  type="info"
/>

// Success message
<InfoBox 
  message="Upload successful!"
  type="success"
/>

// Warning message
<InfoBox 
  message="Large file, may take longer"
  type="warning"
/>

// Error message
<InfoBox 
  message="Upload failed, try again"
  type="error"
/>
```

## 🎭 Animation Durations

```
Fast:   150ms  ← Quick feedback, hover states
Normal: 250ms  ← Standard transitions
Slow:   350ms  ← Emphasis, entrance animations
```

## 📐 Common Layout Dimensions

### Upload Zone
```
Width: Full width - 2x padding
Height: 200-240px
Border: 2-3px dashed
Radius: 16px (lg)
```

### Icon Badge
```
Width: 48-64px
Height: 48-64px
Border Radius: 12-16px
Background: Icon background colors
```

### Form Input
```
Height: 56px (comfortable touch target)
Padding: 16px horizontal
Border Radius: 12px (md)
Border: 1px, light color
```

## 🎯 Color Combinations

### Safe Pairings

| Text | Background | Use |
|------|------------|-----|
| Primary (#0F172A) | White (#FFFFFF) | Main content |
| Primary (#0F172A) | Light Gray (#F8FAFC) | Secondary content |
| Secondary (#475569) | Light Gray (#F1F5F9) | Supporting text |
| White (#FFFFFF) | Blue (#3B82F6) | Buttons, badges |
| White (#FFFFFF) | Teal (#10B981) | Alternative actions |

## ⚠️ Do's and Don'ts

### ✅ DO:
- Use theme values consistently
- Maintain generous spacing
- Center content where appropriate
- Add subtle animations
- Include loading states
- Test on light backgrounds
- Use accessibility best practices (48x48dp min touch)

### ❌ DON'T:
- Hardcode colors (not from theme)
- Use dark backgrounds (theme is light)
- Cram content without spacing
- Make touch targets smaller than 48x48dp
- Skip loading/error states
- Use more than 2-3 font weights per screen
- Mix old dark theme colors with new light theme

## 📋 Pre-Launch Checklist

- [ ] All colors use `theme.colors.*`
- [ ] All spacing uses `theme.spacing.*`
- [ ] All typography uses `theme.typography.*`
- [ ] All shadows use `theme.shadows.*`
- [ ] All components have proper touch targets
- [ ] Loading states implemented
- [ ] Error states with helpful messages
- [ ] Smooth animations throughout
- [ ] Tested on iOS and Android
- [ ] Accessible to users with color blindness
- [ ] Tested with system fonts
- [ ] SafeAreaView handles notches/dynamic island
- [ ] Keyboard avoidance on auth screens
- [ ] Images/icons properly scaled

## 🔍 Debugging Common Issues

### Text looks too dark/light
→ Check `theme.colors.text.*` assignment

### Buttons don't look clickable
→ Ensure button size ≥ `theme.touchTarget.min` (48dp)
→ Add feedback animation with Animated.spring

### Content looks cramped
→ Add more `Spacer` components
→ Increase `paddingHorizontal` to `theme.layout.screenPadding` (24px)

### Colors look off
→ Verify using `theme.colors.*` not hardcoded hex
→ Check if mixing old dark theme (#0B1220) with new light theme

### Shadows not showing
→ Use `elevated` prop on Card: `<Card elevated>`
→ Or apply theme shadows: `...theme.shadows.md`

### Animations laggy
→ Use `useNativeDriver: true` on Animated values
→ Avoid animating color properties
→ Keep animation durations under 500ms

---

**Print this guide for quick reference while building!**
