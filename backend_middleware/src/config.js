/**
 * Middleware Yapılandırma Ayarları (Dinamik JSON İstasyon Destekli)
 */

const fs = require('fs');
const path = require('path');

const JSON_PATH = path.resolve(__dirname, '../../simulation_engine/stations.json');

function loadStations() {
  if (fs.existsSync(JSON_PATH)) {
    try {
      const content = fs.readFileSync(JSON_PATH, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      console.error('[Config] stations.json okunamadı:', e.message);
    }
  }
  return [];
}

function saveStations(list) {
  fs.writeFileSync(JSON_PATH, JSON.stringify(list, null, 2), 'utf8');
}

module.exports = {
  SERVER_PORT: process.env.PORT || 4000,
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",

  MODBUS_HOST: process.env.MODBUS_HOST || "127.0.0.1",
  MODBUS_PORT: parseInt(process.env.MODBUS_PORT, 10) || 5020,

  POLL_INTERVAL_MS: 500,
  RECONNECT_INTERVAL_MS: 3000,

  loadStations,
  saveStations,

  REGISTERS: {
    HOLDING: {
      START_ADDR: 0,
      COUNT: 45,
    }
  }
};
