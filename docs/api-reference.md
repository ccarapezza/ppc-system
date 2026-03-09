# API Reference

All endpoints are served on port 80 via ESPAsyncWebServer.
Responses are JSON (ArduinoJson). CORS is enabled for all origins.

---

## Base Platform API

Provided by `lib/ppc-base/src/WebServer.cpp`. Available on all devices.

### WiFi

#### `GET /wifi-status`

Returns current WiFi connection state and AP information.

**Response:**
```json
{
    "status": "connected",
    "ssid": "MyNetwork",
    "ap-info": {
        "ssid": "PPC-AP_A1B2C3",
        "ip": "172.217.28.15"
    }
}
```

`status` values: `"disconnected"`, `"connecting"`, `"connected"`

---

#### `GET /wifi-scan`

Scans for available WiFi networks. Returns cached results; first call triggers a scan.

**Response:**
```json
{
    "data": [
        {
            "ssid": "MyNetwork",
            "encryptionType": 4,
            "RSSI": -65,
            "BSSID": "AA:BB:CC:DD:EE:FF",
            "channel": 6,
            "isHidden": false
        }
    ]
}
```

---

#### `POST /wifi-connect`

Connects to a WiFi network and saves credentials to flash.

**Parameters** (form data):
| Parameter | Required | Description |
|-----------|----------|-------------|
| `ssid` | yes | Network SSID |
| `password` | yes | Network password |

**Response:**
```json
{ "status": "connecting" }
```

---

#### `POST /wifi-disconnect`

Disconnects from the current WiFi network.

**Response:**
```json
{ "status": "disconnected" }
```

---

### Clock

#### `GET /get-time`

Returns current RTC time.

**Response:**
```json
{ "time": "03/03/2026 14:30:00" }
```

---

#### `GET /clock-status`

Returns NTP/RTC synchronization status.

**Response:**
```json
{
    "ntpEnabled": true,
    "ntpSynced": true,
    "lastNtpSyncEpoch": 1772668200,
    "timeZoneOffset": -3,
    "currentTime": "03/03/2026 14:30:00"
}
```

---

#### `POST /set-clock`

Configures clock mode.

**Parameters** (form data):

*NTP mode:*
| Parameter | Required | Description |
|-----------|----------|-------------|
| `mode` | yes | `"ntp"` |
| `timezone` | no | UTC offset (default: -3) |

*Manual mode:*
| Parameter | Required | Description |
|-----------|----------|-------------|
| `mode` | yes | `"manual"` |
| `year` | yes | e.g. 2026 |
| `month` | yes | 1-12 |
| `day` | yes | 1-31 |
| `hour` | yes | 0-23 |
| `minute` | yes | 0-59 |
| `second` | yes | 0-59 |

**Response:**
```json
{ "success": true, "message": "NTP mode enabled" }
```

---

### Device Linking

#### `POST /link-device`

Links device to a user account via Clerk JWT token verification.

**Parameters** (form data):
| Parameter | Required | Description |
|-----------|----------|-------------|
| `token` | yes | Clerk JWT token |

**Response:**
```json
{ "success": true, "message": "Token verified and device linking initiated" }
```

---

## Timer Module API

Provided by `lib/ppc-timer/src/adapters/TimerController.cpp`.
Available only on devices running the `ppc-timer` environment.

### Relay Control

#### `GET /digital-outputs`

Returns all relay states.

**Response:**
```json
{
    "outputs": [
        { "id": 0, "pin": 16, "state": false },
        { "id": 1, "pin": 12, "state": true },
        { "id": 2, "pin": 13, "state": false }
    ]
}
```

---

#### `GET /digital-output?id=N`

Returns a single relay state.

**Response:**
```json
{ "id": 0, "pin": 16, "state": false, "success": true }
```

---

#### `POST /digital-output`

Sets a relay state.

**Parameters** (form data):
| Parameter | Required | Description |
|-----------|----------|-------------|
| `id` | yes | Relay index (0-based) |
| `state` | yes | `"true"`, `"1"`, `"on"` for ON; anything else for OFF |

**Response:**
```json
{ "id": 0, "pin": 16, "state": true, "success": true }
```

