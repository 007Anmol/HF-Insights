# HealthFuture Insights - File Structure & Guide

Complete guide to the new design system implementation.

## 📁 Project Structure

```
HealthFutureInsights/
├── app/                           # Expo Router screens
│   ├── _layout.tsx               # Root layout (updated: dark StatusBar)
│   ├── index.tsx                 # Welcome/Home screen (refactored)
│   ├── auth/
│   │   ├── login.tsx             # Login screen (refactored)
│   │   └── signup.tsx            # Sign Up screen (refactored)
│   ├── dashboard/
│   │   └── index.tsx             # History/Dashboard (refactored)
│   └── scan/
│       ├── new.tsx               # Upload screen (refactored)
│       └── result.tsx            # Results screen (refactored)
│
├── src/                          # App logic & components
│   ├── theme.ts                  # ✨ Global design system (NEW)
│   ├── components/
│   │   ├── index.ts              # Component exports (NEW)
│   │   ├── Button.tsx            # Button component (refactored)
│   │   ├── Card.tsx              # Card component (refactored)
│   │   ├── Spacer.tsx            # Spacer component (existing)
│   │   ├── FormInput.tsx         # Form input (NEW)
│   │   ├── LoadingOverlay.tsx    # Loading state (NEW)
│   │   └── InfoBox.tsx           # Info/message boxes (NEW)
│   ├── context/
│   │   └── AppContext.tsx        # App state management (existing)
│   ├── insights.ts               # Insights logic (existing)
│   ├── storage.ts                # Storage handling (existing)
│   └── supabase.ts               # Supabase config (existing)
│
├── 📚 Documentation Files (NEW)
│   ├── DESIGN_SYSTEM.md          # Comprehensive design guide
│   ├── QUICK_REFERENCE.md        # Quick lookup guide
│   ├── THEME_REFERENCE.md        # Theme object reference
│   ├── COMPONENT_EXAMPLES.tsx    # Copy-paste examples
│   ├── MAINTENANCE_CHECKLIST.md  # Development checklist
│   ├── REDESIGN_SUMMARY.md       # Summary of changes
│   └── PROJECT_STRUCTURE.md      # This file
│
├── Configuration Files
│   ├── package.json              # Dependencies
│   ├── tsconfig.json             # TypeScript config
│   ├── babel.config.js           # Babel config
│   ├── app.json                  # App config
│   ├── eas.json                  # EAS config
│   └── .gitignore                # Git ignore
│
└── README.md                     # Project readme
```

---

## 🎨 Component Library

### Core Components (In `src/components/`)

#### 1. **Button.tsx**
- **Purpose**: Primary interactive element for actions
- **Props**: title, onPress, variant, size, disabled, fullWidth, style
- **Variants**: primary (blue), secondary (teal), outline
- **Sizes**: small, medium, large
- **Features**: Spring animation on press, proper touch targets
- **Usage**: All interactive actions

#### 2. **Card.tsx**
- **Purpose**: Container for grouped content
- **Props**: children, padded, elevated, style
- **Features**: Elevation/shadows, padding control
- **Usage**: Group related content, display data

#### 3. **Spacer.tsx**
- **Purpose**: Vertical spacing between elements
- **Props**: size (uses theme.spacing values)
- **Usage**: Maintain consistent spacing

#### 4. **FormInput.tsx** (NEW)
- **Purpose**: Form input field with validation
- **Props**: label, placeholder, value, onChangeText, icon, error, secureTextEntry
- **Features**: Password visibility toggle, error display, icons
- **Usage**: Login, signup, forms

#### 5. **LoadingOverlay.tsx** (NEW)
- **Purpose**: Full-screen loading indicator
- **Props**: visible, message
- **Features**: Animated spinner, smooth transitions
- **Usage**: Async operations (upload, auth, analysis)

#### 6. **InfoBox.tsx** (NEW)
- **Purpose**: Info/alert messages
- **Props**: message, type (info/success/warning/error), icon
- **Features**: Semantic colors, icon support
- **Usage**: Privacy notes, warnings, confirmations

---

## 🎨 Theme System (In `src/theme.ts`)

### What It Provides
- **Colors**: 15+ semantic color groups
- **Typography**: Font sizes, weights, line heights
- **Spacing**: 8px scale (4-64px)
- **Border Radius**: Consistent radius values
- **Shadows**: 5 elevation levels
- **Animations**: Standard durations
- **Layout**: Screen and card padding

### How to Use
```typescript
import { theme } from '../src/theme';

// In StyleSheet
const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: theme.layout.screenPadding,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    color: theme.colors.text.primary,
  },
  card: {
    ...theme.shadows.md,
    borderRadius: theme.borderRadius.lg,
    padding: theme.layout.cardPadding,
  },
});

// Directly in components
<View style={{ backgroundColor: theme.colors.primary }}>
  <Button title="Click" onPress={() => {}} />
</View>
```

