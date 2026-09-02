"""
Predixi SCADA & IoT Platformu İçin Otomatik CSV Dışa Aktarıcı
Tanımlı her istasyon (DID) için Predixi'ye direkt yüklenebilecek CSV dosyaları üretir.
"""

import os
import csv
import sys
from datetime import datetime

# Windows konsolunda UTF-8 desteğini etkinleştir
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from simulation_engine.stations_config import load_stations
from simulation_engine.config import HOLDING_REGISTERS

# Predixi Standart Başlıkları
PREDIXI_FIELDNAMES = [
    "did", "name", "addr", "dataType", "factor", "func", "scanRate", "state", "info", "time", "timeCreated"
]

def export_all_predixi_csvs(output_dir: str = "predixi_exports"):
    """Tüm istasyonlar için Predixi formatında CSV dosyaları üretir."""
    os.makedirs(output_dir, exist_ok=True)
    created_files = []
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    stations = load_stations()

    for station in stations:
        did = station["did"]
        sname = station["name"]
        clean_name = sname.replace(" ", "_").replace("(", "").replace(")", "").replace("/", "_")
        filename = os.path.join(output_dir, f"predixi_import_DID_{did}_{clean_name}.csv")

        rows = []
        for addr, reg in HOLDING_REGISTERS.items():
            # Predixi dataType: 16 = Word (UInt16), 38 = UInt32
            dtype = 16
            scale_val = reg.get("scale", 1)
            
            # Predixi'de factor çarpan olarak uygulanır: 366 * 0.01 = 3.66 Bar
            if scale_val == 100:
                factor = 0.01
            elif scale_val == 10:
                factor = 0.1
            elif scale_val == 1000:
                factor = 0.001
            else:
                factor = 1

            rows.append({
                "did": did,
                "name": reg["name"],
                "addr": addr,
                "dataType": dtype,
                "factor": factor,
                "func": "03 Holding Register",
                "scanRate": 5000,
                "state": 10,
                "info": f"{reg['desc']} (Birim: {reg['unit']})",
                "time": now_str,
                "timeCreated": now_str
            })

        with open(filename, "w", encoding="utf-8-sig", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=PREDIXI_FIELDNAMES, delimiter=";")
            writer.writeheader()
            writer.writerows(rows)

        created_files.append((did, sname, filename, len(rows)))

    print(f"\n========================================================================")
    print(f"   📊 PREDIXI CSV DOSYALARI BAŞARIYLA GÜNCELLENDİ                     ")
    print(f"========================================================================")
    for did, sname, path, count in created_files:
        print(f"✔ [DID: {did}] {sname:<35} -> {path} ({count} Tag)")
    print(f"========================================================================\n")
    return created_files

if __name__ == "__main__":
    export_all_predixi_csvs()
