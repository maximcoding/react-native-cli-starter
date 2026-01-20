<!--
FILE: docs/navigation.md
PURPOSE: Navigation registry system documentation for React Navigation (section 26, 27, 29).
         Explains how users can register screens and customize navigation from User Zone.
         Available for both Expo and Bare targets when React Navigation is selected during init.
OWNERSHIP: CLI
-->

# Navigation Registry System

The CORE navigation system provides a flexible registry-based approach that allows you to customize navigation from **User Zone** (`src/**`) without modifying **System Zone** (`packages/@rns/navigation/**`). Available for both **Expo** and **Bare RN** projects when React Navigation is selected during init.

## Overview

When you run `rns init` and select React Navigation, the CLI:
1. Installs React Navigation dependencies
2. Prompts you to select a navigation preset (stack-only, tabs-only, stack+tabs, stack+tabs+modals, drawer)
3. Creates a navigation structure based on your chosen preset
4. Generates a registry file at `src/app/navigation/registry.ts` where you can register your screens

**Key Principle**: The preset you choose during init is just a **starting point**. You can extend beyond it by registering screens in the registry.

## Registry Location

The registry file is located at:
```
src/app/navigation/registry.ts
```

This file is in **User Zone**, meaning:
- ✅ You own it completely
- ✅ CLI will never modify it
- ✅ You can customize it freely

## Registry Functions

All registry functions are **optional**. If you don't implement a function, placeholder screens are used.

### Available Functions

