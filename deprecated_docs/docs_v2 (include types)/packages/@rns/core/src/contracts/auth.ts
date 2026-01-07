export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  displayName?: string;
  photoUrl?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string; // ISO
}

export interface AuthInterface {
  getCurrentUser(): Promise<AuthUser | null>;
  getSession(): Promise<AuthSession | null>;

  signInWithEmailPassword(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}
