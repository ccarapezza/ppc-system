#!/usr/bin/env node
/**
 * PPC WiFi QR Generator
 *
 * Prints a WiFi QR code for the PPC device AP to the terminal.
 *
 * Usage:
 *   node index.mjs <chip-id>
 *   node index.mjs --chip-id 12345678
 *
 * The chip ID is printed to serial on device boot, e.g.:
 *   "Chip ID: 12345678"
 *
 * If no chip ID is provided, prompts for manual SSID input.
 */

import qrcode from 'qrcode-terminal';
import { createInterface } from 'readline';

// ── AP defaults (must match PpcConnection.cpp) ─────────────────────────────
const AP_PASSWORD = 'ppcbot123';
const AP_SSID_PREFIX = 'PPC-AP_';
const CAPTIVE_PORTAL_IP = '192.168.4.1';

// ── Argument parsing ────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = argv.slice(2);
  let chipId = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--chip-id' && args[i + 1]) {
      chipId = args[++i];
    } else if (!args[i].startsWith('--')) {
      chipId = args[i];
    }
  }
  return chipId;
}

// ── Generate and print QR ────────────────────────────────────────────────────
function printWifiQr(ssid) {
  // Standard WiFi QR code format (supported by iOS 11+, Android 9+)
  const wifiString = `WIFI:T:WPA;S:${ssid};P:${AP_PASSWORD};;`;

  console.log('\n');
  console.log('  ┌─────────────────────────────────────────┐');
  console.log(`  │  SSID    : ${ssid.padEnd(29)} │`);
  console.log(`  │  Password: ${AP_PASSWORD.padEnd(29)} │`);
  console.log(`  │  Portal  : http://${CAPTIVE_PORTAL_IP.padEnd(22)} │`);
  console.log('  └─────────────────────────────────────────┘');
  console.log('\n  Scan with your phone camera to connect:\n');

  qrcode.generate(wifiString, { small: true }, (qr) => {
    // Indent each line for readability
    console.log(qr.split('\n').map(line => '  ' + line).join('\n'));
    console.log('\n');
  });
}

// ── Interactive prompt fallback ──────────────────────────────────────────────
function promptForSsid() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  rl.question(
    '  Chip ID not provided. Enter chip ID (e.g. 12345678) or full SSID: ',
    (answer) => {
      rl.close();
      const ssid = answer.startsWith(AP_SSID_PREFIX)
        ? answer.trim()
        : `${AP_SSID_PREFIX}${answer.trim()}`;
      printWifiQr(ssid);
    }
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
const chipId = parseArgs(process.argv);

if (chipId) {
  const ssid = chipId.startsWith(AP_SSID_PREFIX)
    ? chipId
    : `${AP_SSID_PREFIX}${chipId}`;
  printWifiQr(ssid);
} else {
  promptForSsid();
}
