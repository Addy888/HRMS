/**
 * Provider Type Enum
 * Categories of attendance providers
 */
export enum ProviderType {
  MANUAL = 'MANUAL',
  DEVICE = 'DEVICE',
  SOFTWARE = 'SOFTWARE',
  API = 'API',
}

/**
 * Provider Name Enum
 * Specific provider implementations
 */
export enum ProviderName {
  MANUAL = 'MANUAL',
  BIOMETRIC = 'BIOMETRIC',
  RFID = 'RFID',
  FACE_RECOGNITION = 'FACE_RECOGNITION',
  QR_CODE = 'QR_CODE',
  GPS = 'GPS',
  API = 'API',
  WEBHOOK = 'WEBHOOK',
}
