import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Gauge as GaugeIcon } from 'lucide-react';

function createGaugeOption(value, min, max, unit, name, colorRanges) {
  return {
    backgroundColor: 'transparent',
    series: [
      {
        type: 'gauge',
        startAngle: 210,
        endAngle: -30,
        min: min,
        max: max,
        radius: '95%',
        center: ['50%', '55%'],
        splitNumber: 5,
        axisLine: {
          lineStyle: {
            width: 8,
            color: colorRanges,
          },
        },
        pointer: {
          icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
          length: '65%',
          width: 5,
          offsetCenter: [0, '-10%'],
          itemStyle: {
            color: 'auto',
          },
        },
        axisTick: {
          length: 4,
          lineStyle: { color: '#475569', width: 1 },
        },
        splitLine: {
          length: 8,
          lineStyle: { color: '#64748b', width: 1.5 },
        },
        axisLabel: {
          color: '#94a3b8',
          fontSize: 9,
          fontFamily: 'monospace',
          distance: 12,
        },
        title: {
          offsetCenter: [0, '70%'],
          fontSize: 10,
          color: '#94a3b8',
          fontWeight: 600,
        },
        detail: {
          fontSize: 14,
          offsetCenter: [0, '35%'],
          valueAnimation: true,
          formatter: (val) => `${val.toFixed(1)} ${unit}`,
          color: '#ffffff',
          fontFamily: 'monospace',
          fontWeight: 'bold',
        },
        data: [
          {
            value: value || 0,
            name: name,
          },
        ],
      },
    ],
  };
}

export default function GaugeCluster({ telemetry }) {
  const m = telemetry?.measurements || {
    current: 0,
    pElectric: 0,
    pressure: 0,
    temperature: 25,
    efficiency: 0,
  };

  // 1. Sistem Verimi Gauge (0 - 100 %)
  const efficiencyOption = createGaugeOption(m.efficiency, 0, 100, '%', 'SİSTEM VERİMİ', [
    [0.5, '#64748b'],  // %0-50 Düşük / Başlangıç
    [0.7, '#ffb703'],  // %50-70 Orta Verim
    [1.0, '#00ff88'],  // %70-100 Yüksek / Optimum Verim
  ]);

  // 2. Akım Gauge (0 - 60 A)
  const currentOption = createGaugeOption(m.current, 0, 60, 'A', 'HAT AKIMI', [
    [0.7, '#00ff88'], // 0-42 A Normal
    [0.85, '#ffb703'], // 42-51 A Uyarı
    [1, '#ff3366'],   // 51-60 A Aşırı Yük
  ]);

  // 3. Güç Gauge (0 - 35 kW)
  const powerOption = createGaugeOption(m.pElectric, 0, 35, 'kW', 'ELEKTRİK GÜÇ', [
    [0.75, '#00d2ff'],
    [0.9, '#ffb703'],
    [1, '#ff3366'],
  ]);

  // 4. Sıcaklık Gauge (0 - 100 °C)
  const tempOption = createGaugeOption(m.temperature, 0, 100, '°C', 'MOTOR SICAKLIK', [
    [0.6, '#38bdf8'],  // 0-60 C Soğuk/Ilık
    [0.8, '#ffb703'],  // 60-80 C Normal Isı
    [1, '#ff3366'],    // 80-100 C Aşırı Isınma
  ]);

  return (
    <div className="scada-panel rounded-xl p-4 border border-scada-border h-full flex flex-col justify-between">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-scada-border">
        <div className="flex items-center space-x-2">
          <GaugeIcon className="w-5 h-5 text-cyan-400" />
          <h2 className="font-bold text-sm uppercase tracking-wider text-slate-100 font-scada">
            Endüstriyel Kadran Göstergeleri
          </h2>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">Analog Gauges (Real-Time)</span>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1">
        {/* Sistem Verimi Göstergesi */}
        <div className="bg-slate-900/80 rounded-lg p-2 border border-slate-800 flex flex-col items-center justify-center">
          <div className="h-[135px] w-full">
            <ReactECharts option={efficiencyOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* Akım Göstergesi */}
        <div className="bg-slate-900/80 rounded-lg p-2 border border-slate-800 flex flex-col items-center justify-center">
          <div className="h-[135px] w-full">
            <ReactECharts option={currentOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* Güç Göstergesi */}
        <div className="bg-slate-900/80 rounded-lg p-2 border border-slate-800 flex flex-col items-center justify-center">
          <div className="h-[135px] w-full">
            <ReactECharts option={powerOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* Sıcaklık Göstergesi */}
        <div className="bg-slate-900/80 rounded-lg p-2 border border-slate-800 flex flex-col items-center justify-center">
          <div className="h-[135px] w-full">
            <ReactECharts option={tempOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
