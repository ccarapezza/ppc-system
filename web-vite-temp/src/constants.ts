export enum EncryptionType {
  WEP = 5,
  WPA_PSK = 2,
  WPA2_PSK = 4,
  OPEN = 7,
  WPA_WPA2_PSK = 8
}

export const ConnectionState = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected"
}

export const EncryptionTypeLabel : {[key: number]: string} = {
  [EncryptionType.WEP]: "WEP",
  [EncryptionType.WPA_PSK]: "WPA / PSK",
  [EncryptionType.WPA2_PSK]: "WPA2 / PSK",
  [EncryptionType.OPEN]: "Open",
  [EncryptionType.WPA_WPA2_PSK]: "WPA / WPA2 / PSK"
}

export const Utils = {
  getSignalLevel: (RSSI: number) => {
    const minRSSI = -100;
    const maxRSSI = 0;
    const signalStrength = (RSSI - minRSSI) / (maxRSSI - minRSSI);
    const signalLevels = 5;
    return Math.floor(signalStrength * signalLevels)*20+20;
  }
}

export interface ConnectionStatus {
  status: string
  ssid: string
  "ap-info":{
    ssid: string
    ip: string
  }
}

export default {
  ConnectionState,
  EncryptionType,
  EncryptionTypeLabel,
  Utils
}