import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { LineChart } from 'lucide-react';

export default function MultiAxisChart({ history = [] }) {
  const chartOption = useMemo(() => {
    const validHistory = history.length > 0 ? history : [
      { time: '14:30:00', pressure: 3.66, flow: 24.83, pElectric: 15.11, current: 25.36, head: 161.85, efficiency: 75.43 }
    ];

    const times = validHistory.map((h) => h.time);
    const pressures = validHistory.map((h) => Number(h.pressure ?? 0));
    const flows = validHistory.map((h) => Number(h.flow ?? 0));
    const powers = validHistory.map((h) => Number(h.pElectric ?? 0));
    const currents = validHistory.map((h) => Number(h.current ?? 0));
    const efficiencies = validHistory.map((h) => Number(h.efficiency ?? 0));

    return {
      backgroundColor: 'transparent',
      animation: false, // Gerçek zamanlı yüksek performans
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          lineStyle: { color: '#00d2ff', width: 1, type: 'dashed' },
        },
        backgroundColor: 'rgba(13, 21, 32, 0.95)',
        borderColor: '#1e334a',
        borderWidth: 1,
        textStyle: { color: '#e2e8f0', fontFamily: 'monospace', fontSize: 11 },
        padding: 8,
      },
      legend: {
        data: ['Basınç (Bar)', 'Debi (m³/h)', 'Elektriksel Güç (kW)', 'Hat Akımı (A)', 'Sistem Verimi (%)'],
        textStyle: { color: '#94a3b8', fontSize: 11 },
        top: 0,
        selected: {
          'Basınç (Bar)': true,
          'Debi (m³/h)': true,
          'Elektriksel Güç (kW)': true,
          'Hat Akımı (A)': true,
          'Sistem Verimi (%)': true,
        }
      },
      grid: {
        left: 65,
        right: 65,
        bottom: 25,
        top: 45,
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: times,
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#64748b', fontSize: 10, fontFamily: 'monospace' },
        splitLine: { show: true, lineStyle: { color: '#1e293b', type: 'dashed' } },
      },
      yAxis: [
        // Y0: Basınç (Sol)
        {
          type: 'value',
          name: 'Bar',
          position: 'left',
          min: 0,
          max: 8,
          nameTextStyle: { color: '#00d2ff', fontSize: 10 },
          axisLine: { show: true, lineStyle: { color: '#00d2ff' } },
          axisLabel: { color: '#00d2ff', fontSize: 10 },
          splitLine: { show: true, lineStyle: { color: 'rgba(30, 41, 59, 0.4)' } },
        },
        // Y1: Debi & Verim (Sol ofsetli)
        {
          type: 'value',
          name: 'm³/h | %',
          position: 'left',
          offset: 35,
          min: 0,
          max: 120,
          nameTextStyle: { color: '#00ff88', fontSize: 10 },
          axisLine: { show: true, lineStyle: { color: '#00ff88' } },
          axisLabel: { color: '#00ff88', fontSize: 10 },
          splitLine: { show: false },
        },
        // Y2: Güç (Sağ)
        {
          type: 'value',
          name: 'kW',
          position: 'right',
          min: 0,
          max: 40,
          nameTextStyle: { color: '#ffb703', fontSize: 10 },
          axisLine: { show: true, lineStyle: { color: '#ffb703' } },
          axisLabel: { color: '#ffb703', fontSize: 10 },
          splitLine: { show: false },
        },
        // Y3: Akım (Sağ ofsetli)
        {
          type: 'value',
          name: 'A',
          position: 'right',
          offset: 35,
          min: 0,
          max: 60,
          nameTextStyle: { color: '#a855f7', fontSize: 10 },
          axisLine: { show: true, lineStyle: { color: '#a855f7' } },
          axisLabel: { color: '#a855f7', fontSize: 10 },
          splitLine: { show: false },
        }
      ],
      series: [
        {
          name: 'Basınç (Bar)',
          type: 'line',
          yAxisIndex: 0,
          data: pressures,
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 2.5, color: '#00d2ff' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(0, 210, 255, 0.2)' },
                { offset: 1, color: 'rgba(0, 210, 255, 0.0)' }
              ]
            }
          }
        },
        {
          name: 'Debi (m³/h)',
          type: 'line',
          yAxisIndex: 1,
          data: flows,
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 2.5, color: '#00ff88' },
        },
        {
          name: 'Elektriksel Güç (kW)',
          type: 'line',
          yAxisIndex: 2,
          data: powers,
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 2, color: '#ffb703' },
        },
        {
          name: 'Hat Akımı (A)',
          type: 'line',
          yAxisIndex: 3,
          data: currents,
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 2, color: '#a855f7' },
        },
        {
          name: 'Sistem Verimi (%)',
          type: 'line',
          yAxisIndex: 1,
          data: efficiencies,
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 2, color: '#34d399', type: 'dashed' },
        }
      ]
    };
  }, [history]);

  return (
    <div className="scada-panel rounded-xl p-4 border border-scada-border h-full flex flex-col justify-between">
      <div className="flex items-center justify-between pb-2 mb-1 border-b border-scada-border">
        <div className="flex items-center space-x-2">
          <LineChart className="w-5 h-5 text-cyan-400" />
          <h2 className="font-bold text-sm uppercase tracking-wider text-slate-100 font-scada">
            Canlı Süreç Eğrileri (Çoklu Y-Eksenli SCADA Grafiği)
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <span className="flex items-center space-x-1 text-[11px] text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>CANLI ({history.length} Nokta)</span>
          </span>
        </div>
      </div>

      <div className="w-full h-[320px] min-h-[300px]">
        <ReactECharts
          option={chartOption}
          style={{ height: '320px', width: '100%' }}
          notMerge={true}
          lazyUpdate={true}
        />
      </div>
    </div>
  );
}