| Function | Purpose | When to Use |
|----------|---------|-------------|
| `getStackScreens()` | Regular stack screens | Main app screens, detail screens |
| `getTabScreens()` | Bottom tab screens | Tab navigation (works even if preset wasn't tabs) |
| `getModalScreens()` | Modal presentations | Full-screen overlays, dialogs, settings |
| `getDrawerScreens()` | Drawer navigation | Side drawer menu screens |
| `getCustomNavigators()` | Custom navigator components | Sub-stacks, complex navigation hierarchies |
| `getRootStackScreens()` | Root-level screens | Onboarding, auth, splash screens |

## Basic Usage

### 1. Register Stack Screens

```typescript
// src/app/navigation/registry.ts
import type { NavScreen } from '@rns/navigation';
import { ROUTES, createRoute } from '@rns/navigation';
import HomeScreen from '@/screens/HomeScreen';
import ProfileScreen from '@/screens/ProfileScreen';

export function getStackScreens(): NavScreen[] {
  return [
    // Replace placeholder screens
    { 
      name: ROUTES.SCREEN_HOME, 
      component: HomeScreen, 
      order: 10 
    },
    
    // Add new stack screens
    { 
      name: createRoute('SCREEN_PROFILE'), 
      component: ProfileScreen, 
      order: 20 
    },
  ];
}
```

### 2. Register Tab Screens

```typescript
import HomeScreen from '@/screens/HomeScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import ProfileScreen from '@/screens/ProfileScreen';

export function getTabScreens(): NavScreen[] {
  return [
    { 
      name: ROUTES.TAB_HOME, 
      component: HomeScreen, 
      order: 10,
      options: {
        tabBarIcon: ({ color, size }) => <Icon name="home" color={color} size={size} />,
        tabBarLabel: 'Home',
      }
    },
    { 
      name: createRoute('TAB_PROFILE'), 
      component: ProfileScreen, 
      order: 20 
    },
  ];
}
```

**Note**: Tabs work even if your preset was "stack-only" - they'll be added to the navigation structure automatically.

**Default Behavior:**
- If you don't register tab screens, placeholder tabs are used (TAB_HOME, TAB_SETTINGS)
- Placeholder tabs have default emoji icons (🏠 for Home, ⚙️ for Settings)
- Tab labels are automatically translated via i18n if available (using `navigation.tabs.tab_home`, `navigation.tabs.tab_settings`)
- You can override icons and labels by providing `options` in your registry

### 3. Register Modal Screens

```typescript
import InfoModal from '@/screens/modals/InfoModal';
import SettingsModal from '@/screens/modals/SettingsModal';

export function getModalScreens(): NavScreen[] {
  return [
    // Replace placeholder modal
    { 
      name: ROUTES.MODAL_INFO, 
      component: InfoModal, 
      order: 10 
    },
    
    // Add custom modals
    { 
      name: createRoute('MODAL_SETTINGS'), 
      component: SettingsModal, 
      order: 20,
      options: {
        presentation: 'modal',
        headerShown: true,
        title: 'Settings'
      }
    },
  ];
}
```

**Navigation to modals**:
```typescript
import { useNavigation } from '@react-navigation/native';

function MyScreen() {
  const navigation = useNavigation();
  
  const openModal = () => {
    navigation.navigate('MODAL_SETTINGS' as any);
  };
}
```

### 4. Register Root Stack Screens

Root stack screens appear at the **highest level** of navigation (rendered first). Use for onboarding, auth, or splash screens.

```typescript
import OnboardingScreen from '@/screens/OnboardingScreen';
import LoginScreen from '@/screens/auth/LoginScreen';

export function getRootStackScreens(): NavScreen[] {
  return [
    // Onboarding (shown first)
    { 
      name: createRoute('ONBOARDING'), 
      component: OnboardingScreen, 
      order: 10 
    },
    
    // Auth screens
    { 
      name: createRoute('LOGIN'), 
      component: LoginScreen, 
      order: 20 
    },
  ];
}
```

## Advanced: Sub-Stack Navigators

For complex navigation hierarchies, create **sub-stack navigators** using `getCustomNavigators()`.

### Step 1: Create Sub-Stack Component

```typescript
// src/navigation/stacks/SettingsStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsScreen from '@/screens/SettingsScreen';
import AccountScreen from '@/screens/settings/AccountScreen';
import PrivacyScreen from '@/screens/settings/PrivacyScreen';

const Stack = createNativeStackNavigator();

export default function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SETTINGS_MAIN" component={SettingsScreen} />
      <Stack.Screen name="SETTINGS_ACCOUNT" component={AccountScreen} />
      <Stack.Screen name="SETTINGS_PRIVACY" component={PrivacyScreen} />
    </Stack.Navigator>
  );
}
```

### Step 2: Register Sub-Stack

```typescript
// src/app/navigation/registry.ts
import type { CustomNavigator } from '@rns/navigation';
import { createRoute } from '@rns/navigation';
import SettingsStack from '@/navigation/stacks/SettingsStack';
import AuthStack from '@/navigation/stacks/AuthStack';

export function getCustomNavigators(): CustomNavigator[] {
  return [
    {
      name: createRoute('SETTINGS_STACK'),
      component: SettingsStack,
      order: 20,
      options: {
        headerShown: false,
      },
    },
    {
      name: createRoute('AUTH_STACK'),
      component: AuthStack,
      order: 10,
    },
  ];
}
```

### Step 3: Navigate to Sub-Stack

```typescript
// Navigate to sub-stack (shows initial screen)
navigation.navigate('SETTINGS_STACK' as any);

// Navigate to specific screen within sub-stack
navigation.navigate('SETTINGS_STACK' as any, {
  screen: 'SETTINGS_ACCOUNT',
});
```

## Navigation Hierarchy

The registry system creates this hierarchy (rendered in order):

```
RootStack.Navigator
├── Root Stack Screens (from getRootStackScreens) - Highest priority
├── Custom Navigators (from getCustomNavigators) - Sub-stacks
├── Tabs (from getTabScreens or preset)
├── Drawer (from getDrawerScreens or preset)
├── Stack Screens (from getStackScreens)
└── Modals (from getModalScreens) - In modal group
```

## TypeScript Support

### Type Augmentation

Add TypeScript types for your custom routes:

```typescript
// src/app/navigation/types.ts (or at top of registry.ts)
declare global {
  namespace ReactNavigation {
    interface RootParamList {
      // Custom stack screens
      SCREEN_PROFILE: { userId: string };
      
      // Custom tabs
      TAB_PROFILE: undefined;
      
      // Custom modals
      MODAL_SETTINGS: { section?: string };
      
      // Sub-stack navigators
      SETTINGS_STACK: { 
        screen?: 'SETTINGS_MAIN' | 'SETTINGS_ACCOUNT' | 'SETTINGS_PRIVACY' 
      };
      
      // Root stack screens
      ONBOARDING: undefined;
      LOGIN: { email?: string };
    }
  }
}
```

### Using Typed Navigation

```typescript
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<ReactNavigation.RootParamList>;

function MyScreen() {
  const navigation = useNavigation<NavigationProp>();
  
  // Type-safe navigation
  navigation.navigate('SCREEN_PROFILE', { userId: '123' });
  navigation.navigate('MODAL_SETTINGS', { section: 'account' });
}
```

## Preset Independence

**Key Feature**: You can extend beyond your preset choice.

| Your Preset | What You Can Add |
|-------------|------------------|
| `stack-only` | ✅ Tabs, Modals, Drawer, Sub-stacks |
| `tabs-only` | ✅ Stack screens, Modals, Sub-stacks |
| `stack-tabs` | ✅ Modals, Drawer, Sub-stacks |
| `drawer` | ✅ Tabs, Stack screens, Modals, Sub-stacks |

**Example**: Even if you chose "stack-only", you can register tabs and they'll be rendered:

```typescript
export function getTabScreens(): NavScreen[] {
  return [
    { name: createRoute('TAB_HOME'), component: HomeScreen, order: 10 },
    { name: createRoute('TAB_PROFILE'), component: ProfileScreen, order: 20 },
  ];
}
```

The System Zone will automatically add tabs to the navigation structure.

## Complete Example

```typescript
// src/app/navigation/registry.ts
import type { NavScreen, CustomNavigator } from '@rns/navigation';
import { ROUTES, createRoute } from '@rns/navigation';

// Import screens
import OnboardingScreen from '@/screens/OnboardingScreen';
import LoginScreen from '@/screens/auth/LoginScreen';
import HomeScreen from '@/screens/HomeScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import SettingsModal from '@/screens/modals/SettingsModal';

// Import sub-stacks
import SettingsStack from '@/navigation/stacks/SettingsStack';
import AuthStack from '@/navigation/stacks/AuthStack';

export function getRootStackScreens(): NavScreen[] {
  return [
    { name: createRoute('ONBOARDING'), component: OnboardingScreen, order: 10 },
    { name: createRoute('LOGIN'), component: LoginScreen, order: 20 },
  ];
}

export function getCustomNavigators(): CustomNavigator[] {
  return [
    { name: createRoute('AUTH_STACK'), component: AuthStack, order: 30 },
    { name: createRoute('SETTINGS_STACK'), component: SettingsStack, order: 40 },
  ];
}

export function getStackScreens(): NavScreen[] {
  return [
    { name: ROUTES.SCREEN_HOME, component: HomeScreen, order: 50 },
    { name: createRoute('SCREEN_PROFILE'), component: ProfileScreen, order: 60 },
  ];
}

export function getModalScreens(): NavScreen[] {
  return [
    { name: createRoute('MODAL_SETTINGS'), component: SettingsModal, order: 10 },
  ];
}
```

## Best Practices

1. **Use `createRoute()` for custom routes**: Provides type safety and consistency
   ```typescript
   { name: createRoute('SCREEN_PROFILE'), component: ProfileScreen }
   ```

2. **Set `order` for predictable rendering**: Lower numbers render first
   ```typescript
   { name: 'SCREEN_A', component: ScreenA, order: 10 }, // Renders first
   { name: 'SCREEN_B', component: ScreenB, order: 20 }, // Renders second
   ```

3. **Group related screens in sub-stacks**: Use `getCustomNavigators()` for feature-based navigation
   ```typescript
   // SettingsStack contains: Settings, Account, Privacy, Notifications
   // AuthStack contains: Login, Signup, ForgotPassword
   ```

4. **Use root stack screens for app-level flows**: Onboarding, auth, splash
   ```typescript
   // These appear before main app navigation
   getRootStackScreens() // → Onboarding → Auth → Main App
   ```

5. **Keep registry file organized**: Group imports, add comments for clarity

## Troubleshooting

### Registry not being picked up?

- Ensure file is at `src/app/navigation/registry.ts`
- Check that functions are exported (`export function`)
- Verify imports are correct (use `@rns/navigation` for types)

### Screens not appearing?

- Check that you're returning an array (not `undefined`)
- Verify `order` is set (screens are sorted by order)
- Ensure components are imported correctly

### Type errors?

- Add TypeScript module augmentation (see TypeScript Support section)
- Use `as any` for navigation calls if types aren't set up yet

## Reference

- **Registry file**: `src/app/navigation/registry.ts`
- **System Zone navigation**: `packages/@rns/navigation/root.tsx`
- **Route constants**: `packages/@rns/navigation/routes.ts`
- **Type definitions**: `packages/@rns/navigation/types.ts`

For more details on the navigation preset system, see `docs/TODO.md` Section 26.
