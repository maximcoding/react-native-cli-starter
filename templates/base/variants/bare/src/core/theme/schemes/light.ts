/**
 * FILE: src/core/theme/schemes/light.ts
 * PURPOSE: Light theme definition (colors + tokens).
 * OWNERSHIP: USER (editable)
 * 
 * This file defines the light theme color palette.
 * Users can customize colors, add new color tokens, or modify existing ones.
 */

import { spacing } from '../tokens/spacing';
import { radius } from '../tokens/radius';
import { typography } from '../tokens/typography';
import { elevation } from '../tokens/elevation';

export const lightTheme = {
  colors: {
    background: '#FFFFFF',
    backgroundSecondary: '#F7F7F7',
    surface: '#FFFFFF',
    surfaceSecondary: '#F3F3F3',
    textPrimary: '#000000',
    textSecondary: '#555555',
    textTertiary: '#888888',
    primary: '#5247E6',
    primaryHover: '#463BCF',
    primaryActive: '#3E39B4',
    success: '#28A745',
    danger: '#E04242',
    warning: '#F4A100',
    info: '#2E8ECE',
    border: '#E0E0E0',
    divider: '#EBEBEB',
    overlayLight: 'rgba(0,0,0,0.05)',
    overlayMedium: 'rgba(0,0,0,0.12)',
    overlayHeavy: 'rgba(0,0,0,0.2)',
  },
  spacing,
  radius,
  typography,
  elevation,
} as const;

export type LightTheme = typeof lightTheme;
