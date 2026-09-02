import React, { useState } from 'react';
import Header from './components/Header';
import MetricsGrid from './components/MetricsGrid';
import ControlPanel from './components/ControlPanel';
import StationSchema from './components/StationSchema';
import MultiAxisChart from './components/MultiAxisChart';
import GaugeCluster from './components/GaugeCluster';
import AddStationModal from './components/AddStationModal';
import { useModbusSocket } from './hooks/useModbusSocket';
import { ShieldCheck } from 'lucide-react';

export default function App() {
  const {
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
  } = useModbusSocket();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleAddStation = (formData, callback) => {
    addNewStation(formData, (res) => {
      if (res?.success && res?.station) {
        setActiveSlaveId(res.station.slave_id);
      }
      if (callback) callback(res);
    });
  };

  return (
    <div className="min-h-screen bg-scada-darkest text-slate-100 flex flex-col">
      {/* 1. SCADA Header & Çoklu İstasyon Seçici */}
      <Header
        isConnected={isConnected}
        modbusStatus={modbusStatus}
        telemetry={telemetry}
        clock={clock}
        stations={stations}
        activeSlaveId={activeSlaveId}
        onSelectStation={setActiveSlaveId}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onEmergencyStop={emergencyStop}
      />

      {/* Ana Gösterge Paneli */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 space-y-4">
        
        {/* 2. Dijital Ölçüm & KPI Kartları */}
        <section>
          <MetricsGrid
            telemetry={telemetry}
            kuyuData={kuyuData}
            terfiData={terfiData}
          />
        </section>

        {/* 3. Orta Katman: Kontrol Paneli (Sol) & P&ID Şematiği (Sağ) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4 min-h-[410px]">
            <ControlPanel
              telemetry={telemetry}
              clock={clock}
              activeStation={activeStation}
              onUpdateSetpoints={updateSetpoints}
              onSetPump={setPump}
              onSetMode={setMode}
            />
          </div>
          <div className="lg:col-span-8 min-h-[410px]">
            <StationSchema
              telemetry={telemetry}
              kuyuData={kuyuData}
              terfiData={terfiData}
              clock={clock}
              activeStation={activeStation}
            />
          </div>
        </section>

        {/* 4. Alt Katman: Canlı Çoklu Eksen Grafiği (Sol) & Analog Kadranlar (Sağ) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 min-h-[360px]">
            <MultiAxisChart history={history} />
          </div>
          <div className="lg:col-span-4 min-h-[360px]">
            <GaugeCluster telemetry={telemetry} />
          </div>
        </section>

      </main>

      {/* 5. Alt Bilgi Çubuğu (Footer) */}
      <footer className="scada-panel border-t border-scada-border px-4 py-2 text-[11px] font-mono text-slate-400">
        <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Predixi & Metirius SCADA Simülatörü - Dinamik Çoklu İstasyon Sistemi (Slave 1..{stations.length})</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Katman 1: Python Modbus TCP (Port: 5020)</span>
            <span>•</span>
            <span>Katman 2: Node.js Middleware (Port: 4000)</span>
            <span>•</span>
            <span>Katman 3: React SCADA UI (Port: 5173)</span>
          </div>
        </div>
      </footer>

      {/* Yeni İstasyon Ekleme Modalı */}
      <AddStationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddStation={handleAddStation}
        existingStationsCount={stations.length}
      />
    </div>
  );
}
