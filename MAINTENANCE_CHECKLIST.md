# Design System Maintenance Checklist

Use this checklist when adding new features, screens, or making updates to ensure consistency with the new design system.

## 🎨 Before Starting Development

- [ ] Read `DESIGN_SYSTEM.md` to understand principles
- [ ] Review `QUICK_REFERENCE.md` for quick lookups
- [ ] Check `COMPONENT_EXAMPLES.tsx` for patterns
- [ ] Open `src/theme.ts` in another window

## 📱 When Creating a New Screen

### Setup
- [ ] Use `ScrollView` with proper contentContainerStyle
- [ ] Set `backgroundColor: theme.colors.background.primary`
- [ ] Add horizontal padding: `theme.layout.screenPadding`
- [ ] Handle SafeAreaView if needed
- [ ] Set StatusBar to `dark` style (light backgrounds)

### Layout
- [ ] Implement hero/header section if needed
- [ ] Center content vertically and horizontally where appropriate
- [ ] Use `Spacer` component between elements
- [ ] Maintain spacing rhythm (multiples of theme.spacing)
- [ ] Add generous white space (don't cram elements)

### Typography
- [ ] Use semantic sizes: title, subtitle, body, caption
- [ ] Check font sizes are from `theme.typography.fontSize`
- [ ] Verify font weights are from `theme.typography.fontWeight`
- [ ] Ensure line heights use `theme.typography.lineHeight`
- [ ] Test readability on both iOS and Android

### Colors
- [ ] NEVER hardcode colors - use `theme.colors.*`
- [ ] Primary action buttons: `theme.colors.primary` (#3B82F6)
- [ ] Secondary actions: `theme.colors.secondary` (#10B981)
- [ ] Text: `theme.colors.text.*` hierarchy
- [ ] Backgrounds: `theme.colors.background.*`
- [ ] Errors/warnings: `theme.colors.error` / `theme.colors.warning`

### Components
- [ ] Use Button with proper variant and size
- [ ] Use Card for grouped content
- [ ] Use FormInput for forms
- [ ] Use InfoBox for messages
- [ ] Use LoadingOverlay for async operations
- [ ] Use Spacer for consistent spacing

### Spacing
- [ ] Screen padding: `theme.layout.screenPadding` (24px)
- [ ] Card padding: `theme.layout.cardPadding` (20px)
- [ ] Between sections: `theme.layout.sectionSpacing` (32px)
- [ ] Between elements: `theme.spacing.md` (16px)
- [ ] Small gaps: `theme.spacing.sm` (8px)
- [ ] Large gaps: `theme.spacing.lg` (24px)

### Animations
- [ ] Add entrance animations (fade-in, slide-up)
- [ ] Animate button press (spring scale 0.95)
- [ ] Use smooth transitions (250ms normal)
- [ ] Stagger list items if animated
- [ ] Always use `useNativeDriver: true`

### States
- [ ] Implement loading state
- [ ] Implement error state
- [ ] Implement empty state
- [ ] Implement success state
- [ ] Add helpful error messages
- [ ] Use LoadingOverlay for full-screen loading

## 🔧 When Refactoring Existing Code

### Colors to Replace
```
Replace          →  Use
#0B1220          →  theme.colors.background.primary
#101B33          →  (remove gradient, use solid)
#121A2B          →  theme.colors.surface.light
#233250          →  theme.colors.border.light
#1B2537          →  theme.colors.background.secondary
#81A2FF          →  theme.colors.primary
#B6C2E2          →  theme.colors.text.secondary
#D9E2FF          →  theme.colors.text.secondary
#8FA2C8          →  theme.colors.text.tertiary
#4E7AF0          →  theme.colors.primary
#3A4A68          →  theme.colors.border.medium
```

### Spacing to Replace
```
Replace  →  Use
4        →  theme.spacing.xs
8        →  theme.spacing.sm
12       →  (use 16 or 8)
16       →  theme.spacing.md
20       →  theme.layout.cardPadding
24       →  theme.layout.screenPadding or theme.spacing.lg
32       →  theme.spacing.xl or theme.layout.sectionSpacing
40       →  theme.spacing['2xl']
```

### Style Updates
- [ ] Remove LinearGradient if dark gradient
- [ ] Replace dark backgrounds with white
- [ ] Add proper shadows with `...theme.shadows.md`
- [ ] Update border colors to light
- [ ] Change text colors to text hierarchy
- [ ] Remove any hardcoded #0B1220 or #121A2B colors

## 📐 When Reviewing Design

### Consistency Checks
- [ ] All text colors use `theme.colors.text.*`
- [ ] All backgrounds use `theme.colors.background.*` or `theme.colors.surface.*`
- [ ] All accent colors use `theme.colors.primary` or `theme.colors.secondary`
- [ ] Spacing is consistent throughout (multiples of 8)
- [ ] Border radius matches component type
- [ ] Shadows are consistent (`sm`, `md`, `lg`, `xl`)

### Visual Balance
- [ ] Content is not cramped
- [ ] Elements have breathing room
- [ ] Hierarchy is clear (size, weight, color)
- [ ] Touch targets are at least 48x48dp
- [ ] Icons are properly sized
- [ ] Cards have consistent padding

### Accessibility
- [ ] Minimum 48x48dp touch targets
- [ ] Text has sufficient contrast (WCAG AA)
- [ ] Colors are not the only indicator (use icons/text too)
- [ ] Focus states are visible
- [ ] Font sizes are readable
- [ ] Line heights are comfortable

### Animations
- [ ] Animations don't feel slow (< 500ms)
- [ ] Using `useNativeDriver: true` for smooth performance
- [ ] No jank or stuttering
- [ ] Animations enhance, don't distract
- [ ] Loading states are clear

## 🐛 Common Mistakes to Avoid

### ❌ DON'T
```typescript
// Don't hardcode colors
backgroundColor: '#0B1220'
color: '#81A2FF'
borderColor: '#233250'

// Don't use incorrect spacing
padding: 12
margin: 10
gap: 20

// Don't mix dark and light theme
// (some screens old, some new)

// Don't use undefined sizes
fontSize: 17  // Use theme.typography.fontSize values

// Don't skip loading states
// Always show feedback for async operations

// Don't cram content
paddingHorizontal: 8  // Use at least 24px

// Don't use random animation durations
duration: 123  // Use theme.animation.duration values
```

### ✅ DO
```typescript
// Do use theme values
backgroundColor: theme.colors.background.primary
color: theme.colors.text.primary
borderColor: theme.colors.border.light

// Do use proper spacing
padding: theme.spacing.md
margin: theme.spacing.lg
gap: theme.spacing.sm

// Do keep it consistent
// All new screens follow new design

// Do use theme typography
fontSize: theme.typography.fontSize.base

// Do implement all states
// loading, error, empty, success

// Do use generous spacing
paddingHorizontal: theme.layout.screenPadding

// Do use standard animations
duration: theme.animation.duration.normal
```

## 🎯 Testing Checklist

### Visual Testing
- [ ] App looks good on iPhone 12 (small)
- [ ] App looks good on iPad (large)
- [ ] App looks good on Android phones
- [ ] No text overflow
- [ ] Images scale properly
- [ ] Buttons are accessible
- [ ] Colors look correct
- [ ] Spacing is consistent

### Functional Testing
- [ ] Loading states display
- [ ] Error states display
- [ ] Empty states display
- [ ] Forms validate
- [ ] Buttons are tappable
- [ ] Links navigate
- [ ] Animations are smooth
- [ ] No console errors

### Performance Testing
- [ ] Scroll is smooth (60fps)
- [ ] Animations don't jank
- [ ] App doesn't freeze
- [ ] Memory usage is normal
- [ ] Load times are acceptable
- [ ] No memory leaks

## 📊 Component Audit

Run this audit monthly to maintain design consistency:

- [ ] Review all Button variants
  - [ ] primary works correctly
  - [ ] secondary works correctly
  - [ ] outline works correctly
  - [ ] all sizes tested

- [ ] Review all Cards
  - [ ] elevation works
  - [ ] padding works
  - [ ] custom styles work
  - [ ] shadows correct

- [ ] Review all text styles
  - [ ] titles look good
  - [ ] body text readable
  - [ ] captions visible
  - [ ] hierarchy clear

- [ ] Review all colors
  - [ ] primary accent consistent
  - [ ] secondary accent consistent
  - [ ] text colors readable
  - [ ] backgrounds clean

- [ ] Review spacing
  - [ ] padding consistent
  - [ ] gaps regular
  - [ ] alignment centered
  - [ ] white space adequate

## 📝 Documentation Maintenance

- [ ] Update DESIGN_SYSTEM.md if adding features
- [ ] Add examples to COMPONENT_EXAMPLES.tsx
- [ ] Update QUICK_REFERENCE.md if adding patterns
- [ ] Document new components in DESIGN_SYSTEM.md
- [ ] Keep REDESIGN_SUMMARY.md updated
- [ ] Add new color/spacing to theme docs

## 🚀 Before Pushing Code

- [ ] All colors use theme
- [ ] All spacing uses theme
- [ ] All typography uses theme
- [ ] No hardcoded values
- [ ] LoadingOverlay included for async
- [ ] Error states handled
- [ ] Empty states designed
- [ ] Animations smooth
- [ ] Touch targets ≥ 48x48dp
- [ ] No console errors/warnings
- [ ] Tested on iOS and Android
- [ ] Code is documented
- [ ] Consistent with existing patterns

## 💬 When in Doubt

1. Check `src/theme.ts` for available values
2. Look at similar screens for patterns
3. Review `COMPONENT_EXAMPLES.tsx` for templates
4. Read `DESIGN_SYSTEM.md` for guidelines
5. Check `QUICK_REFERENCE.md` for quick answers
6. Ask: "Does this follow the design system?"

---

## 🎓 Learning Resources

- **Design System**: `DESIGN_SYSTEM.md`
- **Quick Ref**: `QUICK_REFERENCE.md`
- **Examples**: `COMPONENT_EXAMPLES.tsx`
- **Theme File**: `src/theme.ts`
- **Existing Screens**: `app/` directory

Keep these docs open while developing!

---

**Remember:** The design system exists to make development FASTER and code BETTER.
When you have a question about styling or spacing, the answer is probably in `src/theme.ts`!

✨ **Happy consistent coding!** ✨
