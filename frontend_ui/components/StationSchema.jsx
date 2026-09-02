import React from 'react';
import { Eye, Droplets, Zap, Gauge, Thermometer, Radio } from 'lucide-react';

export default function StationSchema({ telemetry, kuyuData, terfiData, clock }) {
  const k = kuyuData || telemetry?.kuyu?.measurements || telemetry?.measurements || {
    pressure: 3.66,
    flow: 24.83,
    wellLevel: 92.00,
    pumpDepth: 112.30,
    power: 15.11,
    iL1: 25.36,
    vL1: 411.3,
    motorTemp: 23.0,
    cabinetTemp: 53.0,
    outdoorTemp: 25.6,
    waterTemp: 16.7,
  };

  const t = terfiData || telemetry?.terfi?.measurements || {
    tankLevel: 0.95,
    inflowHeight: 3.10,
    pumpingHead: 161.85,
    systemEff: 75.43,
    powerPerM3: 0.609,
    cityDemandFlow: 22.5,
    totalFlowM3: 1090501,
    totalEnergyKwh: 761876,
  };

  const isRunning = telemetry?.setpoints?.pumpRunning;
  const simClock = clock || telemetry?.clock || { timeStr: '14:30', phaseName: 'GÜNDÜZ' };

  // Su seviyesi SVG piksel hesapları
  // Tank: 0..3.80 mss -> SVG y yüksekliği
  const tankWaterHeight = Math.min(50, Math.max(5, (t.tankLevel / 3.5) * 50));
  const tankWaterY = 55 - tankWaterHeight;

  // Kuyu: 88..105 m -> SVG kuyu su seviyesi
  const wellWaterY = Math.min(190, Math.max(120, 120 + ((k.wellLevel - 88) / 20) * 70));

  return (
    <div className="scada-panel rounded-xl p-4 border border-scada-border h-full flex flex-col justify-between">
      
      {/* Şema Başlığı */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-scada-border">
        <div className="flex items-center space-x-2">
          <Eye className="w-5 h-5 text-cyan-400" />
          <h2 className="font-bold text-sm uppercase tracking-wider text-slate-100 font-scada">
            Kuyu & Terfi P&ID Süreç Şeması (Metirius Well Pro)
          </h2>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="text-amber-300 font-bold">🕒 {simClock.timeStr} ({simClock.phaseName})</span>
          <span className={`px-2 py-0.5 rounded font-bold ${isRunning ? 'bg-emerald-950 text-emerald-300 border border-emerald-500' : 'bg-rose-950 text-rose-300 border border-rose-500'}`}>
            {isRunning ? 'POMPA: AKTİF' : 'POMPA: KAPALI'}
          </span>
        </div>
      </div>

      {/* SVG Animasyonlu SCADA P&ID Şeması */}
      <div className="flex-1 w-full flex items-center justify-center p-1 bg-slate-950/70 rounded-lg border border-slate-900 overflow-hidden">
        <svg
          viewBox="0 0 820 280"
          className="w-full h-auto max-h-[300px] select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Su Akış Gradients */}
            <linearGradient id="waterFlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#00ff88" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#00d2ff" stopOpacity="0.8" />
            </linearGradient>

            {/* Kuyu Yeraltı Su Gradyanı */}
            <linearGradient id="groundWater" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(0, 160, 255, 0.4)" />
              <stop offset="100%" stopColor="rgba(0, 50, 120, 0.9)" />
            </linearGradient>

            {/* Terfi Deposu Su Gradyanı */}
            <linearGradient id="tankWaterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.95" />
            </linearGradient>
          </defs>

          {/* Zemin / Yeryüzü Çizgisi */}
          <line x1="10" y1="90" x2="810" y2="90" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
          <text x="20" y="82" fill="#64748b" fontSize="9" fontFamily="monospace">ZEMİN KOTU (0.00m)</text>

          {/* 1. KONTROL PANOSU (VFD Sürücü Kabini) */}
          <g transform="translate(15, 10)">
            <rect x="0" y="0" width="50" height="75" rx="3" fill="#1e293b" stroke="#00d2ff" strokeWidth="1.5" />
            <rect x="5" y="6" width="40" height="15" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
            <text x="25" y="16" textAnchor="middle" fill="#00d2ff" fontSize="7" fontFamily="monospace" fontWeight="bold">METIRIUS</text>
            <circle cx="25" cy="35" r="7" fill={isRunning ? '#10b981' : '#ef4444'} />
            <text x="25" y="38" textAnchor="middle" fill="#ffffff" fontSize="6" fontWeight="bold">VFD</text>
            <text x="25" y="60" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="monospace">PANO 53°C</text>
          </g>

          {/* 2. DERİN KUYU & DALGIÇ POMPA */}
          <g transform="translate(85, 90)">
            {/* Kuyu Sondaj Borusu */}
            <rect x="15" y="0" width="40" height="180" fill="#0b1320" stroke="#475569" strokeWidth="2" />
            
            {/* Yeraltı Suyu */}
            <rect x="16" y={wellWaterY - 90} width="38" height={270 - wellWaterY} fill="url(#groundWater)" />

            {/* Kuyu Su Seviyesi Çizgisi & Kotu */}
            <line x1="0" y1={wellWaterY - 90} x2="70" y2={wellWaterY - 90} stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2 2" />
            <text x="75" y={wellWaterY - 87} fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="bold">
              ▼ {k.wellLevel.toFixed(1)} m
            </text>

            {/* Dalgıç Pompa Gövdesi */}
            <rect x="22" y="130" width="26" height="40" rx="3" fill="#334155" stroke={isRunning ? '#00ff88' : '#64748b'} strokeWidth="1.5" />
            <text x="35" y="148" textAnchor="middle" fill="#ffffff" fontSize="7" fontFamily="monospace" fontWeight="bold">POMPA</text>
            <text x="35" y="160" textAnchor="middle" fill="#94a3b8" fontSize="6" fontFamily="monospace">112.3m</text>

            {/* Pompa İmpeller Dönüş Efekti */}
            <circle cx="35" cy="120" r="6" fill="none" stroke={isRunning ? '#00ff88' : '#64748b'} strokeWidth="1.5" strokeDasharray="3 3" className={isRunning ? 'animate-spin' : ''} />

            {/* Kuyu İçi Basma Borusu */}
            <line x1="35" y1="0" x2="35" y2="120" stroke="#00d2ff" strokeWidth="4" />
          </g>

          {/* 3. YERÜSTÜ İLETİM BORU HATTI */}
          <path
            d="M 120 90 L 120 50 L 320 50 L 480 50 L 620 20"
            fill="none"
            stroke="#1e3a5f"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Akan Su Efekti */}
          <path
            d="M 120 90 L 120 50 L 320 50 L 480 50 L 620 20"
            fill="none"
            stroke="url(#waterFlow)"
            strokeWidth="4"
            strokeDasharray={isRunning ? "8 6" : "none"}
            strokeDashoffset={isRunning ? "-20" : "0"}
            className={isRunning ? "animate-pulse" : ""}
          />

          {/* Basınç Transmitteri (PT-101) */}
          <g transform="translate(180, 20)">
            <line x1="20" y1="30" x2="20" y2="10" stroke="#00d2ff" strokeWidth="1.5" />
            <rect x="-5" y="-18" width="50" height="26" rx="3" fill="#090e17" stroke="#00d2ff" strokeWidth="1.2" />
            <text x="20" y="-9" textAnchor="middle" fill="#00d2ff" fontSize="7" fontFamily="monospace">BASINÇ</text>
            <text x="20" y="2" textAnchor="middle" fill="#ffffff" fontSize="9" fontFamily="monospace" fontWeight="bold">{k.pressure.toFixed(2)} Bar</text>
          </g>

          {/* Debi Metresi (FT-101) */}
          <g transform="translate(265, 20)">
            <line x1="25" y1="30" x2="25" y2="10" stroke="#00ff88" strokeWidth="1.5" />
            <rect x="-2" y="-18" width="54" height="26" rx="3" fill="#090e17" stroke="#00ff88" strokeWidth="1.2" />
            <text x="25" y="-9" textAnchor="middle" fill="#00ff88" fontSize="7" fontFamily="monospace">DEBİ</text>
            <text x="25" y="2" textAnchor="middle" fill="#ffffff" fontSize="9" fontFamily="monospace" fontWeight="bold">{k.flow.toFixed(1)} m³/h</text>
          </g>

          {/* Çekvalf & Vana */}
          <g transform="translate(355, 38)">
            <polygon points="0,5 15,12 15,-2" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
            <polygon points="30,5 15,12 15,-2" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
            <circle cx="15" cy="5" r="3" fill="#00ff88" />
          </g>

          {/* 4. TERFİ SU DEPOSU & GİRİŞ KOTU (AMAS TERFİ P1) */}
          <g transform="translate(630, 10)">
            {/* Depo Beton Duvarları */}
            <rect x="0" y="0" width="130" height="60" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
            
            {/* Depodaki Canlı Su Havuzu */}
            <rect x="2" y={tankWaterY} width="126" height={tankWaterHeight} rx="2" fill="url(#tankWaterGrad)" />

            {/* Su Seviyesi Yazısı & Kotu */}
            <line x1="-15" y1="10" x2="5" y2="10" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="-18" y="13" textAnchor="end" fill="#38bdf8" fontSize="8" fontFamily="monospace">▲ 3.10 mss</text>

            <text x="65" y="32" textAnchor="middle" fill="#ffffff" fontSize="11" fontFamily="monospace" fontWeight="bold">
              {t.tankLevel.toFixed(2)} mss
            </text>
            <text x="65" y="44" textAnchor="middle" fill="#bae6fd" fontSize="7" fontFamily="monospace">
              AMAS TERFİ DEPOSU
            </text>

            {/* Şehre Çıkış Borusu (Tüketim) */}
            <path d="M 130 50 L 165 50" fill="none" stroke="#38bdf8" strokeWidth="4" strokeDasharray="3 3" />
            <text x="135" y="42" fill="#38bdf8" fontSize="7" fontFamily="monospace">ŞEBEKE</text>
            <text x="135" y="62" fill="#38bdf8" fontSize="7" fontFamily="monospace">{t.cityDemandFlow.toFixed(1)}m³/h</text>
          </g>

          {/* 5. METIRIUS BİLGİ & 3-FAZ ELEKTRİK ANALİZÖR PANELİ */}
          <g transform="translate(230, 100)">
            <rect x="0" y="0" width="550" height="165" rx="6" fill="#090e17" stroke="#1e334a" strokeWidth="1.2" />

            {/* Sol Sütun: 3-Faz Elektrik & Güç */}
            <text x="15" y="20" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">3-FAZ ENERJİ ANALİZÖRÜ</text>
            <line x1="15" y1="26" x2="250" y2="26" stroke="#1e293b" strokeWidth="1" />
            
            <text x="15" y="44" fill="#94a3b8" fontSize="10" fontFamily="monospace">L1 Voltaj / Akım:</text>
            <text x="140" y="44" fill="#00d2ff" fontSize="10" fontFamily="monospace" fontWeight="bold">{k.vL1.toFixed(1)} V | {k.iL1.toFixed(2)} A</text>

            <text x="15" y="62" fill="#94a3b8" fontSize="10" fontFamily="monospace">L2 Voltaj / Akım:</text>
            <text x="140" y="62" fill="#00d2ff" fontSize="10" fontFamily="monospace" fontWeight="bold">{k.vL2.toFixed(1)} V | {k.iL2.toFixed(2)} A</text>

            <text x="15" y="80" fill="#94a3b8" fontSize="10" fontFamily="monospace">L3 Voltaj / Akım:</text>
            <text x="140" y="80" fill="#00d2ff" fontSize="10" fontFamily="monospace" fontWeight="bold">{k.vL3.toFixed(1)} V | {k.iL3.toFixed(2)} A</text>

            <text x="15" y="98" fill="#94a3b8" fontSize="10" fontFamily="monospace">Şebeke Frekansı:</text>
            <text x="140" y="98" fill="#ffb703" fontSize="10" fontFamily="monospace" fontWeight="bold">{k.frequency.toFixed(2)} Hz</text>

            <text x="15" y="116" fill="#94a3b8" fontSize="10" fontFamily="monospace">Toplam Aktif Güç:</text>
            <text x="140" y="116" fill="#00ff88" fontSize="11" fontFamily="monospace" fontWeight="bold">{k.power.toFixed(2)} kW</text>

            <text x="15" y="136" fill="#94a3b8" fontSize="9" fontFamily="monospace">Sıcaklıklar:</text>
            <text x="80" y="136" fill="#e2e8f0" fontSize="9" fontFamily="monospace">Motor: {k.motorTemp.toFixed(1)}°C | Pano: {k.cabinetTemp.toFixed(1)}°C | Dış: {k.outdoorTemp.toFixed(1)}°C</text>

            {/* Sağ Sütun: Hidrolik & Verimlilik & Sayaçlar */}
            <text x="280" y="20" fill="#00ff88" fontSize="10" fontFamily="monospace" fontWeight="bold">VERİMLİLİK & SAYAÇLAR</text>
            <line x1="280" y1="26" x2="535" y2="26" stroke="#1e293b" strokeWidth="1" />

            <text x="280" y="44" fill="#94a3b8" fontSize="10" fontFamily="monospace">Basma Yüksekliği (H):</text>
            <text x="440" y="44" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">{t.pumpingHead.toFixed(2)} m</text>

            <text x="280" y="62" fill="#94a3b8" fontSize="10" fontFamily="monospace">Hidrolik Verim:</text>
            <text x="440" y="62" fill="#00ff88" fontSize="10" fontFamily="monospace" fontWeight="bold">%{t.hydraulicEff.toFixed(2)}</text>

            <text x="280" y="80" fill="#94a3b8" fontSize="10" fontFamily="monospace">Sistem Verimi (η):</text>
            <text x="440" y="80" fill="#00ff88" fontSize="11" fontFamily="monospace" fontWeight="bold">%{t.systemEff.toFixed(2)}</text>

            <text x="280" y="98" fill="#94a3b8" fontSize="10" fontFamily="monospace">Özgül Güç (Power/m³):</text>
            <text x="440" y="98" fill="#ffb703" fontSize="10" fontFamily="monospace" fontWeight="bold">{t.powerPerM3.toFixed(3)} kW</text>

            <text x="280" y="118" fill="#94a3b8" fontSize="9" fontFamily="monospace">Toplam İletilen Su:</text>
            <text x="420" y="118" fill="#bae6fd" fontSize="10" fontFamily="monospace" fontWeight="bold">{t.totalFlowM3.toLocaleString()} m³</text>

            <text x="280" y="136" fill="#94a3b8" fontSize="9" fontFamily="monospace">Toplam Elektrik:</text>
            <text x="420" y="136" fill="#fde047" fontSize="10" fontFamily="monospace" fontWeight="bold">{t.totalEnergyKwh.toLocaleString()} kWh</text>

            <text x="280" y="152" fill="#64748b" fontSize="8" fontFamily="monospace">Çalışma Süresi: {t.runtimeHours.toFixed(1)} Saat | Start Sayısı: {t.runCount}</text>
          </g>

        </svg>
      </div>
    </div>
  );
}
