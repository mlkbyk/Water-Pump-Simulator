import React, { useState } from 'react';
import { X, PlusCircle, Droplets, Zap, Gauge, Waves, ArrowDownCircle, CheckCircle, ShieldCheck } from 'lucide-react';

export default function AddStationModal({ isOpen, onClose, onAddStation, existingStationsCount }) {
  const nextNumber = existingStationsCount + 16;
  const nextDid = 12100 + existingStationsCount + 1;

  const [formData, setFormData] = useState({
    name: `AMAS K${nextNumber} (Yeni Kuyu)`,
    type: 'kuyu',
    did: nextDid,
    pumpDepth: 85.0,
    staticLevel: 65.0,
    pressure: 3.80,
    flow: 28.0,
    power: 18.5,
    tankStartLevel: 0.60,
    tankStopLevel: 3.10
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    onAddStation(formData, (res) => {
      setIsSubmitting(false);
      if (res?.success) {
        setSuccessMsg(`İstasyon (${formData.name}) ve Predixi CSV dosyası başarıyla oluşturuldu!`);
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 1200);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="scada-panel border border-cyan-500/50 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Kapat Butonu */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Başlık */}
        <div className="flex items-center space-x-3 pb-4 mb-4 border-b border-slate-700">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 font-scada uppercase tracking-wider">
              Yeni Kuyu / Terfi İstasyonu Ekle
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Otomatik Modbus Slave ID & Predixi CSV Üretici Sihirbazı
            </p>
          </div>
        </div>

        {successMsg ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-400 animate-bounce" />
            <h3 className="text-sm font-bold text-emerald-300 font-mono">{successMsg}</h3>
            <p className="text-xs text-slate-400 font-mono">İstasyon listesi güncelleniyor...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* İstasyon Adı & Tip */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1">İSTASYON ADI</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono focus:border-cyan-400 focus:outline-none"
                  placeholder="Örn: AMAS K19 (Doğu Kuyusu)"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1">İSTASYON TİPİ</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono focus:border-cyan-400 focus:outline-none"
                >
                  <option value="kuyu">💧 Derin Su Kuyusu</option>
                  <option value="terfi">⚡ Terfi & Basınçlandırma</option>
                </select>
              </div>
            </div>

            {/* Predixi DID & Derinlik */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1">PREDIXI DID</label>
                <input
                  type="number"
                  required
                  value={formData.did}
                  onChange={(e) => setFormData({ ...formData, did: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1">KUYU DERİNLİĞİ (m)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.pumpDepth}
                  onChange={(e) => setFormData({ ...formData, pumpDepth: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1">STATİK SU KOTU (m)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.staticLevel}
                  onChange={(e) => setFormData({ ...formData, staticLevel: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Basınç, Debi & Güç */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1">HEDEF BASINÇ (Bar)</label>
                <input
                  type="number"
                  step="0.05"
                  required
                  value={formData.pressure}
                  onChange={(e) => setFormData({ ...formData, pressure: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1">HEDEF DEBİ (m³/h)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={formData.flow}
                  onChange={(e) => setFormData({ ...formData, flow: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-emerald-300 font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1">MOTOR GÜCÜ (kW)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={formData.power}
                  onChange={(e) => setFormData({ ...formData, power: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Bilgi Kutucuğu */}
            <div className="bg-cyan-950/40 border border-cyan-700/50 p-2.5 rounded-lg flex items-center space-x-2 text-[11px] text-cyan-200 font-mono">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                Yeni istasyon açıldığında otomatik olarak <strong>predixi_exports/</strong> klasörüne CSV dosyası oluşturulacak ve Modbus portunda (5020) yayına başlayacaktır.
              </span>
            </div>

            {/* Butonlar */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold transition"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-mono font-bold transition shadow-lg shadow-cyan-950 flex items-center space-x-1.5 disabled:opacity-50"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isSubmitting ? 'Oluşturuluyor...' : 'İSTASYONU OLUŞTUR & BAŞLAT'}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}

