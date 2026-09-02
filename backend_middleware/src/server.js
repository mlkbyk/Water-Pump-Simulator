const http = require("http");
const express = require("express");
const cors = require("cors");
const config = require("./config");
const modbusClient = require("./modbusClient");
const { setupSocketServer } = require("./socketServer");

const app = express();
const httpServer = http.createServer(app);

// Express Middleware
app.use(cors({ origin: config.CORS_ORIGIN }));
app.use(express.json());

// REST API Uç Noktaları
app.get("/", (req, res) => {
  res.json({
    service: "Metirius Kuyu & Terfi SCADA Middleware",
    version: "2.0.0",
    modbus: {
      host: config.MODBUS_HOST,
      port: config.MODBUS_PORT,
      connected: modbusClient.isConnected,
    },
    websocket: {
      port: config.SERVER_PORT,
    },
  });
});

app.get("/api/telemetry", (req, res) => {
  const telemetry = modbusClient.latestTelemetry;
  if (!telemetry) {
    return res.status(503).json({ error: "Telemetri verisi henüz hazır değil veya Modbus bağlı değil." });
  }
  res.json(telemetry);
});

app.post("/api/setpoints", async (req, res) => {
  try {
    const result = await modbusClient.updateControlRegisters(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    modbusConnected: modbusClient.isConnected,
    timestamp: new Date().toISOString(),
  });
});

// Socket.IO ve Modbus Başlatma
setupSocketServer(httpServer);

httpServer.listen(config.SERVER_PORT, () => {
  console.log(`\n\x1b[1m\x1b[32m==============================================================\x1b[0m`);
  console.log(`\x1b[1m\x1b[32m   ⚡ KATMAN 2: SCADA MIDDLEWARE & WEBSOCKET SUNUCUSU AKTİF   \x1b[0m`);
  console.log(`\x1b[1m\x1b[32m==============================================================\x1b[0m`);
  console.log(`\x1b[36mHTTP REST API  : http://localhost:${config.SERVER_PORT}\x1b[0m`);
  console.log(`\x1b[36mWebSocket URL  : ws://localhost:${config.SERVER_PORT}\x1b[0m`);
  console.log(`\x1b[36mModbus Hedefi  : ${config.MODBUS_HOST}:${config.MODBUS_PORT} (500ms Polling)\x1b[0m`);
  console.log(`\x1b[1m\x1b[32m--------------------------------------------------------------\x1b[0m\n`);

  // Modbus TCP Client bağlantısını başlat
  modbusClient.connect();
});

// Graceful Shutdown
process.on("SIGINT", () => {
  console.log("\n\x1b[33mSunucu kapatılıyor...\x1b[0m");
  modbusClient.disconnect();
  httpServer.close(() => {
    console.log("\x1b[32mSunucu güvenle durduruldu.\x1b[0m");
    process.exit(0);
  });
});
