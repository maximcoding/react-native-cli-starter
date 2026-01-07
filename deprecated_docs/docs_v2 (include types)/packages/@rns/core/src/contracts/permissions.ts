export type PermissionState = 'unavailable' | 'denied' | 'blocked' | 'granted' | 'limited';

export interface PermissionInterface {
  /**
   * A stable permission id used by the platform catalog, e.g. "camera", "location.foreground".
   * The concrete adapter decides how to map it to Expo or react-native-permissions.
   */
  getStatus(permissionId: string): Promise<PermissionState>;
  request(permissionId: string): Promise<PermissionState>;
}
