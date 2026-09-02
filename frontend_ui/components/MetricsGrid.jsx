import React from 'react';
import { Gauge, Waves, ArrowUpRight, Zap, Flame, BatteryCharging, Radio, Cpu, Droplets, Layers } from 'lucide-react';

export default function MetricsGrid({ telemetry, kuyuData, terfiData }) {
  const k = kuyuData || telemetry?.kuyu?.measurements || telemetry?.measurements || {
    pressure: 3.66,
    flow: 24.83,
    wellLevel: 92.00,
    pumpDepth: 112.30,
    power: 15.11,
    iL1: 25.36,
    motorTemp: 23.0,
    voltage: 411.3,
  };

  const t = terfiData || telemetry?.terfi?.measurements || {
    tankLevel: 0.95,
    pumpingHead: 161.85,
    systemEff: 75.43,
    powerPerM3: 0.609,
    cityDemandFlow: 22.5,
  };

  const cards = [
    {
      title: 'TERFİ DEPO SEVİYESİ',
      value: (t.tankLevel || 0).toFixed(2),
      unit: 'mss',
      subText: `Şehir Tüketim: ${(t.cityDemandFlow || 22.5).toFixed(1)} m³/h`,
      icon: Droplets,
      color: 'text-cyan-300',
      borderGlow: 'border-cyan-500/40',
      bgGlow: 'from-cyan-950/40 to-slate-900/70',
      tag: 'DEPO',
    },
    {
      title: 'KUYU BASINCI (P)',
      value: (k.pressure || 0).toFixed(2),
      unit: 'Bar',
      subText: 'Çıkış Basınç Transmitteri',
      icon: Gauge,
      color: 'text-cyan-400',
      borderGlow: 'border-cyan-500/30',
      bgGlow: 'from-cyan-950/30 to-slate-900/60',
      tag: 'PT-101',
    },
    {
      title: 'KUYU DEBİSİ (Q)',
      value: (k.flow || 0).toFixed(1),
      unit: 'm³/h',
      subText: 'Elektromanyetik Debi Metre',
      icon: Waves,
      color: 'text-emerald-400',
      borderGlow: 'border-emerald-500/30',
      bgGlow: 'from-emerald-950/30 to-slate-900/60',
      tag: 'FT-101',
    },
    {
      title: 'KUYU SU DERİNLİĞİ',
      value: (k.wellLevel || 92.0).toFixed(1),
      unit: 'm',
      subText: `Pompa Kotu: ${(k.pumpDepth || 112.3).toFixed(1)} m`,
      icon: Layers,
      color: 'text-sky-400',
      borderGlow: 'border-sky-500/30',
      bgGlow: 'from-sky-950/30 to-slate-900/60',
      tag: 'KUYU',
    },
    {
      title: 'ELEKTRİK GÜCÜ',
      value: (k.power || 15.11).toFixed(2),
      unit: 'kW',
      subText: '3-Faz Aktif Güç Tüketimi',
      icon: Zap,
      color: 'text-amber-400',
      borderGlow: 'border-amber-500/30',
      bgGlow: 'from-amber-950/30 to-slate-900/60',
      tag: 'GÜÇ',
    },
    {
      title: 'SİSTEM VERİMİ (η)',
      value: (t.systemEff || 75.43).toFixed(1),
      unit: '%',
      subText: `Basma H: ${(t.pumpingHead || 161.85).toFixed(1)} m`,
      icon: BatteryCharging,
      color: t.systemEff > 70 ? 'text-emerald-400' : 'text-amber-400',
      borderGlow: t.systemEff > 70 ? 'border-emerald-500/40' : 'border-amber-500/30',
      bgGlow: 'from-emerald-950/30 to-slate-900/60',
      tag: 'VERİM',
    },
    {
      title: 'HAT AKIMI (3-FAZ)',
      value: (k.iL1 || 25.36).toFixed(1),
      unit: 'Amper',
      subText: `Voltaj: ${(k.vL1 || 411.3).toFixed(0)} V (L1)`,
      icon: Radio,
      color: 'text-purple-400',
      borderGlow: 'border-purple-500/30',
      bgGlow: 'from-purple-950/30 to-slate-900/60',
      tag: 'ELEKTRİK',
    },
    {
      title: 'ÖZGÜL ENERJİ',
      value: (t.powerPerM3 || 0.609).toFixed(3),
      unit: 'kWh/m³',
      subText: 'Metreküp Başına Güç',
      icon: Cpu,
      color: 'text-teal-400',
      borderGlow: 'border-teal-500/30',
      bgGlow: 'from-teal-950/30 to-slate-900/60',
      tag: 'VERİMLİLİK',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`scada-panel rounded-xl p-3 border bg-gradient-to-b ${card.bgGlow} ${card.borderGlow} flex flex-col justify-between transition-all hover:scale-[1.02]`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-slate-400">
                {card.tag}
              </span>
              <Icon className={`w-3.5 h-3.5 ${card.color}`} />
            </div>

            <div className="my-1">
              <div className="text-[10px] text-slate-400 font-bold tracking-tight truncate">
                {card.title}
              </div>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className={`text-xl font-bold font-mono ${card.color} tracking-tight`}>
                  {card.value}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {card.unit}
                </span>
              </div>
            </div>

            <div className="text-[9px] text-slate-500 font-mono truncate pt-1 border-t border-slate-800/80">
              {card.subText}
            </div>
          </div>
        );
      })}
    </div>
  );
}
