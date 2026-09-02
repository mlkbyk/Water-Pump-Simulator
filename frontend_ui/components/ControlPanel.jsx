import React, { useState, useEffect } from 'react';
import { Sliders, Power, Send, Gauge, Waves, CheckCircle2, Zap, Percent, FastForward, Droplets, ChevronLeft, ChevronRight, Radio } from 'lucide-react';

export default function ControlPanel({ telemetry, clock, activeStation, onUpdateSetpoints, onSetPump, onSetMode, onSetSpeed }) {
  const currentSetpoints = telemetry?.setpoints || {
    pressure: 3.66,
    flow: 24.83,
    pumpRunning: true,
    mode: 'AUTO',
    efficiency: 75.43,
    tankStartLevel: 0.60,
    tankStopLevel: 3.10,
    speedMultiplier: 60,
  };

  const [pressureInput, setPressureInput] = useState(currentSetpoints.pressure);
  const [flowInput, setFlowInput] = useState(currentSetpoints.flow);
  const [efficiencyInput, setEfficiencyInput] = useState(currentSetpoints.efficiency || 75.43);
  const [tankStartInput, setTankStartInput] = useState(currentSetpoints.tankStartLevel || 0.60);
  const [tankStopInput, setTankStopInput] = useState(currentSetpoints.tankStopLevel || 3.10);
  const [speedInput, setSpeedInput] = useState(currentSetpoints.speedMultiplier || 60);
  const [isAutoMode, setIsAutoMode] = useState(currentSetpoints.mode === 'AUTO');
  const [isPumpActive, setIsPumpActive] = useState(currentSetpoints.pumpRunning);
  const [isSaved, setIsSaved] = useState(false);

  const stName = activeStation?.name || "AMAS K16 (Derin Kuyu)";
  const stDid = activeStation?.did || 12101;
  const stSlaveId = activeStation?.slaveId || 1;

  useEffect(() => {
    setPressureInput(currentSetpoints.pressure);
    setFlowInput(currentSetpoints.flow);
    setEfficiencyInput(currentSetpoints.efficiency || 75.43);
    setTankStartInput(currentSetpoints.tankStartLevel || 0.60);
    setTankStopInput(currentSetpoints.tankStopLevel || 3.10);
    setSpeedInput(currentSetpoints.speedMultiplier || 60);
    setIsAutoMode(currentSetpoints.mode === 'AUTO');
    setIsPumpActive(currentSetpoints.pumpRunning);
  }, [
    currentSetpoints.pressure,
    currentSetpoints.flow,
    currentSetpoints.efficiency,
    currentSetpoints.tankStartLevel,
    currentSetpoints.tankStopLevel,
    currentSetpoints.speedMultiplier,
    currentSetpoints.mode,
    currentSetpoints.pumpRunning
  ]);

  const handleApply = () => {
    onUpdateSetpoints({
      pressure: parseFloat(pressureInput),
      flow: parseFloat(flowInput),
      pumpRunning: isPumpActive,
      mode: isAutoMode ? 'AUTO' : 'MANUAL',
      targetEfficiency: parseFloat(efficiencyInput),
      tankStartLevel: parseFloat(tankStartInput),
      tankStopLevel: parseFloat(tankStopInput),
      speedMultiplier: parseInt(speedInput, 10),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 1500);
  };

  const toggleMode = () => {
    const newMode = !isAutoMode;
    setIsAutoMode(newMode);
    if (onSetMode) onSetMode(newMode ? 1 : 0);
    else {
      onUpdateSetpoints({ mode: newMode ? 'AUTO' : 'MANUAL' });
    }
  };

  const togglePump = () => {
    const newState = !isPumpActive;
    setIsPumpActive(newState);
    onSetPump(newState);
  };

  const handleSpeedPreset = (spd) => {
    setSpeedInput(spd);
    if (onSetSpeed) onSetSpeed(spd);
    else onUpdateSetpoints({ speedMultiplier: spd });
  };

  return (
    <div className="scada-panel rounded-xl p-4 border border-scada-border h-full flex flex-col justify-between overflow-y-auto">
      
      <div>
        {/* Panel Başlığı & Aktif İstasyon */}
        <div className="pb-2 mb-3 border-b border-scada-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h2 className="font-bold text-xs uppercase tracking-wider text-slate-100 font-scada">
                {stName}
              </h2>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 font-mono font-bold">
              ID: {stSlaveId} (DID: {stDid})
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
            Hedef İstasyon Ayarları ve Modbus Kontrolü
          </p>
        </div>

        {/* Metirius Tarzı: [ < manual/auto > ] ve [ on/off ] Anahtarları */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          
          {/* Mod Seçici (Manuel / Otomatik) */}
          <div className="bg-slate-900/90 border border-slate-700 p-2 rounded-lg flex flex-col items-center justify-center">
            <span className="text-[10px] font-mono text-slate-400 mb-1">ÇALIŞMA MODU</span>
            <button
              onClick={toggleMode}
              className="flex items-center space-x-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-cyan-500/50 text-cyan-300 font-mono text-xs font-bold transition-all"
            >
              <ChevronLeft className="w-3 h-3 text-cyan-400" />
              <span className={isAutoMode ? 'text-emerald-300 font-bold' : 'text-amber-300'}>
                {isAutoMode ? 'OTOMATİK' : 'MANUEL'}
              </span>
              <ChevronRight className="w-3 h-3 text-cyan-400" />
            </button>
          </div>

          {/* Pompa Aç/Kapa Anahtarı */}
          <div className="bg-slate-900/90 border border-slate-700 p-2 rounded-lg flex flex-col items-center justify-center">
            <span className="text-[10px] font-mono text-slate-400 mb-1">POMPA MOTORU</span>
            <button
              onClick={togglePump}
              className={`px-4 py-1 rounded font-bold text-xs transition-all border flex items-center space-x-1.5 ${
                isPumpActive
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-950'
                  : 'bg-slate-800 hover:bg-slate-700 text-rose-400 border-slate-600'
              }`}
            >
              <Power className="w-3 h-3" />
              <span>{isPumpActive ? 'ON (AÇIK)' : 'OFF (KAPALI)'}</span>
            </button>
          </div>
        </div>

        {/* 24 Saatlik Simülasyon Hızlandırıcı (1x - 300x) */}
        <div className="mb-3 bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-medium text-slate-300 flex items-center space-x-1">
              <FastForward className="w-3.5 h-3.5 text-cyan-400" />
              <span>24 Saat Hız Çarpanı</span>
            </label>
            <span className="text-xs font-bold font-mono text-cyan-300">{speedInput}x ({Math.round(1440 / speedInput)} dk / gün)</span>
          </div>

          <div className="grid grid-cols-4 gap-1 mb-1.5">
            {[1, 30, 60, 120].map((spd) => (
              <button
                key={spd}
                onClick={() => handleSpeedPreset(spd)}
                className={`py-1 rounded text-[10px] font-mono font-bold border transition ${
                  speedInput === spd
                    ? 'bg-cyan-600 text-white border-cyan-400'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {spd === 60 ? '60x (24dk)' : `${spd}x`}
              </button>
            ))}
          </div>
        </div>

        {/* Otomatik Depo Seviye Ayarları (Min Başlat & Max Durdur) */}
        <div className="mb-3 bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
          <div className="flex items-center space-x-1 mb-2">
            <Droplets className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] font-bold text-slate-300 font-mono">OTOMATİK DEPO SEVİYE AYARLARI</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Min Seviye */}
            <div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                <span>Başlat (Min):</span>
                <span className="font-bold text-cyan-300">{parseFloat(tankStartInput).toFixed(2)} mss</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.5"
                step="0.05"
                value={tankStartInput}
                onChange={(e) => setTankStartInput(e.target.value)}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Max Seviye */}
            <div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                <span>Durdur (Max):</span>
                <span className="font-bold text-emerald-300">{parseFloat(tankStopInput).toFixed(2)} mss</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="3.6"
                step="0.05"
                value={tankStopInput}
                onChange={(e) => setTankStopInput(e.target.value)}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>
          </div>
        </div>

        {/* Basınç, Debi ve Verim Sliderları */}
        <div className="space-y-2 mb-3">
          {/* Basınç */}
          <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center mb-1 text-[11px]">
              <span className="text-slate-300 font-mono flex items-center space-x-1">
                <Gauge className="w-3 h-3 text-cyan-400" />
                <span>Basınç Set:</span>
              </span>
              <span className="font-bold font-mono text-cyan-300">{parseFloat(pressureInput).toFixed(2)} Bar</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="6.0"
              step="0.05"
              value={pressureInput}
              onChange={(e) => setPressureInput(e.target.value)}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Debi */}
          <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center mb-1 text-[11px]">
              <span className="text-slate-300 font-mono flex items-center space-x-1">
                <Waves className="w-3 h-3 text-emerald-400" />
                <span>Debi Set:</span>
              </span>
              <span className="font-bold font-mono text-emerald-300">{parseFloat(flowInput).toFixed(1)} m³/h</span>
            </div>
            <input
              type="range"
              min="10.0"
              max="60.0"
              step="0.5"
              value={flowInput}
              onChange={(e) => setFlowInput(e.target.value)}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>

          {/* Verim */}
          <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center mb-1 text-[11px]">
              <span className="text-slate-300 font-mono flex items-center space-x-1">
                <Percent className="w-3 h-3 text-amber-400" />
                <span>Hedef Verim:</span>
              </span>
              <span className="font-bold font-mono text-amber-300">%{parseFloat(efficiencyInput).toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="40"
              max="95"
              step="1"
              value={efficiencyInput}
              onChange={(e) => setEfficiencyInput(e.target.value)}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>
        </div>

      </div>

      {/* Kaydet & Modbus'a Gönder Butonu */}
      <div className="pt-2 border-t border-scada-border">
        <button
          onClick={handleApply}
          className={`w-full py-2 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center space-x-1.5 border shadow-lg ${
            isSaved
              ? 'bg-emerald-600 border-emerald-400 text-white'
              : 'bg-cyan-600 hover:bg-cyan-500 border-cyan-400 text-slate-900'
          }`}
        >
          {isSaved ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>MODBUS'A YAZILDI (SLAVE {stSlaveId})</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>UYGULA ({stName.split(' ')[0]} - SLAVE {stSlaveId})</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