---

## 📚 Documentation Files

### 1. **DESIGN_SYSTEM.md** (START HERE)
- Complete design principles and philosophy
- Color palette with usage examples
- Typography scale and hierarchy
- Spacing system explanation
- Shadow/elevation system
- Animation patterns
- Component library reference
- Screen-specific guidelines
- Implementation checklist

**Read this to understand the design philosophy.**

### 2. **QUICK_REFERENCE.md**
- Color palette at a glance
- Spacing values lookup table
- Component size guide
- Typography scale quick reference
- Common spacing patterns
- Component usage examples
- Do's and don'ts
- Common mistakes and fixes
- Debugging guide

**Use this during development for quick lookups.**

### 3. **THEME_REFERENCE.md**
- Complete theme object structure
- All available values
- Usage examples
- Quick access patterns
- Related files list

**Reference this when you need exact theme values.**

### 4. **COMPONENT_EXAMPLES.tsx**
- Welcome screen example
- Form screen with validation
- List screen with empty state
- Loading/error state patterns
- Detailed card layouts

**Copy-paste these patterns for new screens.**

### 5. **MAINTENANCE_CHECKLIST.md**
- Pre-development checklist
- New screen creation checklist
- Refactoring checklist
- Design review checklist
- Testing checklist
- Common mistakes to avoid
- Before pushing code checklist

**Use this when creating new screens or refactoring.**

### 6. **REDESIGN_SUMMARY.md**
- Overview of all changes
- What was created vs. refactored
- Statistics (files, colors, spacing)
- Features added
- Implementation quality notes
- Future enhancement suggestions

**Read for project overview and history.**

---

## 🎯 Screen Files (Updated)

### `app/index.tsx` - Welcome/Home
- **Changes**: 
  - Dark gradient → light white background
  - New animated hero section
  - Feature cards with icons
  - Testimonial cards
  - CTA buttons (Get Started + Login)
- **Uses**: Button, Card, Spacer, Ionicons
- **Theme Features**: Animations, color palette, spacing

### `app/auth/login.tsx` - Login Screen
- **Changes**:
  - Centered form layout
  - FormInput components
  - LoadingOverlay for auth
  - White background
  - Password visibility toggle
- **Uses**: FormInput, Button, Card, LoadingOverlay
- **Notable**: Keyboard avoidance, form validation

### `app/auth/signup.tsx` - Sign Up Screen
- **Changes**:
  - Same centered layout as login
  - Name, email, password inputs
  - Password validation
  - LoadingOverlay
- **Uses**: FormInput, Button, LoadingOverlay
- **Notable**: Email validation, password strength

### `app/scan/new.tsx` - Upload Screen
- **Changes**:
  - Dashed border upload zone
  - File format chips
  - LoadingOverlay during upload
  - InfoBox for privacy message
  - Feature list with icons
- **Uses**: Button, Card, Spacer, InfoBox, LoadingOverlay
- **Notable**: File handling, upload progress

### `app/scan/result.tsx` - Results Screen
- **Changes**:
  - Clean card-based layout
  - Summary section with icon
  - Recommendations with checkmarks
  - Medical terms section
  - Clear visual hierarchy
- **Uses**: Card, Button, Spacer
- **Notable**: Result display, clear information architecture

### `app/dashboard/index.tsx` - History/Dashboard
- **Changes**:
  - Welcome header with user name
  - Scan history as cards
  - New Scan button
  - Delete functionality
  - Empty state with icon
- **Uses**: Card, Button, Spacer
- **Notable**: List display, empty state handling

### `app/_layout.tsx` - Root Layout
- **Changes**: StatusBar style "light" → "dark" (for light backgrounds)
- **Important**: Affects all screens

---

## 🔄 Workflow Guide

### When Starting a New Feature

1. **Read**: `DESIGN_SYSTEM.md` to understand principles
2. **Check**: `QUICK_REFERENCE.md` for quick values
3. **Look**: `COMPONENT_EXAMPLES.tsx` for similar patterns
4. **Review**: `MAINTENANCE_CHECKLIST.md` before coding
5. **Reference**: `THEME_REFERENCE.md` while coding
6. **Code**: Using theme values for everything

### When Creating a New Screen

1. Copy structure from `COMPONENT_EXAMPLES.tsx`
2. Use `theme.colors.background.primary` for background
3. Use `theme.layout.screenPadding` for padding
4. Use `Spacer` for gaps
5. Use `Button`, `Card` components
6. Add loading/error states
7. Add animations
8. Test on iOS and Android

### When Refactoring Old Code

