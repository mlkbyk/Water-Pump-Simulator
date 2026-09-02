import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Cpu, Wifi, Clock, Sun, Moon, Zap, Flame, Droplet, Radio, PlusCircle } from 'lucide-react';

export default function Header({
  isConnected,
  modbusStatus,
  telemetry,
  clock,
  stations,
  activeSlaveId,
  onSelectStation,
  onOpenAddModal,
  onEmergencyStop
}) {
  const [realTime, setRealTime] = useState(new Date());
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setRealTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isPumpRunning = telemetry?.setpoints?.pumpRunning;
  const simClock = clock || { timeStr: '14:30', phaseName: 'GÜNDÜZ', phaseCode: 2, speedMultiplier: 60 };

  const handleStopClick = () => {
    onEmergencyStop();
    setShowConfirm(false);
  };

  const getPhaseIcon = (code) => {
    switch (code) {
      case 0: return <Moon className="w-3.5 h-3.5 text-indigo-400" />;
      case 1: return <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />;
      case 2: return <Sun className="w-3.5 h-3.5 text-yellow-400" />;
      case 3: return <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />;
      default: return <Sun className="w-3.5 h-3.5 text-yellow-400" />;
    }
  };

  return (
    <header className="scada-panel border-b border-scada-border px-4 py-2 sticky top-0 z-40">
      <div className="max-w-[1700px] mx-auto space-y-2">
        
        {/* Üst Satır: Logo, 24h Saat & Durumlar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Sol: Başlık & Logo */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${isPumpRunning ? 'bg-cyan-950/60 border-cyan-500 text-cyan-400 shadow-cyan-900/50 shadow-md' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>
                <Activity className={`w-5 h-5 ${isPumpRunning ? 'animate-pulse' : ''}`} />
              </div>
              <span className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-scada-darkest ${isConnected && modbusStatus?.connected ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-bold tracking-wider uppercase text-slate-100 font-scada">
                  Metirius & Predixi SCADA Simülatörü
                </h1>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-600/50 font-mono">
                  DİNAMİK ÇOKLU İSTASYON
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Port 5020 | Slave ID 1..{stations?.length || 4} | Canlı Predixi CSV Entegrasyonu
              </p>
            </div>
          </div>

          {/* Orta: 24 Saatlik Simülasyon Saati & Durum Rozetleri */}
          <div className="flex items-center space-x-2 text-xs font-mono">
            {/* 24 Saat Simülasyon Saati */}
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded bg-slate-900/90 border border-cyan-500/50">
              {getPhaseIcon(simClock.phaseCode)}
              <span className="font-bold text-xs text-cyan-300">{simClock.timeStr || '14:30'}</span>
              <span className="text-[9px] text-amber-300 font-semibold uppercase">({simClock.phaseName || 'GÜNDÜZ'})</span>
              <span className="text-[9px] px-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                {simClock.speedMultiplier || 60}x
              </span>
            </div>

            {/* Bağlantı Rozetleri */}
            <div className={`hidden md:flex items-center space-x-1 px-2 py-1 rounded border text-[10px] ${isConnected ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' : 'bg-rose-950/40 border-rose-500/50 text-rose-300'}`}>
              <Wifi className="w-3 h-3" />
              <span>Soket: 4000</span>
            </div>

            <div className={`hidden md:flex items-center space-x-1 px-2 py-1 rounded border text-[10px] ${modbusStatus?.connected ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300' : 'bg-amber-950/40 border-amber-500/50 text-amber-300'}`}>
              <Cpu className="w-3 h-3" />
              <span>Modbus: 5020</span>
            </div>
          </div>

          {/* Sağ: Gerçek Saat & Acil Durdurma */}
          <div className="flex items-center space-x-2">
            <div className="hidden lg:flex items-center space-x-1 text-slate-400 text-[11px] font-mono bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{realTime.toLocaleTimeString([], { hour12: false })}</span>
            </div>

            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center space-x-1 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 text-white font-bold text-[10px] px-3 py-1.5 rounded shadow border border-red-500 active:scale-95"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>ACİL DURDUR</span>
              </button>
            ) : (
              <div className="flex items-center space-x-1 bg-red-950 p-0.5 rounded border border-red-500">
                <span className="text-[9px] text-red-200 px-1 font-bold">Durdur?</span>
                <button onClick={handleStopClick} className="bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">EVET</button>
                <button onClick={() => setShowConfirm(false)} className="bg-slate-700 text-slate-200 text-[9px] px-1.5 py-0.5 rounded">İPTAL</button>
              </div>
            )}
          </div>

        </div>

        {/* Alt Satır: DİNAMİK İSTASYON SEÇİM SEKMELERİ & YENİ EKLE BUTONU */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 overflow-x-auto pb-0.5 gap-2">
          
          <div className="flex items-center space-x-2 overflow-x-auto">
            <span className="text-[10px] text-slate-400 font-mono font-bold flex items-center space-x-1 shrink-0">
              <Radio className="w-3 h-3 text-cyan-400" />
              <span>İSTASYONLAR:</span>
            </span>

            <div className="flex items-center space-x-1.5 shrink-0">
              {(stations || []).map((st) => {
                const sid = st.slaveId || st.slave_id;
                const isSelected = sid === activeSlaveId;
                const isRunning = st.kuyu?.measurements?.statusCode === 1 || (st.kuyu?.setpoints?.pumpRunning ?? true);

                return (
                  <button
                    key={sid}
                    onClick={() => onSelectStation(sid)}
                    className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-900/90 to-slate-900 text-cyan-200 border-cyan-400 shadow-md shadow-cyan-950/80'
                        : 'bg-slate-900/70 hover:bg-slate-800/80 text-slate-300 border-slate-700/60'
                    }`}
                  >
                    <Droplet className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>{st.name}</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800">
                      ID: {sid}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* ➕ YENİ İSTASYON EKLE BUTONU */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-mono font-bold transition shrink-0 shadow-md shadow-cyan-950/50 border border-cyan-400"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>YENİ İSTASYON EKLE</span>
          </button>

        </div>

      </div>
    </header>
  );
}
