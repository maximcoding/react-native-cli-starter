/**
 * FILE: src/core/theme/schemes/dark.ts
 * PURPOSE: Dark theme definition (colors + tokens).
 * OWNERSHIP: USER (editable)
 * 
 * This file defines the dark theme color palette.
 * Users can customize colors, add new color tokens, or modify existing ones.
 */

import { spacing } from '../tokens/spacing';
import { radius } from '../tokens/radius';
import { typography } from '../tokens/typography';
import { elevation } from '../tokens/elevation';

export const darkTheme = {
  colors: {
    background: '#000000',
    backgroundSecondary: '#0E0E0E',
    surface: '#121212',
    surfaceSecondary: '#1A1A1A',
    textPrimary: '#FFFFFF',
    textSecondary: '#CCCCCC',
    textTertiary: '#888888',
    primary: '#9C92FF',
    primaryHover: '#8A7CF2',
    primaryActive: '#6D63D5',
    success: '#41D97C',
    danger: '#FF6B6B',
    warning: '#FFB84D',
    info: '#4DB8FF',
    border: '#333333',
    divider: '#2A2A2A',
    overlayLight: 'rgba(255,255,255,0.05)',
    overlayMedium: 'rgba(255,255,255,0.12)',
    overlayHeavy: 'rgba(255,255,255,0.2)',
  },
  spacing,
  radius,
  typography,
  elevation,
} as const;

export type DarkTheme = typeof darkTheme;
