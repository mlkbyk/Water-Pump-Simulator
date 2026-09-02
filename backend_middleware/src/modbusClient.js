const ModbusRTU = require("modbus-serial");
const config = require("./config");

class MultiStationModbusClient {
  constructor() {
    this.client = new ModbusRTU();
    this.isConnected = false;
    this.pollTimer = null;
    this.reconnectTimer = null;
    this.latestTelemetry = null;
    this.isOperationInProgress = false;
    this.onDataCallback = null;
    this.onStatusCallback = null;
  }

  setDataCallback(fn) {
    this.onDataCallback = fn;
  }

  setStatusCallback(fn) {
    this.onStatusCallback = fn;
  }

  async connect() {
    if (this.isConnected) return;
    try {
      console.log(`[Modbus] ${config.MODBUS_HOST}:${config.MODBUS_PORT} sunucusuna bağlanılıyor...`);
      await this.client.connectTCP(config.MODBUS_HOST, { port: config.MODBUS_PORT });
      this.client.setTimeout(2000);
      this.isConnected = true;
      console.log(`[Modbus] \x1b[32m✔ Modbus TCP Sunucusuna başarıyla bağlanıldı (Port: ${config.MODBUS_PORT})\x1b[0m`);
      
      this._emitStatus({ connected: true, host: config.MODBUS_HOST, port: config.MODBUS_PORT });
      this._startPolling();
    } catch (err) {
      console.error(`[Modbus] Bağlantı kurulamadı: ${err.message}`);
      this.isConnected = false;
      this._emitStatus({ connected: false, error: err.message });
      this._scheduleReconnect();
    }
  }