---

### Alarm Scheduling

#### `GET /alarms`

Returns all configured alarms.

**Response:**
```json
[
    {
        "name": "Lamp_ON",
        "hour": 8,
        "minute": 0,
        "extraParams": [1, 1],
        "executed": false,
        "enabled": true,
        "daysOfWeek": [true, true, true, true, true, false, false]
    }
]
```

`extraParams`: `[channel (1-based), state (1=ON, 0=OFF)]`
`daysOfWeek`: `[Sun, Mon, Tue, Wed, Thu, Fri, Sat]`

---

#### `POST /alarm`

Creates a single alarm.

**Parameters** (form data):
| Parameter | Required | Description |
|-----------|----------|-------------|
| `name` | yes | Alarm name (unique identifier) |
| `hour` | yes | 0-23 |
| `minute` | yes | 0-59 |
| `channel` | yes | Relay channel (1-based: 1, 2, or 3) |
| `action` | yes | `1` = turn ON, `0` = turn OFF |
| `days` | no | Comma-separated: `"1,1,1,1,1,0,0"` (Sun-Sat). Default: all days |

**Response:**
```json
{
    "success": true,
    "message": "Alarm created successfully",
    "name": "Lamp_ON",
    "hour": 8,
    "minute": 0,
    "alarmCount": 1,
    "channel": 1,
    "state": "ON"
}
```

---

#### `POST /alarm-on-off`

Creates an ON/OFF alarm pair (e.g. turn on at 8:00, off at 20:00).

**Parameters** (form data):
| Parameter | Required | Description |
|-----------|----------|-------------|
| `name` | yes | Base name (creates `{name}_ON` and `{name}_OFF`) |
| `onHour` | yes | 0-23 |
| `onMinute` | yes | 0-59 |
| `offHour` | yes | 0-23 |
| `offMinute` | yes | 0-59 |
| `channel` | yes | Relay channel (1-based) |
| `days` | no | Comma-separated: `"1,1,1,1,1,0,0"` |

**Response:**
```json
{
    "success": true,
    "message": "Alarms created successfully",
    "name": "Lamp",
    "alarmCount": 2,
    "channel": 1
}
```

---

#### `POST /alarm-enable`

Enables or disables an alarm.

**Parameters** (form data):
| Parameter | Required | Description |
|-----------|----------|-------------|
| `name` | yes | Alarm name |
| `enabled` | yes | `"true"` or `"false"` |

**Response:**
```json
{ "success": true, "message": "Alarm Lamp_ON enabled" }
```

---

#### `POST /alarm-days`

Updates the days of week for an alarm.

**Parameters** (form data):
| Parameter | Required | Description |
|-----------|----------|-------------|
| `name` | yes | Alarm name |
| `days` | yes | Comma-separated booleans: `"1,1,1,1,1,0,0"` (Sun-Sat) |

**Response:**
```json
{
    "success": true,
    "message": "Alarm days updated for: Lamp_ON",
    "days": [true, true, true, true, true, false, false]
}
```

---

## MQTT Protocol

Broker: `mqtt.powerplantcontrol.com.ar:1883`
Device ID: WiFi MAC address with colons removed (e.g. `AABBCCDDEEFF`)

### Topics

| Topic | Dir | Description | Payload |
|-------|-----|-------------|---------|
| `devices/{id}/presence` | OUT | Online/offline status (retained, will message) | `{"device_id":"…","device_name":"…","device_type":"timer","status":"online"}` |
| `devices/{id}/info` | OUT | Full device state | `{"digitalOutputs":[…],"time":{"time":"…"},"alarms":[…]}` |
| `devices/{id}/request_info` | IN | Request device info publish | _(empty or any)_ |
| `devices/{id}/control` | IN | Remote relay control | `{"type":"digital_output","output_id":0,"state":true}` |
| `devices/{id}/control_response` | OUT | Control acknowledgement | `{"success":true,"output_id":0,"state":true}` |
| `devices/{id}/link` | IN | Link confirmation from backend | `{"linked":true,"user_id":"…"}` |
| `devices/{id}/unlink` | IN | Unlink confirmation | `{"unlinked":true}` |
