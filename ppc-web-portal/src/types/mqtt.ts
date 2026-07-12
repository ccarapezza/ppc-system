// Tipos para la integración MQTT/WebSocket

// Tipos de dispositivo que coinciden con el firmware
export type DeviceType = 'base' | 'timer' | 'thm' | 'temp' | 'full';

// Etapas de crecimiento VPD (del firmware VpdCalculator::stageName())
export type VpdStage =
  | 'DangerLow'
  | 'PropagationEarlyVeg'
  | 'LateVeg'
  | 'EarlyFlower'
  | 'MidLateFlower'
  | 'DangerHigh'
  | 'Unknown';

export interface Device {
  device_id: string;
  device_name: string;
  device_type: DeviceType;
  last_seen: string;
  is_online: boolean;
  first_seen: string;
  user_id?: string;
  linked_at?: string;
  linked: boolean;
}

export interface DigitalOutput {
  id: number;
  pin: number;
  state: boolean;
}

export interface DeviceTime {
  time: string;
}

export interface Alarm {
  id: string;
  hour: number;
  minute: number;
  enabled: boolean;
  channel: number;
  action: 'ON' | 'OFF';
  description?: string;
}

// DeviceInfo compuesto: cada módulo aporta campos opcionales
export interface DeviceInfo {
  // Timer module
  digitalOutputs?: DigitalOutput[];
  alarms?: Alarm[];
  // THM module (DHT22)
  temperature?: number;
  humidity?: number;
  vpd?: number;
  stage?: VpdStage;
  sensorOk?: boolean;
  // TEMP module (DS18B20) — namespaced para evitar colisión con THM
  temp_temperature?: number;
  temp_sensorOk?: boolean;
  // Common
  time?: DeviceTime;
  // Metadata del backend
  _lastUpdate?: number;
  _stale?: boolean;
  _offlineSince?: number;
}

export interface DeviceListMessage {
  type: 'device_list';
  devices: Device[];
}

export interface LinkResultMessage {
  type: 'link_result';
  success: boolean;
  deviceId: string;
  error?: string;
}

export interface UnlinkResultMessage {
  type: 'unlink_result';
  success: boolean;
  deviceId: string;
  error?: string;
}

export interface DeviceInfoMessage {
  type: 'device_info';
  deviceId: string;
  data: DeviceInfo;
}

export interface DeviceInfoErrorMessage {
  type: 'device_info_error';
  deviceId: string;
  error: string;
}

export interface ControlResultMessage {
  type: 'control_result';
  success: boolean;
  deviceId: string;
  data?: any;
  error?: string;
}

export type WebSocketMessage =
  | DeviceListMessage
  | LinkResultMessage
  | UnlinkResultMessage
  | DeviceInfoMessage
  | DeviceInfoErrorMessage
  | ControlResultMessage;

export interface LinkDeviceMessage {
  type: 'link_device';
  deviceId: string;
}

export interface UnlinkDeviceMessage {
  type: 'unlink_device';
  deviceId: string;
}

export interface RequestDeviceInfoMessage {
  type: 'request_device_info';
  deviceId: string;
}

export interface ControlDigitalOutputMessage {
  type: 'control_digital_output';
  deviceId: string;
  outputId: number;
  state: boolean;
}

export interface LinkDeviceByCodeMessage {
  type: 'link_device_by_code';
  code: string;
}

export type ClientMessage =
  | LinkDeviceMessage
  | UnlinkDeviceMessage
  | RequestDeviceInfoMessage
  | ControlDigitalOutputMessage
  | LinkDeviceByCodeMessage;

// Configuración del WebSocket
export const WEBSOCKET_CONFIG = {
  reconnectInterval: 5000, // 5 segundos
  maxReconnectAttempts: 10,
} as const;
