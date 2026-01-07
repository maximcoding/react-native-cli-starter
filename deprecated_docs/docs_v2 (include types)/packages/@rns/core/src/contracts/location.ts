export interface GeoPoint {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
}

export interface LocationInterface {
  getCurrentPosition(): Promise<GeoPoint>;
  watchPosition(handler: (p: GeoPoint) => void): () => void;
}
