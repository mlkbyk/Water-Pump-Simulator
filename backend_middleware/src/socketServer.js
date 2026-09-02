const { Server } = require("socket.io");
const { exec } = require("child_process");
const path = require("path");
const modbusClient = require("./modbusClient");
const config = require("./config");

function setupSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: config.CORS_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ["websocket", "polling"]
  });

  // Modbus verisi geldiğinde WebSocket üzerinden yayınla
  modbusClient.setDataCallback((telemetry) => {
    io.emit("telemetry", telemetry);
    if (telemetry.clock) io.emit("clock_telemetry", telemetry.clock);
    if (telemetry.stations) io.emit("stations_telemetry", telemetry.stations);
  });

  modbusClient.setStatusCallback((status) => {
    io.emit("modbus_status", status);
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.IO] + İstemci bağlandı: ${socket.id}`);

    const latest = modbusClient.latestTelemetry;
    if (latest) {
      socket.emit("telemetry", latest);
      if (latest.clock) socket.emit("clock_telemetry", latest.clock);
      if (latest.stations) socket.emit("stations_telemetry", latest.stations);
    }

    socket.emit("modbus_status", {
      connected: modbusClient.isConnected,
      host: config.MODBUS_HOST,
      port: config.MODBUS_PORT
    });

    // ➕ YENİ İSTASYON EKLEME SİHİRBAZI
    socket.on("add_new_station", async (data, ack) => {
      try {
        console.log(`[Socket.IO] ➕ Yeni istasyon ekleme talebi:`, data.name);
        const currentList = config.loadStations();
        
        let maxSlaveId = 0;
        let maxDid = 12100;
        currentList.forEach(s => {
          const sid = s.slave_id || s.slaveId || 1;
          if (sid > maxSlaveId) maxSlaveId = sid;
          if (s.did && s.did > maxDid) maxDid = s.did;
        });

        const newSlaveId = maxSlaveId + 1;
        const newDid = data.did ? parseInt(data.did, 10) : (maxDid + 1);

        const newStation = {
          did: newDid,
          slave_id: newSlaveId,
          name: data.name || `AMAS K${newSlaveId + 15} (Yeni Kuyu)`,
          type: data.type || "kuyu",
          desc: data.desc || `Dinamik Eklenen İstasyon (DID: ${newDid})`,
          params: {
            pump_depth: parseFloat(data.pumpDepth) || 80.0,
            static_level: parseFloat(data.staticLevel) || 60.0,
            default_pressure: parseFloat(data.pressure) || 3.80,
            default_flow: parseFloat(data.flow) || 28.0,
            rated_power: parseFloat(data.power) || 18.5,
            tank_start_level: parseFloat(data.tankStartLevel) || 0.60,
            tank_stop_level: parseFloat(data.tankStopLevel) || 3.10
          }
        };

        currentList.push(newStation);
        config.saveStations(currentList);
        console.log(`[Socket.IO] ✔ İstasyon kaydedildi: Slave ID ${newSlaveId} - ${newStation.name}`);

        // Predixi CSV Üreticisini Çalıştır
        const exportScript = path.resolve(__dirname, '../../export_predixi_csv.py');
        const rootDir = path.resolve(__dirname, '../../');
        exec(`python "${exportScript}"`, { cwd: rootDir }, (err, stdout) => {
          if (err) console.error(`[Export CSV Hatası] ${err.message}`);
          else console.log(`[Export CSV] Predixi dosyaları güncellendi.`);
        });

        if (typeof ack === "function") {
          ack({ success: true, station: newStation });
        }
      } catch (err) {
        console.error(`[Socket.IO] İstasyon ekleme hatası: ${err.message}`);
        if (typeof ack === "function") ack({ success: false, error: err.message });
      }
    });

    // İstasyon Bazında Ayar Güncelleme
    socket.on("update_station_setpoints", async (data, ack) => {
      try {
        const slaveId = data.slaveId || 1;
        await modbusClient.updateStationRegisters(slaveId, data);
        if (typeof ack === "function") ack({ success: true });
      } catch (err) {
        if (typeof ack === "function") ack({ success: false, error: err.message });
      }
    });

    socket.on("set_pump", async (data, ack) => {
      try {
        const slaveId = data.slaveId || 1;
        const pumpRunning = typeof data === "object" ? data.running : !!data;
        await modbusClient.updateStationRegisters(slaveId, { pumpRunning });
        if (typeof ack === "function") ack({ success: true });
      } catch (err) {
        if (typeof ack === "function") ack({ success: false, error: err.message });
      }
    });

    socket.on("set_mode", async (data, ack) => {
      try {
        const slaveId = data.slaveId || 1;
        const mode = typeof data === "object" ? data.mode : data;
        await modbusClient.updateStationRegisters(slaveId, { mode });
        if (typeof ack === "function") ack({ success: true });
      } catch (err) {
        if (typeof ack === "function") ack({ success: false, error: err.message });
      }
    });

    socket.on("emergency_stop", async (data, ack) => {
      try {
        console.warn(`[Socket.IO] 🛑 TÜM İSTASYONLAR ACİL DURDURULUYOR!`);
        const stationsList = config.loadStations();
        for (const st of stationsList) {
          const sid = st.slave_id || st.slaveId;
          await modbusClient.updateStationRegisters(sid, { pressure: 0, flow: 0, pumpRunning: false, mode: 0 });
        }
        if (typeof ack === "function") ack({ success: true, stopped: true });
      } catch (err) {
        if (typeof ack === "function") ack({ success: false, error: err.message });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket.IO] - İstemci ayrıldı: ${socket.id}`);
    });
  });

  return io;
}

module.exports = { setupSocketServer };
