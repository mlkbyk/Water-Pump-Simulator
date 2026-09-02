import { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';
const MAX_HISTORY_POINTS = 40;

export function useModbusSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [modbusStatus, setModbusStatus] = useState({ connected: false });
  const [activeSlaveId, setActiveSlaveId] = useState(1);

  // İstasyon Listesi
  const [stations, setStations] = useState([
    { did: 12101, slaveId: 1, name: "AMAS K16 (Derin Kuyu)", type: "kuyu", depth: 112.3, kuyu: null, terfi: null },
    { did: 12102, slaveId: 2, name: "AMAS K17 (Yüksek Debi)", type: "kuyu", depth: 75.0, kuyu: null, terfi: null },
    { did: 12103, slaveId: 3, name: "AMAS K18 (Sığ Kuyu)", type: "kuyu", depth: 45.0, kuyu: null, terfi: null },
    { did: 12104, slaveId: 4, name: "AMAS Terfi Altı (Terfi)", type: "terfi", depth: 10.0, kuyu: null, terfi: null }
  ]);

  // 24 Saatlik Çevrim Saati
  const [clock, setClock] = useState({
    hour: 14,
    minute: 30,
    timeStr: '14:30',
    phaseCode: 2,
    phaseName: 'GÜNDÜZ',
    speedMultiplier: 60,
    cityDemandFlow: 22.5,
  });

  const [history, setHistory] = useState(() => {
    const initial = [];
    const now = Date.now();
    for (let i = 15; i >= 0; i--) {
      const d = new Date(now - i * 1000);
      initial.push({
        time: d.toLocaleTimeString([], { hour12: false }),
        epoch: now - i * 1000,
        pressure: 3.66,
        flow: 24.83,
        head: 161.85,
        pElectric: 15.11,
        current: 25.36,
        temperature: 23.00,
        voltage: 411.26,
        efficiency: 75.43,
        tankLevel: 0.95,
      });
    }
    return initial;
  });

  const socketRef = useRef(null);
  const activeSlaveIdRef = useRef(activeSlaveId);

  // İstasyon değiştiğinde grafiği o istasyonun verileriyle yenile
  useEffect(() => {
    activeSlaveIdRef.current = activeSlaveId;
    const st = stations.find(s => (s.slaveId || s.slave_id) === activeSlaveId);
    if (st?.kuyu?.measurements) {
      const km = st.kuyu.measurements;
      const tm = st.terfi?.measurements || {};
      const now = Date.now();
      const initial = [];
      for (let i = 15; i >= 0; i--) {
        const d = new Date(now - i * 1000);
        initial.push({
          time: d.toLocaleTimeString([], { hour12: false }),
          epoch: now - i * 1000,
          pressure: Number(km.pressure ?? 3.66),
          flow: Number(km.flow ?? 24.83),
          head: Number(tm.pumpingHead ?? 161.85),
          pElectric: Number(km.power ?? 15.11),
          current: Number(km.iL1 ?? 25.36),
          temperature: Number(km.motorTemp ?? 23.0),
          voltage: Number(km.vL1 ?? 411.26),
          efficiency: Number(tm.systemEff ?? 75.43),
          tankLevel: Number(tm.tankLevel ?? 0.95),
        });
      }
      setHistory(initial);
    }
  }, [activeSlaveId]);

  // Aktif istasyonu bul
  const activeStation = stations.find(s => (s.slaveId || s.slave_id) === activeSlaveId) || stations[0];
  const kuyuData = activeStation?.kuyu?.measurements || {
    pressure: 3.66,
    flow: 24.83,
    wellLevel: 92.00,
    pumpDepth: 112.30,
    vL1: 411.26,
    vL2: 410.06,
    vL3: 408.31,
    iL1: 25.36,
    iL2: 23.12,
    iL3: 22.00,
    frequency: 49.99,
    power: 15.11,
    motorTemp: 23.00,
    cabinetTemp: 53.00,
    outdoorTemp: 25.60,
    waterTemp: 16.70,
    statusCode: 1,
    statusText: 'ON',
    mode: 'AUTO',
    pumpRunning: true,
  };

  const terfiData = activeStation?.terfi?.measurements || {
    tankLevel: 0.95,
    inflowHeight: 3.10,
    tankStartLevel: 0.60,
    tankStopLevel: 3.10,
    cityDemandFlow: 22.5,
    pumpingHead: 161.85,
    hydraulicEff: 83.81,
    systemEff: 75.43,
    powerPerM3: 0.609,
    totalFlowM3: 1090501,
    totalEnergyKwh: 761876,
    runtimeHours: 1180,
    runCount: 142,
    costEur: 0,
  };

  const currentSetpoints = activeStation?.kuyu?.setpoints || {
    pressure: 3.66,
    flow: 24.83,
    pumpRunning: true,
    mode: 'AUTO',
    efficiency: 75.43,
    tankStartLevel: 0.60,
    tankStopLevel: 3.10,
    speedMultiplier: 60,
  };

  const telemetry = {
    timestamp: new Date().toISOString(),
    epochMs: Date.now(),
    clock: clock,
    activeStation: activeStation,
    setpoints: {
      ...currentSetpoints,
      efficiency: activeStation?.terfi?.setpoints?.targetEfficiency || 75.43,
      tankStartLevel: activeStation?.terfi?.setpoints?.tankStartLevel || 0.60,
      tankStopLevel: activeStation?.terfi?.setpoints?.tankStopLevel || 3.10,
      speedMultiplier: clock.speedMultiplier || 60,
    },
    measurements: {
      pressure: kuyuData.pressure || 3.66,
      flow: kuyuData.flow || 24.83,
      head: terfiData.pumpingHead || 161.85,
      pHydraulic: +((((kuyuData.flow || 24.8) * (terfiData.pumpingHead || 161.85)) / 367.0).toFixed(2)),
      pElectric: kuyuData.power || 15.11,
      current: kuyuData.iL1 || 25.36,
      temperature: kuyuData.motorTemp || 23.0,
      voltage: kuyuData.vL1 || 411.26,
      statusCode: kuyuData.statusCode !== undefined ? kuyuData.statusCode : 1,
      statusText: kuyuData.statusText || 'ON',
      efficiency: terfiData.systemEff || 75.43,
      tankLevel: terfiData.tankLevel || 0.95,
    }
  };

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setModbusStatus({ connected: false });
    });

    socket.on('modbus_status', (status) => {
      setModbusStatus(status);
    });

    socket.on('clock_telemetry', (c) => {
      if (c) setClock(c);
    });

    socket.on('stations_telemetry', (stList) => {
      if (Array.isArray(stList)) {
        setStations(stList);
      }
    });

    socket.on('telemetry', (data) => {
      if (!data) return;
      if (data.clock) setClock(data.clock);
      
      let curStations = stations;
      if (Array.isArray(data.stations)) {
        curStations = data.stations;
        setStations(data.stations);
      }

      // Aktif istasyonun verilerini al
      const currentId = activeSlaveIdRef.current;
      const st = curStations.find(s => (s.slaveId || s.slave_id) === currentId) || curStations[0];
      const km = st?.kuyu?.measurements || data.kuyu?.measurements || {};
      const tm = st?.terfi?.measurements || data.terfi?.measurements || {};

      const now = new Date();
      const timeLabel = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      setHistory((prev) => {
        const newPoint = {
          time: timeLabel,
          epoch: data.epochMs || Date.now(),
          pressure: Number(km.pressure ?? 3.66),
          flow: Number(km.flow ?? 24.83),
          head: Number(tm.pumpingHead ?? 161.85),
          pElectric: Number(km.power ?? 15.11),
          current: Number(km.iL1 ?? 25.36),
          temperature: Number(km.motorTemp ?? 23.0),
          voltage: Number(km.vL1 ?? 411.26),
          efficiency: Number(tm.systemEff ?? 75.43),
          tankLevel: Number(tm.tankLevel ?? 0.95),
        };
        const updated = [...prev, newPoint];
        return updated.length > MAX_HISTORY_POINTS ? updated.slice(updated.length - MAX_HISTORY_POINTS) : updated;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Kontrol Eylemleri (Aktif İstasyona Gönderilir)
  const updateSetpoints = useCallback((data) => {
    if (socketRef.current) {
      socketRef.current.emit('update_station_setpoints', {
        slaveId: activeSlaveId,
        ...data
      });
    }
  }, [activeSlaveId]);

  const setPump = useCallback((running) => {
    if (socketRef.current) {
      socketRef.current.emit('set_pump', { slaveId: activeSlaveId, running });
    }
  }, [activeSlaveId]);

  const setMode = useCallback((mode) => {
    if (socketRef.current) {
      socketRef.current.emit('set_mode', { slaveId: activeSlaveId, mode });
    }
  }, [activeSlaveId]);

  const emergencyStop = useCallback(() => {
    if (socketRef.current) socketRef.current.emit('emergency_stop');
  }, []);

  const addNewStation = useCallback((formData, cb) => {
    if (socketRef.current) {
      socketRef.current.emit('add_new_station', formData, cb);
    }
  }, []);

  return {
    isConnected,
    modbusStatus,
    clock,
    stations,
    activeSlaveId,
    setActiveSlaveId,
    activeStation,
    telemetry,
    kuyuData,
    terfiData,
    history,
    setPump,
    setMode,
    updateSetpoints,
    emergencyStop,
    addNewStation,
  };
}