1. Replace all hardcoded colors with theme values
2. Replace all hardcoded spacing with theme spacing
3. Replace all hardcoded font sizes with theme sizes
4. Add shadows using `theme.shadows.*`
5. Add animations using theme durations
6. Update background colors to light theme
7. Verify consistency across screens

### When Reviewing Code

1. Check `MAINTENANCE_CHECKLIST.md`
2. Verify all theme usage
3. Check touch target sizes (≥48dp)
4. Verify spacing consistency
5. Test animations (no jank)
6. Test loading/error states
7. Test on multiple device sizes

---

## 📊 Statistics

### Files Modified
- 6 screen components
- 2 shared components
- 1 layout file
- **Total: 9 files**

### Files Created
- 1 theme system (`src/theme.ts`)
- 4 new components (FormInput, LoadingOverlay, InfoBox, index.ts)
- 6 documentation files
- **Total: 11 files**

### Design Values
- 15+ color groups
- 8 spacing units
- 5 font sizes ranges
- 4 font weights
- 4 line height values
- 5 shadow levels
- 6 border radius values
- 3 animation durations

---

## 🚀 Getting Started

### For Existing Developers
1. Open `DESIGN_SYSTEM.md` - Read the overview
2. Open `src/theme.ts` - Familiarize with structure
3. Look at `app/index.tsx` - See new patterns
4. Reference `QUICK_REFERENCE.md` - During development

### For New Developers
1. Start with `DESIGN_SYSTEM.md` - Full explanation
2. Read `THEME_REFERENCE.md` - Understand theme object
3. Study `COMPONENT_EXAMPLES.tsx` - See patterns
4. Check `MAINTENANCE_CHECKLIST.md` - Before coding

### For Designers
1. Review `DESIGN_SYSTEM.md` - Color and spacing philosophy
2. Check `QUICK_REFERENCE.md` - For all values
3. Reference `COMPONENT_EXAMPLES.tsx` - For visual patterns

---

## 📚 Documentation Map

```
Read these in this order:

1. DESIGN_SYSTEM.md
   ↓ (Understanding)
2. QUICK_REFERENCE.md
   ↓ (Quick lookups)
3. THEME_REFERENCE.md
   ↓ (Exact values)
4. COMPONENT_EXAMPLES.tsx
   ↓ (Code patterns)
5. MAINTENANCE_CHECKLIST.md
   ↓ (Before coding)
6. Review existing screens (app/ directory)
   ↓ (Real examples)
7. Start coding! 🚀
```

---

## ✅ Verification Checklist

To verify the redesign is complete:

- [x] All dark colors (#0B1220, #121A2B) removed
- [x] All new colors use `theme.colors.*`
- [x] All spacing uses `theme.spacing.*`
- [x] All typography uses `theme.typography.*`
- [x] All shadows use `theme.shadows.*`
- [x] All components use theme values
- [x] All screens have loading states
- [x] All screens have error states
- [x] Buttons have animations
- [x] Touch targets ≥ 48x48dp
- [x] StatusBar updated for light theme
- [x] Documentation complete
- [x] Examples provided
- [x] Checklists created
- [x] Theme system tested

---

## 🎓 Quick Help

### I need to...

**Add a new color**
→ Edit `src/theme.ts` colors section, document in `THEME_REFERENCE.md`

**Create a new screen**
→ Copy `COMPONENT_EXAMPLES.tsx` pattern, follow `MAINTENANCE_CHECKLIST.md`

**Check a color value**
→ Look in `QUICK_REFERENCE.md` or `THEME_REFERENCE.md`

**Find spacing values**
→ Check `theme.spacing.*` in `QUICK_REFERENCE.md`

**Understand the design**
→ Read `DESIGN_SYSTEM.md`

**See code patterns**
→ Look at `COMPONENT_EXAMPLES.tsx`

**Before pushing code**
→ Use `MAINTENANCE_CHECKLIST.md`

**Fix styling issues**
→ Check `QUICK_REFERENCE.md` debugging section

---

## 🔗 Key Files Summary

| File | Purpose | When to Use |
|------|---------|------------|
| `src/theme.ts` | Design system config | Always for styling |
| `DESIGN_SYSTEM.md` | Philosophy & guide | Understanding design |
| `QUICK_REFERENCE.md` | Quick values lookup | During development |
| `THEME_REFERENCE.md` | Exact theme values | Looking up specific values |
| `COMPONENT_EXAMPLES.tsx` | Code templates | Creating new screens |
| `MAINTENANCE_CHECKLIST.md` | Development checklist | Before coding |

---

**Welcome to the new design system! Happy coding! 🚀**

For questions, check the documentation files listed above.
Everything you need is documented!

---

**Last Updated:** January 28, 2026
**Project Status:** ✅ Complete - Ready for Development
