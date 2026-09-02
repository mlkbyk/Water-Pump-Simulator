"""
Metirius & Predixi SCADA - İstasyon Tanımları (Dinamik JSON Destekli)
"""

import json
import os

JSON_PATH = os.path.join(os.path.dirname(__file__), "stations.json")

def load_stations() -> list:
    """stations.json dosyasından istasyon listesini okur."""
    if os.path.exists(JSON_PATH):
        try:
            with open(JSON_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return []

def save_stations(stations_list: list):
    """stations.json dosyasına istasyon listesini yazar."""
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(stations_list, f, indent=2, ensure_ascii=False)

STATIONS = load_stations()
