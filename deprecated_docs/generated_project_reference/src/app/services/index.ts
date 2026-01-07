/**
 * FILE: index.ts
 * LAYER: app/services
 * ---------------------------------------------------------------------
 * PURPOSE:
 *   Provide a single entry-point to all domain services.
 *
 * RESPONSIBILITIES:
 *   - Centralize exports.
 *   - Make service usage explicit and organized.
 * ---------------------------------------------------------------------
 */
// Re-export services from feature packages to provide a stable public API
export * from '@/features/auth/services/auth/auth.service';
export * from '@/features/user/services/user/user.service';
