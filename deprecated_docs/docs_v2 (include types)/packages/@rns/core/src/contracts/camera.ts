export interface CameraCaptureResult {
  uri: string;
  width?: number;
  height?: number;
  mimeType?: string;
}

export interface CameraInterface {
  takePhoto(): Promise<CameraCaptureResult>;
}