  _scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      console.log("[Modbus] Yeniden bağlanmayı deniyor...");
      await this.connect();
    }, config.RECONNECT_INTERVAL_MS);
  }

  _startPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(async () => {
      if (!this.isConnected || this.isOperationInProgress) return;
      await this.readAllStations();
    }, config.POLL_INTERVAL_MS);
  }

  _emitStatus(statusObj) {
    if (this.onStatusCallback) {
      this.onStatusCallback(statusObj);
    }
  }

  async readAllStations() {
    if (!this.isConnected) return null;
    this.isOperationInProgress = true;
    try {
      const stationsList = config.loadStations();
      const stationsData = [];
      let globalClock = null;

      for (const st of stationsList) {
        const sid = st.slave_id || st.slaveId;
        this.client.setID(sid);
        
        let hrRes;
        try {
          hrRes = await this.client.readHoldingRegisters(0, config.REGISTERS.HOLDING.COUNT);
        } catch (e) {
          continue;
        }

        const hr = hrRes.data;
        const totalFlow = ((hr[36] << 16) | hr[37]) >>> 0;
        const totalEnergy = ((hr[38] << 16) | hr[39]) >>> 0;

        const simHour = hr[8] !== undefined ? hr[8] : 14;
        const simMinute = hr[9] !== undefined ? hr[9] : 30;
        const phaseCode = hr[42] !== undefined ? hr[42] : 2;
        const phaseNames = ["GECE MODU", "SABAH PİK", "GÜNDÜZ", "AKŞAM PİK"];

        if (!globalClock) {
          globalClock = {
            hour: simHour,
            minute: simMinute,
            timeStr: `${String(simHour).padStart(2, '0')}:${String(simMinute).padStart(2, '0')}`,
            phaseCode: phaseCode,
            phaseName: phaseNames[phaseCode] || "GÜNDÜZ",
            speedMultiplier: hr[7] || 60,
          };
        }

        const stationTelemetry = {
          did: st.did,
          slaveId: sid,
          name: st.name,
          type: st.type,
          depth: st.params?.pump_depth || 100.0,
          kuyu: {
            setpoints: {
              pressure: +(hr[0] / 100.0).toFixed(2),
              flow: +(hr[1] / 100.0).toFixed(1),
              pumpRunning: hr[2] === 1,
              mode: hr[3] === 1 ? "AUTO" : "MANUAL",
            },
            measurements: {
              pressure: +(hr[10] / 100.0).toFixed(2),
              flow: +(hr[11] / 100.0).toFixed(1),
              wellLevel: +(hr[12] / 100.0).toFixed(2),
              pumpDepth: +(hr[13] / 100.0).toFixed(2),
              vL1: +(hr[14] / 10.0).toFixed(1),
              vL2: +(hr[15] / 10.0).toFixed(1),
              vL3: +(hr[16] / 10.0).toFixed(1),
              iL1: +(hr[17] / 100.0).toFixed(2),
              iL2: +(hr[18] / 100.0).toFixed(2),
              iL3: +(hr[19] / 100.0).toFixed(2),
              frequency: +(hr[20] / 100.0).toFixed(2),
              power: +(hr[21] / 100.0).toFixed(2),
              motorTemp: +(hr[22] / 100.0).toFixed(1),
              cabinetTemp: +(hr[23] / 100.0).toFixed(1),
              outdoorTemp: +(hr[24] / 100.0).toFixed(1),
              waterTemp: +(hr[25] / 100.0).toFixed(1),
              statusCode: hr[26],
              statusText: hr[26] === 1 ? "ON" : "OFF",
            }
          },
          terfi: {
            setpoints: {
              targetEfficiency: +(hr[4] / 100.0).toFixed(2),
              tankStartLevel: +(hr[5] / 100.0).toFixed(2),
              tankStopLevel: +(hr[6] / 100.0).toFixed(2),
            },
            measurements: {
              tankLevel: +(hr[30] / 100.0).toFixed(2),
              cityDemandFlow: +(hr[31] / 100.0).toFixed(1),
              inflowHeight: hr[43] !== undefined ? +(hr[43] / 100.0).toFixed(2) : 3.10,
              pumpingHead: +(hr[32] / 100.0).toFixed(2),
              hydraulicEff: +(hr[33] / 100.0).toFixed(2),
              systemEff: +(hr[34] / 100.0).toFixed(2),
              powerPerM3: +(hr[35] / 1000.0).toFixed(3),
              totalFlowM3: totalFlow,
              totalEnergyKwh: totalEnergy,
              runtimeHours: hr[40] || 1180,
              runCount: hr[41] || 142,
              costEur: 0,
            }
          }
        };

        stationsData.push(stationTelemetry);
      }

      const defaultStation = stationsData[0] || {};
      const telemetry = {
        timestamp: new Date().toISOString(),
        epochMs: Date.now(),
        clock: globalClock,
        stations: stationsData,
        kuyu: defaultStation.kuyu,
        terfi: defaultStation.terfi,
      };

      this.latestTelemetry = telemetry;
      if (this.onDataCallback) {
        this.onDataCallback(telemetry);
      }
      return telemetry;
    } catch (err) {
      console.error(`[Modbus] Okuma hatası: ${err.message}`);
      return null;
    } finally {
      this.isOperationInProgress = false;
    }
  }

  async updateStationRegisters(slaveId, {
    pressure,
    flow,
    pumpRunning,
    mode,
    targetEfficiency,
    tankStartLevel,
    tankStopLevel,
    speedMultiplier
  }) {
    if (!this.isConnected) throw new Error("Modbus sunucusuna bağlı değil.");
    while (this.isOperationInProgress) {
      await new Promise((r) => setTimeout(r, 20));
    }
    this.isOperationInProgress = true;
    try {
      this.client.setID(slaveId || 1);
      const currentHr = await this.client.readHoldingRegisters(0, 8);
      let pVal = pressure !== undefined ? Math.round(pressure * 100) : currentHr.data[0];
      let qVal = flow !== undefined ? Math.round(flow * 100) : currentHr.data[1];
      let pumpVal = pumpRunning !== undefined ? (pumpRunning ? 1 : 0) : currentHr.data[2];
      let modeVal = mode !== undefined ? (mode === "AUTO" || mode === 1 ? 1 : 0) : currentHr.data[3];
      let etaVal = targetEfficiency !== undefined ? Math.round(targetEfficiency * 100) : currentHr.data[4];
      let minLvl = tankStartLevel !== undefined ? Math.round(tankStartLevel * 100) : currentHr.data[5];
      let maxLvl = tankStopLevel !== undefined ? Math.round(tankStopLevel * 100) : currentHr.data[6];
      let speedVal = speedMultiplier !== undefined ? Math.round(speedMultiplier) : currentHr.data[7];

      await this.client.writeRegisters(0, [pVal, qVal, pumpVal, modeVal, etaVal, minLvl, maxLvl, speedVal]);
      console.log(`[Modbus] ✔ Slave ID ${slaveId} güncellendi:`, [pVal, qVal, pumpVal, modeVal]);
      return { success: true };
    } finally {
      this.isOperationInProgress = false;
    }
  }

  async disconnect() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.isConnected = false;
    try {
      await this.client.close();
    } catch (e) {}
  }
}

module.exports = new MultiStationModbusClient();
